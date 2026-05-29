// Default menu installed when a restaurant subscribes without going
// through the full onboarding flow. Lets the QR codes resolve to
// something usable on day one — the owner can replace it later via
// the builder.

const STARTER_MENU = {
  name: "Your Restaurant",
  tagline: "A menu to get you started",
  subtagline: "Edit these items in the builder once you're ready.",
  template: "sprout",
  palette: "ed-burgundy",
  categories: ["Mains", "Sides", "Drinks", "Dessert"],
  items: [
    { name: "Heirloom Tomato Salad", price: 14, category: "Mains",   description: "Stone fruit, burrata, basil oil." },
    { name: "Wood-Fired Margherita", price: 18, category: "Mains",   description: "San Marzano, mozzarella di bufala, basil." },
    { name: "Roast Chicken Plate",   price: 22, category: "Mains",   description: "Pan jus, charred lemon, soft herbs." },
    { name: "Pan-Seared Salmon",     price: 26, category: "Mains",   description: "Brown butter, capers, lemon." },
    { name: "Roasted Carrots",       price:  9, category: "Sides",   description: "Honey, cumin, yogurt." },
    { name: "Crispy Potatoes",       price:  8, category: "Sides",   description: "Sea salt, smoked paprika aioli." },
    { name: "House Salad",           price:  9, category: "Sides",   description: "Little gems, parmesan, lemon vinaigrette." },
    { name: "House Spritz",          price: 12, category: "Drinks",  description: "Aperol, prosecco, soda." },
    { name: "Cold Brew",             price:  5, category: "Drinks",  description: "Single origin, milk on side." },
    { name: "Sparkling Water",       price:  4, category: "Drinks",  description: "Local, lightly carbonated." },
    { name: "Olive Oil Cake",        price:  9, category: "Dessert", description: "Citrus, candied almond." },
    { name: "Affogato",              price:  8, category: "Dessert", description: "Vanilla gelato, espresso." },
  ],
};

module.exports = { STARTER_MENU };
