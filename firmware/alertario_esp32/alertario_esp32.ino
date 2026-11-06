/*
  AlertaRio — firmware da estação (ESP32 ou Arduino)
  Lê o HC-SR04, decide o alerta local (LED + buzzer) e envia uma linha JSON
  pela porta serial (USB) para o PC a cada INTERVALO_ENVIO_MS.

  Exemplo de linha enviada:
  {"station_id":"AR-01","distance_cm":188.2,"level_cm":111.8}

  Linhas que começam com '#' são só mensagens de depuração (a ponte ignora).

  ATENÇÃO (ESP32): o pino ECHO do HC-SR04 manda 5 V. Use divisor de tensão
  (1 kΩ + 2 kΩ) ou um módulo HC-SR04 versão 3,3 V. Ver README_ARDUINO.md.
*/

// ====== CONFIGURE AQUI ======
const char* STATION_ID = "AR-01";          // AR-01, AR-02, AR-03 ou AR-04 (igual a api/_stations.js)
const float ALTURA_SENSOR_CM = 300.0;      // distância do sensor até o FUNDO (medir na instalação)
const float ATENCAO_CM = 180.0;            // igual a api/_stations.js
const float CRITICO_CM = 240.0;            // igual a api/_stations.js
const float HISTERESE_CM = 5.0;            // evita "pisca-pisca" de alerta

// Pinos (padrão ESP32 DevKit v1). Em Arduino Uno troque, p.ex.: TRIG 9, ECHO 10, LEDs 4/5/6, BUZZER 7.
const int PIN_TRIG   = 5;
const int PIN_ECHO   = 18;
const int PIN_LED_VERDE    = 25;
const int PIN_LED_AMARELO  = 26;
const int PIN_LED_VERMELHO = 27;
const int PIN_BUZZER = 14;                 // buzzer ATIVO

const unsigned long INTERVALO_LEITURA_MS = 1000;  // leitura/alerta local
const unsigned long INTERVALO_ENVIO_MS   = 5000;  // envio serial para o PC
// ============================

enum Estado { NORMAL, ATENCAO, CRITICO };
Estado estado = NORMAL;

float ultimaDistancia = -1;
float ultimoNivel = -1;
bool leituraValida = false;

unsigned long tLeitura = 0, tEnvio = 0, tBuzzer = 0;
bool buzzerLigado = false;

float medirUmaVez() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(3);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  unsigned long dur = pulseIn(PIN_ECHO, HIGH, 30000UL);  // timeout 30 ms (~5 m)
  if (dur == 0) return -1;
  return dur * 0.0343f / 2.0f;                           // cm (som a ~20 °C)
}

// Mediana de 5 leituras: ignora picos/ruído.
float medirDistancia() {
  float v[5];
  int n = 0;
  for (int i = 0; i < 5; i++) {
    float d = medirUmaVez();
    if (d >= 2.0f && d <= 400.0f) v[n++] = d;
    delay(60);
  }
  if (n < 3) return -1;
  for (int i = 0; i < n - 1; i++)
    for (int j = i + 1; j < n; j++)
      if (v[j] < v[i]) { float t = v[i]; v[i] = v[j]; v[j] = t; }
  return v[n / 2];
}

void atualizarEstado(float nivel) {
  switch (estado) {
    case NORMAL:
      if (nivel >= CRITICO_CM) estado = CRITICO;
      else if (nivel >= ATENCAO_CM) estado = ATENCAO;
      break;
    case ATENCAO:
      if (nivel >= CRITICO_CM) estado = CRITICO;
      else if (nivel < ATENCAO_CM - HISTERESE_CM) estado = NORMAL;
      break;
    case CRITICO:
      if (nivel < CRITICO_CM - HISTERESE_CM) estado = (nivel >= ATENCAO_CM) ? ATENCAO : NORMAL;
      break;
  }
}

void atualizarSaidas() {
  digitalWrite(PIN_LED_VERDE,    estado == NORMAL  && leituraValida);
  digitalWrite(PIN_LED_AMARELO,  estado == ATENCAO);
  digitalWrite(PIN_LED_VERMELHO, estado == CRITICO);

  // Buzzer: mudo no normal, bipe lento na atenção, bipe rápido no crítico.
  unsigned long agora = millis();
  unsigned long periodo = (estado == CRITICO) ? 250 : (estado == ATENCAO ? 1000 : 0);
  if (periodo == 0) {
    digitalWrite(PIN_BUZZER, LOW);
    buzzerLigado = false;
  } else if (agora - tBuzzer >= periodo) {
    tBuzzer = agora;
    buzzerLigado = !buzzerLigado;
    digitalWrite(PIN_BUZZER, buzzerLigado);
  }
}

void enviarSerial() {
  if (leituraValida) {
    Serial.print("{\"station_id\":\"");
    Serial.print(STATION_ID);
    Serial.print("\",\"distance_cm\":");
    Serial.print(ultimaDistancia, 1);
    Serial.print(",\"level_cm\":");
    Serial.print(ultimoNivel, 1);
    Serial.println("}");
  } else {
    Serial.print("{\"station_id\":\"");
    Serial.print(STATION_ID);
    Serial.println("\",\"error\":\"sem_leitura\"}");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_LED_VERDE, OUTPUT);
  pinMode(PIN_LED_AMARELO, OUTPUT);
  pinMode(PIN_LED_VERMELHO, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);
  Serial.println("# AlertaRio iniciado");
}

void loop() {
  unsigned long agora = millis();

  if (agora - tLeitura >= INTERVALO_LEITURA_MS) {
    tLeitura = agora;
    float d = medirDistancia();
    if (d < 0) {
      leituraValida = false;   // sensor desconectado/sem eco: mantém o último estado de alerta
    } else {
      leituraValida = true;
      ultimaDistancia = d;
      ultimoNivel = ALTURA_SENSOR_CM - d;
      if (ultimoNivel < 0) ultimoNivel = 0;
      atualizarEstado(ultimoNivel);
    }
  }

  if (agora - tEnvio >= INTERVALO_ENVIO_MS) {
    tEnvio = agora;
    enviarSerial();
  }

  atualizarSaidas();
}
