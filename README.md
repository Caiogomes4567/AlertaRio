

# Manual de inicialização do AlertaRio

Arquitetura atual do projeto

ESP32 + sensor ultrassônico

Mede a distância e calcula o nível da água

API local — porta 8000

Recebe as medições e grava no SQLite

Proxy local — porta 8001

Disponibiliza a consulta dos dados

Cloudflare Tunnel

Cria o endereço público para acessar o computador

Site AlertaRio — Vercel

Exibe as estações e os dados no navegador

## Etapa 1 — Preparar o computador

Antes de iniciar, confira:

- Computador conectado à internet.
- ESP32 conectado ao computador ou à alimentação USB.
- Wi-Fi funcionando.
- Python instalado.
- Cloudflared instalado.
- Navegador disponível.

### 1.1. Abrir o PowerShell

1. Pressione `Windows + R`.
2. Digite `powershell`.
3. Pressione Enter.
4. Uma janela azul ou preta será aberta.
5. Repita esse procedimento até ter quatro janelas do PowerShell.

Você pode identificar as janelas pelo número:

| Janela       | Função        |
| ------------ | ------------- |
| PowerShell 1 | API principal |
| PowerShell 2 | Proxy         |
| PowerShell 3 | Cloudflare    |
| PowerShell 4 | Testes        |

Não execute todos os comandos em uma única janela. Os três primeiros processos precisam ficar rodando continuamente.

## Etapa 2 — Iniciar a API principal

PowerShell 1

Essa é a parte responsável por receber os dados enviados pelo ESP32 e armazená-los no banco de dados.

### 2.1. Abrir a pasta do projeto

Copie e cole:

```
$projeto = "$env:USERPROFILE\Downloads\AlertaRio_Vercel\alertario"

Write-Host "`n===== PROJETO ALERTARIO =====" -ForegroundColor Cyan

Write-Host "Pasta: $projeto"

Test-Path "$projeto\pc-bridge\server.py"
```

O resultado esperado é:

```
True
```

Se aparecer `False`, não continue: o arquivo não está no caminho esperado.

### 2.2. Iniciar o servidor

Na mesma janela, execute:

```
py "$projeto\pc-bridge\server.py"
```

Você deverá visualizar algo semelhante a:

```
=============================================
ALERTARIO - API LOCAL
Servidor: http://localhost:8000
Banco: ...\pc-bridge\data\alertario.db
=============================================
```

API iniciada

O que fazer agora: deixe essa janela aberta. Não pressione `Ctrl + C`, não feche o PowerShell e não execute outro servidor na mesma porta.

Essa janela é o processo que mantém a API funcionando.

## Etapa 3 — Iniciar o proxy

PowerShell 2

O proxy é necessário para que o Cloudflare encaminhe as consultas do site até a API local.

### 3.1. Abrir uma nova janela

Abra outro PowerShell, sem fechar o primeiro.

Execute:

```
$projeto = "$env:USERPROFILE\Downloads\AlertaRio_Vercel\alertario"

Write-Host "`n===== VERIFICANDO PROXY =====" -ForegroundColor Cyan

Test-Path "$projeto\pc-bridge\read_proxy.py"
```

Resultado esperado:

```
True
```

### 3.2. Iniciar o proxy

Execute:

```
py "$projeto\pc-bridge\read_proxy.py"
```

Ele deverá permanecer ativo no endereço:

```
http://127.0.0.1:8001
```

Não feche essa janela.

Neste momento você terá:

- PowerShell 1: API na porta 8000.
- PowerShell 2: proxy na porta 8001.

## Etapa 4 — Iniciar o Cloudflare

PowerShell 3

O Cloudflare é o responsável por criar uma conexão pública entre a internet e o proxy do seu computador.

### 4.1. Verificar a instalação

Abra uma terceira janela do PowerShell.

Execute:

```
cloudflared --version
```

Deverá aparecer uma versão semelhante a:

```
cloudflared version 2026.10.7
```

Se aparecer que o comando não é reconhecido, o Cloudflare não está disponível no PATH ou não está instalado corretamente.

### 4.2. Iniciar o túnel

Execute:

```
cloudflared tunnel --url http://127.0.0.1:8001
```

Aguarde alguns segundos.

O Cloudflare deve mostrar mensagens de conexão e gerar uma URL pública.

O endereço atual do nosso projeto é:

[https://handheld-campus-technologies-going.trycloudflare.com](https://handheld-campus-technologies-going.trycloudflare.com?utm_source=chatgpt.com)

O endereço pode mudar quando o túnel for reiniciado. Se isso acontecer, não utilize o endereço antigo.

### 4.3. Confirmar a conexão

Procure mensagens indicando que a conexão foi estabelecida.

Deixe a janela aberta.

Agora temos três processos ativos:

1. API local.
2. Proxy.
3. Cloudflare Tunnel.

## Etapa 5 — Testar os serviços

PowerShell 4

Agora vamos testar cada parte separadamente, antes de abrir o site.

Abra a quarta janela do PowerShell.

### 5.1. Testar a API principal

Execute:

```
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host " TESTE 1 - API LOCAL"
Write-Host "==================================" -ForegroundColor Cyan

try {
    $resposta = Invoke-RestMethod "http://127.0.0.1:8000/api/stations"

    $resposta | ConvertTo-Json -Depth 8
}
catch {
    Write-Host "ERRO: API local indisponivel." -ForegroundColor Red
    Write-Host $_.Exception.Message
}
```

Você deve receber uma resposta JSON contendo a lista de estações.

Procure a estação:

```
AR-01
```

### 5.2. Testar o proxy

Na mesma janela, execute:

```
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host " TESTE 2 - PROXY LOCAL"
Write-Host "==================================" -ForegroundColor Cyan

try {
    $resposta = Invoke-RestMethod "http://127.0.0.1:8001/api/stations"

    $resposta | ConvertTo-Json -Depth 8
}
catch {
    Write-Host "ERRO: Proxy indisponivel." -ForegroundColor Red
    Write-Host $_.Exception.Message
}
```

O resultado deve ser semelhante ao teste anterior.

### 5.3. Testar o Cloudflare

Execute:

```
Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host " TESTE 3 - API PUBLICA"
Write-Host "==================================" -ForegroundColor Cyan

$url = "https://handheld-campus-technologies-going.trycloudflare.com/api/stations"

try {
    $resposta = Invoke-RestMethod $url

    $resposta | ConvertTo-Json -Depth 8
}
catch {
    Write-Host "ERRO: API publica indisponivel." -ForegroundColor Red
    Write-Host $_.Exception.Message
}
```

Se o JSON aparecer, significa que o endereço público está conseguindo acessar as estações.

## Etapa 6 — Verificar o ESP32

Agora precisamos garantir que o dispositivo esteja efetivamente enviando os dados.

### 6.1. Abrir a Arduino IDE

1. Abra a Arduino IDE.
2. Abra o sketch do AlertaRio.
3. Conecte o ESP32 ao computador.
4. Entre em Ferramentas → Placa.
5. Confira se a placa selecionada é ESP32 Dev Module, conforme a configuração usada no projeto.
6. Entre em Ferramentas → Porta.
7. Selecione a porta COM correspondente ao ESP32.

### 6.2. Abrir o Monitor Serial

1. Clique no ícone do Monitor Serial.
2. Selecione a velocidade configurada no firmware. No projeto, confira se está em `115200`.
3. Observe as mensagens de conexão Wi-Fi e envio da API.

Exemplo de resposta esperada:

```
[API] HTTP 201 | envios=315 falhas=145
```

O número de envios deve aumentar conforme novas leituras forem transmitidas.

HTTP 201

Essa resposta indica que a API aceitou a medição enviada.

Atenção: não confunda o número acumulado de falhas com uma falha atual. O que importa é observar se os envios novos continuam recebendo HTTP 201 e se as falhas deixam de aumentar.

## Etapa 7 — Abrir o site

Agora que a comunicação foi testada, abra o site AlertaRio na Vercel.

1. Abra o navegador.
2. Entre no endereço público do projeto.
3. Pressione `Ctrl + F5`.
4. Aguarde o carregamento.
5. Localize a estação `AR-01`.
6. Confira os dados de distância, nível da água e estado de alerta.
7. Observe o horário da última atualização.

Se o site mostrar dados recentes, a demonstração está operacional.

## Etapa 8 — Checklist antes de apresentar

Use esta lista sempre que for demonstrar o projeto.

Checklist de inicialização

0/10

ESP32 ligado e conectado ao Wi-Fi

Monitor Serial aberto e recebendo leituras

API principal ativa na porta 8000

Proxy ativo na porta 8001

Cloudflare conectado e com URL pública

Teste da API local aprovado

Teste do proxy aprovado

Teste da API pública aprovado

Site aberto e atualizado

Estação AR-01 exibindo dados recentes

Reiniciar checklist

## Etapa 9 — Como resolver os problemas mais comuns

| Problema                            | O que verificar                                               |
| ----------------------------------- | ------------------------------------------------------------- |
| `server.py` não encontrado          | Caminho da pasta `AlertaRio_Vercel\alertario`                 |
| Porta 8000 ocupada                  | Verificar se já existe outra API rodando                      |
| Porta 8001 ocupada                  | Verificar se o proxy já está aberto                           |
| Cloudflare não conecta              | Verificar internet e se o proxy está ativo                    |
| API local funciona, mas pública não | Conferir Cloudflare e URL do túnel                            |
| ESP32 apresenta HTTP -1             | Verificar Wi-Fi, API local e endereço configurado no firmware |
| Site não atualiza                   | Conferir URL em `public/script.js`, deploy da Vercel e cache  |
| Site abre, mas não mostra estação   | Conferir resposta JSON e console do navegador                 |

## Etapa 10 — Desligar corretamente

Quando terminar a demonstração:

1. Na janela do Cloudflare, pressione `Ctrl + C`.
2. Na janela do proxy, pressione `Ctrl + C`.
3. Na janela da API, pressione `Ctrl + C`.
4. Feche a Arduino IDE ou desligue o ESP32.

O banco SQLite permanece salvo no computador. Não exclua a pasta `data` nem o arquivo `alertario.db`, pois eles armazenam o histórico das medições.

