// Curated, license-friendly Unsplash food photos. Now with multiple variants
// per category — pick a deterministic variant based on a hash of the dish name
// so that two different "noodle" dishes get two different photos instead of
// always sharing one.
//
// Image URLs go straight to images.unsplash.com (CDN, no API key, no rate limit
// for normal use). If a URL ever 404s, menu.html's BMImageFail handler swaps it
// out for a gradient tile so the page never shows a broken-image icon.

window.BMImages = (function () {
  const W = 800;
  const url = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${W}&q=70`;

  // Stable string hash (djb2). Same name in, same number out.
  function hash(s) {
    let h = 5381;
    s = String(s || "");
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
    return Math.abs(h | 0);
  }

  // Keyword categories, each with 3-6 photo variants. First-match wins, so
  // more specific categories (ramen, dan dan) come before general ones (noodle).
  const LIBRARY = [
    { keys: ["ramen"], variants: [
      "photo-1569718212165-3a8278d5f624",
      "photo-1547928576-b822bc410bdf",
      "photo-1591814468924-caf88d1232e1",
      "photo-1623341214825-9f4f963727da",
    ]},
    { keys: ["pho", "vietnamese"], variants: [
      "photo-1607330289024-1535c6b4e1c1",
      "photo-1582268611958-ebfd161ef9cf",
      "photo-1583224994076-ae3ab7c8e6d6",
    ]},
    { keys: ["dan dan", "sichuan", "spicy noodle", "chili noodle", "chili oil"], variants: [
      "photo-1552611052-33e04de081de",
      "photo-1612927601601-6638404737ce",
      "photo-1626804475297-41608ea09aeb",
    ]},
    { keys: ["udon", "soba", "mian", "noodle"], variants: [
      "photo-1569718212165-3a8278d5f624",
      "photo-1612927601601-6638404737ce",
      "photo-1582268611958-ebfd161ef9cf",
      "photo-1623341214825-9f4f963727da",
    ]},
    { keys: ["wonton", "soup dumpling", "xiao long bao"], variants: [
      "photo-1547592180-85f173990554",
      "photo-1543339494-b4cd4f7ba686",
    ]},
    { keys: ["dumpling", "bao", "gyoza", "potsticker"], variants: [
      "photo-1496116218417-1a781b1c416c",
      "photo-1563379091339-03b21ab4a4f8",
      "photo-1625042782220-3a51a4cb6e1e",
    ]},
    { keys: ["miso soup", "broth", "stew", "soup"], variants: [
      "photo-1547592180-85f173990554",
      "photo-1543339494-b4cd4f7ba686",
      "photo-1583224994076-ae3ab7c8e6d6",
    ]},
    { keys: ["matcha"], variants: [
      "photo-1545518514-ce8448f542b3",
      "photo-1564890369478-c89ca6d9cde9",
    ]},
    { keys: ["tea", "chai"], variants: [
      "photo-1564890369478-c89ca6d9cde9",
      "photo-1597318181409-cf64d0b7a16d",
    ]},
    { keys: ["latte", "cappuccino", "espresso", "americano"], variants: [
      "photo-1495474472287-4d71bcdd2085",
      "photo-1509042239860-f550ce710b93",
      "photo-1453614512568-c4024d13c247",
    ]},
    { keys: ["coffee"], variants: [
      "photo-1509042239860-f550ce710b93",
      "photo-1495474472287-4d71bcdd2085",
      "photo-1453614512568-c4024d13c247",
    ]},
    { keys: ["lemonade"], variants: [
      "photo-1556679343-c7306c1976bc",
      "photo-1437418747212-8d9709afab22",
    ]},
    { keys: ["juice"], variants: [
      "photo-1610970881699-44a5587cabec",
      "photo-1437418747212-8d9709afab22",
    ]},
    { keys: ["soda", "yuzu", "sparkling"], variants: [
      "photo-1437418747212-8d9709afab22",
      "photo-1556679343-c7306c1976bc",
    ]},
    { keys: ["cocktail", "negroni", "martini", "old fashioned"], variants: [
      "photo-1551538827-9c037cb4f32a",
      "photo-1574096079513-d8259312b785",
    ]},
    { keys: ["wine"], variants: [
      "photo-1510812431401-41d2bd2722f3",
      "photo-1553361371-9b22f78e8b1d",
    ]},
    { keys: ["beer", "ipa", "pilsner"], variants: [
      "photo-1535958636474-b021ee887b13",
      "photo-1571613316887-6f8d5cbf7ef7",
    ]},
    { keys: ["shake", "milkshake", "smoothie"], variants: [
      "photo-1572490122747-3968b75cc699",
      "photo-1610970881699-44a5587cabec",
    ]},
    { keys: ["cucumber", "smashed cucumber"], variants: [
      "photo-1546069901-ba9599a7e63c",
    ]},
    { keys: ["salad", "greens", "kale"], variants: [
      "photo-1546069901-ba9599a7e63c",
      "photo-1607532941433-304659e8198a",
      "photo-1556909114-f6e7ad7d3136",
    ]},
    { keys: ["rice bowl", "donburi", "poke"], variants: [
      "photo-1546833999-b9f581a1996d",
      "photo-1574484284002-952d92456975",
    ]},
    { keys: ["rice"], variants: [
      "photo-1546833999-b9f581a1996d",
      "photo-1574484284002-952d92456975",
    ]},
    { keys: ["burger", "cheeseburger", "smashburger"], variants: [
      "photo-1568901346375-23c9450c58cd",
      "photo-1571091718767-18b5b1457add",
      "photo-1586816001966-79b736744398",
      "photo-1572802419224-296b0aeee0d9",
    ]},
    { keys: ["fries", "french fries", "tots"], variants: [
      "photo-1573080496219-bb080dd4f877",
      "photo-1630384060421-cb20d0e0649d",
    ]},
    { keys: ["pizza", "margherita", "pepperoni"], variants: [
      "photo-1513104890138-7c749659a591",
      "photo-1565299624946-b28f40a0ae38",
      "photo-1574071318508-1cdbab80d002",
      "photo-1604068549290-dea0e4a305ca",
    ]},
    { keys: ["sushi", "sashimi", "nigiri", "maki", "omakase"], variants: [
      "photo-1579871494447-9811cf80d66c",
      "photo-1583623025817-d180a2221d0a",
      "photo-1617196034796-73dfa7b1fd56",
      "photo-1607301406259-dfb186e15de9",
    ]},
    { keys: ["taco", "al pastor"], variants: [
      "photo-1565299585323-38d6b0865b47",
      "photo-1599974579688-8dbdd335c77f",
    ]},
    { keys: ["burrito"], variants: [
      "photo-1626700051175-6818013e1d4f",
      "photo-1565299585323-38d6b0865b47",
    ]},
    { keys: ["nachos", "quesadilla"], variants: [
      "photo-1599974579688-8dbdd335c77f",
      "photo-1565299585323-38d6b0865b47",
    ]},
    { keys: ["wing", "chicken"], variants: [
      "photo-1532550907401-a500c9a57435",
      "photo-1606756790138-261d2b21cd75",
      "photo-1626082929543-6a4f43d9a3f7",
    ]},
    { keys: ["fish", "salmon", "seafood"], variants: [
      "photo-1467003909585-2f8a72700288",
      "photo-1535140728325-a4d3707eee94",
      "photo-1519708227418-c8fd9a32b7a2",
    ]},
    { keys: ["pasta", "spaghetti", "lasagna", "carbonara"], variants: [
      "photo-1473093295043-cdd812d0e601",
      "photo-1551183053-bf91a1d81141",
      "photo-1572441713132-51c75654db73",
    ]},
    { keys: ["steak", "ribeye", "beef"], variants: [
      "photo-1546964124-0cce460f38ef",
      "photo-1558030006-450675393462",
      "photo-1600891964092-4316c288032e",
    ]},
    { keys: ["dessert", "tiramisu"], variants: [
      "photo-1488477181946-6428a0291777",
      "photo-1565958011703-44f9829ba187",
    ]},
    { keys: ["cake", "cheesecake"], variants: [
      "photo-1565958011703-44f9829ba187",
      "photo-1488477181946-6428a0291777",
    ]},
    { keys: ["ice cream", "gelato", "sorbet"], variants: [
      "photo-1488900128323-21503983a07e",
      "photo-1497034825429-c343d7c6a68f",
    ]},
    { keys: ["croissant"], variants: [
      "photo-1555507036-ab1f4038808a",
      "photo-1509440159596-0249088772ff",
    ]},
    { keys: ["bread", "loaf", "sourdough"], variants: [
      "photo-1567181073066-0aa3a0f5c2c4",
      "photo-1555507036-ab1f4038808a",
    ]},
    { keys: ["pastry", "muffin", "scone", "donut"], variants: [
      "photo-1509440159596-0249088772ff",
      "photo-1555507036-ab1f4038808a",
    ]},
    { keys: ["banana bread"], variants: [
      "photo-1509440159596-0249088772ff",
    ]},
    { keys: ["avocado", "avo toast"], variants: [
      "photo-1541519227354-08fa5d50c44d",
      "photo-1525351484163-7529414344d8",
    ]},
    { keys: ["toast", "egg", "breakfast"], variants: [
      "photo-1525351484163-7529414344d8",
      "photo-1541519227354-08fa5d50c44d",
    ]},
    { keys: ["sandwich", "panini", "club"], variants: [
      "photo-1539252554935-80c8cb886ed8",
      "photo-1568901346375-23c9450c58cd",
    ]},
    { keys: ["curry"], variants: [
      "photo-1565557623262-b51c2513a641",
      "photo-1574484284002-952d92456975",
    ]},
    { keys: ["caviar", "oyster"], variants: [
      "photo-1519708227418-c8fd9a32b7a2",
      "photo-1535140728325-a4d3707eee94",
    ]},
    { keys: ["edamame", "appetizer", "starter"], variants: [
      "photo-1546069901-ba9599a7e63c",
      "photo-1607532941433-304659e8198a",
    ]},
  ];

  // Final fallback if nothing matches the dish name.
  const FALLBACKS = [
    "photo-1504674900247-0877df9cc836",
    "photo-1565299507177-b0ac66763828",
    "photo-1567620905732-2d1ec7ab7445",
  ];

  function pickVariant(variants, seed) {
    if (!variants || variants.length === 0) return null;
    return variants[seed % variants.length];
  }

  function forItem(name) {
    const n = (name || "").toLowerCase();
    const seed = hash(n);
    for (const entry of LIBRARY) {
      if (entry.keys.some(k => n.includes(k))) {
        const id = pickVariant(entry.variants, seed);
        if (id) return url(id);
      }
    }
    return url(FALLBACKS[seed % FALLBACKS.length]);
  }

  // Hero images for the onboarding step's restaurant types.
  const HEROES = {
    noodle: url("photo-1569718212165-3a8278d5f624"),
    cafe:   url("photo-1495474472287-4d71bcdd2085"),
    pizza:  url("photo-1513104890138-7c749659a591"),
    sushi:  url("photo-1579871494447-9811cf80d66c"),
    burger: url("photo-1568901346375-23c9450c58cd"),
    fine:   url("photo-1546964124-0cce460f38ef"),
    other:  url(FALLBACKS[0]),
  };

  return { forItem, HEROES, FALLBACK: url(FALLBACKS[0]) };
})();
