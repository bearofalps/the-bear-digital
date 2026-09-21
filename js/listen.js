(() => {
  const synth = window.speechSynthesis;
  const btn = document.getElementById("listen-toggle");
  if (!btn) return;
  if (!synth) {
    btn.hidden = true;
    return;
  }

  const idleLabel = btn.dataset.idle || "Listen";
  const busyLabel = btn.dataset.busy || "Stop";
  const pageLang = (document.documentElement.lang || "en").toLowerCase();
  const utterLang = pageLang.startsWith("fr") ? "fr-FR" : "en-GB";

  let queue = [];
  let index = 0;
  let active = false;
  let currentEl = null;

  const pickVoice = () => {
    const voices = synth.getVoices() || [];
    const want = pageLang.startsWith("fr") ? "fr" : "en";
    return voices.find(v => (v.lang || "").toLowerCase().startsWith(want) && /fr-fr|en-gb|en-us/i.test(v.lang))
        || voices.find(v => (v.lang || "").toLowerCase().startsWith(want))
        || null;
  };

  const chapterInView = () => {
    const chapters = [...document.querySelectorAll("article.chapter")];
    if (!chapters.length) return null;
    const mid = innerHeight * 0.28;
    let best = chapters[0];
    let bestDist = Infinity;
    for (const ch of chapters) {
      const r = ch.getBoundingClientRect();
      if (r.bottom < 64) continue;
      const dist = Math.abs(r.top - mid);
      if (dist < bestDist) {
        best = ch;
        bestDist = dist;
      }
    }
    return best;
  };

  const unitsFrom = (startChapter) => {
    const chapters = [...document.querySelectorAll("article.chapter")];
    const start = Math.max(0, chapters.indexOf(startChapter));
    const units = [];
    for (const ch of chapters.slice(start)) {
      ch.querySelectorAll("header .ch-num, h2, p").forEach((el) => {
        const text = (el.innerText || "").replace(/\s+/g, " ").trim();
        if (text) units.push({ el, text });
      });
    }
    return units;
  };

  const clearMark = () => {
    currentEl?.classList.remove("is-reading");
    currentEl = null;
  };

  const setIdle = () => {
    active = false;
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = idleLabel;
    clearMark();
  };

  const stop = () => {
    synth.cancel();
    queue = [];
    index = 0;
    setIdle();
  };

  const speakNext = () => {
    if (!active) return;
    if (index >= queue.length) {
      stop();
      return;
    }
    const unit = queue[index];
    clearMark();
    currentEl = unit.el;
    currentEl.classList.add("is-reading");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = currentEl.getBoundingClientRect().top;
    if (!reduce && (top < 72 || top > innerHeight * 0.78)) {
      currentEl.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    const utter = new SpeechSynthesisUtterance(unit.text);
    utter.lang = utterLang;
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    utter.rate = 0.96;
    utter.pitch = 1;
    utter.onend = () => {
      if (!active) return;
      index += 1;
      speakNext();
    };
    utter.onerror = () => {
      if (!active) return;
      index += 1;
      speakNext();
    };
    synth.speak(utter);
  };

  const start = () => {
    const chapters = document.querySelectorAll("article.chapter");
    if (!chapters.length) {
      btn.textContent = "…";
      setTimeout(() => {
        if (btn.getAttribute("aria-pressed") === "true" || btn.textContent === "…") start();
      }, 350);
      return;
    }
    synth.cancel();
    queue = unitsFrom(chapterInView());
    index = 0;
    if (!queue.length) {
      setIdle();
      return;
    }
    active = true;
    btn.setAttribute("aria-pressed", "true");
    btn.textContent = busyLabel;
    speakNext();
  };

  btn.addEventListener("click", () => {
    if (active) stop();
    else start();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && active) synth.pause();
    else if (!document.hidden && active && synth.paused) synth.resume();
  });

  addEventListener("beforeunload", stop);
})();
