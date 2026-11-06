import bridge


def test_parse():
    ok = bridge.parse_line('{"station_id":"AR-01","distance_cm":188.2,"level_cm":111.8}\r\n')
    assert ok == {"station_id": "AR-01", "level_cm": 111.8, "distance_cm": 188.2}
    assert bridge.parse_line("# AlertaRio iniciado") is None
    assert bridge.parse_line('{"station_id":"AR-01","error":"sem_leitura"}') is None
    assert bridge.parse_line("lixo{") is None
    assert bridge.parse_line('{"station_id":"AR-01","level_cm":"x"}') is None


def test_throttle():
    t = bridge.Throttle(60, 10)
    assert t.should_send("AR-01", 100, 0)
    assert not t.should_send("AR-01", 101, 10)
    assert t.should_send("AR-01", 115, 11)      # mudou >= 10 cm
    assert t.should_send("AR-01", 115, 80)      # passou o intervalo
    assert t.should_send("AR-02", 50, 81)       # outra estação


def test_queue_offline_then_recover():
    state = {"online": False, "sent": []}

    def post(p):
        if not state["online"]:
            raise ConnectionError("offline")
        state["sent"].append(p)
        return 201

    u = bridge.Uploader(post)
    u.submit({"station_id": "AR-01", "level_cm": 1.0, "distance_cm": 2.0})
    u.submit({"station_id": "AR-01", "level_cm": 2.0, "distance_cm": 2.0})
    assert len(u.queue) == 2 and not state["sent"]
    state["online"] = True
    assert u.flush() and not u.queue
    assert [p["level_cm"] for p in state["sent"]] == [1.0, 2.0]
    assert all("ts" in p for p in state["sent"])


def test_bad_request_is_dropped():
    u = bridge.Uploader(lambda p: 401)
    u.submit({"station_id": "AR-01", "level_cm": 1.0, "distance_cm": None})
    assert not u.queue


if __name__ == "__main__":
    test_parse(); test_throttle(); test_queue_offline_then_recover(); test_bad_request_is_dropped()
    print("bridge: todos os testes passaram")
