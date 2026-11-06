#!/usr/bin/env python3
"""AlertaRio - ponte PC: lê o JSON do ESP32 pela USB (serial) e envia ao site na Vercel.

Uso:  python bridge.py            (usa o arquivo .env desta pasta)
      python bridge.py --list     (lista as portas seriais disponíveis)
"""
import json
import os
import sys
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path

MAX_QUEUE = 2000  # leituras guardadas se a internet cair


def load_env(path):
    """Carrega .env simples (CHAVE=valor) sem depender de bibliotecas."""
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def parse_line(line):
    """Converte uma linha serial em dict válido ou None (ignora depuração/erros)."""
    line = line.strip()
    if not line.startswith("{"):
        return None
    try:
        d = json.loads(line)
    except json.JSONDecodeError:
        return None
    if "error" in d or "station_id" not in d:
        return None
    try:
        level = float(d["level_cm"])
        dist = float(d["distance_cm"]) if d.get("distance_cm") is not None else None
    except (KeyError, TypeError, ValueError):
        return None
    return {"station_id": str(d["station_id"]), "level_cm": level, "distance_cm": dist}


class Throttle:
    """Decide quando enviar: por intervalo, ou antes se o nível mudou bastante."""

    def __init__(self, interval_s, change_cm):
        self.interval_s = interval_s
        self.change_cm = change_cm
        self.last = {}  # station_id -> (timestamp, level)

    def should_send(self, station_id, level, now):
        prev = self.last.get(station_id)
        if prev is None:
            ok = True
        else:
            ok = (now - prev[0] >= self.interval_s) or (abs(level - prev[1]) >= self.change_cm)
        if ok:
            self.last[station_id] = (now, level)
        return ok


class Uploader:
    """Envia ao site; se falhar, guarda na fila e tenta de novo depois."""

    def __init__(self, post_fn, max_queue=MAX_QUEUE):
        self.post = post_fn  # post_fn(payload) -> status code (lança exceção se sem rede)
        self.queue = deque(maxlen=max_queue)

    def submit(self, payload):
        payload = dict(payload, ts=datetime.now(timezone.utc).isoformat())
        self.queue.append(payload)
        self.flush()

    def flush(self):
        while self.queue:
            item = self.queue[0]
            try:
                status = self.post(item)
            except Exception as e:  # sem internet / timeout
                print(f"[aviso] sem conexão com o site ({e.__class__.__name__}); {len(self.queue)} na fila")
                return False
            if status in (200, 201):
                self.queue.popleft()
            elif status in (400, 401, 403, 404):
                print(f"[erro] site recusou a leitura (HTTP {status}) — verifique SITE_URL/DEVICE_API_KEY/station_id")
                self.queue.popleft()  # não adianta reenviar
                return False
            else:  # 5xx etc.: tenta depois
                print(f"[aviso] site respondeu HTTP {status}; {len(self.queue)} na fila")
                return False
        return True


def pick_port(configured):
    from serial.tools import list_ports

    if configured:
        return configured
    ports = list(list_ports.comports())
    if len(ports) == 1:
        return ports[0].device
    print("Não consegui escolher a porta sozinho. Portas encontradas:")
    for p in ports:
        print(f"  {p.device}  {p.description}")
    print("Defina SERIAL_PORT no arquivo .env")
    sys.exit(1)


def main():
    load_env(Path(__file__).parent / ".env")

    if "--list" in sys.argv:
        from serial.tools import list_ports

        for p in list_ports.comports():
            print(f"{p.device}  {p.description}")
        return

    import requests
    import serial

    site = os.environ.get("SITE_URL", "").rstrip("/")
    key = os.environ.get("DEVICE_API_KEY", "")
    if not site or not key:
        print("Configure SITE_URL e DEVICE_API_KEY no arquivo .env")
        sys.exit(1)
    baud = int(os.environ.get("BAUD_RATE", "115200"))
    throttle = Throttle(float(os.environ.get("SEND_INTERVAL_S", "60")), float(os.environ.get("CHANGE_CM", "10")))
    session = requests.Session()

    def post(payload):
        r = session.post(f"{site}/api/telemetry", json=payload, headers={"x-api-key": key}, timeout=10)
        return r.status_code

    up = Uploader(post)
    print(f"AlertaRio bridge -> {site}")

    while True:
        port = pick_port(os.environ.get("SERIAL_PORT", "").strip())
        try:
            with serial.Serial(port, baud, timeout=2) as ser:
                print(f"Lendo {port} @ {baud}")
                last_retry = time.monotonic()
                while True:
                    raw = ser.readline().decode("utf-8", errors="ignore")
                    now = time.monotonic()
                    data = parse_line(raw) if raw else None
                    if data:
                        print(f"[leitura] {data['station_id']} nível={data['level_cm']:.1f} cm")
                        if throttle.should_send(data["station_id"], data["level_cm"], now):
                            up.submit(data)
                    if up.queue and now - last_retry >= 15:
                        last_retry = now
                        up.flush()
        except serial.SerialException as e:
            print(f"[aviso] porta serial indisponível ({e}); tentando de novo em 5 s")
            time.sleep(5)
        except KeyboardInterrupt:
            print("\nEncerrado.")
            return


if __name__ == "__main__":
    main()
