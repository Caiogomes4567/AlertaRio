# AlertaRio — Site + API (Vercel)

Estrutura:

```
public/          site estático (index.html, style.css, script.js)
api/             funções serverless da Vercel
  telemetry.js   POST  recebe leituras da ponte do PC (exige x-api-key)
  stations.js    GET   níveis atuais para o site
  subscribe.js   POST  guarda e-mails do formulário
  _stations.js   cadastro das estações e limites de atenção/crítico
supabase.sql     tabelas do banco
pc-bridge/       ponte USB → internet (rodar no PC)
firmware/        código do ESP32
```

Guia do ESP32 e da ponte: **README_ARDUINO.md**.

## Publicar na Vercel

### 1) Banco (Supabase, plano gratuito)
1. Crie um projeto em supabase.com.
2. *SQL Editor* → cole o conteúdo de `supabase.sql` → **Run**.
3. Em *Project Settings → API*, copie a **Project URL** e a chave **service_role** (secreta; nunca coloque no site nem no GitHub).

### 2) Chave do dispositivo
Gere uma chave longa e aleatória, por exemplo:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3) Vercel
1. Envie esta pasta para um repositório no GitHub (o `.gitignore` já protege `.env`).
2. Na Vercel: **Add New → Project** → importe o repositório. *Framework Preset*: **Other**; deixe build command e output vazios (o `vercel.json` já aponta para `public`).
3. Em **Environment Variables**, adicione (para Production):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `DEVICE_API_KEY`
   - `OFFLINE_AFTER_MIN` (opcional, padrão 10)
4. **Deploy**. (Se adicionar variáveis depois, faça *Redeploy*.)

Alternativa pela linha de comando: `npm i -g vercel` → `vercel` → `vercel --prod`.

### 4) Verificar
- Abra o site: sem leituras, aparece "valores de demonstração"/estações offline.
- Rode o `curl` da seção 6 do README_ARDUINO.md: o card da AR-01 passa a mostrar "Dados ao vivo".

## Ajustar estações
Edite `api/_stations.js` (nome, local, limites). Os limites de **AR-04** são provisórios — defina os reais. Mantenha os mesmos valores no firmware.

## Testes locais
```bash
node tests/api.test.js            # API com banco simulado
cd pc-bridge && python test_bridge.py
```

## O que ainda não existe
- Os e-mails do formulário são **guardados** (tabela `subscribers`), mas o envio de alertas por e-mail/SMS não está implementado.
- Textos como "~40 min de antecedência" e "R$ 114" na página são conteúdo do projeto, não calculados pelo sistema.
