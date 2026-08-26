(() => {
  const KEY = "bear-route";
  const btn = document.getElementById("continue");
  const barResume = document.getElementById("resume");

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); }
    catch { return null; }
  };

  const write = (place) => {
    try { localStorage.setItem(KEY, JSON.stringify(place)); }
    catch { /* private mode */ }
  };

  const labelOf = (ch) => {
    const num = (ch.querySelector(".ch-num")?.innerText || "").replace(/\s+/g, " ").trim();
    const title = (ch.querySelector("h2")?.innerText || "").replace(/\s+/g, " ").trim();
    if (num && title) return `${num} — ${title}`;
    return title || num || "where you left";
  };

  const nearestChapter = () => {
    const chapters = [...document.querySelectorAll("article.chapter[id]")];
    if (!chapters.length) return null;
    const line = 96;
    let current = chapters[0];
    for (const ch of chapters) {
      if (ch.getBoundingClientRect().top <= line) current = ch;
      else break;
    }
    return current;
  };

  const save = () => {
    const ch = nearestChapter();
    if (!ch) return;
    write({
      id: ch.id,
      label: labelOf(ch),
      offset: Math.max(0, scrollY - ch.offsetTop),
      at: Date.now()
    });
  };

  const paintButtons = () => {
    const place = read();
    if (!place?.id) return;
    const text = "Continue · " + place.label;
    if (btn) {
      btn.hidden = false;
      btn.textContent = text;
      btn.href = "#" + place.id;
    }
    if (barResume) {
      barResume.hidden = false;
      barResume.textContent = "Continue";
      barResume.href = "#" + place.id;
      barResume.title = place.label;
    }
  };

  const restore = () => {
    if (location.hash && location.hash !== "#cover" && location.hash !== "#book") return;
    const place = read();
    if (!place?.id) return;
    const el = document.getElementById(place.id);
    if (!el) return;
    const y = el.offsetTop + Math.min(place.offset || 0, el.offsetHeight * 0.8);
    scrollTo({ top: y, behavior: "auto" });
    history.replaceState(null, "", "#" + place.id);
  };

  const onContinue = (e) => {
    const place = read();
    if (!place?.id) return;
    const el = document.getElementById(place.id);
    if (!el) return;
    e.preventDefault();
    const y = el.offsetTop + Math.min(place.offset || 0, el.offsetHeight * 0.8);
    scrollTo({ top: y, behavior: "smooth" });
    history.replaceState(null, "", "#" + place.id);
  };

  btn?.addEventListener("click", onContinue);
  barResume?.addEventListener("click", onContinue);

  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      save();
      ticking = false;
    });
  }, { passive: true });

  document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
  addEventListener("pagehide", save);

  paintButtons();

  const ready = () => {
    paintButtons();
    restore();
  };

  document.addEventListener("bear-ready", ready);
  if (document.querySelector("article.chapter")) ready();
})();
