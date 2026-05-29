// Customer-side ordering glue. Listens for clicks on the per-template
// "add" buttons across all five layouts, builds a cart, renders a fixed
// cart panel, and posts to /api/orders. Idempotent — safe to include on
// builder previews; the panel only appears once items are added, and
// the Send button is gated on a ?r=<slug> URL parameter so demo menus
// can't write to the real orders table.

(function () {
  if (window.__bmOrderFlow) return;
  window.__bmOrderFlow = true;

  const ADD_SELECTORS = [
    { btn: ".purr-add",      card: ".purr-card", name: ".purr-name",     price: ".purr-price" },
    { btn: ".sp-add",        card: ".sp-card",   name: ".sp-card-name",  price: ".sp-price" },
    { btn: ".ch-plus",       card: ".ch-card",   name: ".ch-card-name",  price: ".ch-card-price" },
    { btn: ".bq-action-btn", card: ".bq-card",   name: ".bq-card-name",  price: ".bq-card-prices" },
    { btn: ".sh-card-cta",   card: ".sh-card",   name: ".sh-card-name",  price: ".sh-card-price" },
  ];

  const params = new URLSearchParams(location.search);
  const slug = (params.get("r") || "").trim();
  const tableNumber = Math.max(0, parseInt(params.get("t") || "0", 10) || 0);
  const isLive = !!slug;

  const cart = []; // { name, price, qty }

  function parseMoney(s) {
    const m = String(s || "").replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : 0;
  }

  function findItem(btn) {
    for (const sel of ADD_SELECTORS) {
      if (!btn.matches(sel.btn)) continue;
      const card = btn.closest(sel.card);
      if (!card) return null;
      const nameEl = card.querySelector(sel.name);
      if (!nameEl) return null;
      const priceEl = card.querySelector(sel.price);
      return {
        name: nameEl.textContent.trim(),
        price: priceEl ? parseMoney(priceEl.textContent) : 0,
      };
    }
    return null;
  }

  function addToCart(item) {
    const existing = cart.find((c) => c.name === item.name);
    if (existing) existing.qty += 1;
    else cart.push({ ...item, qty: 1 });
    renderPanel();
  }

  function changeQty(name, delta) {
    const i = cart.findIndex((c) => c.name === name);
    if (i < 0) return;
    cart[i].qty += delta;
    if (cart[i].qty <= 0) cart.splice(i, 1);
    renderPanel();
  }

  function ensurePanel() {
    let panel = document.getElementById("bm-order-panel");
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "bm-order-panel";
    panel.style.cssText = [
      "position:fixed", "right:16px", "bottom:16px", "z-index:99999",
      "width:min(360px, calc(100vw - 32px))",
      "background:#1a1a1a", "color:#FBF7EE", "border-radius:20px",
      "box-shadow:0 16px 48px rgba(0,0,0,0.25)",
      "font-family:-apple-system,system-ui,sans-serif", "font-size:14px",
      "padding:18px 18px 16px", "display:none",
    ].join(";");
    document.body.appendChild(panel);
    return panel;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  function renderPanel() {
    const panel = ensurePanel();
    if (cart.length === 0) { panel.style.display = "none"; return; }
    panel.style.display = "block";
    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const sendable = isLive;
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <strong style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;">
          Your order${tableNumber ? ` · Table ${tableNumber}` : ""}
        </strong>
        <button data-bm-clear aria-label="Clear cart"
                style="background:transparent;color:#FBF7EE;opacity:.55;border:0;cursor:pointer;font-size:18px;line-height:1;">×</button>
      </div>
      <ul style="list-style:none;padding:0;margin:0 0 12px;max-height:200px;overflow:auto;">
        ${cart.map((c) => `
          <li style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.08);gap:8px;">
            <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(c.name)}</span>
            <span style="display:inline-flex;align-items:center;gap:6px;">
              <button data-bm-qty="-1" data-bm-name="${escapeHtml(c.name)}" aria-label="Decrease"
                      style="background:rgba(255,255,255,0.12);color:#FBF7EE;border:0;width:22px;height:22px;border-radius:999px;cursor:pointer;line-height:1;">−</button>
              <span style="min-width:14px;text-align:center;font-variant-numeric:tabular-nums;">${c.qty}</span>
              <button data-bm-qty="1" data-bm-name="${escapeHtml(c.name)}" aria-label="Increase"
                      style="background:rgba(255,255,255,0.12);color:#FBF7EE;border:0;width:22px;height:22px;border-radius:999px;cursor:pointer;line-height:1;">+</button>
            </span>
            <span style="font-variant-numeric:tabular-nums;opacity:.85;min-width:54px;text-align:right;">$${(c.price * c.qty).toFixed(2)}</span>
          </li>
        `).join("")}
      </ul>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;font-weight:600;">
        <span>Total</span><span>$${total.toFixed(2)}</span>
      </div>
      <button data-bm-send ${sendable ? "" : "disabled"} style="
        width:100%;padding:11px 16px;border-radius:999px;border:0;
        background:#FDA172;color:#1a1a1a;font-weight:600;font-size:14px;
        cursor:${sendable ? "pointer" : "not-allowed"};opacity:${sendable ? 1 : 0.5};
      ">${sendable ? "Send to kitchen" : "Demo menu · scan a real QR to order"}</button>
      <p id="bm-order-status" style="margin:8px 0 0;font-size:12px;opacity:.75;min-height:14px;" aria-live="polite"></p>
    `;
  }

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = [
      "position:fixed", "left:50%", "bottom:24px", "transform:translateX(-50%)",
      "background:#1a1a1a", "color:#FBF7EE", "padding:10px 18px", "border-radius:999px",
      "font-family:-apple-system,system-ui,sans-serif", "font-size:13px", "z-index:99999",
      "box-shadow:0 12px 32px rgba(0,0,0,0.25)",
    ].join(";");
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }

  async function send() {
    if (!isLive || cart.length === 0) return;
    const panel = ensurePanel();
    const btn = panel.querySelector("[data-bm-send]");
    const status = panel.querySelector("#bm-order-status");
    btn.disabled = true;
    btn.textContent = "Sending…";
    status.textContent = "";
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, table: tableNumber, items: cart }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        status.textContent = (data && data.error) || `Server ${res.status}.`;
        btn.disabled = false;
        btn.textContent = "Send to kitchen";
        return;
      }
      cart.length = 0;
      renderPanel();
      toast("Sent to the kitchen. We'll bring it out shortly.");
    } catch (err) {
      status.textContent = "Network error. Try again.";
      btn.disabled = false;
      btn.textContent = "Send to kitchen";
    }
  }

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const btn = target.closest("button");
    if (!btn) return;

    for (const sel of ADD_SELECTORS) {
      if (btn.matches(sel.btn)) {
        const item = findItem(btn);
        if (item) addToCart(item);
        return;
      }
    }

    if (btn.matches("[data-bm-send]"))  { send(); return; }
    if (btn.matches("[data-bm-clear]")) { cart.length = 0; renderPanel(); return; }
    if (btn.matches("[data-bm-qty]")) {
      const name = btn.getAttribute("data-bm-name");
      const delta = parseInt(btn.getAttribute("data-bm-qty"), 10) || 0;
      changeQty(name, delta);
    }
  });
})();
