/**
 * Cloudflare Pages Function — Contact form handler.
 *
 * Validates the submission and (if RESEND_API_KEY is configured) forwards it
 * to Petra via Resend. Always logs to the console for review in CF dashboard.
 *
 * Env vars to configure in Cloudflare Pages → Settings → Environment variables:
 *   RESEND_API_KEY (optional)  — API key from resend.com
 *   CONTACT_TO     (optional)  — recipient email (defaults to p.schemmann@web.de)
 *   CONTACT_FROM   (optional)  — verified sender (e.g. praxis@yourdomain.de)
 */

export async function onRequestPost({ request, env }) {
  const json = (status, body) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, message: 'Ungültige Anfrage.' });
  }

  const { name, email, phone = '', topic = '', message, consent, website = '' } = payload || {};

  if (website) return json(200, { ok: true });

  if (!name || !email || !message || !consent) {
    return json(400, { ok: false, message: 'Bitte füllen Sie die Pflichtfelder aus.' });
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { ok: false, message: 'Bitte geben Sie eine gültige E-Mail-Adresse an.' });
  }

  if (String(message).length > 5000 || String(name).length > 200) {
    return json(400, { ok: false, message: 'Eingaben zu lang.' });
  }

  const safe = (s) => String(s).replace(/[<>]/g, '');
  const subject = `Neue Anfrage · ${safe(topic) || 'Allgemein'}`;
  const body = [
    `Name: ${safe(name)}`,
    `E-Mail: ${safe(email)}`,
    phone && `Telefon: ${safe(phone)}`,
    topic && `Anliegen: ${safe(topic)}`,
    '',
    'Nachricht:',
    safe(message),
    '',
    '— Gesendet via praxis-petra-schemmann.de',
  ].filter(Boolean).join('\n');

  const html = `
    <div style="font-family: -apple-system, sans-serif; color: #2A2620; max-width: 540px;">
      <h2 style="font-family: Georgia, serif; font-weight: normal;">Neue Anfrage über die Website</h2>
      <p><strong>Anliegen:</strong> ${safe(topic) || 'Allgemein'}</p>
      <hr style="border: none; border-top: 1px solid #D9CFBA; margin: 1rem 0;" />
      <p><strong>Name:</strong> ${safe(name)}</p>
      <p><strong>E-Mail:</strong> <a href="mailto:${safe(email)}">${safe(email)}</a></p>
      ${phone ? `<p><strong>Telefon:</strong> ${safe(phone)}</p>` : ''}
      <hr style="border: none; border-top: 1px solid #D9CFBA; margin: 1rem 0;" />
      <p style="white-space: pre-wrap;">${safe(message)}</p>
    </div>
  `;

  console.log('Contact submission:', { name, email, phone, topic });

  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO || 'p.schemmann@web.de';
  const from = env.CONTACT_FROM || 'Praxis Petra Schemmann <onboarding@resend.dev>';

  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: email,
          subject,
          text: body,
          html,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('Resend error:', res.status, errText);
        return json(502, { ok: false, message: 'Versand fehlgeschlagen. Bitte versuchen Sie es per Telefon.' });
      }
    } catch (err) {
      console.error('Resend exception:', err);
      return json(502, { ok: false, message: 'Versand fehlgeschlagen. Bitte versuchen Sie es per Telefon.' });
    }
  }

  return json(200, { ok: true, message: 'Nachricht erhalten' });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
