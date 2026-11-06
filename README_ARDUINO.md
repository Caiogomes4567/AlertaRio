# AlertaRio — Guia do ESP32/Arduino → PC → Site

Fluxo completo:

```
[HC-SR04 + ESP32] --USB (serial JSON)--> [PC: pc-bridge/bridge.py] --HTTPS--> [Vercel /api/telemetry] --> [Supabase] --> [Site]
```

O ESP32 **não** fala com a internet: ele mede, avisa localmente (LED + buzzer) e manda uma linha de texto pela USB.
O PC lê essa linha e envia ao site. Se a internet do PC cair, a ponte guarda as leituras e reenvia depois.

---

## 1. Material

- ESP32 DevKit v1 (ou Arduino Uno/Nano — veja nota no fim)
- Sensor ultrassônico HC-SR04
- 3 LEDs (verde, amarelo, vermelho) + 3 resistores de 220 Ω
- 1 buzzer **ativo**
- 1 resistor de 1 kΩ e 1 de 2 kΩ (divisor de tensão do ECHO)
- Cabo USB de **dados** (alguns cabos só carregam e não funcionam)

## 2. Ligações (padrão do firmware)

| Componente | Pino do ESP32 |
|---|---|
| HC-SR04 VCC | VIN (5 V) |
| HC-SR04 GND | GND |
| HC-SR04 TRIG | GPIO 5 |
| HC-SR04 ECHO | GPIO 18 **através do divisor de tensão** |
| LED verde (+ 220 Ω) | GPIO 25 |
| LED amarelo (+ 220 Ω) | GPIO 26 |
| LED vermelho (+ 220 Ω) | GPIO 27 |
| Buzzer ativo (+) | GPIO 14 (− no GND) |

**Divisor de tensão do ECHO (obrigatório no ESP32):** o ECHO do HC-SR04 sai com 5 V, mas o GPIO do ESP32 aguenta 3,3 V.

```
ECHO ──[1 kΩ]──┬── GPIO 18
               │
             [2 kΩ]
               │
              GND
```

(Alternativa: usar um módulo HC-SR04 versão 3,3 V.)

## 3. Gravar o firmware

1. Instale o **Arduino IDE** e, em *Gerenciador de Placas*, instale **esp32 by Espressif Systems**.
2. Abra `firmware/alertario_esp32/alertario_esp32.ino`.
3. Ajuste o bloco `CONFIGURE AQUI`:
   - `STATION_ID`: `AR-01`, `AR-02`, `AR-03` ou `AR-04` (tem que existir em `api/_stations.js`).
   - `ALTURA_SENSOR_CM`: distância, em cm, do sensor até o **fundo** do canal/bueiro. O nível da água é `ALTURA − distância medida`.
   - `ATENCAO_CM` e `CRITICO_CM`: iguais aos da estação em `api/_stations.js`.
4. Placa: **ESP32 Dev Module** → escolha a porta → **Upload**.
   (Se travar em "Connecting...", segure o botão **BOOT** até começar a gravar.)
5. Abra o **Monitor Serial a 115200**. A cada 5 s deve aparecer:

```
{"station_id":"AR-01","distance_cm":188.2,"level_cm":111.8}
```

Se aparecer `"error":"sem_leitura"`, o sensor não está respondendo (confira VCC, GND, TRIG, ECHO e o divisor).

> **Feche o Monitor Serial antes de rodar a ponte.** Só um programa por vez pode usar a porta.

## 4. Instalar a ponte no PC

Precisa do Python 3.9+.

```bash
cd pc-bridge
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Linux/macOS:  source .venv/bin/activate
pip install -r requirements.txt
```

Copie `.env.example` para `.env` e preencha:

```
SITE_URL=https://SEU-SITE.vercel.app
DEVICE_API_KEY=<a mesma chave configurada na Vercel>
SERIAL_PORT=COM3          # Windows | /dev/ttyUSB0 (Linux) | /dev/cu.usbserial-XXXX (macOS)
SEND_INTERVAL_S=60
CHANGE_CM=10
```

Para descobrir a porta: `python bridge.py --list`.
No Windows, se a porta não aparecer, instale o driver **CP210x** ou **CH340** (depende do seu ESP32).
No Linux, se der "permission denied": `sudo usermod -a -G dialout $USER` e faça logout/login.

## 5. Rodar

```bash
python bridge.py
```

Saída esperada:

```
AlertaRio bridge -> https://SEU-SITE.vercel.app
Lendo COM3 @ 115200
[leitura] AR-01 nível=111.8 cm
```

- Envia ao site no máximo 1 leitura a cada `SEND_INTERVAL_S` segundos, **ou na hora** se o nível mudar `CHANGE_CM` cm ou mais.
- Se o site/internet falhar, as leituras ficam numa fila (até 2000) e são reenviadas com o horário original.
- Se o ESP32 for desconectado, a ponte tenta reconectar sozinha.
- Mensagens `HTTP 401` = `DEVICE_API_KEY` diferente da Vercel. `HTTP 400` = `station_id` inexistente.

O PC precisa ficar **ligado, com a ponte rodando** para o site receber dados. Se parar, o site marca a estação como *Offline* após 10 minutos sem leitura (`OFFLINE_AFTER_MIN`).

## 6. Testar sem o ESP32 (opcional)

Para conferir se a Vercel está recebendo:

```bash
curl -X POST https://SEU-SITE.vercel.app/api/telemetry \
  -H "Content-Type: application/json" \
  -H "x-api-key: SUA_CHAVE" \
  -d '{"station_id":"AR-01","level_cm":112,"distance_cm":188}'
```

Resposta esperada: `{"ok":true}`. Depois abra o site: o card da AR-01 deve mostrar "Dados ao vivo".

## 7. Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Nada aparece na porta serial | Cabo só de carga, driver faltando, ou baud diferente de 115200 |
| `sem_leitura` | Fiação do HC-SR04 / sensor a menos de 2 cm ou além de 4 m da água |
| Nível negativo/zerado | `ALTURA_SENSOR_CM` menor que a distância real ao fundo |
| `could not open port` | Monitor Serial do Arduino IDE aberto, ou outra ponte rodando |
| Site mostra "valores de demonstração" | API sem as variáveis do Supabase/Vercel, ou nenhuma leitura enviada ainda |
| Estação "Offline" | Ponte parada ou sem leitura há mais de 10 min |

## Nota: usar Arduino Uno/Nano

O código serve, com ajustes: troque os pinos no bloco `CONFIGURE AQUI` (por ex. TRIG 9, ECHO 10, LEDs 4/5/6, buzzer 7). O Uno trabalha em 5 V, então **não** precisa do divisor no ECHO.
