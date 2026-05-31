/* ---------- DATA ---------- */
const MODULES=[
  {id:"qr",icon:"qr",name:"QR Menu Website",desc:"A clean digital menu your guests open by scanning a code at the table.",rec:true},
  {id:"takeout",icon:"cart",name:"Takeout And Pickup",desc:"Let guests order ahead and pay for pickup, right from the menu.",rec:true},
  {id:"catering",icon:"catering",name:"Catering Menu",desc:"Turn your dishes into trays and platters with their own lead times.",rec:false},
  {id:"multi",icon:"locations",name:"Multi Location Menus",desc:"Separate menus, hours, and prices for each of your locations.",rec:false},
  {id:"home",icon:"home",name:"Restaurant Homepage",desc:"A full landing page with your story, photos, hours, and links.",rec:true},
  {id:"codes",icon:"menu",name:"Table And Location QR Codes",desc:"Printable codes for every table and seat, ready to place on day one.",rec:true},
];
const AREA_DEFS=[
  {key:"dining",label:"Dining",unit:"Tables",tile:"Table",icon:"utensils"},
  {key:"patio",label:"Patio",unit:"Tables",tile:"Table",icon:"umbrella"},
  {key:"bar",label:"Bar And Counter",unit:"Seats",tile:"Seat",icon:"martini"},
];
const GEN_STEPS=[
  {k:"read",icon:"eye",label:"Reading your menu",detail:"2 PDFs · 1 website"},
  {k:"items",icon:"price",label:"Finding items and prices",detail:"64 dishes · 12 sections"},
  {k:"mistakes",icon:"shield",label:"Checking for possible mistakes",detail:"spelling · OCR · pricing"},
  {k:"templates",icon:"layout",label:"Preparing template matches",detail:"3 best fits"},
  {k:"draft",icon:"sparkle",label:"Drafting your selected modules",detail:"QR · Takeout · Homepage · Codes"},
];
const FINDING_GROUPS=[
  {id:"spelling",title:"Spelling Fixes",icon:"edit",tone:"safe",blurb:"Clear typos Benu can tidy up for you.",
    items:[{from:"Bruchetta",to:"Bruschetta",ctx:"Starters"},{from:"Margherita Pizaa",to:"Margherita Pizza",ctx:"Wood-fired"},{from:"Tiramsu",to:"Tiramisù",ctx:"Dessert"}]},
  {id:"ocr",title:"Unclear Scans",icon:"eye",tone:"review",blurb:"Benu wasn’t fully sure it read these right.",
    items:[{from:"Lamb k????a",to:"Lamb kofta",ctx:"Mains",conf:"Low confidence"},{from:"Halloum?",to:"Halloumi",ctx:"Mezze",conf:"Medium confidence"}]},
  {id:"price",title:"Prices To Confirm",icon:"price",tone:"review",blurb:"These were tricky to read or look a little off.",
    items:[{from:"Mezze Platter, $1?",to:"$18.00",ctx:"Mezze",conf:"Couldn’t read decimals"},{from:"House Red, no price",to:"Add price",ctx:"Wine",conf:"Price missing"}]},
  {id:"mods",title:"Possible Add Ons",icon:"box",tone:"suggest",blurb:"Options Benu could turn into easy upsells for guests.",
    items:[{from:"“add chicken +6”",to:"Protein add-on · $6",ctx:"Salads"},{from:"“gf available”",to:"Gluten-free option",ctx:"Pizza"}]},
  {id:"desc",title:"Missing Descriptions",icon:"text",tone:"suggest",blurb:"Items with no description yet. Benu can write one for you to approve.",
    items:[{from:"Branzino",to:"Whole-roasted sea bass, lemon, herbs, olive oil",ctx:"Mains"},{from:"Spanakopita",to:"Flaky filo, spinach and feta",ctx:"Mezze"}]},
];
const toneMap={safe:{chip:"st-ok",label:"Safe Fix",color:"var(--ok)"},review:{chip:"st-warn",label:"Needs Review",color:"var(--warn)"},suggest:{chip:"st-ai",label:"Suggestion",color:"var(--mint-700)"}};
const TONE_TIERS=[
  {tone:"safe",   title:"Safe Fixes",        icon:"shield", lead:"Benu’s sure on these. Let it fix them all in one tap.", accent:"var(--ok)",       iconBg:"var(--ok-bg)"},
  {tone:"review", title:"Needs Your Review", icon:"alert",  lead:"Benu wasn’t fully sure. These need your eyes.",          accent:"var(--warn)",     iconBg:"var(--warn-bg)"},
  {tone:"suggest",title:"Suggestions",       icon:"sparkle",lead:"Optional ideas Benu drafted. Keep the ones you like.",   accent:"var(--mint-700)", iconBg:"var(--mint-100)"},
];
const CATERING=[
  {id:"mezze",name:"Mezze Feast",based:"Built from your Mezze and Starters",serves:"8 to 10",price:"120",lead:"48 hrs",min:"2 trays",contents:["Hummus and pita","Spanakopita","Falafel","Greek salad","Tzatziki and olives"]},
  {id:"grill",name:"Wood-Fired Grill Platter",based:"Built from your Mains",serves:"10 to 12",price:"185",lead:"72 hrs",min:"1 tray",contents:["Lamb kofta","Chicken souvlaki","Branzino","Roasted vegetables","Lemon potatoes"]},
  {id:"brunch",name:"Weekend Brunch Spread",based:"Built from your Brunch menu",serves:"6 to 8",price:"95",lead:"48 hrs",min:"2 trays",contents:["Shakshuka","Labneh and flatbread","Seasonal fruit","Pastry basket"]},
];
const CATER_FIELDS=[{label:"Serves",key:"serves",suffix:"guests",icon:"users"},{label:"Package Price",key:"price",suffix:"$",icon:"price"},{label:"Lead Time",key:"lead",suffix:"",icon:"clock"},{label:"Minimum Order",key:"min",suffix:"",icon:"box"}];
const LOCATIONS=[
  {id:"main",name:"South Congress",addr:"1401 S Congress Ave, Austin",main:true,hours:"Tue to Sun · 5 to 10pm",pickup:"Curbside and in-store"},
  {id:"dom",name:"The Domain",addr:"11800 Domain Blvd, Austin",main:false,hours:"Daily · 11am to 10pm",pickup:"In-store only"},
  {id:"rr",name:"Round Rock",addr:"201 University Blvd, Round Rock",main:false,hours:"Same as main",pickup:"Same as main"},
];
const TEMPLATES=[
  {id:"editorial",name:"Sunlit Editorial",tag:"Best match",why:"Your warm photography and longer dish descriptions shine in this magazine-style layout.",feats:["Serif headlines","Large photo grid","Story section"]},
  {id:"warm",name:"Hearth and Home",tag:"Great for catering",why:"Split hero and earthy tones suit your wood-fired identity and push the catering CTA.",feats:["Split hero","Catering-forward","Warm palette"]},
  {id:"minimal",name:"Clean Plate",tag:"Fastest to load",why:"A crisp, no-frills layout that puts the menu and ordering first, ideal for takeout.",feats:["Order-first","Minimal type","Quick load"]},
];
const BUILT=[
  {icon:"qr",name:"QR menu website",detail:"64 items · 12 sections",ok:true},
  {icon:"cart",name:"Takeout and pickup",detail:"Ordering and payments connected",ok:true},
  {icon:"catering",name:"Catering menu",detail:"3 packages · 1 needs confirmation",ok:false},
  {icon:"home",name:"Restaurant Homepage",detail:"Sunlit Editorial template",ok:true},
  {icon:"locations",name:"Multi Location Menus",detail:"3 locations · 3 QR codes",ok:true},
  {icon:"menu",name:"Table And Location QR Codes",detail:"Ready to print",ok:true},
];
const CHECKLIST=[
  {id:"items",label:"Menu items and prices approved",req:true,done:true},
  {id:"catering",label:"Confirm the Weekend Brunch catering package",req:true,done:false},
  {id:"contact",label:"Contact details and hours verified",req:true,done:true},
  {id:"payments",label:"Connect payouts for takeout orders",req:true,done:false},
  {id:"allergy",label:"Ingredient and allergy info (can do after launch)",req:false,done:false},
];
const ALLERGY_ITEMS=[
  {name:"Mezze Platter",section:"Mezze",state:"verified",ingredients:["Chickpeas","Tahini","Olive oil","Pita (wheat)","Garlic"],tags:[{t:"Vegetarian",ok:true},{t:"Contains Gluten",warn:true},{t:"Contains Sesame",warn:true}]},
  {name:"Lamb Kofta",section:"Mains",state:"review",ingredients:["Ground lamb","Cumin","Parsley","Onion","Egg"],tags:[{t:"Contains Egg",warn:true},{t:"Halal?",q:true}]},
  {name:"Branzino",section:"Mains",state:"suggested",ingredients:["Sea bass","Lemon","Herbs","Olive oil"],tags:[{t:"Contains Fish",warn:true},{t:"Gluten-free",ok:true},{t:"Dairy-free",ok:true}]},
  {name:"Tiramisù",section:"Dessert",state:"suggested",ingredients:["Mascarpone","Espresso","Ladyfingers (wheat)","Egg","Cocoa"],tags:[{t:"Contains Dairy",warn:true},{t:"Contains Egg",warn:true},{t:"Contains Gluten",warn:true}]},
];
const allergyState={
  suggested:{label:"AI suggested",cls:"st-ai",icon:"sparkle",dot:"var(--mint-500)"},
  review:{label:"Needs your review",cls:"st-warn",icon:"alert",dot:"var(--warn)"},
  verified:{label:"Verified by you",cls:"st-ok",icon:"shield",dot:"var(--ok)"},
};

const PHOTO_LIB={
  counts:{food:38,interior:9,exterior:4,team:3},
  total:64,withPhoto:52,
  dishes:[
    {name:"Margherita Pizza",section:"Wood-fired",has:true},
    {name:"Bruschetta",section:"Starters",has:true},
    {name:"Mezze Platter",section:"Mezze",has:true},
    {name:"Halloumi",section:"Mezze",has:true},
    {name:"Branzino",section:"Mains",has:true},
    {name:"Lamb Kofta",section:"Mains",has:true},
    {name:"Spanakopita",section:"Mezze",has:true},
    {name:"Caesar Salad",section:"Salads",has:true},
    {name:"Tiramisù",section:"Dessert",has:false},
    {name:"House Red",section:"Wine",has:false},
    {name:"Bone Broth",section:"Starters",has:false},
    {name:"Affogato",section:"Dessert",has:false},
  ],
};
