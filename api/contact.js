// Vintron Group - contact form handler (Vercel Serverless Function).
// Port of the original api/contact.php + api/config.php. Sends the inquiry via the Brevo REST API.
//
// Environment variables (set in Vercel > Project > Settings > Environment Variables):
//   BREVO_API_KEY            required
//   BREVO_SENDER_EMAIL       optional, must be a verified sender in Brevo (default noreply@vintron-world.com)
//   BREVO_SENDER_NAME        optional (default "Vintron World")
//   INQUIRY_RECIPIENT_EMAIL  optional (default sales@vintron.ae)

const DEFAULT_RECIPIENT_NAME = 'Vintron Inquiries';

const DIVISION_NAMES = {
  trading: 'Vintron General Trading',
  manufacturing: 'Vienna Turning Eng. & Steel',
  contracting: 'Vintron Technical Contracting',
  linutech: 'Linu Tech Cont.',
  venusauto: 'Venus Auto Maintenance',
  other: 'Vintron Group General Support',
};

const stripTags = (value) => String(value ?? '').replace(/<[^>]*>/g, '').trim();
const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
const isValidEmail = (value) => /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/.test(value);

function formatDubaiTime(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')} ${get('month')} ${get('year')}, ${get('hour')}:${get('minute')} ${get('dayPeriod').toUpperCase()} (GST / UAE Time)`;
}

function buildHtml({ subject, divisionLabel, fullName, email, receivedAt, message }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #1e293b; line-height: 1.5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #404d9a, #6366f1); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 22px 28px 18px; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px;">Vintron Group</h1>
                    <p style="margin: 2px 0 0; font-size: 12px; color: #64748b; font-weight: 500;">Website Contact Inquiry</p>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #eef2ff; color: #404d9a; border: 1px solid #c7d2fe; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${divisionLabel}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 28px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; width: 110px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Sender Name</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; font-size: 14px; font-weight: 600; color: #0f172a;">${fullName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Email</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; font-size: 14px;">
                    <a href="mailto:${email}" style="color: #404d9a; text-decoration: none; font-weight: 500;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Received At</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #475569;">${receivedAt}</td>
                </tr>
              </table>
              <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569;">Inquiry Message:</p>
              <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #404d9a; border-radius: 6px; padding: 16px 18px; margin-bottom: 22px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${message}</p>
              </div>
              <div style="text-align: center;">
                <a href="mailto:${email}?subject=Re:%20Inquiry%20to%20Vintron%20Group%20-%20${divisionLabel}" style="display: inline-block; background-color: #404d9a; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 600; padding: 11px 24px; border-radius: 6px; box-shadow: 0 2px 6px rgba(64, 77, 154, 0.25);">
                  Reply to ${fullName} &rarr;
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed. Only POST requests are accepted.' });
    return;
  }

  // Vercel parses JSON bodies; fall back to a raw string just in case.
  let data = req.body;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      data = {};
    }
  }
  if (!data || typeof data !== 'object') data = {};

  // Anti-spam honeypot: silently succeed to mislead bots
  if (data.website) {
    res.status(200).json({ success: true, message: 'Your inquiry has been received.' });
    return;
  }

  const firstName = stripTags(data.firstName);
  const lastName = stripTags(data.lastName);
  const fullName = `${firstName} ${lastName}`.trim();
  const email = String(data.email ?? '').trim();
  const division = stripTags(data.division) || 'other';
  const message = stripTags(data.message);

  if (!firstName || !lastName || !email || !message) {
    res.status(400).json({
      success: false,
      message: 'Please fill in all required fields (First Name, Last Name, Email, and Message).',
    });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('BREVO_API_KEY is not set');
    res.status(500).json({
      success: false,
      message: 'Email service is not configured yet. Please set the BREVO_API_KEY environment variable.',
    });
    return;
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@vintron-world.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'Vintron World';
  const recipientEmail = process.env.INQUIRY_RECIPIENT_EMAIL || 'sales@vintron.ae';

  const known = Object.prototype.hasOwnProperty.call(DIVISION_NAMES, division);
  const divisionLabel = known ? DIVISION_NAMES[division] : 'General Corporate Inquiry';
  const recipientName = known ? DIVISION_NAMES[division] : DEFAULT_RECIPIENT_NAME;

  const safeFullName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safeDivisionLabel = escapeHtml(divisionLabel);
  const subject = `New Inquiry: ${safeFullName} - ${safeDivisionLabel}`;

  const htmlContent = buildHtml({
    subject,
    divisionLabel: safeDivisionLabel,
    fullName: safeFullName,
    email: safeEmail,
    receivedAt: formatDubaiTime(new Date()),
    message: escapeHtml(message).replace(/\n/g, '<br>'),
  });

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: recipientEmail, name: recipientName }],
    replyTo: { email, name: fullName },
    subject,
    htmlContent,
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { accept: 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json().catch(() => ({}));

    if (response.ok && result.messageId) {
      res.status(200).json({
        success: true,
        message: 'Thank you! Your inquiry has been sent successfully. Our team will contact you shortly.',
        messageId: result.messageId,
      });
      return;
    }

    console.error('Brevo error', response.status, result);
    res.status(response.status >= 400 ? response.status : 500).json({
      success: false,
      message: result.message || 'An error occurred while sending your message via Brevo.',
      code: response.status,
    });
  } catch (err) {
    console.error('Brevo request failed', err);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to email service: ' + (err && err.message ? err.message : 'unknown error'),
    });
  }
};
