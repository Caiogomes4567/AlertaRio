// POST /api/subscribe — guarda e-mails do formulário "Receber alertas"
const { rest } = require('./_db');
const RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  if (!RE.test(email) || email.length > 254) return res.status(400).json({ error: 'E-mail inválido' });
  try {
    await rest('subscribers?on_conflict=email', {
      method: 'POST',
      prefer: 'resolution=ignore-duplicates,return=minimal',
      body: { email },
    });
    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Falha ao cadastrar' });
  }
};
