// GET /api/stations — usado pelo site para mostrar os níveis
const stations = require('./_stations');
const { rest } = require('./_db');

const OFFLINE_MIN = Number(process.env.OFFLINE_AFTER_MIN) || 10;

function statusOf(st, level, ageMin) {
  if (level === null || ageMin === null || ageMin > OFFLINE_MIN) return 'offline';
  if (level >= st.critico) return 'critical';
  if (level >= st.atencao) return 'attention';
  return 'normal';
}

function trendOf(rows) {
  // rows: do mais novo para o mais antigo, últimas 3 h
  if (rows.length < 2) return 'sem histórico suficiente';
  const diff = Number(rows[0].level_cm) - Number(rows[rows.length - 1].level_cm);
  if (diff > 5) return 'subindo nas últimas 3 h';
  if (diff < -5) return 'descendo nas últimas 3 h';
  return 'estável nas últimas 3 h';
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=20');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  try {
    const since = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    const out = await Promise.all(
      stations.map(async (st) => {
        const rows = await rest(
          `readings?station_id=eq.${encodeURIComponent(st.id)}&created_at=gte.${encodeURIComponent(since)}` +
            `&select=level_cm,created_at&order=created_at.desc&limit=200`
        );
        let last = rows[0];
        if (!last) {
          const old = await rest(
            `readings?station_id=eq.${encodeURIComponent(st.id)}&select=level_cm,created_at&order=created_at.desc&limit=1`
          );
          last = old[0];
        }
        const level = last ? Number(last.level_cm) : null;
        const ageMin = last ? (Date.now() - new Date(last.created_at).getTime()) / 60000 : null;
        const status = statusOf(st, level, ageMin);
        return {
          id: st.id,
          nome: st.nome,
          local: st.local,
          atencao: st.atencao,
          critico: st.critico,
          level_cm: status === 'offline' ? null : level,
          status,
          updated_at: last ? last.created_at : null,
          trend: status === 'offline' ? null : trendOf(rows),
        };
      })
    );
    return res.status(200).json({ stations: out, generated_at: new Date().toISOString() });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Falha ao consultar dados' });
  }
};
