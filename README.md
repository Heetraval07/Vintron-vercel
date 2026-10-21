# Vintron website – Vercel deployment package

- `public/` – the prebuilt Vue SPA (from the supplied `dist/`, unmodified; PHP and `.htaccess` removed)
- `api/contact.js` – Vercel serverless port of `api/contact.php` (Brevo email). The frontend still posts to `/api/contact.php`; `vercel.json` rewrites that to this function.
- `vercel.json` – SPA fallback, cache headers, no build step

## Local
    npm run dev      # http://localhost:3000  (optional: copy .env.example to .env.local and fill BREVO_API_KEY)
    npm run check    # verifies every referenced asset exists and no PHP/API key is shipped

## Vercel settings
Framework Preset: Other · Root Directory: `./` · Build Command: (empty) · Install Command: (empty) · Output Directory: `public`

## Environment variables (Production + Preview)
| Name | Required | Value |
|---|---|---|
| BREVO_API_KEY | yes | a NEW Brevo API key |
| BREVO_SENDER_EMAIL | no | verified Brevo sender (default noreply@vintron-world.com) |
| BREVO_SENDER_NAME | no | default "Vintron World" |
| INQUIRY_RECIPIENT_EMAIL | no | default sales@vintron.ae |
