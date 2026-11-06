const form = document.getElementById("alertForm");
const message = document.getElementById("formMessage");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.className = "";
  message.textContent = "Enviando...";
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email.value })
    });
    if (!res.ok) throw new Error(String(res.status));
    message.textContent = "E-mail cadastrado! Você entrou na lista de alertas.";
    form.reset();
  } catch (err) {
    message.className = "error";
    message.textContent = "Não foi possível cadastrar agora. Verifique o e-mail e tente novamente.";
  }
});

/* ===== Dados reais das estações (API /api/stations) ===== */
const STATUS_LABEL = { normal: "Normal", attention: "Atenção", critical: "Crítico", offline: "Offline" };
const POLL_MS = 15000;

function hhmm(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function applyStation(s) {
  const el = document.querySelector('.station[data-station="' + s.id + '"]');
  if (!el) return;
  const offline = s.status === "offline";
  const label = STATUS_LABEL[s.status] || "Offline";

  const barCls = { attention: " warning", critical: " critical", offline: " offline" }[s.status] || "";
  const bar = el.querySelector(".bar");
  bar.className = "bar" + barCls;
  const pct = offline || s.level_cm === null ? 0 : Math.max(0, Math.min(100, (s.level_cm / s.critico) * 100));
  bar.querySelector("i").style.width = pct.toFixed(0) + "%";
  bar.querySelector("em").style.right = (100 - (s.atencao / s.critico) * 100).toFixed(0) + "%";

  const pill = el.querySelector(".pill");
  pill.className = "pill " + s.status;
  pill.textContent = label;

  const val = el.querySelector(":scope > strong");
  const info = el.querySelector(".station-info span");
  if (offline) {
    val.textContent = "— —";
    val.setAttribute("aria-label", "Sem leitura disponível");
    info.textContent = s.id + " · " + s.local + " · " +
      (s.updated_at ? "sem comunicar desde " + hhmm(s.updated_at) : "sem leitura recebida");
    el.setAttribute("aria-label", "Estação " + s.id + ", " + s.nome + ". Sem leitura disponível. Status: offline.");
  } else {
    val.textContent = Math.round(s.level_cm) + " cm";
    val.removeAttribute("aria-label");
    info.textContent = s.id + " · " + s.local + " · atenção em " + s.atencao + " cm";
    el.setAttribute("aria-label", "Estação " + s.id + ", " + s.nome + ". Nível atual: " + Math.round(s.level_cm) +
      " centímetros. Atenção a partir de " + s.atencao + " centímetros. Status: " + label.toLowerCase() + ".");
  }
}

function applyHero(s) {
  if (!s) return;
  const offline = s.status === "offline";
  document.getElementById("heroName").textContent = s.nome;
  document.getElementById("heroMeta").textContent = "Estação " + s.id +
    (s.updated_at ? " · leitura de " + hhmm(s.updated_at) : " · sem leitura");
  const st = document.getElementById("heroStatus");
  st.className = "status " + s.status;
  st.textContent = STATUS_LABEL[s.status] || "Offline";
  document.getElementById("heroLevel").textContent = offline ? "—" : Math.round(s.level_cm);
  document.getElementById("heroTrend").textContent = offline ? "sem comunicação" : (s.trend || "");
}

async function loadStations() {
  const notice = document.getElementById("dataNotice");
  try {
    const res = await fetch("/api/stations", { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    data.stations.forEach(applyStation);
    applyHero(data.stations.find((x) => x.id === "AR-01"));
    notice.className = "data-notice live";
    notice.textContent = "Dados ao vivo · atualizado às " + hhmm(data.generated_at);
  } catch (err) {
    notice.className = "data-notice";
    notice.textContent = "Dados ao vivo indisponíveis. Exibindo valores de demonstração.";
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
        alert("Seu navegador não oferece suporte à leitura de voz.");
        return;
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        readText.innerHTML = "<span>🔊</span> Ler conteúdo da página";
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
        alert("Não encontrei texto para leitura.");
        return;
    }

    const speech = new SpeechSynthesisUtterance(pageText);

    speech.lang = "pt-BR";
    speech.rate = 1;
    speech.pitch = 1;

    speech.onend = () => {
        readText.innerHTML = "<span>🔊</span> Ler conteúdo da página";
    };

    speech.onerror = () => {
        readText.innerHTML = "<span>🔊</span> Ler conteúdo da página";
    };

    readText.innerHTML = "<span>⏹</span> Parar leitura";

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

    readText.innerHTML = "<span>🔊</span> Ler conteúdo da página";
});

