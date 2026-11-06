// Bridge: ESP32 (rede local) -> este PC -> Vercel
// O ESP32 continua enviando o mesmo JSON para o PC; o bridge repassa para a Vercel.
import http from 'node:http'

const PORT = Number(process.env.PORT || 3000)
const VERCEL_URL = (process.env.VERCEL_URL || '').replace(/\/$/, '')
const DEVICE_TOKEN = process.env.DEVICE_TOKEN || ''

if (!VERCEL_URL || !DEVICE_TOKEN) {
  console.error('Faltou VERCEL_URL ou DEVICE_TOKEN no arquivo .env.bridge')
  process.exit(1)
}

let ultimo = null

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ bridge: 'ok', destino: VERCEL_URL, ultimo }))
  }

  const chunks = []
  for await (const c of req) chunks.push(c)
  const body = Buffer.concat(chunks).toString()

  // Responde logo ao ESP32 (ele não fica esperando a internet) e repassa em segundo plano.
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true }))

  try {
    const r = await fetch(`${VERCEL_URL}/api/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEVICE_TOKEN}`,
      },
      body,
      signal: AbortSignal.timeout(8000),
    })
    ultimo = { em: new Date().toISOString(), status: r.status }
    console.log(`[${new Date().toLocaleTimeString()}] Vercel respondeu ${r.status}`)
  } catch (err) {
    ultimo = { em: new Date().toISOString(), erro: err.message }
    console.error('Falha ao enviar para a Vercel:', err.message)
  }
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bridge ouvindo na porta ${PORT} -> ${VERCEL_URL}`)
})
