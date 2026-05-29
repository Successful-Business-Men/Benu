// Map onboarding answers to a template (layout) + palette (color).
// Type picks the layout. Vibe picks the color story.
window.BMRecommend = (function () {
  // Type drives layout/typography.
  const TYPE_TO_TEMPLATE = {
    noodle: "purr",      // Counter dashboard suits quick-serve noodle shops
    cafe:   "purr",      // Counter dashboard with cart panel
    pizza:  "shack",     // Bold modernist diner
    sushi:  "boutique",  // Editorial boutique
    burger: "shack",     // Shake-Shack vibes
    fine:   "boutique",  // Editorial boutique
    market: "sprout",    // Filter-rail market
    chain:  "chain",     // Big chain storefront
    other:  "sprout",    // Sensible default
  };

  // Vibe drives color only.
  const VIBE_TO_PALETTE = {
    warm:   "peach",
    modern: "ink",
    bold:   "shack",
    cozy:   "forest",
  };

  const VIBE_LABEL = {
    warm:   "warm peach",
    modern: "midnight ink",
    bold:   "mint shack",
    cozy:   "deep forest",
  };

  const TYPE_LABEL = {
    noodle: "Counter",
    cafe:   "Counter",
    pizza:  "Shack",
    sushi:  "Boutique",
    burger: "Shack",
    fine:   "Boutique",
    market: "Market",
    chain:  "Storefront",
    other:  "Market",
  };

  function suggest({ type, vibe }) {
    const t = (type || "other").toLowerCase();
    const v = (vibe || "warm").toLowerCase();

    const template = TYPE_TO_TEMPLATE[t] || TYPE_TO_TEMPLATE.other;
    const palette  = VIBE_TO_PALETTE[v]  || VIBE_TO_PALETTE.warm;

    const primary = {
      template,
      palette,
      reason: `${TYPE_LABEL[t] || TYPE_LABEL.other} layout in a ${VIBE_LABEL[v] || VIBE_LABEL.warm} palette.`,
    };

    const COPY = {
      noodle: { tagline: "Fresh, hand-pulled.",     subtagline: "Pick a bowl, add a spice level, pair with a drink." },
      cafe:   { tagline: "Slow mornings, hot cups.", subtagline: "Espresso, pastries, and a quiet table." },
      pizza:  { tagline: "Wood-fired, hand-tossed.", subtagline: "Order a slice or build your own." },
      sushi:  { tagline: "Cut to order.",            subtagline: "Daily fish, seasonal vegetables." },
      burger: { tagline: "Smash it.",                subtagline: "Burgers, fries, milkshakes." },
      fine:   { tagline: "Seasonal tasting menu.",   subtagline: "Reservations recommended." },
      market: { tagline: "From the pantry.",         subtagline: "House-baked, locally sourced, restocked daily." },
      chain:  { tagline: "Brightest new drinks.",    subtagline: "Today's lineup, fresh on the menu." },
      other:  { tagline: "Today's menu.",            subtagline: "Made with care, served fresh." },
    };
    const copy = COPY[t] || COPY.other;
    return { primary, copy, type: t };
  }

  // Curated top-3 templates for a specific restaurant. The primary always leads;
  // the next two are sensible alternates ranked by type, then padded from a
  // global fallback order. Multi-location nudges the chain "Storefront" up.
  const ALT_BY_TYPE = {
    noodle: ["purr", "shack", "sprout"],
    cafe:   ["purr", "chain", "boutique"],
    pizza:  ["shack", "purr", "chain"],
    sushi:  ["boutique", "sprout", "purr"],
    burger: ["shack", "purr", "chain"],
    fine:   ["boutique", "sprout", "purr"],
    market: ["sprout", "chain", "boutique"],
    chain:  ["chain", "purr", "shack"],
    other:  ["sprout", "purr", "boutique"],
  };
  const FALLBACK_ORDER = ["sprout", "purr", "boutique", "shack", "chain"];

  const WHY = {
    purr:     "Live cart and search — great for quick-serve ordering.",
    sprout:   "Filter rail and product cards — easy to browse a big menu.",
    chain:    "Promo banner and category rows — built for multi-location brands.",
    boutique: "Editorial hero and reviews — for menus with a story.",
    shack:    "Bold headlines and photo-led cards — high-energy and casual.",
  };

  function suggestTop3(stateLike = {}) {
    const base = suggest(stateLike);
    const t = base.type;
    const modules = stateLike.modules || {};

    const ranked = [...(ALT_BY_TYPE[t] || ALT_BY_TYPE.other)];
    // Multi-location restaurants benefit from the Storefront layout — surface it.
    if (modules.multiLocation && !ranked.includes("chain")) ranked.splice(1, 0, "chain");
    // Ensure the primary recommendation always leads.
    const lead = base.primary.template;
    const order = [lead, ...ranked, ...FALLBACK_ORDER].filter(
      (id, i, arr) => arr.indexOf(id) === i
    );

    const top = order.slice(0, 3).map((template, i) => ({
      template,
      palette: base.primary.palette,
      reason: WHY[template] || "",
      recommended: i === 0,
    }));

    return { top, copy: base.copy, type: t };
  }

  return { suggest, suggestTop3 };
})();
