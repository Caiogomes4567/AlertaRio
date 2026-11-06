// POST /api/telemetry  — chamado pela ponte no PC (pc-bridge/bridge.py)
// Header obrigatório: x-api-key: <DEVICE_API_KEY>
const crypto = require('crypto');
const stations = require('./_stations');
const { rest } = require('./_db');

function keyOk(received) {
  const expected = process.env.DEVICE_API_KEY || '';
  if (!expected || !received) return false;
  const a = Buffer.from(String(received));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  if (!keyOk(req.headers['x-api-key'])) return res.status(401).json({ error: 'Chave inválida' });

  const b = req.body && typeof req.body === 'object' ? req.body : {};
  const station = stations.find((s) => s.id === b.station_id);
  if (!station) return res.status(400).json({ error: 'station_id desconhecido' });

  const level = Number(b.level_cm);
  const dist = b.distance_cm === undefined || b.distance_cm === null ? null : Number(b.distance_cm);
  if (!Number.isFinite(level) || level < -50 || level > 1000) {
    return res.status(400).json({ error: 'level_cm inválido' });
  }
  if (dist !== null && (!Number.isFinite(dist) || dist < 0 || dist > 1000)) {
    return res.status(400).json({ error: 'distance_cm inválido' });
  }

  // ts opcional (ISO 8601): usado quando o PC reenvia leituras que ficaram na fila sem internet.
  const row = { station_id: station.id, level_cm: level, distance_cm: dist };
  if (b.ts) {
    const t = new Date(b.ts).getTime();
    const now = Date.now();
    if (Number.isFinite(t) && t <= now + 60000 && t >= now - 24 * 3600 * 1000) {
      row.created_at = new Date(t).toISOString();
    }
  }

  try {
    await rest('readings', {
      method: 'POST',
      prefer: 'return=minimal',
      body: row,
    });
    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Falha ao gravar' });
  }
};
