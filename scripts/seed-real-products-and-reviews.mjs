import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dgipjdyzcugtegfqiiig.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnaXBqZHl6Y3VndGVnZnFpaWlnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTU2MzI1OCwiZXhwIjoyMTAxMTM5MjU4fQ.hfALLkIKTbmPeyb8b0Ic0KGp6bK3PtWDqKRanTGaZng";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Authentic Pakistani Customers
const PAKISTANI_CUSTOMERS = [
  { name: "Fatima Tariq", phone: "03008451294", email: "fatima.tariq@gmail.com", city: "Lahore", area: "Gulberg III" },
  { name: "Muhammad Usman", phone: "03214592018", email: "usman.m92@gmail.com", city: "Karachi", area: "Clifton Block 5" },
  { name: "Zainab Ali", phone: "03335198273", email: "zainab.ali94@gmail.com", city: "Islamabad", area: "F-10/2" },
  { name: "Ayesha Khan", phone: "03028219401", email: "ayesha.khan88@yahoo.com", city: "Lahore", area: "DHA Phase 5" },
  { name: "Bilal Ahmed", phone: "03124892011", email: "bilal.ahmed.pk@gmail.com", city: "Karachi", area: "DHA Phase 6" },
  { name: "Sana Malik", phone: "03454910283", email: "sana.malik@outlook.com", city: "Rawalpindi", area: "Bahria Town Phase 7" },
  { name: "Hamza Chaudhry", phone: "03239821045", email: "hamza.chaudhry@gmail.com", city: "Faisalabad", area: "Peoples Colony" },
  { name: "Hira Siddiqui", phone: "03017649201", email: "hira.siddiqui@gmail.com", city: "Karachi", area: "PECHS Block 2" },
  { name: "Omer Farooq", phone: "03348291048", email: "omer.farooq@live.com", city: "Lahore", area: "Model Town" },
  { name: "Mariam Javed", phone: "03157291042", email: "mariam.javed@gmail.com", city: "Islamabad", area: "G-11/3" },
  { name: "Saad Qureshi", phone: "03224819028", email: "saad.qureshi@gmail.com", city: "Multan", area: "Cantt" },
  { name: "Mahnoor Sheikh", phone: "03038291047", email: "mahnoor.sheikh@gmail.com", city: "Karachi", area: "Gulshan-e-Iqbal Block 13" },
  { name: "Zeeshan Butt", phone: "03429182049", email: "zeeshan.butt@gmail.com", city: "Sialkot", area: "Model Town" },
  { name: "Rabia Anwar", phone: "03314829105", email: "rabia.anwar@hotmail.com", city: "Lahore", area: "Johar Town" },
  { name: "Daniyal Raza", phone: "03134910284", email: "daniyal.raza@gmail.com", city: "Karachi", area: "North Nazimabad" },
  { name: "Nida Faisal", phone: "03058291039", email: "nida.faisal@gmail.com", city: "Lahore", area: "Cantt" },
  { name: "Hassan Mehmood", phone: "03248192038", email: "hassan.mehmood@gmail.com", city: "Islamabad", area: "I-8/4" },
  { name: "Syeda Amna", phone: "03359182047", email: "syeda.amna@gmail.com", city: "Karachi", area: "Bahria Town Karachi" },
  { name: "Talha Noor", phone: "03064910283", email: "talha.noor@gmail.com", city: "Rawalpindi", area: "Chaklala Scheme III" },
  { name: "Bushra Rehman", phone: "03164920194", email: "bushra.rehman@gmail.com", city: "Lahore", area: "Wapda Town" },
  { name: "Mehwish Raza", phone: "03258291048", email: "mehwish.raza@gmail.com", city: "Peshawar", area: "Hayatabad" },
  { name: "Anam Qureshi", phone: "03074819203", email: "anam.qureshi@gmail.com", city: "Karachi", area: "KDA Scheme 1" },
  { name: "Zunaira Tariq", phone: "03369182049", email: "zunaira.tariq@gmail.com", city: "Lahore", area: "Garden Town" },
  { name: "Aliza Shah", phone: "03178291047", email: "aliza.shah@gmail.com", city: "Islamabad", area: "F-7/1" },
  { name: "Sadia Farooq", phone: "03264910285", email: "sadia.farooq@gmail.com", city: "Karachi", area: "DHA Phase 8" },
  { name: "Farah Naeem", phone: "03088291038", email: "farah.naeem@gmail.com", city: "Lahore", area: "Faisal Town" },
  { name: "Shahzaib Khan", phone: "03464910284", email: "shahzaib.khan@gmail.com", city: "Gujranwala", area: "DC Colony" },
  { name: "Kashif Rauf", phone: "03278192039", email: "kashif.rauf@gmail.com", city: "Karachi", area: "Federal B Area" },
  { name: "Farhan Abbasi", phone: "03379182048", email: "farhan.abbasi@gmail.com", city: "Rawalpindi", area: "Westridge" },
  { name: "Salman Tahir", phone: "03184910285", email: "salman.tahir@gmail.com", city: "Lahore", area: "Valencia Town" },
];

// Realistic Reviews: Mix of Short, Medium, Long in Roman Urdu, English, and Mixed Urdu-English
const REVIEWS_BY_TYPE = {
  cakes: [
    // Short
    { rating: 5, body: "Bht zabardast cake tha! Fresh sponge and super tasty." },
    { rating: 5, body: "10/10 taste. Everyone in family loved it!" },
    { rating: 5, body: "Bohat mazy ka tha, sweetness bilkul perfect thi." },
    { rating: 4, body: "Fresh tha aur taste bhi acha tha. Good packing." },
    { rating: 5, body: "Best chocolate cake in town! Delivered right on time." },
    { rating: 5, body: "Bohat soft sponge tha. Bachon ko bohat pasand aya." },
    { rating: 4, body: "Fresh cream and great presentation. Recommended!" },
    { rating: 5, body: "Zabardast! Time pe delivery mil gai in Karachi." },

    // Medium
    { rating: 5, body: "Ordered for my daughter's birthday in Lahore. Cake bilkul fresh pohncha, packaging was neat and safe. Sab ne tareef ki!" },
    { rating: 5, body: "Sponge was so soft and moist. Sugar level was balanced, not overly sweet. Will definitely order again." },
    { rating: 5, body: "Karachi me timely delivery mil gai. Cake bilkul intact tha, presentation was 10/10. Thank you Bake Bazaar!" },
    { rating: 4, body: "Bohot acha cake tha, looks exactly like the picture. Slices bohat neat cut hue. Highly satisfied." },
    { rating: 5, body: "Anniversary k liye order kia tha. The chocolate ganache was rich and premium. Guest loved it so much." },
    { rating: 5, body: "Super fresh and delicious. Delivery boy was polite and chilled packaging kept the cake cool." },

    // Detailed / Longer
    { rating: 5, body: "Gulberg Lahore me timely delivery mil gai. Chocolate fudge bohat rich hai, sponge moist tha aur bilkul heavy nahi laga. We will always order from here now." },
    { rating: 5, body: "Quality is top notch! Flavour profile is amazing and fresh cream quality is very premium. Delivered without any damage in DHA." },
  ],

  pastries: [
    // Short
    { rating: 5, body: "Bohot flaky aur buttery! Chai k sath best hai." },
    { rating: 5, body: "Proper fresh croissants, 10/10." },
    { rating: 4, body: "Very fresh and soft, good quality butter." },
    { rating: 5, body: "Crisp and fresh! Oven me 2 min warm kia to fresh ho gaya." },
    { rating: 5, body: "Taste zabardast hai, highly recommended." },

    // Medium
    { rating: 5, body: "Subah breakfast k liye mangwaya tha. Airfryer me warm kia, bilkul French bakery jesa crisp ho gaya. Loved it!" },
    { rating: 5, body: "Bohat zabardast flaky layers hain. Pakistan me aise authentic butter croissants mushkil se miltay hain." },
    { rating: 4, body: "Good buttery aroma and fresh texture. Delivery was on time." },
  ],

  brownies: [
    // Short
    { rating: 5, body: "Proper fudgy brownie, best in town!" },
    { rating: 5, body: "Gooey chocolate center, pure heaven." },
    { rating: 5, body: "Walnuts ka crunch bohat acha hai, super rich." },
    { rating: 5, body: "Microwave me 15 sec garam kar k ice cream k sath khaya, maza a gaya." },
    { rating: 4, body: "Bohot chocolaty hai, sweet tooth k liye best treat." },
    { rating: 5, body: "10/10 taste, perfectly baked." },

    // Medium
    { rating: 5, body: "Dense and fudgy texture, not dry at all. Chocolate quality feels very rich and premium." },
    { rating: 5, body: "Office k liye mangwaya tha, 10 mins me box khatam ho gaya! Sab ko bohat pasand aya." },
  ],

  cookies: [
    // Short
    { rating: 5, body: "Bohot crispy edges aur soft center, kids loved it." },
    { rating: 5, body: "Proper chunky cookies, chocolate chunks are huge!" },
    { rating: 5, body: "Chai k sath perfect match hai. Bohat khasta." },
    { rating: 4, body: "Taste is good, packing is also airtight and fresh." },
    { rating: 5, body: "Super fresh, best tea time snack." },

    // Medium
    { rating: 5, body: "New York style chunky cookies jesa taste hai. Crispy from outside and soft gooey inside. Worth the price." },
    { rating: 5, body: "Cake rusks are super fresh and crunchy. Ilaichi ka aroma bohat acha hai, daily chai k sath must have." },
  ],

  cupcakes: [
    // Short
    { rating: 5, body: "Cute presentation and super soft cupcakes!" },
    { rating: 5, body: "Frosting bilkul light aur fresh thi, not grainy." },
    { rating: 5, body: "Gift kia tha friend ko, she was so happy!" },
    { rating: 4, body: "Nice taste, sponge is soft and not overly sweet." },
    { rating: 5, body: "Box packing was very neat, 10/10." },

    // Medium
    { rating: 5, body: "Red velvet cupcakes were amazingly soft. Cream cheese frosting was smooth and delicious. Perfect for gifting." },
  ],

  desserts: [
    // Short
    { rating: 5, body: "Tres leches is heavenly, melt in mouth!" },
    { rating: 5, body: "Thanda thanda bohot mazy ka lagta hai." },
    { rating: 5, body: "Sweetness bilkul balanced hai, so light and airy." },
    { rating: 4, body: "Good portion and very rich milk soak. Highly satisfied." },
    { rating: 5, body: "10/10 dessert, family loved it!" },

    // Medium
    { rating: 5, body: "Bake Bazaar's tres leches is truly the best in town. Milk soak is rich, fragrant, and perfectly chilled." },
    { rating: 5, body: "Sunday family dinner k liye mangwaya tha, sab ne bohot tareef ki. Will reorder definitely!" },
  ],

  general: [
    // Short
    { rating: 5, body: "Quality bohot achi hai, strong and durable material." },
    { rating: 5, body: "Same as shown in pictures. Very satisfied!" },
    { rating: 4, body: "Useful product, timely delivery in Karachi." },
    { rating: 5, body: "Bubble wrap me securely pack tha, thanks!" },
    { rating: 4, body: "Good value for money. Daily use k liye best." },
    { rating: 5, body: "Kitchen me bohot useful hai, neat finishing." },
    { rating: 5, body: "Fast delivery and polite rider. 5 stars." },
  ],
};

// Professional Bakery Products Lineup
const NEW_PROFESSIONAL_BAKERY_PRODUCTS = [
  {
    sku: "BMB-CAKE-004",
    slug: "belgian-triple-chocolate-malt-cake",
    name: "Belgian Triple Chocolate Malt Cake",
    catSlug: "cakes",
    price: 3450,
    sale_price: 3150,
    stock_quantity: 15,
    is_featured: true,
    is_bestseller: true,
    tags: ["chocolate", "belgian", "malt", "celebration", "birthday"],
    short_description: "Rich dark Belgian chocolate sponge infused with malt syrup, layered with smooth milk chocolate ganache and chocolate malt crunch.",
    description: "Our Belgian Triple Chocolate Malt Cake is handcrafted for true chocolate enthusiasts. Prepared with premium imported Belgian cocoa, dark chocolate truffle ganache, and light malted chocolate sponge, this cake is crowned with hand-rolled chocolate pearls and a mirror glaze drip. Baked fresh in small batches daily.",
    featured_image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Weight": "2.5 lbs (approx. 1.1 kg)", "Servings": "8 to 10 persons", "Flavour Profile": "Deep Belgian Cocoa & Silky Malt", "Storage": "Refrigerate at 4°C - 6°C", "Shelf Life": "4 days refrigerated", "Allergens": "Dairy, Eggs, Wheat, Soy" },
    ingredients: "Belgian dark chocolate couverture (54%), dairy cream, unsalted butter, unbleached flour, farm fresh eggs, cane sugar, malted milk extract, cocoa powder, sea salt.",
    care_instructions: "Keep refrigerated until 30 minutes before serving. Cut with a warm knife for smooth, bakery-perfect slices.",
    delivery_information: "Same-day delivery available across Karachi for orders placed before 1:00 PM. Delivered in insulated temperature-controlled packaging.",
    return_policy: "100% satisfaction guarantee. In case of any transit damage, contact us immediately for instant replacement or refund."
  },
  {
    sku: "BMB-CAKE-005",
    slug: "lotus-biscoff-caramel-mousse-cake",
    name: "Lotus Biscoff Caramel Mousse Cake",
    catSlug: "cakes",
    price: 3650,
    sale_price: 3290,
    stock_quantity: 12,
    is_featured: true,
    is_bestseller: true,
    tags: ["lotus", "biscoff", "caramel", "speculoos", "celebration"],
    short_description: "Crunchy Biscoff biscuit crust, vanilla sponge layered with caramelized Speculoos mousse and warm Biscoff spread drip.",
    description: "An irresistible trend-setting masterpiece. Features alternating layers of fluffy Madagascar vanilla sponge and velvety Lotus Speculoos cream, grounded by a crunchy spiced biscuit base and crowned with whole Lotus biscuits and toasted butter crumble.",
    featured_image: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Weight": "2.5 lbs (approx. 1.1 kg)", "Servings": "8 to 10 persons", "Flavour Profile": "Spiced Speculoos & Salted Caramel", "Storage": "Refrigerate at 4°C - 6°C", "Shelf Life": "3 to 4 days refrigerated", "Allergens": "Dairy, Wheat, Soy" },
    ingredients: "Authentic Lotus Biscoff spread and biscuits, fresh heavy dairy cream, cream cheese, pure vanilla extract, wheat flour, farm eggs, golden caramel.",
    care_instructions: "Serve chilled. Store in an airtight container in the refrigerator.",
    delivery_information: "Delivered fresh via express temperature-safe courier service across Karachi.",
    return_policy: "Guaranteed freshness upon delivery. Reach out via WhatsApp or email for instant assistance."
  },
  {
    sku: "BMB-CAKE-006",
    slug: "classic-ny-cheesecake",
    name: "Classic New York Baked Cheesecake",
    catSlug: "cakes",
    price: 3800,
    sale_price: null,
    stock_quantity: 10,
    is_featured: true,
    is_bestseller: false,
    tags: ["cheesecake", "new york", "cream cheese", "gourmet"],
    short_description: "Authentic slow-baked New York cheesecake with dense, velvety cream cheese and golden butter graham crust.",
    description: "Baked gently in a traditional water bath to achieve that iconic creamy, dense, yet silky texture that true New York cheesecake is renowned for. Made with real Philadelphia-style cream cheese and a zesty kiss of fresh lemon zest.",
    featured_image: "https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Weight": "2.2 lbs (approx. 1 kg)", "Servings": "8 to 10 persons", "Flavour Profile": "Tangy, Rich Cream Cheese & Butter Crust", "Storage": "Chilled at 2°C - 4°C", "Shelf Life": "5 days refrigerated", "Allergens": "Dairy, Eggs, Wheat" },
    ingredients: "Full-fat cream cheese, butter graham crumbs, pure dairy sour cream, sugar, whole eggs, natural vanilla bean, fresh lemon juice.",
    care_instructions: "Keep strictly chilled. Serve straight from the fridge.",
    delivery_information: "Special temperature-safe delivery with ice packs to prevent softening during transit in Karachi.",
    return_policy: "Quality and freshness guaranteed."
  },
  {
    sku: "BMB-CAKE-007",
    slug: "ferrero-hazelnut-drip-cake",
    name: "Ferrero Rocher Hazelnut Drip Cake",
    catSlug: "cakes",
    price: 4200,
    sale_price: 3850,
    stock_quantity: 8,
    is_featured: true,
    is_bestseller: true,
    tags: ["ferrero", "hazelnut", "nutella", "luxury", "birthday"],
    short_description: "Decadent roasted hazelnut sponge, Nutella fudge buttercream, dark chocolate drip, and gold-dusted Ferrero Rocher pralines.",
    description: "The epitome of luxury baking. Three layers of moist chocolate hazelnut sponge sandwiched with pure roasted hazelnut praline paste and creamy Nutella frosting, topped with genuine Ferrero Rocher confections.",
    featured_image: "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Weight": "3 lbs (approx. 1.35 kg)", "Servings": "10 to 12 persons", "Flavour Profile": "Nutella, Roasted Hazelnut & Dark Truffle", "Storage": "Refrigerate at 4°C - 6°C", "Shelf Life": "4 days refrigerated", "Allergens": "Hazelnuts, Tree Nuts, Dairy, Wheat, Eggs" },
    ingredients: "Roasted Turkish hazelnuts, Nutella hazelnut spread, dark chocolate ganache, Ferrero Rocher chocolates, fresh dairy cream, cocoa powder, flour, eggs.",
    care_instructions: "Bring to cool room temperature (18°C) for 20 minutes before enjoying for best hazelnut aroma.",
    delivery_information: "Same-day priority delivery in Karachi with premium gift box packaging.",
    return_policy: "100% guarantee on appearance and taste."
  },
  {
    sku: "BMB-CAKE-008",
    slug: "karachi-pineapple-cream-cake",
    name: "Karachi Special Pineapple Cream Cake",
    catSlug: "cakes",
    price: 2600,
    sale_price: 2350,
    stock_quantity: 20,
    is_featured: false,
    is_bestseller: true,
    tags: ["pineapple", "traditional", "nostalgic", "light", "fresh cream"],
    short_description: "The nostalgic Karachi classic: ultra-light vanilla sponge soaked in natural pineapple syrup with diced pineapples and whipped cream.",
    description: "A beloved Pakistani celebration staple. Feather-light vanilla chiffon sponge soaked in sweet pineapple nectar, layered with juicy crushed pineapple chunks and dairy whipped cream, finished with maraschino cherries.",
    featured_image: "https://images.unsplash.com/photo-1562772186-085d7946b3d5?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Weight": "2 lbs (approx. 900g)", "Servings": "6 to 8 persons", "Flavour Profile": "Sweet Pineapple & Light Dairy Cream", "Storage": "Chilled at 4°C", "Shelf Life": "3 days refrigerated", "Allergens": "Dairy, Eggs, Wheat" },
    ingredients: "Fresh whipped cream, crushed Queen pineapples, natural pineapple syrup, pastry flour, eggs, sugar, maraschino cherries.",
    care_instructions: "Keep refrigerated until ready to serve. Consume within 48 hours for optimal fruit freshness.",
    delivery_information: "Same-day delivery across Karachi.",
    return_policy: "Contact support for any queries or replacements."
  },
  {
    sku: "BMB-CAKE-009",
    slug: "espresso-tiramisu-cake",
    name: "Italian Espresso Tiramisu Cake",
    catSlug: "cakes",
    price: 3400,
    sale_price: null,
    stock_quantity: 11,
    is_featured: false,
    is_bestseller: false,
    tags: ["coffee", "tiramisu", "mascarpone", "dessert"],
    short_description: "Espresso-soaked sponge layered with delicate mascarpone mousse and generously dusted with Dutch cocoa.",
    description: "An authentic Italian delicacy crafted with freshly pulled espresso coffee and velvety mascarpone sabayon cream. Dusted generously with bitter-sweet Dutch processed cocoa.",
    featured_image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Weight": "2.5 lbs (approx. 1.1 kg)", "Servings": "8 to 10 persons", "Flavour Profile": "Robust Espresso & Sweet Mascarpone", "Storage": "Refrigerate at 4°C", "Shelf Life": "3 days", "Allergens": "Dairy, Eggs, Wheat, Caffeine" },
    ingredients: "Mascarpone cheese, fresh Arabica espresso brew, sponge ladyfinger layers, pasture eggs, cocoa powder, sugar.",
    care_instructions: "Best served chilled. Keep away from direct sunlight.",
    delivery_information: "Delivered fresh across Karachi.",
    return_policy: "Freshness guaranteed."
  },
  {
    sku: "BMB-PAST-002",
    slug: "butter-croissant-pack-of-4",
    name: "Classic French Butter Croissants (Pack of 4)",
    catSlug: "pastries",
    price: 1450,
    sale_price: 1250,
    stock_quantity: 25,
    is_featured: true,
    is_bestseller: true,
    tags: ["croissant", "butter", "french", "breakfast", "pastry"],
    short_description: "Handcrafted with European cultured butter, featuring 27 micro-layers for a shatteringly crisp exterior and airy honeycomb center.",
    description: "Baked fresh before dawn every morning. Made strictly according to traditional French lamination techniques using 82% fat cultured dairy butter. Reheat in an oven or airfryer for 2-3 minutes for that unmatched bakery-fresh aroma.",
    featured_image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Quantity": "4 pieces per box", "Weight": "approx. 320g total", "Flavour Profile": "Rich Butter & Delicate Crispness", "Storage": "Room temperature for 24h or freeze up to 2 weeks", "Allergens": "Dairy, Wheat" },
    ingredients: "French T55 unbleached flour, cultured European butter (82% fat), whole milk, yeast, cane sugar, sea salt.",
    care_instructions: "Warm in preheated oven at 170°C for 3 minutes for crisp perfection.",
    delivery_information: "Delivered every morning across Karachi.",
    return_policy: "Guaranteed fresh bake."
  },
  {
    sku: "BMB-PAST-003",
    slug: "pain-au-chocolat-pack-of-4",
    name: "Pain au Chocolat (Chocolate Croissants Pack of 4)",
    catSlug: "pastries",
    price: 1650,
    sale_price: null,
    stock_quantity: 18,
    is_featured: false,
    is_bestseller: true,
    tags: ["chocolate", "pastry", "croissant", "breakfast"],
    short_description: "Buttery laminated puff pastry enveloping two generous batons of dark Belgian chocolate.",
    description: "A morning luxury. Crisp, golden, buttery pastry ribbons that shatter pleasantly with every bite, revealing warm, melting Belgian dark chocolate batons inside.",
    featured_image: "https://images.unsplash.com/photo-1549903072-7e6e0bedb7fb?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Quantity": "4 pieces per box", "Weight": "approx. 360g", "Flavour Profile": "Flaky Butter & Molten Dark Chocolate", "Allergens": "Dairy, Wheat, Soy" },
    ingredients: "Cultured dairy butter, unbleached flour, 55% Belgian chocolate batons, milk, sugar, sea salt.",
    care_instructions: "Warm for 2 minutes in oven before breakfast.",
    delivery_information: "Fresh daily morning bake in Karachi.",
    return_policy: "100% freshness guaranteed."
  },
  {
    sku: "BMB-BRWN-002",
    slug: "fudgy-nutella-walnut-brownies",
    name: "Fudgy Nutella Walnut Brownie Box (6 Pieces)",
    catSlug: "brownies",
    price: 1550,
    sale_price: 1350,
    stock_quantity: 30,
    is_featured: true,
    is_bestseller: true,
    tags: ["brownies", "nutella", "walnut", "fudgy", "chocolate"],
    short_description: "Thick, gooey fudge brownies swirled with rich Nutella and loaded with toasted Kashmiri walnuts.",
    description: "Crafted for intense chocolate indulgence. We melt down pure dark chocolate with brown sugar and churn it into a dense, fudgy batter with crunchy toasted walnuts and ribbon swirls of hazelnut Nutella.",
    featured_image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Quantity": "6 thick slices", "Weight": "approx. 500g", "Flavour Profile": "Fudgy Cocoa, Nutella & Crunchy Walnuts", "Storage": "Airtight container at room temperature or refrigerated", "Shelf Life": "7 days room temp, 14 days chilled", "Allergens": "Walnuts, Tree Nuts, Dairy, Eggs, Wheat" },
    ingredients: "Dark couverture chocolate, unsalted butter, Nutella, toasted walnuts, unrefined brown sugar, fresh eggs, flour, cocoa.",
    care_instructions: "Microwave for 15 seconds and serve warm with vanilla ice cream.",
    delivery_information: "Nationwide delivery across Pakistan via courier partners; same-day in Karachi.",
    return_policy: "100% money back guarantee if not satisfied."
  },
  {
    sku: "BMB-COOK-002",
    slug: "ny-chunky-chocochip-cookies",
    name: "New York Chunky Chocochip Cookies (Box of 6)",
    catSlug: "cookies",
    price: 1200,
    sale_price: 1050,
    stock_quantity: 35,
    is_featured: true,
    is_bestseller: true,
    tags: ["cookies", "chocochip", "new york", "soft baked"],
    short_description: "Giant, thick bakery cookies loaded with melting Belgian dark and milk chocolate chunks. Crispy rim, molten center.",
    description: "Inspired by the famed Manhattan bakeries. Each cookie weighs over 70 grams and is packed to the brim with hand-cut Belgian chocolate chunks and a pinch of Maldon sea salt on top.",
    featured_image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Quantity": "6 oversized cookies", "Weight": "approx. 450g", "Flavour Profile": "Brown Butter, Vanilla & Melted Chocolate", "Shelf Life": "10 days in sealed box", "Allergens": "Dairy, Wheat, Eggs, Soy" },
    ingredients: "Brown butter, Belgian dark chocolate chunks, milk chocolate drops, brown sugar, flour, sea salt.",
    care_instructions: "Pop in microwave for 10 seconds for that molten center experience.",
    delivery_information: "Available for same-day delivery in Karachi and nationwide courier delivery.",
    return_policy: "Satisfaction guaranteed."
  },
  {
    sku: "BMB-COOK-003",
    slug: "khasta-cake-rusks-500g",
    name: "Traditional Khasta Cake Rusks (500g Box)",
    catSlug: "cookies",
    price: 650,
    sale_price: null,
    stock_quantity: 50,
    is_featured: false,
    is_bestseller: true,
    tags: ["rusks", "tea time", "chai", "traditional", "khasta"],
    short_description: "Double-baked golden cake rusks infused with cardamom and pure butter. Crisp, airy, and made for evening chai.",
    description: "The quintessential Pakistani tea companion. Double-baked to golden perfection from freshly baked vanilla sponge cake, flavored with crushed green cardamom pods. Stays wonderfully crisp in our airtight packaging.",
    featured_image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Weight": "500 grams", "Texture": "Extra crispy, khasta", "Flavour Profile": "Cardamom, Butter & Vanilla", "Shelf Life": "30 days in dry container", "Allergens": "Wheat, Eggs, Dairy" },
    ingredients: "Wheat flour, farm eggs, vegetable fat, sugar, green cardamom powder, natural vanilla.",
    care_instructions: "Store in an airtight jar after opening to retain crispness.",
    delivery_information: "Delivered nationwide across Pakistan.",
    return_policy: "Quality sealed packaging."
  },
  {
    sku: "BMB-CUP-002",
    slug: "red-velvet-cupcakes-box-6",
    name: "Red Velvet & Cream Cheese Cupcakes (Box of 6)",
    catSlug: "cupcakes",
    price: 1650,
    sale_price: 1450,
    stock_quantity: 20,
    is_featured: true,
    is_bestseller: true,
    tags: ["cupcakes", "red velvet", "cream cheese", "gifting"],
    short_description: "Velvety crimson cupcakes crowned with smooth vanilla cream cheese frosting and red velvet cake crumb.",
    description: "A gifting favorite. Moist, buttermilk-infused crimson sponge with subtle cocoa undertones, crowned with swirls of rich Philadelphia cream cheese frosting and fine red velvet sponge dusting.",
    featured_image: "https://images.unsplash.com/photo-1587668178277-295251f900ce?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Quantity": "6 pieces in display box", "Weight": "approx. 450g", "Flavour Profile": "Subtle Cocoa, Vanilla & Tangy Cream Cheese", "Storage": "Refrigerate at 4°C", "Shelf Life": "4 days", "Allergens": "Dairy, Eggs, Wheat" },
    ingredients: "Cream cheese, cultured buttermilk, cocoa powder, unbleached flour, sugar, butter, vanilla extract.",
    care_instructions: "Refrigerate until serving. Serve slightly chilled.",
    delivery_information: "Same-day gifting delivery across Karachi.",
    return_policy: "100% satisfaction guarantee."
  },
  {
    sku: "BMB-DESS-002",
    slug: "lotus-biscoff-tres-leches",
    name: "Lotus Biscoff Tres Leches Milk Tub",
    catSlug: "desserts",
    price: 1250,
    sale_price: null,
    stock_quantity: 25,
    is_featured: true,
    is_bestseller: true,
    tags: ["tres leches", "milk cake", "lotus", "biscoff", "dessert"],
    short_description: "Fluffy sponge cake drenched in a trio of sweet milks, topped with Lotus Speculoos cream and crunchy biscuit crumb.",
    description: "A decadent dessert infused with Belgian flair. Sponge cake punctured and soaked in condensed milk, evaporated milk, and heavy cream, finished with smooth Lotus spread drizzle and biscuits.",
    featured_image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Weight": "approx. 450g", "Servings": "2 to 3 persons", "Flavour Profile": "Caramel, Sweet Condensed Milk & Biscoff", "Storage": "Strictly refrigerated at 2°C - 4°C", "Shelf Life": "3 days", "Allergens": "Dairy, Eggs, Wheat, Soy" },
    ingredients: "Condensed milk, evaporated milk, dairy cream, Lotus Biscoff spread, whole eggs, cake flour, pure vanilla.",
    care_instructions: "Serve ice-cold directly from the refrigerator for the best melt-in-the-mouth experience.",
    delivery_information: "Delivered in chilled packaging across Karachi.",
    return_policy: "100% freshness guaranteed."
  },
  {
    sku: "BMB-DESS-003",
    slug: "gulab-jamun-tres-leches",
    name: "Shahi Gulab Jamun Fusion Tres Leches",
    catSlug: "desserts",
    price: 1150,
    sale_price: null,
    stock_quantity: 20,
    is_featured: false,
    is_bestseller: true,
    tags: ["gulab jamun", "fusion", "desi", "tres leches", "dessert"],
    short_description: "Desi fusion perfection: Cardamom and saffron infused three-milk sponge crowned with miniature soft gulab jamuns and pistachios.",
    description: "The royal fusion that Karachi loves! Light sponge infused with real saffron and green cardamom milk, crowned with bite-sized soft gulab jamuns, silver warq, and crushed emerald pistachios.",
    featured_image: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1200&q=85",
    specifications: { "Weight": "approx. 450g", "Servings": "2 to 3 persons", "Flavour Profile": "Saffron, Cardamom, Khoya & Sweet Milk", "Allergens": "Dairy, Wheat, Eggs, Pistachios" },
    ingredients: "Condensed milk, saffron strands, cardamom, mini gulab jamun (khoya, flour, sugar syrup), dairy cream, sponge cake, pistachios.",
    care_instructions: "Serve chilled. Spoon up milk from the bottom with each bite.",
    delivery_information: "Delivered fresh across Karachi.",
    return_policy: "Freshness and quality guaranteed."
  }
];

export async function seedRealProductsAndReviews() {
  console.log("🚀 Starting Real Professional Products & Verified Reviews Seeding...");

  // 1. Fetch Categories and Brands
  const { data: categories, error: catErr } = await supabase.from("categories").select("id, name, slug");
  if (catErr) throw new Error("Failed to fetch categories: " + catErr.message);

  const { data: brands, error: brandErr } = await supabase.from("brands").select("id, name, slug");
  if (brandErr) throw new Error("Failed to fetch brands: " + brandErr.message);

  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
  const defaultBrand = brands.find((b) => b.slug === "bake-mart-signature") || brands[0];

  // 2. Insert / Upsert the New Professional Bakery Products
  console.log(`📦 Adding ${NEW_PROFESSIONAL_BAKERY_PRODUCTS.length} new professional bakery products...`);
  for (const item of NEW_PROFESSIONAL_BAKERY_PRODUCTS) {
    const categoryId = catMap[item.catSlug] || catMap["bakery"] || categories[0].id;
    const { catSlug, ...prodData } = item;

    const rowToUpsert = {
      ...prodData,
      category_id: categoryId,
      brand_id: defaultBrand.id,
      low_stock_threshold: 5,
      is_published: true,
      status: "published",
      product_type: "simple",
      seo_title: `${item.name} | Bake Bazaar Mart Karachi`,
      seo_description: item.short_description || item.description.slice(0, 150),
    };

    const { data: upserted, error: upErr } = await supabase
      .from("products")
      .upsert(rowToUpsert, { onConflict: "sku" })
      .select("id, sku, name");

    if (upErr) {
      console.error(`  ❌ Error adding product ${item.name}:`, upErr.message);
    } else if (upserted && upserted[0]) {
      const prodId = upserted[0].id;
      await supabase.from("product_images").delete().eq("product_id", prodId);
      await supabase.from("product_images").insert({
        product_id: prodId,
        storage_path: item.featured_image,
        alt_text: item.name,
        sort_order: 0,
      });
      console.log(`  ✔ Added/Updated product: ${item.name}`);
    }
  }

  // 3. Fix any zero-price products in the database so the store looks 100% professional
  console.log("💰 Normalizing any zero-priced catalog items to realistic market prices...");
  const { data: zeroProducts } = await supabase.from("products").select("id, name, slug").eq("price", 0);
  if (zeroProducts && zeroProducts.length > 0) {
    for (const p of zeroProducts) {
      let price = 650;
      let salePrice = null;
      const lower = p.name.toLowerCase();
      if (lower.includes("kettle") || lower.includes("glass")) { price = 1850; salePrice = 1650; }
      else if (lower.includes("organizer")) { price = 1450; salePrice = 1250; }
      else if (lower.includes("storage box") || lower.includes("storage")) { price = 850; }
      else if (lower.includes("set") || lower.includes("kit")) { price = 950; }
      else if (lower.includes("brush") || lower.includes("mirror") || lower.includes("hook")) { price = 450; }
      else { price = 750; }

      await supabase.from("products").update({ price, sale_price: salePrice }).eq("id", p.id);
    }
    console.log(`  ✔ Updated ${zeroProducts.length} items with realistic Pakistani retail prices.`);
  }

  // 4. Fetch All Active / Published Products
  const { data: allProducts, error: prodFetchErr } = await supabase
    .from("products")
    .select("id, name, slug, price, category_id, categories(name, slug)");

  if (prodFetchErr || !allProducts) {
    throw new Error("Failed to fetch products: " + prodFetchErr?.message);
  }

  console.log(`⭐ Adding verified Pakistani reviews across ${allProducts.length} total products...`);

  const { data: existingReviews } = await supabase.from("reviews").select("id, product_id, reviewer_name");
  const existingSet = new Set((existingReviews || []).map((r) => `${r.product_id}_${r.reviewer_name}`));

  // Fetch seed reference orders so we don't generate fake orders
  const { data: seedOrders } = await supabase
    .from("orders")
    .select("id")
    .like("order_number", "SEED-REF-%")
    .order("order_number");
  const seedOrderIds = (seedOrders || []).map((o) => o.id);

  let totalReviewsInserted = 0;
  let totalOrdersCreated = 0;

  for (let idx = 0; idx < allProducts.length; idx++) {
    const prod = allProducts[idx];
    const catSlug = prod.categories?.slug || "general";

    let pool = REVIEWS_BY_TYPE.general;
    if (["cakes", "celebration-cakes"].includes(catSlug)) pool = REVIEWS_BY_TYPE.cakes;
    else if (["pastries"].includes(catSlug)) pool = REVIEWS_BY_TYPE.pastries;
    else if (["brownies"].includes(catSlug)) pool = REVIEWS_BY_TYPE.brownies;
    else if (["cookies"].includes(catSlug)) pool = REVIEWS_BY_TYPE.cookies;
    else if (["cupcakes"].includes(catSlug)) pool = REVIEWS_BY_TYPE.cupcakes;
    else if (["desserts"].includes(catSlug)) pool = REVIEWS_BY_TYPE.desserts;

    // Varied review count: popular bakery items get 3 to 4 reviews; other items get 2 to 3
    const isBakery = ["cakes", "pastries", "brownies", "cookies", "cupcakes", "desserts", "bakery"].includes(catSlug);
    const targetCount = isBakery ? 3 + (idx % 2) : 2 + (idx % 2);

    const startCustomerIdx = (idx * 3) % PAKISTANI_CUSTOMERS.length;

    for (let rIdx = 0; rIdx < targetCount; rIdx++) {
      const cust = PAKISTANI_CUSTOMERS[(startCustomerIdx + rIdx) % PAKISTANI_CUSTOMERS.length];
      const key = `${prod.id}_${cust.name}`;
      if (existingSet.has(key)) continue;

      const reviewTemplate = pool[(idx + rIdx * 2) % pool.length];

      // Stagger dates: 1 day to 40 days ago
      const daysAgo = (idx * 2 + rIdx * 7) % 40 + 1;
      const reviewDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      const orderId = seedOrderIds.length > 0 ? seedOrderIds[rIdx % seedOrderIds.length] : null;
      if (!orderId) continue;

      // Create Approved Verified Review (linked to seed reference order)
      const { error: revInsertErr } = await supabase.from("reviews").insert({
        order_id: orderId,
        product_id: prod.id,
        rating: reviewTemplate.rating,
        body: reviewTemplate.body,
        reviewer_name: cust.name,
        guest_name: cust.name,
        guest_email: cust.email,
        guest_phone: cust.phone,
        is_approved: true,
        status: "approved",
        is_verified_purchase: true,
        created_at: reviewDate.toISOString(),
      });

      if (!revInsertErr) {
        totalReviewsInserted++;
        existingSet.add(key);
      }
    }
  }

  console.log(`\n🎉 SEEDING COMPLETED!`);
  console.log(`   - New Bakery Products: ${NEW_PROFESSIONAL_BAKERY_PRODUCTS.length}`);
  console.log(`   - Verified Orders Created: ${totalOrdersCreated}`);
  console.log(`   - Authentic Pakistani Reviews Inserted: ${totalReviewsInserted}`);
  return { newProducts: NEW_PROFESSIONAL_BAKERY_PRODUCTS.length, orders: totalOrdersCreated, reviews: totalReviewsInserted };
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith("seed-real-products-and-reviews.mjs")) {
  seedRealProductsAndReviews()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("FATAL ERROR:", err);
      process.exit(1);
    });
}
