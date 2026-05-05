# Praxis Petra Schemmann

Website für die **Praxis für Physiotherapie & Klopftherapie Petra Schemmann** in Eigeltingen-Münchhöf.

Static one-pager + Cloudflare Pages Function für das Kontaktformular.

## Stack

- Pure HTML / CSS / JS (kein Build-Schritt)
- Cloudflare Pages für Hosting
- Cloudflare Pages Function (`functions/api/contact.js`) für das Kontaktformular
- Resend (optional) für E-Mail-Versand
- Fonts: [Fraunces](https://fonts.google.com/specimen/Fraunces) (display) + [General Sans](https://www.fontshare.com/fonts/general-sans) (body)

## Lokale Entwicklung

```bash
npm install -g wrangler   # falls noch nicht installiert
npm run dev               # serve auf http://localhost:8788
```

Das startet einen lokalen Server, der HTML, CSS, JS und die `functions/`-API zusammen ausliefert.

## Deployment

```bash
npm run deploy
```

Das pusht direkt zum Cloudflare Pages Projekt **`praxis-petra-schemann`**.

Alternativ: Code zu GitHub pushen — Cloudflare baut automatisch bei jedem Commit.

## Kontaktformular

Das Formular postet an `/api/contact`. Die Function:

1. Validiert Eingaben (Pflichtfelder, E-Mail-Format, Honeypot, Längen-Limits).
2. Sendet — falls `RESEND_API_KEY` gesetzt ist — eine E-Mail via [Resend](https://resend.com).
3. Loggt die Anfrage immer in den Cloudflare-Logs (zur Notfall-Sicherung).

### Setup für Live-E-Mail-Versand

Im Cloudflare Pages Dashboard → **Settings → Environment variables**:

| Name              | Wert                                              |
| ----------------- | ------------------------------------------------- |
| `RESEND_API_KEY`  | API-Key aus [resend.com](https://resend.com)      |
| `CONTACT_TO`      | `p.schemmann@web.de` (default)                    |
| `CONTACT_FROM`    | `Praxis <praxis@deinedomain.de>` (verifiziert)    |

Ohne API-Key ist das Formular trotzdem aktiv und Anfragen erscheinen in den CF-Logs.

## Struktur

```
.
├── index.html             ← One-Pager
├── impressum.html
├── datenschutz.html
├── styles.css             ← Editorial Heilpraxis Aesthetik
├── legal.css              ← Styles für Impressum/Datenschutz
├── script.js              ← Mobile-Nav, Reveals, Form-Handler
├── favicon.svg, apple-touch-icon.svg, og.svg
├── _headers, _redirects   ← CF Pages config
├── robots.txt, sitemap.xml
├── functions/
│   └── api/
│       └── contact.js     ← Kontaktformular Backend
├── wrangler.toml
└── package.json
```

## Inhalte

Inhaltliche Quelle: <https://praxis-petra-schemmann.jimdofree.com> (alte Jimdo-Seite).
Veraltete Texte (Auszeit-Briefe von 2018/2020) wurden entfernt; die übrigen Informationen
(Leistungen, EFT-Beschreibungen, Seminardetails, Impressum) sind übernommen und neu strukturiert.
