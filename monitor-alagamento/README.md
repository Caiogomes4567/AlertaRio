# Monitor de Alagamento (Vercel + bridge no PC)

Fluxo: **ESP32 → (Wi-Fi local) → PC com o bridge → Vercel → painel no navegador**. Sem banco de dados.

> O estado fica na memória da Vercel. Se o painel mostrar "sem dados" por alguns segundos, é um cold start: o próximo envio do ESP32 repõe tudo. O ESP32 deve enviar pelo menos a cada 10 s (o painel marca OFFLINE após 15 s).

## 1. Primeira vez (uma vez só)

1. Instale o **Node.js 20 ou superior** (LTS, nodejs.org) e o **Git**.
2. Crie um repositório **vazio** em github.com/new chamado `monitor-alagamento`.
3. No VS Code: **File → Open Folder** e escolha esta pasta. Abra o terminal com **Ctrl + `**.
4. Envie para o GitHub:
   ```
   git init
   git add .
   git commit -m "Monitor de alagamento"
   git branch -M main
   git remote add origin https://github.com/Caiogomes4567/monitor-alagamento.git
   git push -u origin main
   ```
   Confira com `git status` que `.env.bridge` e `.env.local` **não** aparecem (são ignorados de propósito).
5. Em vercel.com: **Add New → Project → Import** o repositório. Antes de **Deploy**, em **Environment Variables**, crie:
   - `DEVICE_TOKEN` = um texto longo e aleatório (invente um; não use o antigo `token-secreto-esp32-01`)
6. Clique em **Deploy** e copie o endereço (ex.: `https://monitor-alagamento.vercel.app`).

## 2. Rodar no dia a dia (VS Code)

1. Abra a pasta no VS Code e o terminal (**Ctrl + `**).
2. Na primeira vez: `npm install`
3. Crie o arquivo de configuração do bridge:
   ```
   copy .env.bridge.example .env.bridge
   ```
   (no PowerShell: `Copy-Item .env.bridge.example .env.bridge`) e preencha:
   ```
   VERCEL_URL=https://SEU-APP.vercel.app
   DEVICE_TOKEN=o mesmo valor configurado na Vercel
   PORT=3000
   ```
4. Inicie o bridge e **deixe a janela aberta**:
   ```
   npm run bridge
   ```
5. Ligue o ESP32. A cada envio aparece `Vercel respondeu 200`. Abra o endereço da Vercel para ver o painel.
6. Para parar: **Ctrl + C** no terminal.

O firmware do ESP32 envia o POST a cada 3 s para `http://IP-DO-PC:3000/api/telemetry` (IP atual do PC: `192.168.0.14`). O bridge responde 200 na hora ao ESP32 e repassa para a Vercel em segundo plano; erros de envio aparecem no terminal do PC. O bridge aceita o mesmo JSON de antes e usa o token dele para falar com a Vercel.

## 3. Ao trocar de rede (casa, faculdade, hotspot...)

A Vercel e o bridge **não mudam**. Só mudam o PC e o firmware:

1. Conecte o **PC** na nova rede.
2. Descubra o IP do PC: abra o terminal e rode `ipconfig`; use o **Endereço IPv4** do adaptador Wi-Fi (ex.: `192.168.0.14`).
3. No código do ESP32, altere **3 coisas**: nome da rede (SSID), senha do Wi-Fi e o **IP do PC** na URL do servidor. Grave no ESP32 de novo (upload).
4. A rede precisa ser **2,4 GHz** para o ESP32 (ele não conecta em 5 GHz). No hotspot do celular, ative a opção de compatibilidade/2,4 GHz.
5. No Windows, a nova rede deve estar como **Rede privada** (Configurações → Rede e Internet → Wi-Fi → propriedades da rede). Se aparecer o aviso do Firewall para o Node.js, clique em **Permitir**.
6. Reinicie o bridge (`npm run bridge`) e confirme as linhas `Vercel respondeu 200`.

Se nada chegar no PC, a rede pode ter **isolamento de clientes** (comum em Wi-Fi de faculdade ou público): um aparelho não enxerga o outro. Use o hotspot do celular ou o seu roteador.

Dica: no roteador, reserve um IP fixo para o PC para o IP não mudar na mesma rede.

## 4. Segurança

- Nunca envie `.env.local` ou `.env.bridge` ao GitHub.
- A chave privada VAPID antiga foi compartilhada em um zip; se for usar push no futuro, gere um novo par (`npx web-push generate-vapid-keys`).
