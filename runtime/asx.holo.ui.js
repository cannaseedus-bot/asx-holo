/* ============================================================================
   ASX HOLOGRAM UI RUNTIME (asx.holo.ui.js)
   - Sidebar “Holographic Cards” (Joe’s List style) for ASX tabs
   - TabStore → FeedStore integration
   - Comments, Likes, Pins, Bookmarks (localStorage)
   - Neon CRT theme injector
   - Works with canvas or iframe preview + custom open event
   ==========================================================================*/

(() => {
  // ---------- 0) Neon theme injector (once) ----------
  const THEME_ID = "asx-holo-theme";
  if (!document.getElementById(THEME_ID)) {
    const css = `
:root{
  --holo-bg:#04070a; --holo-neon:#00ffd0; --holo-ink:#bff7ff;
  --holo-amber:#ff7a00; --holo-grid:#0b1418; --holo-card:#0b1216;
  --holo-border:#1de9c3; --scan:#06ffc2;
}
#tabsRail .card{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:12px;background:#000;
  border:1px solid rgba(0,255,208,.20);position:relative;box-shadow:0 2px 8px rgba(0,255,208,.12);margin:12px 0;
  transition:transform .18s ease, box-shadow .25s ease;}
#tabsRail .card:hover{transform:scale(1.02);box-shadow:0 0 14px var(--holo-neon);}
#tabsRail .card-header{display:flex;align-items:center;gap:8px}
#tabsRail .card-header img.avatar{width:28px;height:28px;border-radius:50%;object-fit:cover}
#tabsRail .card-title{font-weight:700;font-size:1.02rem;color:var(--holo-ink);text-shadow:0 0 8px var(--holo-neon);cursor:pointer}
#tabsRail .card-desc{font-size:.95rem;line-height:1.35;color:var(--holo-ink)}
#tabsRail .card .thumbnail{max-width:120px;max-height:120px;border-radius:8px;float:left;margin:0 12px 8px 0;object-fit:cover}
#tabsRail .card-meta{font-size:.82rem;color:#94f5ffad}
#tabsRail .card-actions{display:flex;gap:14px;margin-top:8px;color:#89cdd6}
#tabsRail .card-actions a{display:flex;align-items:center;gap:6px;font-size:.9rem;color:#89cdd6;text-decoration:none}
#tabsRail .card-actions a:hover{color:var(--holo-neon)}
#tabsRail .card.pinned{border:2px solid #00ff66;box-shadow:0 0 10px #00ff66}
#tabsRail .featured-badge{position:absolute;top:8px;right:8px;background:var(--holo-amber);color:#000;font-size:.75rem;
  padding:2px 6px;border-radius:4px;font-weight:700}
#tabsRail .expanded{outline:1px dashed var(--holo-border);box-shadow:0 0 10px var(--holo-neon)}
#tabsRail .expanded .expanded-content{margin-top:10px;border-top:1px solid rgba(0,255,208,.15);padding-top:10px}
.asx-chip{border:1px solid var(--holo-neon);background:transparent;color:var(--holo-ink);padding:.25rem .5rem;border-radius:8px}
#statusText{color:var(--holo-ink)}
    `.trim();
    const style = Object.assign(document.createElement("style"), { id: THEME_ID, textContent: css });
    document.head.appendChild(style);
  }

  // ---------- 1) Small helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s = "") => (s + "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const hostname = (u="") => { try { return new URL(u).hostname; } catch { return ""; } };
  const nowISO = () => new Date().toISOString();
  const tryFeather = () => { try { window.feather?.replace(); } catch {} };
  const status = (msg) => { const el = $("#statusText"); if (el) el.textContent = msg; };

  const updateHostingStatus = async () => {
    const dnsEl = $("#dnsStatus");
    const staticEl = $("#staticStatus");
    if (!dnsEl && !staticEl) return;

    const fallbackHost = location.host || "local";
    try {
      const res = await fetch("/status");
      const data = await res.json();
      if (dnsEl) dnsEl.textContent = `DNS: ${data.dnsHost || fallbackHost}`;
      if (staticEl) staticEl.textContent = `Static: ${data.staticServer || "active"}`;
    } catch {
      if (dnsEl) dnsEl.textContent = `DNS: ${fallbackHost}`;
      if (staticEl) staticEl.textContent = "Static: offline";
    }
  };

  // ---------- 2) Persistence (keys) ----------
  const K_TABS = "asx_tabs_v1";
  const K_LIKES = "asx_likes_v1";
  const K_BOOKS = "asx_bookmarks_v1";
  const K_PINS  = "asx_pins_v1";
  const K_COMMS = "asx_comments_v1";

  const loadJSON = (k, def) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(def)); } catch { return def; } };
  const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  // ---------- 3) TabStore (source of truth for openable items) ----------
  const TabStore = {
    _list: [],
    load(){ this._list = loadJSON(K_TABS, []); return this._list; },
    save(){ saveJSON(K_TABS, this._list); },
    add(url, extra = {}){
      const id = crypto.randomUUID();
      const title = (url || "").replace(/^https?:\/\//i, "").slice(0, 80);
      const meta = {
        favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=32`,
        source: extra.source || "manual"
      };
      const t = { id, url, title, meta, createdAt: nowISO(), ...extra };
      this._list.unshift(t); this.save(); return t;
    },
    all(){ return this._list; },
    get(id){ return this._list.find(t => t.id === id); },
    set(id, patch){ const t = this.get(id); if (t) Object.assign(t, patch); this.save(); return t; },
    remove(id){ this._list = this._list.filter(t => t.id !== id); this.save(); }
  };

  // ---------- 4) FeedStore (likes / comments / pins / bookmarks) ----------
  const FeedStore = {
    likes: loadJSON(K_LIKES, {}),        // { [id]: { count, liked } }
    bookmarks: loadJSON(K_BOOKS, {}),    // { [id]: { title, url } }
    pins: loadJSON(K_PINS, {}),          // { [id]: true }
    comments: loadJSON(K_COMMS, {}),     // { [id]: [{ user, text, ts }] }

    saveAll(){
      saveJSON(K_LIKES, this.likes);
      saveJSON(K_BOOKS, this.bookmarks);
      saveJSON(K_PINS, this.pins);
      saveJSON(K_COMMS, this.comments);
    },

    toggleLike(id){
      const entry = this.likes[id] || { count: 0, liked: false };
      entry.liked = !entry.liked;
      entry.count = Math.max(0, entry.count + (entry.liked ? 1 : -1));
      this.likes[id] = entry; this.saveAll(); return entry;
    },

    toggleBookmark(id, payload){
      if (this.bookmarks[id]) delete this.bookmarks[id];
      else this.bookmarks[id] = payload;
      this.saveAll();
      return !!this.bookmarks[id];
    },

    togglePin(id){
      if (this.pins[id]) delete this.pins[id]; else this.pins[id] = true;
      this.saveAll(); return !!this.pins[id];
    },

    addComment(id, user, text){
      const list = this.comments[id] || (this.comments[id] = []);
      list.push({ user, text, ts: nowISO() });
      this.saveAll(); return list;
    }
  };

  // ---------- 5) Rendering (Joe’s List style cards in #tabsRail) ----------
  function ensureRails() {
    if (!$("#tabsRail")) {
      const col = document.createElement("aside");
      col.id = "tabsRail";
      col.style.cssText = "width:320px;background:rgba(0,0,0,.85);border-right:2px solid #0ff6;overflow:auto;padding:12px;";
      const main = $("#mainView") || document.body;
      main.prepend(col);
    }
  }

  function renderTabs() {
    ensureRails();
    const rail = $("#tabsRail");
    rail.innerHTML = "";
    const list = TabStore.all();

    list.forEach(t => {
      const id = t.id;
      const pinned = FeedStore.pins[id] ? "pinned" : "";
      const featured = t.featured ? `<div class="featured-badge">FEATURED</div>` : "";
      const like = FeedStore.likes[id]?.count || 0;
      const commCount = (FeedStore.comments[id] || []).length;

      const card = document.createElement("article");
      card.className = `card ${pinned}`;
      card.dataset.id = id;
      card.dataset.url = t.url;

      card.innerHTML = `
        ${featured}
        <div class="card-header">
          <img class="avatar" src="${esc(t.meta?.favicon || "")}" alt="icon" />
          <div>
            <div class="username">ASX Tab</div>
            <div class="card-meta">${esc(hostname(t.url))} • ${new Date(t.createdAt).toLocaleString()}</div>
          </div>
        </div>

        <div class="card-title js-expand" data-id="${esc(id)}">${esc(t.title || "Untitled")}</div>

        <div class="card-desc">
          ${t.thumb ? `<img class="thumbnail" src="${esc(t.thumb)}" alt="thumb" />` : ""}
          <p>${esc(t.desc || "No description")}</p>
        </div>

        <div class="card-actions">
          <a href="#" class="js-comment" data-id="${esc(id)}" title="Comments"><i data-feather="message-circle"></i> ${commCount}</a>
          <a href="#" class="js-share" data-id="${esc(id)}" title="Share"><i data-feather="share-2"></i> Share</a>
          <a href="#" class="js-like" data-id="${esc(id)}" title="Like"><i data-feather="heart"></i> ${like}</a>
          <a href="#" class="js-bookmark" data-id="${esc(id)}" title="Bookmark"><i data-feather="bookmark"></i></a>
          <a href="#" class="js-pin" data-id="${esc(id)}" title="Pin"><i data-feather="map-pin"></i></a>
          <a href="${esc(t.url)}" target="_blank" rel="noopener" title="Open"><i data-feather="external-link"></i></a>
        </div>
      `;

      rail.appendChild(card);
    });

    tryFeather();
  }

  // ---------- 6) Expand/Collapse & Actions ----------
  function expandCard(id) {
    const card = document.querySelector(`#tabsRail .card[data-id="${CSS.escape(id)}"]`);
    if (!card) return;

    // collapse others
    document.querySelectorAll("#tabsRail .card.expanded").forEach(el => {
      if (el !== card) {
        el.classList.remove("expanded");
        el.querySelector(".expanded-content")?.remove();
      }
    });

    // toggle
    if (card.classList.contains("expanded")) {
      card.classList.remove("expanded");
      card.querySelector(".expanded-content")?.remove();
      return;
    }

    card.classList.add("expanded");
    const t = TabStore.get(id);
    const comments = FeedStore.comments[id] || [];

    const ext = document.createElement("div");
    ext.className = "expanded-content";
    ext.innerHTML = `
      <div><strong>URL:</strong> ${esc(t.url)}</div>
      <div style="margin-top:6px"><strong>Meta:</strong> ${esc(t.meta?.source || "manual")}</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="asx-chip js-open" data-id="${esc(id)}">OPEN IN PREVIEW</button>
        <button class="asx-chip js-remove" data-id="${esc(id)}">REMOVE</button>
        <button class="asx-chip js-copy" data-url="${esc(t.url)}">COPY URL</button>
      </div>

      <div style="margin-top:12px"><strong>Comments (${comments.length})</strong></div>
      <div class="comments" style="margin-top:6px">
        ${comments.map(c => `
          <div style="padding:8px;border:1px dashed rgba(0,255,208,.2);border-radius:8px;margin-bottom:6px">
            <div style="opacity:.8"><strong>${esc(c.user)}</strong> • ${new Date(c.ts).toLocaleString()}</div>
            <div>${esc(c.text)}</div>
          </div>
        `).join("") || `<em style="opacity:.7">No comments yet.</em>`}
      </div>

      <form class="comment-form" data-id="${esc(id)}" style="margin-top:8px;display:flex;gap:8px">
        <input required name="text" placeholder="Add a comment…" style="flex:1;background:#000;border:1px solid var(--holo-neon);color:var(--holo-ink);padding:.5rem;border-radius:8px">
        <button class="asx-chip" type="submit">Post</button>
      </form>
    `;
    card.appendChild(ext);
  }

  function wireRailEvents() {
    const rail = $("#tabsRail");
    rail.addEventListener("click", async (e) => {
      const a = e.target.closest("a,button,.js-expand");
      if (!a) return;

      const id = a.dataset.id;
      const url = a.dataset.url || (id ? TabStore.get(id)?.url : undefined);

      if (a.classList.contains("js-expand")) {
        e.preventDefault(); expandCard(id); return;
      }
      if (a.classList.contains("js-like")) {
        e.preventDefault(); FeedStore.toggleLike(id); renderTabs(); return;
      }
      if (a.classList.contains("js-bookmark")) {
        e.preventDefault();
        const t = TabStore.get(id);
        FeedStore.toggleBookmark(id, { title: t?.title || "Untitled", url: t?.url });
        renderTabs(); return;
      }
      if (a.classList.contains("js-pin")) {
        e.preventDefault(); FeedStore.togglePin(id); renderTabs(); return;
      }
      if (a.classList.contains("js-share")) {
        e.preventDefault();
        const shareUrl = tShareLink(id);
        if (navigator.share) { try { await navigator.share({ title: TabStore.get(id)?.title, url: shareUrl }); } catch {} }
        else { await navigator.clipboard.writeText(shareUrl); alert("Share link copied!"); }
        return;
      }
      if (a.classList.contains("js-open")) {
        e.preventDefault(); openInPreview(id); return;
      }
      if (a.classList.contains("js-remove")) {
        e.preventDefault(); TabStore.remove(id); renderTabs(); return;
      }
      if (a.classList.contains("js-copy")) {
        e.preventDefault(); await navigator.clipboard.writeText(a.dataset.url || ""); status("Copied URL"); return;
      }
    });

    rail.addEventListener("submit", (e) => {
      const form = e.target.closest(".comment-form");
      if (!form) return;
      e.preventDefault();
      const id = form.dataset.id;
      const text = form.elements.text.value.trim();
      if (!text) return;
      const user = localStorage.getItem("username") || "Anonymous";
      FeedStore.addComment(id, user, text);
      expandCard(id); // re-render that card expanded block
      renderTabs();   // update counts
    });
  }

  function tShareLink(id) {
    const base = location.origin + location.pathname;
    const u = new URL(base);
    u.searchParams.set("tab", id);
    return u.toString();
  }

  // ---------- 7) Address bar & Add tab ----------
  function ensureTopBar() {
    if (!$("#addr")) {
      // If no header exists, add a minimal bar
      const hdr = document.createElement("div");
      hdr.className = "asx-header";
      hdr.style.cssText = "display:flex;gap:10px;align-items:center;padding:8px;border-bottom:2px solid #0ff6;background:#0008";
      hdr.innerHTML = `
        <input id="addr" placeholder="Enter URL…" style="flex:1;min-width:220px;background:#000;border:1px solid #0ff;color:#0ff;padding:.4rem .6rem;border-radius:8px">
        <button id="goBtn" class="asx-chip">GO</button>
        <div id="statusText" style="min-width:120px;text-align:right;color:#89cdd6">Ready</div>
      `;
      document.body.prepend(hdr);
    }
  }

  function wireAddressBar() {
    const addr = $("#addr"), go = $("#goBtn");
    if (!addr || !go) return;

    const addAndOpen = () => {
      const raw = (addr.value || "").trim();
      if (!raw) return;
      const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      const t = TabStore.add(url);
      addr.value = "";
      renderTabs();
      openInPreview(t.id);
    };

    go.addEventListener("click", addAndOpen);
    addr.addEventListener("keydown", (e) => { if (e.key === "Enter") addAndOpen(); });
  }

  // ---------- 8) Preview (Canvas or Iframe) + Event hook ----------
  async function openInPreview(id) {
    const t = TabStore.get(id); if (!t) return;
    const canvas = $("#asxCanvas");
    const iframe = $("#asxFrame");

    // Fire a custom event for other modules (e.g., your CORS proxy canvas renderer)
    window.dispatchEvent(new CustomEvent("asx:open", { detail: { id: t.id, url: t.url } }));
    status(`Opening ${t.title}…`);

    if (canvas && canvas.getContext) {
      // lightweight holographic text preview (your renderer can listen to asx:open for full draw)
      const ctx = canvas.getContext("2d");
      const w = canvas.width = canvas.clientWidth;
      const h = canvas.height = canvas.clientHeight;
      ctx.fillStyle = "#031318"; ctx.fillRect(0,0,w,h);
      ctx.shadowColor = "#00ffd0"; ctx.shadowBlur = 24;
      ctx.fillStyle = "#00ffd0"; ctx.font = "20px 'Share Tech Mono', monospace";
      ctx.fillText(`ASX Hologram Preview`, 30, 40);
      ctx.shadowBlur = 0; ctx.fillStyle = "#aef";
      ctx.fillText(`URL: ${t.url}`, 30, 80);
      return;
    }

    if (iframe) {
      iframe.setAttribute("sandbox","allow-forms allow-scripts allow-popups allow-same-origin");
      iframe.src = t.url;
      return;
    }

    // Fallback: just open new tab
    window.open(t.url, "_blank", "noopener");
  }

  // ---------- 9) Deep-link support (?tab=ID) ----------
  function maybeOpenFromQuery() {
    const id = new URLSearchParams(location.search).get("tab");
    if (id && TabStore.get(id)) {
      // open and highlight
      setTimeout(() => {
        renderTabs();
        expandCard(id);
        openInPreview(id);
      }, 50);
    }
  }

  // ---------- 10) Boot wiring ----------
  function boot() {
    ensureTopBar();
    ensureRails();
    TabStore.load();  // load tabs first
    renderTabs();
    wireRailEvents();
    wireAddressBar();
    maybeOpenFromQuery();
    updateHostingStatus();
    status("Ready");
  }

  // Prefer asx:ready if present (DOM + SW + auth)
  const start = () => boot();
  if (document.readyState === "complete" || document.readyState === "interactive") {
    // Wait one tick for layout to settle
    setTimeout(() => {
      if (window.addEventListener) {
        // if asx.ready.js fires, we still listen and ensure boot happened
        let booted = false;
        const once = () => { if (!booted) { booted = true; start(); } };
        window.addEventListener("asx:ready", once, { once: true });
        // fallback if asx:ready never comes
        setTimeout(once, 400);
      } else start();
    }, 0);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      let booted = false;
      const once = () => { if (!booted) { booted = true; start(); } };
      window.addEventListener("asx:ready", once, { once: true });
      setTimeout(once, 400);
    });
  }

})();
