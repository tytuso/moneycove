function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]))
}

export async function sendWelcomeEmail({ email, name }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !email) return { skipped: true }

  const from = process.env.MONEYCOVE_FROM_EMAIL || process.env.PESAPILOT_FROM_EMAIL || 'MoneyCove <hello@nileai.solutions>'
  const siteUrl = process.env.PUBLIC_SITE_URL || 'https://moneycove.nileai.solutions'
  const safeName = escapeHtml(name || 'there')
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Welcome to MoneyCove',
      html: `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a"><div style="max-width:620px;margin:0 auto;padding:40px 20px"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:32px"><div style="font-size:22px;font-weight:800">MoneyCove</div><div style="margin-top:6px;color:#64748b;font-size:12px;letter-spacing:.16em;font-weight:700">CLARITY FOR EVERY MONEY DECISION</div><h1 style="font-size:28px;margin:28px 0 10px">Welcome, ${safeName} 👋</h1><p style="font-size:15px;line-height:1.7;color:#475569">Your MoneyCove account is ready. There is no email verification step — you can sign in and start tracking your money immediately.</p><p style="margin:26px 0"><a href="${siteUrl}/app#/dashboard" style="display:inline-block;background:#0f766e;color:white;text-decoration:none;padding:13px 20px;border-radius:12px;font-weight:800">Open MoneyCove</a></p><p style="font-size:13px;line-height:1.6;color:#64748b">Free includes expense tracking, budgets and reports. MoneyCove Pro is $5/month and adds AI guidance and premium PDF reports.</p></div><p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:18px">A Nile AI Solutions product</p></div></body></html>`
    }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.warn('MoneyCove welcome email failed', response.status, detail.slice(0, 300))
    return { skipped: false, ok: false }
  }
  return { skipped: false, ok: true }
}
