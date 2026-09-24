(() => {
  const target = document.getElementById("manuscript");
  if (!target) return;

  const lang = (document.documentElement.lang || "en").slice(0, 2);
  const src = target.dataset.src || "book.md";
  const prefix = target.dataset.imgPrefix || "../img/";

  const PLATES = {
    prologue: ["quote-continuity.svg", {
      en: "Continuity was not the absence of interruption. It was the ability to find the route again.",
      de: "Kontinuität war nicht die Abwesenheit von Unterbrechung. Sie war die Fähigkeit, den Weg wiederzufinden.",
      sl: "Kontinuiteta ni bila odsotnost prekinitve. Bila je zmožnost, da spet najdeš pot.",
      fr: "La continuité n’était pas l’absence d’interruption. C’était la capacité de retrouver le chemin."
    }],
    "part-i": ["plate-sidelined.svg", {
      en: "A wagon left aside in the rain. Outward services can still look operational.",
      de: "Ein Wagen im Regen abgestellt. Die äußeren Dienste können noch betriebsbereit wirken.",
      sl: "Vagon odložen v dežju. Zunanje storitve so lahko videti, kot da še delujejo.",
      fr: "Wagon mis de côté sous la pluie. Les services extérieurs peuvent encore paraître opérationnels."
    }],
    "part-ii": ["plate-two-routes.svg", {
      en: "Two routes still lit. The map can be corrected without erasing the yard.",
      de: "Zwei Routen bleiben beleuchtet. Die Karte lässt sich korrigieren, ohne den Bahnhof zu löschen.",
      sl: "Dve poti sta še prižgani. Zemljevid je mogoče popraviti, ne da bi izbrisali postajo.",
      fr: "Deux routes restent allumées. La carte peut se corriger sans effacer la gare."
    }],
    "part-iii": ["plate-junction.svg", {
      en: "Junction under load. Correction is one of the structures that keep the route worth carrying.",
      de: "Kreuzung unter Last. Korrektur ist eine der Strukturen, die den Weg weiter tragfähig machen.",
      sl: "Križišče pod obremenitvijo. Popravek je ena od struktur, zaradi katerih je pot še vredna nošenja.",
      fr: "Bifurcation sous charge. La correction est l’une des structures qui rendent le chemin encore transportable."
    }]
  };

  const escape = (s) => s.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
  const inline = (s) => escape(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");

  const classify = (title) => {
    const t = title.toLowerCase();
    if (/prolog|prologue/.test(t)) return { id: "prologue", kind: "chapter", num: title.split("—")[0].trim() };
    if (/epilog|épilogue|epilogue/.test(t)) return { id: "epilogue", kind: "chapter", num: title.split("—")[0].trim() };
    if (/teil i\b|part i\b|i\. del|première partie/.test(t)) return { id: "part-i", kind: "part" };
    if (/teil ii\b|part ii\b|ii\. del|deuxième partie/.test(t)) return { id: "part-ii", kind: "part" };
    if (/teil iii\b|part iii\b|iii\. del|troisième partie/.test(t)) return { id: "part-iii", kind: "part" };
    const ch = t.match(/(?:chapter|kapitel|chapitre|poglavje)\s+(\d+)/) || t.match(/^(\d+)\.\s*poglavje/);
    if (ch) return { id: "ch-" + ch[1], kind: "chapter", num: title.split("—")[0].trim() };
    return { id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24), kind: "chapter", num: "" };
  };

  const plate = (key) => {
    const pack = PLATES[key];
    if (!pack) return "";
    const [file, captions] = pack;
    const cap = captions[lang] || captions.en;
    return `<figure class="plate-block"><img src="${prefix}${file}" alt="${escape(cap)}" loading="lazy"/><figcaption>${escape(cap)}</figcaption></figure>`;
  };

  const render = (md) => {
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let i = 0;
    const flushP = (buf, first) => {
      const text = buf.join(" ").trim();
      if (!text) return "";
      return `<p${first ? ' class="first"' : ""}>${inline(text)}</p>`;
    };
    while (i < lines.length && !/^#\s+(Prolog|Prologue|Teil|Part |I\. del|Première|Kapitel|Chapter|Chapitre|\d+\. poglavje|Epilog|Épilogue|Epilogue)/.test(lines[i])) i++;
    while (i < lines.length) {
      const line = lines[i];
      if (/^#\s+/.test(line)) {
        const title = line.replace(/^#\s+/, "").trim();
        const info = classify(title);
        const after = title.includes("—") ? title.split("—").slice(1).join("—").trim() : title;
        if (info.kind === "part") {
          const label = title.split("—")[0].trim();
          html += `<section class="part-break" id="${info.id}"><div class="label">${escape(label)}</div><h2>${escape(after)}</h2></section>`;
          html += plate(info.id);
        } else {
          html += `<article class="chapter" id="${info.id}"><header>`;
          if (info.num) html += `<p class="ch-num">${escape(info.num)}</p>`;
          html += `<h2>${escape(after)}</h2></header>`;
          i++;
          let buf = [];
          let first = true;
          const close = () => { html += "</article>"; if (info.id === "prologue") html += plate("prologue"); };
          while (i < lines.length && !/^#\s+/.test(lines[i])) {
            const ln = lines[i];
            if (/^\s*$/.test(ln)) {
              html += flushP(buf, first);
              if (buf.length) first = false;
              buf = [];
            } else if (/^\*\s+\*\s+\*$/.test(ln.trim()) || /^---+$/.test(ln.trim())) {
              html += flushP(buf, first);
              buf = [];
              first = true;
              html += '<hr class="scene"/>';
            } else if (/^>\s?/.test(ln)) {
              html += flushP(buf, first);
              buf = [];
              first = false;
              html += `<blockquote><p>${inline(ln.replace(/^>\s?/, ""))}</p></blockquote>`;
            } else {
              buf.push(ln);
            }
            i++;
          }
          html += flushP(buf, first);
          close();
          continue;
        }
        i++;
        continue;
      }
      i++;
    }
    return html;
  };

  fetch(src).then((r) => {
    if (!r.ok) throw new Error(src + " " + r.status);
    return r.text();
  }).then((md) => {
    target.innerHTML = render(md);
    document.dispatchEvent(new Event("bear-ready"));
    if (location.hash && location.hash !== "#cover") {
      requestAnimationFrame(() => document.querySelector(location.hash)?.scrollIntoView());
    }
  }).catch((err) => {
    target.innerHTML = '<article class="chapter"><p>Manuscript not on the route yet: ' + err.message + '</p></article>';
  });
})();
