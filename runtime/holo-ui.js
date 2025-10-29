(() => {
  const K = "asx_tabs_v1";
  const $ = (s, r = document) => r.querySelector(s);

  const TabStore = {
    _list: [],
    load() { try { this._list = JSON.parse(localStorage.getItem(K) || "[]"); } catch { this._list = []; } return this._list; },
    save() { localStorage.setItem(K, JSON.stringify(this._list)); },
    add(url) {
      const id = crypto.randomUUID();
      const title = url.replace(/^https?:\/\//, "").slice(0, 60);
      const meta = { favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}` };
      const t = { id, url, title, meta, createdAt: new Date().toISOString() };
      this._list.unshift(t); this.save(); return t;
    },
    all() { return this._list; },
    get(id) { return this._list.find(t => t.id === id); },
  };

  function renderTabs() {
    const rail = $("#tabsRail");
    rail.innerHTML = "";
    TabStore.all().forEach(t => {
      const div = document.createElement("div");
      div.className = "asx-tab-card";
      div.innerHTML = `
        <div class="asx-tab-title"><img src="${t.meta.favicon}" width="16" height="16"> ${t.title}</div>
        <button data-open="${t.id}" class="btn">OPEN</button>`;
      rail.appendChild(div);
    });
  }

 async function drawPage(url) {
  const canvas = $("#asxCanvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#001a1f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#00ffff";
  ctx.font = "20px 'Share Tech Mono'";
  ctx.fillText(`Loading ${url}`, 60, 80);

  try {
    const proxied = `/asx-proxy?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxied);
    const html = await res.text();

    // 🔹 Simulated rendering preview
    ctx.fillStyle = "#0ff";
    ctx.fillText("Rendering holographic snapshot...", 60, 120);
    const preview = html.substring(0, 180).replace(/<[^>]*>/g, "").trim();
    ctx.fillStyle = "#aaffff";
    wrapText(ctx, preview, 60, 160, 800, 22);
  } catch (err) {
    ctx.fillStyle = "#ff6666";
    ctx.fillText("⚠ CORS proxy failed.", 60, 120);
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else line = testLine;
  }
  ctx.fillText(line, x, y);
}


  function wireEvents() {
    const addr = $("#addr");
    $("#goBtn").addEventListener("click", () => {
      const raw = (addr.value || "").trim();
      if (!raw) return;
      const url = raw.match(/^https?:\/\//i) ? raw : `https://${raw}`;
      const t = TabStore.add(url);
      renderTabs();
      drawPage(url);
      addr.value = "";
    });
    $("#tabsRail").addEventListener("click", e => {
      const id = e.target.dataset.open;
      if (id) drawPage(TabStore.get(id).url);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    TabStore.load();
    renderTabs();
    wireEvents();
    const boot = $("#bootSplash");
    setTimeout(() => boot.remove(), 3000);
  });
})();


const whitelist = ["example.com", "wikipedia.org", "devmicro.app"];
if (!whitelist.some(d => target.includes(d))) {
  return res.status(403).json({ error: "Domain not allowed" });
}
