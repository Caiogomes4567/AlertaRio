const form = document.getElementById("alertForm");
const message = document.getElementById("formMessage");

if (form && message) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    message.className = "error";
    message.textContent = "O cadastro de alertas por e-mail estÃ¡ temporariamente indisponÃ­vel.";
  });
}

/* ===== Monitor AlertaRio: leitura do PC via Cloudflare Tunnel ===== */
const DATA_API = "https://earning-discretion-notifications-routing.trycloudflare.com/api/stations";
const POLL_MS = 5000;
const STATUS_LABEL = {
  normal: "Normal",
  attention: "AtenÃ§Ã£o",
  alert: "Alerta",
  critical: "CrÃ­tico",
  offline: "Offline"
};

function hhmm(value) {
  if (!value) return "--:--";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function normalizeStatus(s) {
  if (s.online === false || Number(s.sensor_ok) === 0) return "offline";
  const raw = String(s.alert || s.status || "normal").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (["critical", "critico", "perigo", "danger"].includes(raw)) return "critical";
  if (["alert", "alerta", "attention", "atencao", "warning"].includes(raw)) return "attention";
  if (["offline", "sensor_falha", "sensor_failure"].includes(raw)) return "offline";
  return "normal";
}

function applyStation(s) {
  const stationId = s.station_id || s.id;
  const el = document.querySelector('.station[data-station="' + stationId + '"]');
  if (!el) return;

  const status = normalizeStatus(s);
  const offline = status === "offline";
  const label = STATUS_LABEL[status] || "Offline";
  const level = Number(s.level_cm ?? s.water_depth_cm);
  const levelValid = Number.isFinite(level);
  const bar = el.querySelector(".bar");
  const info = el.querySelector(".station-info span");
  const val = el.querySelector(":scope > strong");
  const pill = el.querySelector(".pill");

  bar.className = "bar" + ({
    attention: " warning",
    critical: " critical",
    offline: " offline"
  }[status] || "");

  const stationConfig = {
    "AR-01": { atencao: 180, critico: 240 },
    "AR-02": { atencao: 150, critico: 200 },
    "AR-03": { atencao: 90, critico: 120 },
    "AR-04": { atencao: 120, critico: 160 }
  }[stationId] || { atencao: 180, critico: 240 };

  const pct = offline || !levelValid ? 0 : Math.max(0, Math.min(100, (level / stationConfig.critico) * 100));
  bar.querySelector("i").style.width = pct.toFixed(0) + "%";
  bar.querySelector("em").style.right = (100 - (stationConfig.atencao / stationConfig.critico) * 100).toFixed(0) + "%";

  pill.className = "pill " + status;
  pill.textContent = label;

  const updated = s.created_at || s.updated_at;
  if (offline || !levelValid) {
    val.textContent = "â€” â€”";
    val.setAttribute("aria-label", "Sem leitura disponÃ­vel");
    info.textContent = stationId + " Â· " + (s.local || "EstaÃ§Ã£o") + " Â· " +
      (updated ? "sem comunicar desde " + hhmm(updated) : "sem leitura recebida");
  } else {
    val.textContent = level.toFixed(1).replace(".", ",") + " cm";
    val.removeAttribute("aria-label");
    info.textContent = stationId + " Â· " + (s.local || "Leitura do sensor") +
      " Â· distÃ¢ncia: " + (Number.isFinite(Number(s.distance_cm)) ? Number(s.distance_cm).toFixed(1).replace(".", ",") + " cm" : "â€”");
  }
  el.setAttribute("aria-label", "EstaÃ§Ã£o " + stationId + ". NÃ­vel atual: " +
    (offline || !levelValid ? "sem leitura" : level.toFixed(1) + " centÃ­metros") + ". Status: " + label + ".");
}

function applyHero(s) {
  if (!s) return;
  const status = normalizeStatus(s);
  const offline = status === "offline";
  const level = Number(s.level_cm ?? s.water_depth_cm);
  const valid = Number.isFinite(level);
  const updated = s.created_at || s.updated_at;

  document.getElementById("heroName").textContent = "Canal do Pinheirinho";
  document.getElementById("heroMeta").textContent = "EstaÃ§Ã£o AR-01" +
    (updated ? " Â· leitura de " + hhmm(updated) : " Â· aguardando leitura");
  const st = document.getElementById("heroStatus");
  st.className = "status " + status;
  st.textContent = STATUS_LABEL[status] || "Offline";
  document.getElementById("heroLevel").textContent = offline || !valid ? "â€”" : level.toFixed(1).replace(".", ",");
  document.getElementById("heroTrend").textContent = offline ? "sem comunicaÃ§Ã£o" : (s.trend || "sem tendÃªncia calculada");
}

async function loadStations() {
  const notice = document.getElementById("dataNotice");
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let res;
    try {
      res = await fetch(DATA_API, { cache: "no-store", signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    if (!Array.isArray(data.stations)) throw new Error("Resposta sem estaÃ§Ãµes");
    data.stations.forEach(applyStation);
    const mainStation = data.stations.find((x) => (x.station_id || x.id) === "AR-01");
    applyHero(mainStation);
    notice.className = "data-notice live";
    notice.textContent = "Dados ao vivo Â· atualizado Ã s " + hhmm(new Date().toISOString());
  } catch (err) {
    notice.className = "data-notice";
    notice.textContent = "Sem conexÃ£o com a estaÃ§Ã£o. Aguardando nova tentativa automÃ¡tica.";
  }
}

loadStations();
setInterval(loadStations, POLL_MS);

const toggle = document.getElementById("accessibilityToggle");
const menu = document.getElementById("accessibilityMenu");
const close = document.getElementById("accessibilityClose");

const increaseText = document.getElementById("increaseText");
const decreaseText = document.getElementById("decreaseText");
const highContrast = document.getElementById("highContrast");
const grayscale = document.getElementById("grayscale");
const readText = document.getElementById("readText");
const keyboardFocus = document.getElementById("keyboardFocus");
const reset = document.getElementById("resetAccessibility");

const html = document.documentElement;

let fontScale = 1;

function closeMenu() {
    menu.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
}

toggle.addEventListener("click", () => {
    menu.hidden = !menu.hidden;

    toggle.setAttribute(
        "aria-expanded",
        String(!menu.hidden)
    );
});

close.addEventListener("click", closeMenu);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
        closeMenu();
        toggle.focus();
    }
});

function applyTextScale() {

    const textElements = document.querySelectorAll(
        "h1, h2, h3, h4, h5, h6, p, a, span, " +
        "strong, b, small, li, label, button, " +
        "input, textarea, select, td, th"
    );

    textElements.forEach(element => {

        if (element.closest(".accessibility-widget")) return;

        if (!element.dataset.originalFontSize) {
            element.dataset.originalFontSize =
                parseFloat(getComputedStyle(element).fontSize);
        }

        const originalSize = parseFloat(
            element.dataset.originalFontSize
        );

        element.style.fontSize =
            `${originalSize * fontScale}px`;
    });
}

increaseText.addEventListener("click", () => {
    fontScale = Math.min(fontScale + 0.1, 1.5);
    applyTextScale();
});

decreaseText.addEventListener("click", () => {
    fontScale = Math.max(fontScale - 0.1, 0.8);
    applyTextScale();
});

highContrast.addEventListener("click", () => {
    html.classList.toggle("high-contrast");
});

grayscale.addEventListener("click", () => {
    html.classList.toggle("grayscale");
});

readText.addEventListener("click", () => {

    if (!("speechSynthesis" in window)) {
        alert("Seu navegador nÃ£o oferece suporte Ã  leitura de voz.");
        return;
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        readText.innerHTML = "<span>ðŸ”Š</span> Ler conteÃºdo da pÃ¡gina";
        return;
    }

    const selectedText = window.getSelection().toString().trim();

    const mainContent =
        document.querySelector("main") ||
        document.querySelector("article") ||
        document.body;

    const clone = mainContent.cloneNode(true);

    clone.querySelectorAll(
        "script, style, button, nav, input, textarea, select, " +
        ".accessibility-widget, [aria-hidden='true']"
    ).forEach(element => element.remove());

    const pageText = selectedText || clone.innerText.trim();

    if (!pageText) {
        alert("NÃ£o encontrei texto para leitura.");
        return;
    }

    const speech = new SpeechSynthesisUtterance(pageText);

    speech.lang = "pt-BR";
    speech.rate = 1;
    speech.pitch = 1;

    speech.onend = () => {
        readText.innerHTML = "<span>ðŸ”Š</span> Ler conteÃºdo da pÃ¡gina";
    };

    speech.onerror = () => {
        readText.innerHTML = "<span>ðŸ”Š</span> Ler conteÃºdo da pÃ¡gina";
    };

    readText.innerHTML = "<span>â¹</span> Parar leitura";

    window.speechSynthesis.speak(speech);
});

keyboardFocus.addEventListener("click", () => {
    html.classList.toggle("keyboard-accessibility");
});

reset.addEventListener("click", () => {

    document.querySelectorAll("[data-original-font-size]")
        .forEach(element => {
            element.style.removeProperty("font-size");
            delete element.dataset.originalFontSize;
        });

    fontScale = 1;

    html.classList.remove(
        "high-contrast",
        "grayscale",
        "keyboard-accessibility"
    );

    window.speechSynthesis?.cancel();

    readText.innerHTML = "<span>ðŸ”Š</span> Ler conteÃºdo da pÃ¡gina";
});


