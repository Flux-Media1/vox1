import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipientEmail, recipientName, senderRole, messageSnippet, dashboardUrl } = req.body;

  if (!recipientEmail || !messageSnippet) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Transporter using your existing SMTP / Gmail config
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (Number(process.env.SMTP_PORT) || 465) === 465,
    auth: {
      user: process.env.SMTP_FROM,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const isToApplicant = senderRole === 'admin';
  const subject = isToApplicant
    ? 'New message from Vox Direct'
    : 'New applicant response received on Vox Direct';

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #faf9f6; border: 1px solid #e2e8f0; border-radius: 4px;">
      <h2 style="color: #0f3d2e; margin-top: 0;">Vox Direct</h2>
      <p>Hello ${recipientName || 'there'},</p>
      <p>You have received a new message regarding your placement application:</p>
      <blockquote style="background: #ffffff; border-left: 4px solid #c27803; padding: 12px 16px; margin: 16px 0; font-style: italic; color: #475569;">
        "${messageSnippet}"
      </blockquote>
      <p style="margin-top: 24px;">
        <a href="${dashboardUrl || 'https://vox-direct.com/dashboard'}" 
           style="background-color: #0f3d2e; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: 600;">
          View & Reply
        </a>
      </p>
      <hr style="margin-top: 32px; border: none; border-top: 1px solid #cbd5e1;" />
      <p style="font-size: 12px; color: #94a3b8;">Vox Direct · UK Sales Placement Service</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Vox Direct" <${process.env.SMTP_FROM}>`,
      to: recipientEmail,
      subject: subject,
      html: html,
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('SMTP Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to send notification email' });
  }
}
