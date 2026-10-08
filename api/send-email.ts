import type { IncomingMessage, ServerResponse } from 'http';
import nodemailer from 'nodemailer';

interface VercelRequest extends IncomingMessage {
  body: any;
  query: { [key: string]: string | string[] };
}

interface VercelResponse extends ServerResponse {
  send: (body: any) => VercelResponse;
  json: (jsonBody: any) => VercelResponse;
  status: (statusCode: number) => VercelResponse;
}

// Escapes user-supplied text before it is placed inside HTML emails
function e(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Email sent to YOU (the admin alert)
// ---------------------------------------------------------------------------
function formatAdminEmail(type: string, data: Record<string, any>) {
  if (type === 'offer_owner') {
    const subject = `[Vox Direct Alert] New Offer Owner Lead: ${data.fullName || 'Lead'} (${data.company || 'Business'})`;
    const text = `
NEW OFFER OWNER LEAD
====================
Submitted: ${new Date().toISOString()}

CONTACT INFORMATION:
- Name: ${data.fullName}
- Email: ${data.email}
- Phone: ${data.phone}
- Company: ${data.company}
- Website: ${data.website || 'N/A'}

PLACEMENT REQUIREMENTS:
- Role Needed: ${data.roleNeeded}
- Commission Structure: ${data.commissionStructure}
- Expected Volume: ${data.expectedVolume}

OFFER DETAILS:
${data.offerDescription}

MESSAGE / NOTES:
${data.message || 'None provided'}
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0F2A24; margin: 0 0 16px 0;">Vox Direct · New Offer Owner Lead</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Full Name:</strong></td><td style="color: #0f172a;">${e(data.fullName)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td><td style="color: #0f172a;"><a href="mailto:${e(data.email)}">${e(data.email)}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Phone:</strong></td><td style="color: #0f172a;">${e(data.phone)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Company:</strong></td><td style="color: #0f172a;">${e(data.company)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Website:</strong></td><td style="color: #0f172a;">${e(data.website || 'N/A')}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Role Needed:</strong></td><td style="color: #0f172a;"><strong>${e(data.roleNeeded)}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Commission:</strong></td><td style="color: #0f172a;">${e(data.commissionStructure)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Expected Volume:</strong></td><td style="color: #0f172a;">${e(data.expectedVolume)}</td></tr>
        </table>
        <h3 style="color: #1e293b; font-size: 15px; margin-bottom: 8px;">Offer Description</h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 14px; white-space: pre-wrap;">
          ${e(data.offerDescription)}
        </div>
        ${data.message ? `
          <h3 style="color: #1e293b; font-size: 15px; margin-top: 16px; margin-bottom: 8px;">Additional Notes</h3>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 14px; white-space: pre-wrap;">
            ${e(data.message)}
          </div>
        ` : ''}
      </div>
    `;
    return { subject, text, html };
  }

  if (type === 'offer_seeker') {
    const subject = `[Vox Direct Alert] New Candidate Application: ${data.fullName || 'Candidate'} (${data.role || 'Role'})`;
    const text = `
NEW CANDIDATE APPLICATION
=========================
Submitted: ${new Date().toISOString()}

CANDIDATE INFORMATION:
- Name: ${data.fullName}
- Email: ${data.email}
- Phone: ${data.phone}
- Location & Timezone: ${data.locationAndTimezone}
- Role Applying For: ${data.role}
- Video / Profile Link: ${data.portfolioOrVideoLink || 'N/A'}

EXPERIENCE & SKILLS:
- Experience: ${data.experience}
- Niches Worked In: ${data.nichesWorkedIn}
- Tools Used: ${data.toolsUsed}
- GDPR Consent: ${data.gdprConsent ? 'Confirmed' : 'No'}

MESSAGE:
${data.message || 'None provided'}
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0F2A24; margin: 0 0 16px 0;">Vox Direct · New Candidate Application</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Full Name:</strong></td><td style="color: #0f172a;">${e(data.fullName)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td><td style="color: #0f172a;"><a href="mailto:${e(data.email)}">${e(data.email)}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Phone:</strong></td><td style="color: #0f172a;">${e(data.phone)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Location:</strong></td><td style="color: #0f172a;">${e(data.locationAndTimezone)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Role:</strong></td><td style="color: #0f172a;"><strong>${e(data.role)}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Video / Portfolio:</strong></td><td style="color: #0f172a;">${
            data.portfolioOrVideoLink
              ? `<a href="${e(data.portfolioOrVideoLink)}">${e(data.portfolioOrVideoLink)}</a>`
              : 'N/A'
          }</td></tr>
        </table>
        <h3 style="color: #1e293b; font-size: 15px; margin-bottom: 8px;">Experience Overview</h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 14px; white-space: pre-wrap;">
          ${e(data.experience)}
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 12px;"><strong>Niches:</strong> ${e(data.nichesWorkedIn)} | <strong>Tools:</strong> ${e(data.toolsUsed)}</p>
        ${data.message ? `
          <h3 style="color: #1e293b; font-size: 15px; margin-top: 16px; margin-bottom: 8px;">Candidate Message</h3>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 14px; white-space: pre-wrap;">
            ${e(data.message)}
          </div>
        ` : ''}
      </div>
    `;
    return { subject, text, html };
  }

  const subject = `[Vox Direct Alert] New Contact Enquiry: ${data.fullName || data.name || 'Lead'}`;
  const text = `
NEW CONTACT MESSAGE
===================
From: ${data.fullName || data.name}
Email: ${data.email}
Subject: ${data.subject || 'General Enquiry'}
Message: ${data.message}
  `.trim();
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2>New Contact Message</h2>
      <p><strong>From:</strong> ${e(data.fullName || data.name)} (${e(data.email)})</p>
      <p><strong>Message:</strong></p>
      <div style="background:#f8fafc; padding:12px; border-radius:6px; white-space:pre-wrap;">${e(data.message)}</div>
    </div>
  `;
  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Confirmation email sent to the PERSON WHO SUBMITTED the form
// ---------------------------------------------------------------------------
function formatSubmitterEmail(type: string, data: Record<string, any>) {
  const plainName = data.fullName || data.name || 'there';

  let subject = '[Vox Direct] We have received your message';
  let intro =
    'Thank you for contacting Vox Direct. We have safely received your message and will reply shortly.';

  if (type === 'offer_owner') {
    subject = '[Vox Direct] We have received your offer placement enquiry';
    intro =
      'Thank you for contacting Vox Direct. We have safely received your placement enquiry, and a member of our team will review your offer and be in touch shortly.';
  } else if (type === 'offer_seeker') {
    subject = '[Vox Direct] We have received your sales application';
    intro =
      'Thank you for applying to Vox Direct. We have safely received your profile for sales placement, and our team will review it and be in touch if there is a suitable match.';
  }

  const text = `Dear ${plainName},

${intro}

Kind regards,
The Vox Direct Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1A1A18;">
      <h2 style="color: #0F2A24; margin: 0 0 16px 0;">Vox Direct · Sales Placement Agency</h2>
      <p style="font-size: 15px; line-height: 1.6;">Dear ${e(plainName)},</p>
      <p style="font-size: 15px; line-height: 1.6;">${intro}</p>
      <p style="font-size: 15px; line-height: 1.6;">Kind regards,<br/>The Vox Direct Team</p>
    </div>
  `;

  return { subject, text, html };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).send('OK');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = req.body;
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const { type, data, targetEmail } = body || {};

    if (!type || !data) {
      return res.status(400).json({ error: 'Missing type or data' });
    }

    const adminEmail = targetEmail || process.env.NOTIFICATION_EMAIL || 'jc.dev.uk@gmail.com';
    const smtpUser = process.env.SMTP_USER || 'jc.dev.uk@gmail.com';
    const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';
    const smtpPass = rawPass.replace(/\s+/g, '');

    const { subject, text, html } = formatAdminEmail(type, data);

    let adminSent = false;
    let submitterSent = false;
    let submitterError = '';

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      // 1. Alert to you (this must succeed)
      await transporter.sendMail({
        from: `Vox Direct <${smtpUser}>`,
        to: adminEmail,
        replyTo: data.email,
        subject,
        text,
        html,
      });
      adminSent = true;

      // 2. Confirmation to the person who filled in the form
      const submitterAddress = String(data.email || '').trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submitterAddress)) {
        try {
          const confirmation = formatSubmitterEmail(type, data);
          await transporter.sendMail({
            from: `Vox Direct <${smtpUser}>`,
            to: submitterAddress,
            replyTo: adminEmail,
            subject: confirmation.subject,
            text: confirmation.text,
            html: confirmation.html,
          });
          submitterSent = true;
          console.log('Confirmation email sent to submitter');
        } catch (err: any) {
          submitterError = err?.message || String(err);
          console.error('Confirmation email failed:', submitterError);
        }
      } else {
        submitterError = 'Invalid or missing submitter email';
        console.error(submitterError);
      }
    }

    return res.status(200).json({
      success: true,
      isLive: adminSent,
      provider: adminSent ? 'gmail' : 'simulated',
      deliveredToAdmin: adminSent ? adminEmail : null,
      deliveredToSubmitter: submitterSent,
      submitterError: submitterError || undefined,
    });
  } catch (error: any) {
    console.error('API Send Error:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      details: error?.message || String(error),
    });
  }
}
