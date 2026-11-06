// Testes das funções da API com Supabase simulado (sem rede).
const assert = require('assert');
process.env.SUPABASE_URL = 'https://fake.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'svc';
process.env.DEVICE_API_KEY = 'segredo123';

const db = { readings: [], subscribers: [] };
global.fetch = async (url, opts = {}) => {
  const u = new URL(url);
  const table = u.pathname.split('/').pop();
  const ok = (body, status = 200) => ({ ok: true, status, text: async () => (body ? JSON.stringify(body) : '') });
  if (opts.method === 'POST') {
    const row = JSON.parse(opts.body);
    if (table === 'subscribers') {
      if (!db.subscribers.find((r) => r.email === row.email)) db.subscribers.push(row);
    } else db.readings.push({ created_at: new Date().toISOString(), ...row });
    return ok(null, 201);
  }
  const sid = u.searchParams.get('station_id').replace('eq.', '');
  let rows = db.readings.filter((r) => r.station_id === sid).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const gte = u.searchParams.get('created_at');
  if (gte) rows = rows.filter((r) => r.created_at >= gte.replace('gte.', ''));
  return ok(rows.slice(0, Number(u.searchParams.get('limit'))));
};

const telemetry = require('../api/telemetry');
const stationsApi = require('../api/stations');
const subscribe = require('../api/subscribe');

function call(handler, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve) => {
    const res = {
      code: 200, h: {},
      setHeader(k, v) { this.h[k] = v; },
      status(c) { this.code = c; return this; },
      json(o) { resolve({ code: this.code, body: o }); },
    };
    handler({ method, headers, body }, res);
  });
}

(async () => {
  const key = { 'x-api-key': 'segredo123' };
  assert.strictEqual((await call(telemetry, { method: 'POST', body: {} })).code, 401);
  assert.strictEqual((await call(telemetry, { method: 'POST', headers: { 'x-api-key': 'errada' }, body: {} })).code, 401);
  assert.strictEqual((await call(telemetry, { method: 'GET', headers: key })).code, 405);
  assert.strictEqual((await call(telemetry, { method: 'POST', headers: key, body: { station_id: 'XX', level_cm: 1 } })).code, 400);
  assert.strictEqual((await call(telemetry, { method: 'POST', headers: key, body: { station_id: 'AR-01', level_cm: 'abc' } })).code, 400);

  assert.strictEqual((await call(telemetry, { method: 'POST', headers: key, body: { station_id: 'AR-01', level_cm: 112, distance_cm: 188 } })).code, 201);
  assert.strictEqual((await call(telemetry, { method: 'POST', headers: key, body: { station_id: 'AR-02', level_cm: 158 } })).code, 201);
  assert.strictEqual((await call(telemetry, { method: 'POST', headers: key, body: { station_id: 'AR-03', level_cm: 130 } })).code, 201);
  // timestamp antigo (fila do PC) é respeitado; futuro distante é ignorado
  const old = new Date(Date.now() - 3600e3).toISOString();
  await call(telemetry, { method: 'POST', headers: key, body: { station_id: 'AR-04', level_cm: 10, ts: old } });
  assert.strictEqual(db.readings.find((r) => r.station_id === 'AR-04').created_at, old);

  const r = await call(stationsApi);
  assert.strictEqual(r.code, 200);
  const by = Object.fromEntries(r.body.stations.map((s) => [s.id, s]));
  assert.strictEqual(by['AR-01'].status, 'normal');
  assert.strictEqual(by['AR-02'].status, 'attention');
  assert.strictEqual(by['AR-03'].status, 'critical');
  assert.strictEqual(by['AR-04'].status, 'offline');   // última leitura há 1 h > 10 min
  assert.strictEqual(by['AR-04'].level_cm, null);

  assert.strictEqual((await call(subscribe, { method: 'POST', body: { email: 'invalido' } })).code, 400);
  assert.strictEqual((await call(subscribe, { method: 'POST', body: { email: 'Teste@Exemplo.com' } })).code, 201);
  assert.strictEqual(db.subscribers[0].email, 'teste@exemplo.com');
  console.log('api: todos os testes passaram');
})().catch((e) => { console.error(e); process.exit(1); });
