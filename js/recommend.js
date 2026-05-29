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

  return { suggest };
})();
