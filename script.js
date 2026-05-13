// Praxis Petra Schemmann · Interactions

// ────────────────  Year stamp  ────────────────
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ────────────────  Mobile nav  ────────────────
const navToggle = document.querySelector('.nav-toggle');
const mobileNav = document.getElementById('mobile-nav');

navToggle?.addEventListener('click', () => {
  const open = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!open));
  mobileNav.hidden = open;
  document.body.style.overflow = open ? '' : 'hidden';
});

mobileNav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navToggle.setAttribute('aria-expanded', 'false');
    mobileNav.hidden = true;
    document.body.style.overflow = '';
  });
});

// ────────────────  Sticky header shadow  ────────────────
const header = document.querySelector('.site-header');
if (header) {
  const handleScroll = () => {
    if (window.scrollY > 8) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

// ────────────────  Reveal on scroll  ────────────────
const revealTargets = document.querySelectorAll(
  '.section-head, .service, .audience-list li, .process-list li, .seminar-day, .timeline li, .spot-card, .trust-item, .about-portrait, .about-text, .seminars-text, .seminar-content, .contact-head, .contact-form, .map-card, .map-aside'
);

revealTargets.forEach(el => el.classList.add('reveal'));

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const target = entry.target;
            const delay = Math.min(i, 6) * 60;
            setTimeout(() => target.classList.add('visible'), delay);
            io.unobserve(target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
    )
  : null;

if (io) {
  revealTargets.forEach(t => io.observe(t));
} else {
  revealTargets.forEach(t => t.classList.add('visible'));
}

// ────────────────  Smooth scroll w/ header offset  ────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href');
    if (href === '#' || href.length < 2) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const offset = 70;
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

// ────────────────  Contact form  ────────────────
const form = document.getElementById('contact-form');
const status = form?.querySelector('.form-status');
const submitBtn = form?.querySelector('button[type="submit"]');
const submitLabel = submitBtn?.querySelector('.btn-label');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';

    if (form.elements['website'].value) {
      status.classList.add('success');
      status.textContent = 'Vielen Dank! Wir melden uns zeitnah.';
      form.reset();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());

    if (!data.name || !data.email || !data.message || !data.consent) {
      status.classList.add('error');
      status.textContent = 'Bitte füllen Sie die Pflichtfelder aus.';
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Wird gesendet…';
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Übermittlung fehlgeschlagen');
      }

      status.classList.add('success');
      status.textContent = 'Vielen Dank für Ihre Nachricht. Ich melde mich zeitnah bei Ihnen.';
      form.reset();
    } catch (err) {
      status.classList.add('error');
      status.textContent = `Hoppla, ${err.message}. Bitte rufen Sie an oder schreiben direkt an p.schemmann@web.de`;
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Nachricht senden';
      }
    }
  });
}

// ════════════════════════════════════════════════════════════════════
//   Cookie / Consent Manager  ·  DSGVO + TTDSG
// ════════════════════════════════════════════════════════════════════

const CONSENT_KEY = 'pps_cookie_consent';
const CONSENT_VERSION = 1;
const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 12 months

const Consent = {
  load() {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.version !== CONSENT_VERSION) return null;
      if (Date.now() - data.timestamp > CONSENT_TTL_MS) return null;
      return data;
    } catch { return null; }
  },
  save(prefs) {
    const data = {
      version: CONSENT_VERSION,
      timestamp: Date.now(),
      prefs: {
        necessary: true,
        externalMedia: !!prefs.externalMedia,
      },
    };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(data)); } catch {}
    document.dispatchEvent(new CustomEvent('consent:change', { detail: data.prefs }));
    return data;
  },
  has(category) {
    const data = this.load();
    return !!(data && data.prefs && data.prefs[category]);
  },
  reset() {
    try { localStorage.removeItem(CONSENT_KEY); } catch {}
    document.dispatchEvent(new CustomEvent('consent:change', { detail: { necessary: true, externalMedia: false } }));
  },
};

function buildConsentBanner({ openInSettings = false } = {}) {
  const existing = document.getElementById('consent-banner');
  if (existing) existing.remove();

  const stored = Consent.load();
  const externalChecked = stored ? !!stored.prefs.externalMedia : false;

  const banner = document.createElement('div');
  banner.id = 'consent-banner';
  banner.className = 'consent-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-modal', 'false');
  banner.setAttribute('aria-labelledby', 'consent-title');
  banner.setAttribute('aria-describedby', 'consent-desc');
  banner.dataset.view = openInSettings ? 'settings' : 'initial';

  banner.innerHTML = `
    <div class="consent-backdrop" data-action="dismiss-backdrop" aria-hidden="true"></div>
    <div class="consent-card" tabindex="-1">
      <button type="button" class="consent-close" data-action="close-settings" aria-label="Schließen" hidden>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </button>

      <div class="consent-head">
        <span class="consent-icon" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 3c-7 0-13 6-13 13s6 13 13 13 13-6 13-13c0-.6-.5-1-1-1-2 0-3.5-1.5-3.5-3.5 0-.5-.5-1-1-1-2 0-3.5-1.5-3.5-3.5 0-.5-.5-1-1-1-2 0-3-1.5-3-3 0-.6-.4-1-1-1Z"/>
            <circle cx="11" cy="12" r="1.4" fill="currentColor"/>
            <circle cx="19" cy="20" r="1.4" fill="currentColor"/>
            <circle cx="11" cy="22" r="1.2" fill="currentColor"/>
            <circle cx="22" cy="13" r="1" fill="currentColor"/>
          </svg>
        </span>
        <div class="consent-head-text">
          <h2 id="consent-title">Datenschutz &amp; externe Inhalte</h2>
          <p id="consent-desc">Diese Website nutzt ausschließlich technisch notwendige Cookies. Externe Inhalte wie der Google-Maps-Lageplan werden erst geladen, wenn Sie zustimmen. Sie können Ihre Auswahl jederzeit im Footer ändern.</p>
        </div>
      </div>

      <div class="consent-categories">
        <div class="consent-category">
          <div class="consent-category-text">
            <h3>Notwendig</h3>
            <p>Speichert Ihre Cookie-Auswahl im Browser. Ohne diese funktioniert die Seite nicht. Keine Übertragung an Dritte.</p>
          </div>
          <span class="toggle is-locked" aria-label="Notwendig, immer aktiv">
            <input type="checkbox" checked disabled tabindex="-1" />
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </span>
        </div>
        <div class="consent-category">
          <div class="consent-category-text">
            <h3>Externe Medien</h3>
            <p>Lädt den Google-Maps-Lageplan zur Anzeige der Anfahrt. Dabei werden Daten (u.&nbsp;a. IP-Adresse) an Google&nbsp;LLC (USA) übertragen. Rechtsgrundlage: Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO.</p>
          </div>
          <label class="toggle">
            <input type="checkbox" id="consent-external-media" ${externalChecked ? 'checked' : ''} />
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
            <span class="visually-hidden">Externe Medien zulassen</span>
          </label>
        </div>
      </div>

      <div class="consent-actions">
        <button type="button" class="consent-btn consent-btn-ghost" data-action="reject">
          Nur notwendige
        </button>
        <button type="button" class="consent-btn consent-btn-primary" data-action="accept-all">
          Alle akzeptieren
        </button>
        <button type="button" class="consent-btn consent-btn-primary" data-action="save" hidden>
          Auswahl speichern
        </button>
      </div>

      <button type="button" class="consent-link" data-action="settings">Einstellungen anpassen</button>

      <p class="consent-foot">
        <a href="/datenschutz.html">Datenschutz</a>
        <span aria-hidden="true">·</span>
        <a href="/impressum.html">Impressum</a>
      </p>
    </div>
  `;

  document.body.appendChild(banner);

  const card = banner.querySelector('.consent-card');
  const externalToggle = banner.querySelector('#consent-external-media');
  const settingsBtn = banner.querySelector('[data-action="settings"]');
  const rejectBtn = banner.querySelector('[data-action="reject"]');
  const acceptBtn = banner.querySelector('[data-action="accept-all"]');
  const saveBtn = banner.querySelector('[data-action="save"]');
  const closeBtn = banner.querySelector('[data-action="close-settings"]');
  const backdrop = banner.querySelector('[data-action="dismiss-backdrop"]');

  const showSettingsView = () => {
    banner.dataset.view = 'settings';
    settingsBtn.hidden = true;
    rejectBtn.hidden = true;
    acceptBtn.hidden = false;
    saveBtn.hidden = false;
    if (Consent.load()) closeBtn.hidden = false;
  };

  if (openInSettings) showSettingsView();

  settingsBtn.addEventListener('click', showSettingsView);

  acceptBtn.addEventListener('click', () => {
    Consent.save({ externalMedia: true });
    closeConsentBanner();
  });

  rejectBtn.addEventListener('click', () => {
    Consent.save({ externalMedia: false });
    closeConsentBanner();
  });

  saveBtn.addEventListener('click', () => {
    Consent.save({ externalMedia: externalToggle.checked });
    closeConsentBanner();
  });

  const closeIfStored = () => { if (Consent.load()) closeConsentBanner(); };
  closeBtn?.addEventListener('click', closeIfStored);
  backdrop?.addEventListener('click', closeIfStored);

  banner.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeIfStored();
  });

  requestAnimationFrame(() => {
    banner.classList.add('is-open');
    if (openInSettings) card.focus();
  });
}

function closeConsentBanner() {
  const banner = document.getElementById('consent-banner');
  if (!banner) return;
  banner.classList.remove('is-open');
  setTimeout(() => banner.remove(), 320);
}

function openConsentSettings() {
  buildConsentBanner({ openInSettings: true });
}

// Auto-show on first visit / expired consent
const startBanner = () => {
  if (!Consent.load()) buildConsentBanner();
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startBanner);
} else {
  startBanner();
}

// Expose for footer link / inline buttons
window.PPS_openCookieSettings = openConsentSettings;

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-open-cookie-settings]');
  if (trigger) {
    e.preventDefault();
    openConsentSettings();
  }
});

// ════════════════════════════════════════════════════════════════════
//   Google Maps  ·  Consent-Gated Embed
// ════════════════════════════════════════════════════════════════════

function setupMapConsent() {
  const placeholder = document.querySelector('[data-map-placeholder]');
  const wrapper = document.querySelector('[data-map-wrapper]');
  if (!placeholder || !wrapper) return;

  const MAP_SRC = 'https://maps.google.com/maps?q=Hegaustr.%204a%2C%2078253%20Eigeltingen-M%C3%BCnchh%C3%B6f&t=&z=15&ie=UTF8&iwloc=&output=embed';

  const activate = () => {
    if (wrapper.dataset.loaded === 'true') return;
    const iframe = document.createElement('iframe');
    iframe.src = MAP_SRC;
    iframe.title = 'Lageplan: Praxis Petra Schemmann, Hegaustr. 4a, 78253 Eigeltingen-Münchhöf';
    iframe.loading = 'lazy';
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('allowfullscreen', '');
    wrapper.appendChild(iframe);
    wrapper.dataset.loaded = 'true';
    placeholder.hidden = true;
    wrapper.hidden = false;
  };

  const deactivate = () => {
    wrapper.innerHTML = '';
    wrapper.dataset.loaded = 'false';
    wrapper.hidden = true;
    placeholder.hidden = false;
  };

  const sync = () => {
    if (Consent.has('externalMedia')) activate();
    else deactivate();
  };

  placeholder.querySelector('[data-action="map-accept"]')?.addEventListener('click', () => {
    Consent.save({ externalMedia: true });
    closeConsentBanner();
  });

  document.addEventListener('consent:change', sync);
  sync();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupMapConsent);
} else {
  setupMapConsent();
}
