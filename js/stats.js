(() => {
  const NS = "bearbook.alpskimedved.xyz";
  const API = "https://counterapi.com/api";
  const display = document.getElementById("read-count");
  if (sessionStorage.getItem("bear-optout") === "1") return;

  const get = (key, readOnly) =>
    fetch(`${API}/${NS}/view/${key}${readOnly ? "?readOnly=true" : ""}`)
      .then((r) => r.json())
      .then((d) => Number(d.value) || 0)
      .catch(() => null);

  const bump = (key) => get(key, false);

  const paint = (n) => {
    if (!display || n == null) return;
    display.hidden = false;
    display.textContent = String(n);
    display.title = n === 1
      ? "1 session stayed long enough to suggest reading"
      : `${n} sessions stayed long enough to suggest reading`;
  };

  get("engaged", true).then(paint);

  if (!sessionStorage.getItem("bear-visit")) {
    sessionStorage.setItem("bear-visit", "1");
    bump("visits");
  }

  const seen = new Set();
  let dwell = false;
  let depth = false;
  let listened = false;
  let sent = sessionStorage.getItem("bear-engaged") === "1";

  const maybeEngage = () => {
    if (sent) return;
    const chapters = seen.size;
    const stayed = dwell && (depth || chapters >= 1);
    const swept = chapters >= 2;
    if (!(stayed || swept || listened)) return;
    sent = true;
    sessionStorage.setItem("bear-engaged", "1");
    bump("engaged").then((n) => {
      if (n != null) paint(n);
      else get("engaged", true).then(paint);
    });
  };

  setTimeout(() => {
    dwell = true;
    maybeEngage();
  }, 45000);

  const onScroll = () => {
    if (scrollY > Math.max(1400, innerHeight * 1.25)) {
      depth = true;
      maybeEngage();
    }
  };
  addEventListener("scroll", onScroll, { passive: true });

  const watchChapters = () => {
    const chapters = document.querySelectorAll("article.chapter");
    if (!chapters.length) return false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        if (e.target.id) seen.add(e.target.id);
      });
      maybeEngage();
    }, { threshold: 0.28 });
    chapters.forEach((ch) => io.observe(ch));
    return true;
  };

  const arm = () => {
    if (watchChapters()) return;
    setTimeout(arm, 400);
  };
  arm();

  document.getElementById("listen-toggle")?.addEventListener("click", () => {
    listened = true;
    maybeEngage();
  });
})();
