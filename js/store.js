// Tiny localStorage-backed store shared by builder, menu, and kitchen pages.
window.BMStore = (function () {
  const KEY = "better-menu:state:v1";

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  // Five palettes — one signature for each new template, plus a couple of
  // crossover moods. Every palette ships the same token set so any template
  // can render in any palette.
  const PALETTES = {
    // Purr — peachy cream dashboard with a candied-orange accent.
    peach:     { bg: "#FBE8D6", surface: "#FFFFFF", accent: "#FF8A5C", accentDeep: "#E76A39", soft: "#FFF4E8", softDeep: "#F5D9BD", text: "#1F1A16", muted: "#7E6F5F", rule: "#1F1A16" },
    // Sprout — warm linen with deep forest greens and a sale-red highlight.
    forest:    { bg: "#EAE6DE", surface: "#FFFFFF", accent: "#2C5043", accentDeep: "#1B362D", soft: "#F1EEE6", softDeep: "#D9D2C2", text: "#1B2620", muted: "#7D8278", rule: "#1B2620" },
    // Storefront — Starbucks-style evergreen on bright white.
    evergreen: { bg: "#FFFFFF", surface: "#FFFFFF", accent: "#006241", accentDeep: "#00432D", soft: "#E8F2EE", softDeep: "#BFD9CD", text: "#0E1B14", muted: "#6E7B72", rule: "#E5E8E5" },
    // Boutique — ivory paper with deep botanical green and a gold star.
    spa:       { bg: "#F5F1EA", surface: "#FFFFFF", accent: "#1C3829", accentDeep: "#0E2118", soft: "#EAE3D2", softDeep: "#D5C9AE", text: "#10160F", muted: "#766F61", rule: "#1C3829" },
    // Shack — Shake-Shack mint on warm off-white, with a tomato secondary.
    shack:     { bg: "#FFFCF7", surface: "#FFFFFF", accent: "#36B873", accentDeep: "#27945A", soft: "#E9F8EE", softDeep: "#C7E9CF", text: "#0F1410", muted: "#6F7670", rule: "#0F1410" },
    // Universal moods, available to any template.
    ink:       { bg: "#0E1115", surface: "#161A1F", accent: "#FFB454", accentDeep: "#E0942A", soft: "#1B2027", softDeep: "#262C35", text: "#F2EDE4", muted: "#8A8E96", rule: "#2A2F37" },
    noir:      { bg: "#F4F1EA", surface: "#FFFFFF", accent: "#111111", accentDeep: "#000000", soft: "#EDE8DC", softDeep: "#DCD5C2", text: "#0B0B0B", muted: "#7A7468", rule: "#0B0B0B" },
  };

  // Type stacks. Inter is the universal body; each template picks its own
  // headline voice.
  const INTER   = "'Inter', ui-sans-serif, system-ui, sans-serif";
  const JAKARTA = "'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif";
  const SERIF   = "'DM Serif Display', 'Cormorant Garamond', ui-serif, Georgia, serif";
  const SIGN    = "'Anton', 'Inter', ui-sans-serif, system-ui, sans-serif";
  const CORMO   = "'Cormorant Garamond', ui-serif, Georgia, serif";

  // Five templates. Each one is a different *shape* of restaurant interface
  // — dashboard, market, storefront, boutique, diner — not just a recolor.
  const TEMPLATES = {
    "purr": {
      label: "Counter",
      blurb: "Dashboard layout with a fixed sidebar, search bar, and a live cart panel that books orders inline. For coffee shops and quick-serve counters.",
      tags: ["Cafe", "Dashboard", "Live cart"],
      defaultPalette: "peach",
      layout: "purr",
      headingFont: JAKARTA,
      bodyFont: INTER,
    },
    "sprout": {
      label: "Market",
      blurb: "Filtered grocery layout with a sticky filter rail, circular product photos in rounded cards, and ON-SALE pricing. For groceries, bakeries, and pantry-style menus.",
      tags: ["Market", "Filters", "Forest"],
      defaultPalette: "forest",
      layout: "sprout",
      headingFont: SERIF,
      bodyFont: INTER,
    },
    "chain": {
      label: "Storefront",
      blurb: "Promo-banner storefront with a sticky utility bar and horizontal-scroll category rows. Big chains made simple.",
      tags: ["Chain", "Promo", "Evergreen"],
      defaultPalette: "evergreen",
      layout: "chain",
      headingFont: JAKARTA,
      bodyFont: INTER,
    },
    "boutique": {
      label: "Boutique",
      blurb: "Editorial boutique with a centered hero title, sidebar filters, percentage-off badges, and review stars. For shops that sell things with a story.",
      tags: ["Boutique", "Reviews", "Spa green"],
      defaultPalette: "spa",
      layout: "boutique",
      headingFont: SERIF,
      bodyFont: INTER,
    },
    "shack": {
      label: "Shack",
      blurb: "Shake-Shack-style modernist diner. Condensed sign-painter headlines, photo-led item cards, sticky Order CTA. For burgers, shakes, and counter spots.",
      tags: ["Diner", "Bold", "Mint green"],
      defaultPalette: "shack",
      layout: "shack",
      headingFont: SIGN,
      bodyFont: INTER,
    },
  };

  function applyTheme(state) {
    const basePal = PALETTES[state.palette] || PALETTES[TEMPLATES[state.template]?.defaultPalette] || PALETTES.peach;
    const tpl = TEMPLATES[state.template] || TEMPLATES["sprout"];
    const pal = { ...basePal, ...(state.customColors || {}) };
    const root = document.documentElement.style;
    Object.entries(pal).forEach(([k, v]) => root.setProperty(`--bm-${k}`, v));
    root.setProperty("--bm-heading-font", tpl.headingFont);
    root.setProperty("--bm-body-font",    tpl.bodyFont);
    if (document.body) {
      document.body.style.background = pal.bg;
      document.body.style.color = pal.text;
      document.body.style.fontFamily = tpl.bodyFont;
      document.body.setAttribute("data-layout", tpl.layout);
    }
    return { palette: pal, template: tpl };
  }

  // Pack state into a URL-safe string for share links. Drops uploaded
  // data-URL photos because they balloon past browser URL limits.
  function encodeState(state) {
    const slim = {
      ...state,
      items: (state.items || []).map(i => ({
        ...i,
        image: i.image && i.image.startsWith("data:") ? "" : i.image,
      })),
    };
    const json = JSON.stringify(slim);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function decodeState(s) {
    try {
      const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
      const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
      return JSON.parse(decodeURIComponent(escape(atob(b64 + pad))));
    } catch {
      return null;
    }
  }

  return { load, save, PALETTES, TEMPLATES, applyTheme, encodeState, decodeState };
})();
