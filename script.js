// Praxis Petra Schemmann · Interactions

// ────────────────  Year stamp  ────────────────
document.getElementById('year').textContent = new Date().getFullYear();

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
const handleScroll = () => {
  if (window.scrollY > 8) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
};
window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();

// ────────────────  Reveal on scroll  ────────────────
const revealTargets = document.querySelectorAll(
  '.section-head, .service, .audience-list li, .process-list li, .seminar-day, .timeline li, .spot-card, .trust-item, .about-portrait, .about-text, .seminars-text, .seminar-content, .contact-head, .contact-form'
);

revealTargets.forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver(
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
);

revealTargets.forEach(t => io.observe(t));

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

    // Honeypot
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
      status.textContent = `Hoppla — ${err.message}. Bitte rufen Sie an oder schreiben direkt an p.schemmann@web.de`;
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Nachricht senden';
      }
    }
  });
}
