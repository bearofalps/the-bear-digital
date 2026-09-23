(() => {
  const KEY = "bear-theme";
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  const meta = document.querySelector('meta[name="theme-color"]');

  const defaults = { en: "dark", de: "light", sl: "dark", fr: "light" };
  const lang = (root.lang || "en").slice(0, 2);

  const labels = {
    en: { dark: "Paper", light: "Night" },
    de: { dark: "Papier", light: "Nacht" },
    sl: { dark: "Papir", light: "Noč" },
    fr: { dark: "Papier", light: "Nuit" }
  };

  const read = () => {
    try { return localStorage.getItem(KEY); } catch { return null; }
  };

  const write = (theme) => {
    try { localStorage.setItem(KEY, theme); } catch { /* private mode */ }
  };

  const apply = (theme) => {
    const next = theme === "light" ? "light" : "dark";
    root.dataset.theme = next;
    if (meta) meta.setAttribute("content", next === "light" ? "#f4f1ea" : "#07090e");
    if (btn) {
      const pack = labels[lang] || labels.en;
      btn.textContent = pack[next];
      btn.setAttribute("aria-pressed", next === "light" ? "true" : "false");
      btn.setAttribute("aria-label", next === "light" ? pack.light : pack.dark);
    }
  };

  const initial = read() || defaults[lang] || "dark";
  apply(initial);

  btn?.addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    write(next);
    apply(next);
  });
})();
