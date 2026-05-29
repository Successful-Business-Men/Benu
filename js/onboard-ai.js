// Client-side mock/heuristic "AI" for the guided onboarding flow.
//
// This module stands in for server-side AI so the whole onboarding experience
// works end to end today. Every function here is intentionally isolated and
// returns plain data, so each piece can later be swapped for a real API call
// (e.g. buildDraft -> /api/generate-menu, findIssues -> /api/review-menu)
// without touching the onboarding UI.
//
// Guiding product rule: AI may extract, suggest, draft, and organize — but the
// owner must approve every important detail. Nothing here marks anything as
// "final" or "verified"; that only happens when the owner approves in the UI.

window.BMOnboardAI = (function () {
  // ─── Type inference ──────────────────────────────────────────────
  // Guess the restaurant type from item names / a free-text brief so the
  // owner doesn't have to pick one manually.
  const TYPE_KEYWORDS = {
    noodle: ["noodle", "ramen", "pho", "dan dan", "udon", "wonton", "dumpling", "lo mein"],
    sushi:  ["sushi", "nigiri", "sashimi", "maki", "omakase", "roll", "tempura"],
    pizza:  ["pizza", "margherita", "pepperoni", "calzone", "slice"],
    burger: ["burger", "smash", "fries", "shake", "patty", "cheeseburger"],
    cafe:   ["latte", "espresso", "cappuccino", "croissant", "matcha", "americano", "coffee", "pastry"],
    fine:   ["tasting", "course", "caviar", "sommelier", "pairing", "prix fixe"],
    market: ["raisin", "apricot", "dried", "pantry", "grocery", "bulk", "jar"],
    chain:  ["cold brew", "macchiato", "frappe", "seasonal drink"],
  };

  function inferType(textOrItems) {
    let hay = "";
    if (Array.isArray(textOrItems)) {
      hay = textOrItems.map(i => `${i.name || ""} ${i.category || ""}`).join(" ");
    } else {
      hay = String(textOrItems || "");
    }
    hay = hay.toLowerCase();
    let best = null, bestScore = 0;
    for (const [type, keys] of Object.entries(TYPE_KEYWORDS)) {
      let score = 0;
      for (const k of keys) if (hay.includes(k)) score++;
      if (score > bestScore) { bestScore = score; best = type; }
    }
    return best || "other";
  }

  const CUISINE_LABEL = {
    noodle: "Noodle bar", cafe: "Cafe", pizza: "Pizzeria", sushi: "Sushi",
    burger: "Burger joint", fine: "Fine dining", market: "Market / Grocery",
    chain: "Chain / Storefront", other: "Restaurant",
  };
  function cuisineLabel(type) { return CUISINE_LABEL[type] || CUISINE_LABEL.other; }

  function defaultName(type) {
    return ({
      noodle: "Hand-Pulled Noodle Co.", cafe: "Daybreak Cafe", pizza: "Hearthstone Pizza",
      sushi: "Omakase Bar", burger: "Smash and Co.", fine: "The Tasting Room",
      market: "Sprout Market", chain: "Brew House", other: "Your Restaurant",
    })[type] || "Your Restaurant";
  }

  // ─── Starter items (fallback when no real menu is uploaded) ───────
  function starterItems(type) {
    const tag = (name, price, category, description, spice = 0) => ({
      name, price, category, description, spice,
      image: window.BMImages ? BMImages.forItem(name) : "",
    });
    switch (type) {
      case "noodle": return [
        tag("Chili Oil Noodles", 12.50, "Noodles", "Hand-pulled wheat noodles, scallion oil, toasted sesame.", 2),
        tag("Wonton Soup", 10.00, "Noodles", "Eight pork and shrimp wontons in clear ginger broth."),
        tag("Dan Dan Mian", 13.50, "Noodles", "Sichuan pepper, minced pork, preserved greens, peanut.", 3),
        tag("Pork Dumplings", 9.00, "Dumplings", "Six pan-fried, sesame, black vinegar dipping sauce."),
        tag("Smashed Cucumber", 7.00, "Sides", "Garlic, chili oil, black vinegar, sesame.", 1),
        tag("Yuzu Soda", 4.00, "Drinks", "Cold-pressed yuzu, sparkling."),
      ];
      case "cafe": return [
        tag("Latte", 5.00, "Drinks", "Whole milk, double shot."),
        tag("Matcha", 5.50, "Drinks", "Ceremonial grade, lightly sweetened."),
        tag("Almond Croissant", 4.50, "Pastry", "Laminated dough, almond cream, toasted almonds."),
        tag("Avocado Toast", 11.00, "Plates", "Sourdough, smashed avocado, chili crisp, soft egg."),
        tag("Iced Americano", 4.50, "Drinks", "Double shot over ice."),
        tag("Banana Bread", 4.00, "Pastry", "Brown butter, walnuts, sea salt."),
      ];
      case "pizza": return [
        tag("Margherita", 16.00, "Pizza", "San Marzano, fior di latte, basil."),
        tag("Pepperoni", 18.00, "Pizza", "Tomato, mozzarella, cup and char pepperoni."),
        tag("White Mushroom", 19.00, "Pizza", "Ricotta, mozzarella, roasted mushrooms, thyme."),
        tag("House Salad", 9.00, "Sides", "Little gems, shaved parm, lemon vinaigrette."),
        tag("Garlic Knots", 7.00, "Sides", "Sea salt, olive oil, oregano."),
        tag("Tiramisu", 8.00, "Dessert", "Espresso, mascarpone, cocoa."),
      ];
      case "sushi": return [
        tag("Salmon Nigiri", 8.00, "Nigiri", "Two pieces, Norwegian salmon."),
        tag("Tuna Sashimi", 16.00, "Sashimi", "Five pieces, daily cut maguro."),
        tag("Spicy Tuna Maki", 12.00, "Maki", "Tuna, scallion, chili mayo.", 2),
        tag("Chef Selection", 45.00, "Omakase", "Twelve pieces, today's catch."),
        tag("Edamame", 5.00, "Sides", "Sea salt."),
        tag("Miso Soup", 4.00, "Sides", "House dashi, scallion, tofu."),
      ];
      case "burger": return [
        tag("Single Smash", 10.00, "Burgers", "Beef, American, pickles, special sauce."),
        tag("Double Smash", 13.00, "Burgers", "Two patties, double cheese, special sauce."),
        tag("Mushroom Swiss", 14.00, "Burgers", "Roasted mushrooms, swiss, garlic aioli."),
        tag("Fries", 5.00, "Sides", "Hand-cut, sea salt."),
        tag("Chocolate Shake", 6.50, "Drinks", "Whole milk, valrhona cocoa."),
        tag("Strawberry Shake", 6.50, "Drinks", "Fresh strawberry."),
      ];
      case "fine": return [
        tag("Five-Course Tasting", 120.00, "Tasting", "Seasonal, served between six and nine pm."),
        tag("Wine Pairing", 75.00, "Pairings", "Five glasses, sommelier's selection."),
        tag("Caviar Service", 95.00, "Tasting", "Osetra, creme fraiche, blini."),
        tag("Cheese Course", 28.00, "Tasting", "Three selections, seasonal accompaniments."),
      ];
      case "market": return [
        tag("Seedless Prune", 2.00, "Dried fruits", "Plump, soft-dried, no added sugar."),
        tag("Red Grape Raisins", 4.00, "Dried fruits", "Extra series, slow-dried for two weeks."),
        tag("Seedless Red Plums", 9.80, "Dried fruits", "Tart finish, candy-sweet middle."),
        tag("Chocolate Apricots", 2.60, "Confections", "Dark cocoa dust, no added oils."),
        tag("Gold Apricots Jumbo", 5.40, "Confections", "Limited series, hand-sorted."),
        tag("Natural Mango", 12.00, "Tropicals", "King-size, soft-dry, pure fruit."),
      ];
      case "chain": return [
        tag("Cold Brew", 2.95, "Cold Brew", "Slow steeped, 14 hours."),
        tag("Pumpkin Spice Cream", 4.25, "Cold Brew", "Seasonal, lightly sweetened."),
        tag("Salted Caramel Cream", 4.25, "Cold Brew", "Slow steeped with salted caramel cold foam."),
        tag("Vanilla Sweet Cream", 3.95, "Cold Brew", "Vanilla, milk, ice."),
        tag("Iced Pumpkin Latte", 4.25, "Lattes", "Espresso, pumpkin, milk, spice."),
        tag("Iced Caffe Latte", 3.75, "Lattes", "Cold milk, double shot."),
      ];
      default: return [
        tag("Sample Dish A", 12.00, "Menu", "Replace this with your own item."),
        tag("Sample Dish B", 14.00, "Menu", "Add as many items as you like."),
        tag("Sample Drink", 5.00, "Menu", "A signature beverage."),
        tag("Sample Dessert", 8.00, "Menu", "Something sweet to finish."),
      ];
    }
  }

  // ─── Spelling / formatting fixes ─────────────────────────────────
  const SPELL = {
    chiken: "Chicken", chicke: "Chicken", chickn: "Chicken", alfedo: "Alfredo",
    expresso: "Espresso", capuccino: "Cappuccino", cappucino: "Cappuccino",
    sandwhich: "Sandwich", sandwich: "Sandwich", burito: "Burrito",
    quesadila: "Quesadilla", mozzarela: "Mozzarella", cesar: "Caesar", ceasar: "Caesar",
    brocoli: "Broccoli", avacado: "Avocado", tomatoe: "Tomato", potatoe: "Potato",
    lemonaid: "Lemonade", milshake: "Milkshake", cofee: "Coffee", coffe: "Coffee",
    spagetti: "Spaghetti", spaghetti: "Spaghetti", lasagne: "Lasagna",
    fettucine: "Fettuccine", gnochi: "Gnocchi", parmesean: "Parmesan",
    parmasan: "Parmesan", vinagrette: "Vinaigrette", vinaigerette: "Vinaigrette",
  };

  // Returns a corrected version of a name, or null when nothing changed.
  function spellFix(name) {
    const original = String(name || "");
    // 1) normalize whitespace
    let out = original.replace(/\s+/g, " ").trim();
    // 2) word-by-word dictionary replacement (preserve surrounding punctuation)
    out = out.split(" ").map(word => {
      const m = word.match(/^([^a-zA-Z]*)([a-zA-Z]+)([^a-zA-Z]*)$/);
      if (!m) return word;
      const [, pre, core, post] = m;
      const fix = SPELL[core.toLowerCase()];
      return fix ? pre + fix + post : word;
    }).join(" ");
    // 3) letter "O" used inside a number (OCR slip), e.g. "1O" -> "10"
    out = out.replace(/(\d)[Oo](?=\d|\b)/g, "$10").replace(/[Oo](?=\d)/g, "0");
    return out !== original ? out : null;
  }

  // Detect an OCR-looking price written with letter O's, e.g. "$1O.OO".
  function priceLooksOcr(raw) {
    return /\$\s?[\dOo]+[.,][\dOo]{2}/.test(String(raw || "")) && /[Oo]/.test(String(raw || ""));
  }

  // ─── Build the AI draft ──────────────────────────────────────────
  // imp = { type, vibe, pdfItems, brief, websiteUrl, name }
  function buildDraft(imp = {}, modules = {}) {
    const haveReal = Array.isArray(imp.pdfItems) && imp.pdfItems.length > 0;
    let items = haveReal ? imp.pdfItems.slice() : starterItems(imp.type || inferType(imp.brief || ""));
    items = items.map(it => ({
      name: it.name,
      price: typeof it.price === "number" ? it.price : parseFloat(it.price) || 0,
      category: it.category || "Menu",
      description: it.description || "",
      spice: it.spice || 0,
      image: it.image || (window.BMImages ? BMImages.forItem(it.name) : ""),
    }));

    const type = imp.type || inferType(haveReal ? items : (imp.brief || ""));
    const rec = window.BMRecommend ? BMRecommend.suggest({ type, vibe: imp.vibe }) : null;
    const categories = [...new Set(items.map(i => i.category || "Menu"))];

    return {
      name: imp.name || defaultName(type),
      cuisine: cuisineLabel(type),
      type,
      tagline: rec ? rec.copy.tagline : "Today's menu.",
      subtagline: rec ? rec.copy.subtagline : "Made with care, served fresh.",
      template: rec ? rec.primary.template : "sprout",
      palette: rec ? rec.primary.palette : "forest",
      categories,
      items,
      source: haveReal ? "menu" : (imp.brief ? "brief" : imp.websiteUrl ? "website" : "starter"),
    };
  }

  // ─── Review: group findings into safe fixes + needs-answer ────────
  function findIssues(items = []) {
    const fixes = [];
    const questions = [];
    items.forEach((it, idx) => {
      // Safe fix: spelling / formatting in the name
      const fixed = spellFix(it.name);
      if (fixed) {
        fixes.push({
          id: `fix-name-${idx}`, kind: "spelling", itemIndex: idx, field: "name",
          from: it.name, to: fixed, status: "pending",
        });
      }

      // Needs answer: uncertain / missing price
      const priceMissing = !it.price || it.price <= 0 || Number.isNaN(it.price);
      const ocrPrice = priceLooksOcr(it.rawPrice);
      if (priceMissing || ocrPrice) {
        questions.push({
          id: `q-price-${idx}`, kind: "price", itemIndex: idx, field: "price",
          item: it.name,
          prompt: ocrPrice
            ? `"${it.rawPrice}" might be a price for "${it.name}". Confirm the amount.`
            : `We could not read a clear price for "${it.name}". What should it be?`,
          value: it.price > 0 ? it.price.toFixed(2) : "",
          status: "pending",
        });
      }

      // Needs answer (optional): missing description
      if (!it.description || it.description.trim().length < 3) {
        questions.push({
          id: `q-desc-${idx}`, kind: "description", itemIndex: idx, field: "description",
          item: it.name, prompt: `Add a short description for "${it.name}"`,
          value: "", optional: true, status: "pending",
        });
      }

      // Needs answer: looks like a modifier / add-on
      if (/\b(add|extra|with|sub|side of)\b/i.test(it.name) && /\+|\$|\d/.test(it.name)) {
        questions.push({
          id: `q-mod-${idx}`, kind: "modifier", itemIndex: idx,
          item: it.name, prompt: `"${it.name}" looks like an add-on, not a dish. Make it a modifier instead?`,
          optional: true, status: "pending",
        });
      }
    });

    // Needs answer: catering candidates flagged inline (Party Tray, etc.)
    items.forEach((it, idx) => {
      if (/\b(party tray|platter|family (meal|pack|bundle)|catering|tray|box of|bulk|dozen)\b/i.test(it.name)) {
        questions.push({
          id: `q-cat-${idx}`, kind: "catering", itemIndex: idx,
          item: it.name, prompt: `"${it.name}" might belong in your catering menu. Move it there?`,
          optional: true, status: "pending",
        });
      }
    });

    return { fixes, questions };
  }

  // ─── Catering suggestions (from existing items only) ──────────────
  const TRAVEL = ["noodle", "rice", "fried", "wing", "dumpling", "sandwich", "taco", "pasta",
    "salad", "bowl", "roast", "platter", "tray", "family", "pie", "pizza", "bbq", "curry",
    "wrap", "sub", "nugget", "tender", "meatball", "lasagna", "mac", "knot", "bread", "edamame"];
  const FRAGILE = ["ice cream", "shake", "sashimi", "nigiri", "souffle", "tempura", "fries",
    "gelato", "slushie", "float", "soft serve", "sorbet", "soda", "espresso", "latte", "matcha"];

  function isTravelFriendly(it) {
    const hay = `${it.name} ${it.category || ""}`.toLowerCase();
    if (FRAGILE.some(f => hay.includes(f))) return false;
    return TRAVEL.some(t => hay.includes(t));
  }

  function cateringSuggestions(items = []) {
    const candidates = items.filter(isTravelFriendly).slice(0, 4);
    return candidates.map((it, i) => ({
      id: `cater-${i}`,
      name: `${it.name} Party Tray`,
      basedOn: it.name,
      items: [it.name],
      serving: "Serves 8-10",
      // Batch price suggestion derived from the real item price; owner edits/approves.
      price: Math.max(1, Math.round(((it.price || 10) * 8) * 0.9)),
      minOrder: 1,
      leadTime: "24 hours",
      availability: "Pickup",
      source: "ai_suggested",
      status: "pending",
    }));
  }

  // ─── Dietary tags (always suggestions until owner verifies) ───────
  const DIET_RULES = [
    { tag: "Spicy", test: it => (it.spice || 0) >= 2 || /\b(chili|spicy|sichuan|hot|jalape)\b/i.test(it.name) },
    { tag: "Vegetarian", test: it => /\b(veg|tofu|mushroom|cucumber|edamame|salad|cheese|margherita)\b/i.test(`${it.name} ${it.description}`) && !/\b(beef|pork|chicken|fish|shrimp|tuna|salmon|bacon)\b/i.test(`${it.name} ${it.description}`) },
    { tag: "Contains nuts", test: it => /\b(peanut|almond|walnut|cashew|sesame|pistachio)\b/i.test(`${it.name} ${it.description}`) },
    { tag: "Contains dairy", test: it => /\b(milk|cheese|cream|butter|latte|mascarpone|ricotta|mozzarella)\b/i.test(`${it.name} ${it.description}`) },
    { tag: "Contains gluten", test: it => /\b(noodle|bread|bun|pasta|wheat|dough|crust|knot|croissant|pizza|wonton|dumpling)\b/i.test(`${it.name} ${it.description}`) },
  ];

  function dietaryTags(item) {
    return DIET_RULES.filter(r => r.test(item)).map(r => ({ tag: r.tag, state: "ai_suggested" }));
  }

  return {
    inferType, cuisineLabel, defaultName, starterItems,
    buildDraft, findIssues, cateringSuggestions, dietaryTags, spellFix,
  };
})();
