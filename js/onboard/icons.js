/* ============================================================
   BENU / BETTER MENU — AI Onboarding Flow (vanilla port)
   ============================================================ */
const ICONS={
  upload:"M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 20h14",
  link:"M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 1 0-5.66-5.66l-1.5 1.5M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 1 0 5.66 5.66l1.5-1.5",
  image:"M4 5h16v14H4zM4 15l4.5-4.5L13 15m-2-2l2.5-2.5L20 17",
  text:"M5 6h14M5 12h14M5 18h9",
  qr:"M3 3h6v6H3z M5 5h2v2H5z M15 3h6v6h-6z M17 5h2v2h-2z M3 15h6v6H3z M5 17h2v2H5z M12 4h2v2h-2z M4 12h2v2h-2z M12 12h2v2h-2z M16 12h2v2h-2z M19 15h2v2h-2z M12 16h2v2h-2z M16 18h2v2h-2z M19 19h2v2h-2z",
  cart:"M4 5h2l2 11h9l2-7H7M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  catering:"M12 3v2M5 11a7 7 0 0 1 14 0zM3 11h18M4 15h16M6 19h12",
  home:"M4 11l8-7 8 7M6 10v9h12v-9",
  locations:"M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11zM12 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  check:"M5 12.5l4.5 4.5L19 7.5",
  checkCircle:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 12l2.5 2.5L15.5 9.5",
  edit:"M4 20h4L18.5 9.5a2 2 0 0 0-3-3L5 17v3zM14 7l3 3",
  x:"M6 6l12 12M18 6L6 18",
  arrowR:"M5 12h14m0 0l-6-6m6 6l-6 6",
  arrowL:"M19 12H5m0 0l6-6m-6 6l6 6",
  sparkle:"M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  alert:"M12 3l9 16H3zM12 9v5M12 17.5v.5",
  info:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5",
  clock:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2",
  price:"M7 12h10M7 8h10M5 4h14v16l-2.5-1.5L14 20l-2-1.5L10 20l-2.5-1.5L5 20z",
  users:"M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0-1.5-5.6M21 20a6 6 0 0 0-4-5.7",
  box:"M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9",
  leaf:"M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19c3-3 6-5 10-7",
  menu:"M7 4h10a1 1 0 0 1 1 1v15l-3-2-3 2-3-2-3 2V5a1 1 0 0 1 1-1zM9 8h6M9 12h6M9 16h3",
  shield:"M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6zM9 12l2 2 4-4",
  eye:"M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  layout:"M4 5h16v14H4zM4 9h16M9 9v10",
  copy:"M9 9h10v10H9zM5 15H4V5h10v1",
  refresh:"M4 12a8 8 0 0 1 13.5-5.8L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.5 5.8L4 16M4 20v-4h4",
  plus:"M12 5v14M5 12h14",
  minus:"M5 12h14",
  utensils:"M8 3v18M5 3v4a3 3 0 0 0 6 0V3M16 3c-1.5 2-2 4.5-2 7.5 0 2 1 3 2 3v7.5",
  umbrella:"M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9ZM12 12v7a2.5 2.5 0 0 1-5 0",
  martini:"M5 4h14l-7 8zM12 12v7M8 19h8",
};
function icon(name,o){o=o||{};const size=o.size||20,stroke=o.stroke||1.6,color=o.color||"currentColor",fill=o.fill||"none",style=o.style||"";
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" style="${style}"><path d="${ICONS[name]}"/></svg>`;}
function pdfTile(size){size=size||40;return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" fill="none"><path d="M8 6a2 2 0 0 1 2-2h12l10 10v18a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z" fill="#0E7C66"/><path d="M22 4l10 10h-8a2 2 0 0 1-2-2z" fill="#0B5E4D"/><text x="20" y="29" text-anchor="middle" font-family="Inter, sans-serif" font-size="8" font-weight="700" fill="#fff">PDF</text></svg>`;}
function logoHtml(size){size=size||20;return `<div class="row gap-2" style="align-items:center"><div style="width:${size+6}px;height:${size+6}px;border-radius:8px;background:var(--mint-900);display:grid;place-items:center;box-shadow:var(--shadow-green)"><svg width="${size-4}" height="${size-4}" viewBox="0 0 24 24" fill="none"><path d="M7 4h7a4 4 0 0 1 0 8H7zM7 12h8a4 4 0 0 1 0 8H7zM7 4v16" stroke="#CBE0A8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span style="font-family:var(--serif);font-size:${size+4}px;font-weight:600;letter-spacing:-0.01em">Benu</span></div>`;}

const STEPS=["Import","Build","Generate","Review","Photos","Catering","Locations","Templates","Publish"];
