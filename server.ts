import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory store of dispatched emails for testing and admin inspection
export interface SentEmailRecord {
  id: string;
  timestamp: string;
  to: string;
  recipientType: 'submitter' | 'admin';
  from: string;
  subject: string;
  type: 'offer_owner' | 'offer_seeker' | 'contact';
  html: string;
  text: string;
  status: 'sent' | 'simulated' | 'failed';
  provider: string;
  error?: string;
}

const sentEmailsHistory: SentEmailRecord[] = [];

/**
 * Formats email for the Admin / Agency Owner (jc.dev.uk@gmail.com)
 */
function formatAdminEmailContent(type: string, data: Record<string, unknown>) {
  if (type === 'offer_owner') {
    const subject = `[Vox Direct Alert] New Offer Owner Lead: ${data.fullName} (${data.company})`;
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

MESSAGE:
${data.message || 'None provided'}
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0;">Vox Direct · New Offer Owner Lead</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Received at ${new Date().toLocaleString('en-GB')}</p>
        </div>

        <h3 style="color: #1e293b; font-size: 15px; margin-bottom: 8px;">Contact Information</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Full Name:</strong></td><td style="color: #0f172a;">${data.fullName}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td><td style="color: #0f172a;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Phone:</strong></td><td style="color: #0f172a;"><a href="tel:${data.phone}">${data.phone}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Company:</strong></td><td style="color: #0f172a;">${data.company}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Website:</strong></td><td style="color: #0f172a;">${data.website ? `<a href="${data.website}">${data.website}</a>` : 'N/A'}</td></tr>
        </table>

        <h3 style="color: #1e293b; font-size: 15px; margin-bottom: 8px;">Placement Requirements</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Role Needed:</strong></td><td style="color: #0f172a; text-transform: capitalize;"><strong>${data.roleNeeded}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Commission:</strong></td><td style="color: #0f172a;">${data.commissionStructure}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Lead Volume:</strong></td><td style="color: #0f172a;">${data.expectedVolume}</td></tr>
        </table>

        <h3 style="color: #1e293b; font-size: 15px; margin-bottom: 8px;">Offer Description</h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 14px; color: #334155; white-space: pre-wrap; margin-bottom: 20px;">
          ${data.offerDescription}
        </div>

        ${data.message ? `
          <h3 style="color: #1e293b; font-size: 15px; margin-bottom: 8px;">Additional Notes</h3>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 14px; color: #334155; white-space: pre-wrap; margin-bottom: 20px;">
            ${data.message}
          </div>
        ` : ''}

        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 12px; color: #94a3b8; text-align: center;">
          Sent to agency admin from Vox Direct.
        </div>
      </div>
    `;
    return { subject, text, html };
  }

  if (type === 'offer_seeker') {
    const subject = `[Vox Direct Alert] New Candidate Application: ${data.fullName} (${data.role})`;
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
- Video / Profile: ${data.portfolioOrVideoLink}

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
        <div style="border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0;">Vox Direct · New Candidate Application</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Received at ${new Date().toLocaleString('en-GB')}</p>
        </div>

        <h3 style="color: #1e293b; font-size: 15px; margin-bottom: 8px;">Candidate Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Full Name:</strong></td><td style="color: #0f172a;">${data.fullName}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td><td style="color: #0f172a;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Phone:</strong></td><td style="color: #0f172a;"><a href="tel:${data.phone}">${data.phone}</a></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Location:</strong></td><td style="color: #0f172a;">${data.locationAndTimezone}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Role:</strong></td><td style="color: #0f172a; text-transform: capitalize;"><strong>${data.role}</strong></td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Video / Profile:</strong></td><td style="color: #0f172a;"><a href="${data.portfolioOrVideoLink}" target="_blank">${data.portfolioOrVideoLink}</a></td></tr>
        </table>

        <h3 style="color: #1e293b; font-size: 15px; margin-bottom: 8px;">Experience Overview</h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 14px; color: #334155; white-space: pre-wrap; margin-bottom: 15px;">
          ${data.experience}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr><td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Niches:</strong></td><td style="color: #0f172a;">${data.nichesWorkedIn}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;"><strong>Tools:</strong></td><td style="color: #0f172a;">${data.toolsUsed}</td></tr>
        </table>

        ${data.message ? `
          <h3 style="color: #1e293b; font-size: 15px; margin-bottom: 8px;">Candidate Message</h3>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 14px; color: #334155; white-space: pre-wrap; margin-bottom: 20px;">
            ${data.message}
          </div>
        ` : ''}

        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 12px; color: #94a3b8; text-align: center;">
          Sent to agency admin from Vox Direct.
        </div>
      </div>
    `;
    return { subject, text, html };
  }

  // Default contact
  const subject = `[Vox Direct Alert] New Contact Message: ${data.fullName}${data.subject ? ` - ${data.subject}` : ''}`;
  const text = `
NEW CONTACT MESSAGE
===================
From: ${data.fullName}
Email: ${data.email}
Subject: ${data.subject || 'General Enquiry'}

Message:
${data.message}
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0;">Vox Direct · New Contact Message</h2>
      </div>
      <p><strong>From:</strong> ${data.fullName} (<a href="mailto:${data.email}">${data.email}</a>)</p>
      ${data.subject ? `<p><strong>Subject:</strong> ${data.subject}</p>` : ''}
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 14px; color: #334155; white-space: pre-wrap; margin-top: 15px;">
        ${data.message}
      </div>
    </div>
  `;
  return { subject, text, html };
}

/**
 * Formats automatic confirmation email sent to the Submitter (the email filled in the form)
 */
function formatSubmitterEmailContent(type: string, data: Record<string, unknown>) {
  if (type === 'offer_owner') {
    const subject = `[Vox Direct] We have received your offer placement enquiry`;
    const text = `
Dear ${data.fullName},

Thank you for contacting Vox Direct. We have safely received your enquiry regarding sales placement for ${data.company}.

Our placement team is reviewing your requirements for appointment setters and closers. We will review your pipeline model and contact you directly to discuss placement options.

SUMMARY OF YOUR SUBMISSION:
- Company: ${data.company}
- Role Needed: ${data.roleNeeded}
- Commission Structure: ${data.commissionStructure}
- Expected Volume: ${data.expectedVolume}
- Offer Description: ${data.offerDescription}

If you have any urgent questions in the meantime, please reply directly to this email or contact us at jc.dev.uk@gmail.com.

Kind regards,
The Vox Direct Team
https://voxdirect.co.uk
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0;">Vox Direct</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Sales Placement Agency</p>
        </div>

        <p style="font-size: 15px; color: #1e293b;">Dear <strong>${data.fullName}</strong>,</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Thank you for contacting Vox Direct. We have safely received your placement enquiry for <strong>${data.company}</strong>.
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Our placement team is reviewing your specifications. We will be in touch directly with you shortly to discuss candidates and next steps.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px;">Summary of Your Submission:</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
            <tr><td style="padding: 4px 0; width: 140px;"><strong>Company:</strong></td><td>${data.company}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Role Needed:</strong></td><td style="text-transform: capitalize;">${data.roleNeeded}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Commission:</strong></td><td>${data.commissionStructure}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Expected Volume:</strong></td><td>${data.expectedVolume}</td></tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          If you have any questions or additional details to share in the meantime, feel free to reply directly to this email.
        </p>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 24px; font-size: 12px; color: #94a3b8;">
          Vox Direct · Connecting offer owners with appointment setters and closers.
        </div>
      </div>
    `;
    return { subject, text, html };
  }

  if (type === 'offer_seeker') {
    const subject = `[Vox Direct] We have received your sales application`;
    const text = `
Dear ${data.fullName},

Thank you for applying to Vox Direct. We have safely received your candidate application for sales placement.

Our team reviews every application for role alignment, experience, and background. If your profile matches one of our active offer placement opportunities, we will reach out directly to schedule an introductory discussion.

SUMMARY OF YOUR APPLICATION:
- Role: ${data.role}
- Location & Timezone: ${data.locationAndTimezone}
- Niches: ${data.nichesWorkedIn}
- Tools: ${data.toolsUsed}

Kind regards,
The Vox Direct Placement Team
https://voxdirect.co.uk
    `.trim();

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #0f172a; margin: 0;">Vox Direct</h2>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Sales Placement Agency</p>
        </div>

        <p style="font-size: 15px; color: #1e293b;">Dear <strong>${data.fullName}</strong>,</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Thank you for applying to Vox Direct. We have safely received your profile for sales placement.
        </p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6;">
          Our placement team reviews every applicant to align candidates with vetted offers. If your background matches an active opportunity, we will reach out to you directly.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px;">Application Details Recorded:</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
            <tr><td style="padding: 4px 0; width: 140px;"><strong>Role:</strong></td><td style="text-transform: capitalize;">${data.role}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Location/Timezone:</strong></td><td>${data.locationAndTimezone}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Niches:</strong></td><td>${data.nichesWorkedIn}</td></tr>
            <tr><td style="padding: 4px 0;"><strong>Tools:</strong></td><td>${data.toolsUsed}</td></tr>
          </table>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 24px; font-size: 12px; color: #94a3b8;">
          Vox Direct · Connecting offer owners with appointment setters and closers.
        </div>
      </div>
    `;
    return { subject, text, html };
  }

  // Contact confirmation
  const subject = `[Vox Direct] We've received your message`;
  const text = `
Dear ${data.fullName},

Thank you for contacting Vox Direct. We have received your message and will get back to you shortly.

YOUR MESSAGE:
${data.message}

Kind regards,
Vox Direct
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0;">Vox Direct</h2>
      </div>
      <p>Dear <strong>${data.fullName}</strong>,</p>
      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        Thank you for contacting Vox Direct. We have received your message and will respond to you shortly.
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 13px; color: #475569;">
        <strong>Your Message:</strong><br />${data.message}
      </div>
    </div>
  `;
  return { subject, text, html };
}

/**
 * Dispatch an individual email using Resend, SMTP, or local simulation
 */
async function dispatchEmail(params: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  type: 'offer_owner' | 'offer_seeker' | 'contact';
  recipientType: 'submitter' | 'admin';
}): Promise<SentEmailRecord> {
  const { to, from, subject, html, text, type, recipientType } = params;
  let sent = false;
  let provider = 'simulated';
  let deliveryError: string | undefined;

  // 1. Try Gmail / SMTP first if configured
  const smtpUser = process.env.SMTP_USER || 'jc.dev.uk@gmail.com';
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  if (!sent && smtpUser && rawPass) {
    try {
      const isGmail =
        process.env.SMTP_HOST?.includes('gmail') ||
        smtpUser.includes('@gmail.com');
      const cleanPass = rawPass.replace(/\s+/g, '');

      const transporter = isGmail
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: smtpUser,
              pass: cleanPass,
            },
          })
        : nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 465,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: smtpUser,
              pass: cleanPass,
            },
          });

      await transporter.sendMail({ from, to, subject, text, html });
      sent = true;
      provider = isGmail ? 'gmail' : 'smtp';
    } catch (e: unknown) {
      deliveryError = e instanceof Error ? e.message : String(e);
      console.warn('SMTP delivery failed for', to, ':', e);
    }
  }

  // 2. Try Resend if RESEND_API_KEY is available and SMTP was not used
  if (!sent && process.env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html, text }),
      });

      if (resendRes.ok) {
        sent = true;
        provider = 'resend';
      } else {
        const errText = await resendRes.text();
        
        // Handle Resend free tier sandbox restriction:
        if (resendRes.status === 403 && errText.includes('only send testing emails to your own email address')) {
          console.log(`[Resend Sandbox] External recipient ${to} restricted by Resend test mode. Forwarding applicant copy to ${process.env.NOTIFICATION_EMAIL || 'jc.dev.uk@gmail.com'} for review.`);
          try {
            const fallbackAdminEmail = process.env.NOTIFICATION_EMAIL || 'jc.dev.uk@gmail.com';
            const sandboxRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from,
                to: fallbackAdminEmail,
                subject: `[Applicant Copy: ${to}] ${subject}`,
                html: `
                  <div style="background:#fef3c7;border:1px solid #f59e0b;padding:12px;margin-bottom:16px;border-radius:6px;font-size:12px;color:#92400e;line-height:1.5;">
                    <strong>Resend Sandbox Testing Notice:</strong><br />
                    Resend's free tier currently permits live delivery only to your registered email (<code>${fallbackAdminEmail}</code>) until a custom domain is verified at <a href="https://resend.com/domains" target="_blank" style="color:#b45309;font-weight:bold;">resend.com/domains</a>.<br /><br />
                    This is the exact confirmation email formatted for <strong>${to}</strong>.
                  </div>
                ` + html,
                text: `[Resend Sandbox - Intended for ${to}]\n\n` + text,
              }),
            });

            if (sandboxRes.ok) {
              sent = true;
              provider = 'resend (sandbox copy)';
              deliveryError = undefined;
            } else {
              deliveryError = 'Resend sandbox limit: Verify domain at resend.com/domains to send to external recipients.';
            }
          } catch {
            deliveryError = 'Resend sandbox limit: Verify domain at resend.com/domains to send to external recipients.';
          }
        } else {
          console.warn('Resend error for', to, ':', errText);
          deliveryError = errText;
        }
      }
    } catch (e: unknown) {
      deliveryError = e instanceof Error ? e.message : String(e);
    }
  }

  // 3. Try Web3Forms if WEB3FORMS_ACCESS_KEY is available
  if (!sent && process.env.WEB3FORMS_ACCESS_KEY) {
    try {
      const w3Res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          access_key: process.env.WEB3FORMS_ACCESS_KEY,
          subject: subject,
          from_name: 'Vox Direct Notifications',
          to_email: to,
          message: text,
        }),
      });

      if (w3Res.ok) {
        sent = true;
        provider = 'web3forms';
      } else {
        const errText = await w3Res.text();
        console.warn('Web3Forms error:', errText);
        deliveryError = errText;
      }
    } catch (e: unknown) {
      deliveryError = e instanceof Error ? e.message : String(e);
    }
  }

  const record: SentEmailRecord = {
    id: 'eml_' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    to,
    recipientType,
    from,
    subject,
    type,
    html,
    text,
    status: sent ? 'sent' : 'simulated',
    provider,
    error: deliveryError,
  };

  sentEmailsHistory.unshift(record);
  console.log(`[Email Dispatched] To: ${to} (${recipientType}) | Subject: ${subject} | Provider: ${provider}`);
  return record;
}

// POST endpoint: /api/send-email
// Dispatches BOTH:
// 1. Confirmation email to the person who filled in the form (data.email)
// 2. Lead alert email to you (jc.dev.uk@gmail.com)
app.post('/api/send-email', async (req: Request, res: Response) => {
  try {
    const { type, data, targetEmail } = req.body;
    if (!type || !data) {
      return res.status(400).json({ error: 'Missing type or data in request body' });
    }

    const adminEmail =
      targetEmail ||
      process.env.NOTIFICATION_EMAIL ||
      'jc.dev.uk@gmail.com';

    const submitterEmail = String(data.email || '').trim();
    const fromEmail =
      process.env.SMTP_FROM ||
      (process.env.RESEND_API_KEY
        ? 'Vox Direct <onboarding@resend.dev>'
        : process.env.SMTP_USER
        ? `Vox Direct <${process.env.SMTP_USER}>`
        : 'Vox Direct <notifications@voxdirect.co.uk>');

    const results: SentEmailRecord[] = [];

    // 1. Send confirmation email to the SUBMITTER (the person filling the form)
    if (submitterEmail && submitterEmail.includes('@')) {
      const submitterContent = formatSubmitterEmailContent(type, data);
      const submitterRecord = await dispatchEmail({
        to: submitterEmail,
        recipientType: 'submitter',
        from: fromEmail,
        subject: submitterContent.subject,
        html: submitterContent.html,
        text: submitterContent.text,
        type,
      });
      results.push(submitterRecord);
    }

    // 2. Send lead alert email to YOU (the agency owner)
    const adminContent = formatAdminEmailContent(type, data);
    const adminRecord = await dispatchEmail({
      to: adminEmail,
      recipientType: 'admin',
      from: fromEmail,
      subject: adminContent.subject,
      html: adminContent.html,
      text: adminContent.text,
      type,
    });
    results.push(adminRecord);

    const isLive = results.some((r) => r.status === 'sent');
    const provider = results[0]?.provider || 'simulated';

    return res.status(200).json({
      success: true,
      deliveredToAdmin: adminEmail,
      deliveredToSubmitter: submitterEmail,
      dispatchedCount: results.length,
      isLive,
      provider,
      records: results.map((r) => ({ id: r.id, to: r.to, recipientType: r.recipientType, subject: r.subject })),
    });
  } catch (error: unknown) {
    console.error('Failed to process send-email:', error);
    return res.status(500).json({
      error: 'Failed to process email dispatch',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET endpoint: /api/sent-emails
app.get('/api/sent-emails', (req: Request, res: Response) => {
  res.json({
    adminEmail: process.env.NOTIFICATION_EMAIL || 'jc.dev.uk@gmail.com',
    history: sentEmailsHistory,
  });
});

// Vite middleware mounting in development, or static hosting in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vox Direct server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
