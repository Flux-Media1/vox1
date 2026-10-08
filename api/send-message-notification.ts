import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { recipientEmail, recipientName, senderRole, messageSnippet, dashboardUrl } = req.body;

  if (!recipientEmail || !messageSnippet) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const subject = senderRole === 'admin'
    ? 'New message from Vox Direct regarding your application'
    : 'New applicant response received on Vox Direct';

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        access_key: process.env.WEB3FORMS_ACCESS_KEY,
        to_email: recipientEmail,
        from_name: 'Vox Direct',
        subject: subject,
        message: `Hello ${recipientName || 'there'},\n\nYou have received a new message:\n\n"${messageSnippet}"\n\nView and reply here:\n${dashboardUrl || 'https://vox-direct.com/dashboard'}`,
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      return res.status(500).json({ error: result.message || 'Web3Forms failed to deliver' });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Unexpected server error' });
  }
}
