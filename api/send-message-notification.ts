type VercelRequest = {
  method?: string;
  body?: any;
  [key: string]: any;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (data: any) => VercelResponse;
  [key: string]: any;
};
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipientEmail, recipientName, senderRole, messageSnippet, dashboardUrl } = req.body;

  if (!recipientEmail || !messageSnippet) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Exact keys from your Vercel dashboard:
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.error('SMTP credentials missing in environment');
    return res.status(500).json({ error: 'Server misconfigured: missing SMTP credentials' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });

  const isToApplicant = senderRole === 'admin';
  const subject = isToApplicant
    ? 'New message from Vox Direct regarding your application'
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
      from: `"Vox Direct" <${user}>`,
      to: recipientEmail,
      subject: subject,
      html: html,
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Nodemailer send error:', err);
    return res.status(500).json({ error: err.message || 'Failed to dispatch email' });
  }
}
