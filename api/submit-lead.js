export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, commodity, message } = req.body;

  if (!name || !email || !commodity || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Save the lead to Supabase
    const supabaseRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ name, email, commodity, message })
    });

    if (!supabaseRes.ok) throw new Error('Failed to save lead');

    // 2. Send confirmation email via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Prime Urban Buka <trade@primeurbanbuka.com>',
        to: email,
        subject: `Your Q3 Technical Data Sheet — ${commodity}`,
        html: `<p>Thank you, ${name}!</p><p>Your Q3 Technical Data Sheets for <strong>${commodity}</strong> will follow shortly.</p><p>— Prime Urban Buka Trade Desk</p>`
      })
    });

    if (!resendRes.ok) throw new Error('Failed to send email');

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}