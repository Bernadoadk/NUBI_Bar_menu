const uiStrings = {
    en: {
        hero_subtitle: "Discover Our Selection",
        hero_categories: "Wines • Spirits • Cocktails • Food",
        footer_tagline: "Elegance in every pour.",
        footer_disclaimer: "© 2026 NUBI Bar • All prices in FCFA • Please drink responsibly",
        whatsapp_text: "RESERVE TABLE",
        btl: "BTL",
        gls: "GLS",
        shot: "SHOT",
        name: "NAME"
    },
    fr: {
        hero_subtitle: "Découvrez Notre Sélection",
        hero_categories: "Vins • Spiritueux • Cocktails • Cuisine",
        footer_tagline: "L'élégance dans chaque verre.",
        footer_disclaimer: "© 2026 NUBI Bar • Prix en FCFA • À consommer avec modération",
        whatsapp_text: "RÉSERVER",
        btl: "BTE",
        gls: "VER",
        shot: "SHOT",
        name: "NOM"
    }
};

const menuData = [
    {
        id: "drinks-of-the-week",
        title: { en: "Drinks of the Week", fr: "Boissons de la Semaine" },
        type: "featured",
        subsections: [
            {
                name: { en: "Mocktails", fr: "Mocktails" },
                defaultPrice: "6,500 FCFA",
                items: [
                    { 
                        name: "Fresh Up", 
                        description: { 
                            en: "Jasmine syrup, apple juice, lime, green apple puree, sparkling water", 
                            fr: "Sirop de jasmin, jus de pomme, citron vert, purée de pomme verte, eau pétillante" 
                        } 
                    },
                    { 
                        name: "Nubi Vibes", 
                        description: { 
                            en: "Dragon fruit, passion fruit puree, lychee juice, lemonade", 
                            fr: "Fruit du dragon, purée de fruit de la passion, jus de litchi, limonade" 
                        } 
                    },
                    { 
                        name: "Virgin Mojito", 
                        description: { 
                            en: "Available flavors: Red fruits, Apple, Mandarin. Lime, fresh mint, cane sugar, sparkling water", 
                            fr: "Saveurs : Fruits rouges, Pomme, Mandarine. Citron vert, menthe, sucre de canne, eau pétillante" 
                        } 
                    }
                ]
            },
            {
                name: { en: "Cocktails", fr: "Cocktails" },
                items: [
                    { 
                        name: "Caipirinha", 
                        price: "7,000 FCFA", 
                        description: { en: "Cachaça, lime, cane sugar", fr: "Cachaça, citron vert, sucre de canne" } 
                    },
                    { 
                        name: "Margarita", 
                        price: "7,000 FCFA", 
                        description: { en: "Tequila, triple sec, lime", fr: "Tequila, triple sec, citron vert" } 
                    },
                    { 
                        name: "Pornstar Martini", 
                        price: "9,000 FCFA", 
                        description: { en: "Vodka, passion fruit juice, vanilla syrup, lime", fr: "Vodka, jus de passion, sirop de vanille, citron vert" } 
                    },
                    { 
                        name: "Red Mojito", 
                        price: "9,000 FCFA", 
                        description: { en: "White rum, red fruit puree, lime, mint, cane sugar, sparkling water", fr: "Rhum blanc, purée de fruits rouges, menthe, sucre de canne, eau pétillante" } 
                    },
                    { 
                        name: "Tentations", 
                        price: "9,000 FCFA", 
                        description: { en: "Spiced rum, pineapple juice, tangerine puree, grenadine syrup", fr: "Rhum épicé, jus d'ananas, purée de mandarine, sirop de grenadine" } 
                    }
                ]
            }
        ]
    },
    {
        id: "wine-menu",
        title: { en: "Wine Menu", fr: "Carte des Vins" },
        type: "list",
        subsections: [
            {
                name: { en: "Red Wines (75cl)", fr: "Vins Rouges (75cl)" },
                items: [
                    { name: "JP. Chanet 'Odyssey'", price: "12,000 FCFA" },
                    { name: "Bordeaux Chevalier de Landerac", price: "15,000 FCFA" },
                    { name: "Belles Vignes", price: "15,000 FCFA", note: { en: "Glass 3,000 FCFA", fr: "Verre 3,000 FCFA" } },
                    { name: "Domaine de la Baume", price: "20,000 FCFA" },
                    { name: "Mouton Cadet (Bordeaux)", price: "25,000 FCFA" },
                    { name: "Château du Grand Puch", price: "25,000 FCFA" },
                    { name: "Château Haut-Belfort (Médoc)", price: "25,000 FCFA" }
                ]
            },
            {
                name: { en: "White Wines", fr: "Vins Blancs" },
                items: [
                    { name: "Belles Vignes Blanc Sec", price: "15,000 FCFA", note: { en: "Glass 3,000 FCFA", fr: "Verre 3,000 FCFA" } },
                    { name: "Belles Vignes Blanc Moelleux", price: "15,000 FCFA", note: { en: "Glass 3,000 FCFA", fr: "Verre 3,000 FCFA" } },
                    { name: "Rooftop by Haussmann Blanc", price: "25,000 FCFA" }
                ]
            },
            {
                name: { en: "Rosé Wines", fr: "Vins Rosés" },
                items: [
                    { name: "Di Vin Mix Rosé Pêche", price: "12,000 FCFA" },
                    { name: "Listel Grain de Gris", price: "20,000 FCFA", note: { en: "Glass 4,000 FCFA", fr: "Verre 4,000 FCFA" } },
                    { name: "Haussmann Côtes de Provence", price: "20,000 FCFA" }
                ]
            }
        ]
    },
    {
        id: "champagnes",
        title: { en: "Champagnes", fr: "Champagnes" },
        subtitle: { en: "Bottle 75cl", fr: "Bouteille 75cl" },
        type: "list",
        items: [
            { name: "Champagne Pierre Grandet", price: "55,000 FCFA" },
            { name: "Champagne Trouillard Elexium", price: "55,000 FCFA" },
            { name: "Moët & Chandon Brut Impérial", price: "70,000 FCFA" },
            { name: "Laurent-Perrier Brut", price: "75,000 FCFA" },
            { name: "Veuve Clicquot Brut Yellow Label", price: "80,000 FCFA" },
            { name: "Ruinart Brut", price: "120,000 FCFA" },
            { name: "Ruinart Rosé", price: "150,000 FCFA" },
            { name: "Dom Pérignon Vintage", price: "300,000 FCFA" }
        ]
    },
    {
        id: "spirits",
        title: { en: "Spirits", fr: "Spiritueux" },
        subtitle: { en: "Bottle / Glass (4cl) / Shot (2cl)", fr: "Bouteille / Verre (4cl) / Shot (2cl)" },
        type: "spirits",
        categories: [
            { name: { en: "Gin", fr: "Gin" }, items: [
                { name: "Bardone Gin", prices: ["25,000", "2,500", "1,500"] },
                { name: "Bombay Sapphire", prices: ["50,000", "5,000", "3,500"] }
            ]},
            { name: { en: "Vodka", fr: "Vodka" }, items: [
                { name: "Absolut Vodka", prices: ["45,000", "4,500", "3,000"] },
                { name: "Grey Goose", prices: ["70,000", "7,000", "4,500"] }
            ]},
            { name: { en: "Whisky / Scotch", fr: "Whisky / Scotch" }, items: [
                { name: "Johnnie Walker Red Label", prices: ["25,000", "2,500", "1,500"] },
                { name: "Johnnie Walker Black Label", prices: ["50,000", "5,000", "3,000"] },
                { name: "Johnnie Walker Double Black", prices: ["70,000", "7,000", "4,500"] },
                { name: "Glenfiddich 12", prices: ["80,000", "8,000", "5,000"] },
                { name: "Talisker Distillers Edition", prices: ["95,000", "9,000", "6,000"] },
                { name: "Glenfiddich 15", prices: ["105,000", "10,000", "6,000"] },
                { name: "Lagavulin 16", prices: ["130,000", "13,000", "8,000"] },
                { name: "Johnnie Walker Blue Label", prices: ["140,000", "14,000", "9,000"] }
            ]},
            { name: { en: "Rum", fr: "Rhum" }, items: [
                { name: "Admiral Jack", prices: ["15,000", "1,500", "1,000"] },
                { name: "Bacardi Carta Blanca", prices: ["30,000", "3,000", "2,000"] },
                { name: "Captain Morgan Spiced", prices: ["40,000", "4,000", "2,500"] },
                { name: "Diplomatico Reserva Exclusiva", prices: ["90,000", "9,000", "5,000"] },
                { name: "Don Papa", prices: ["110,000", "11,000", "8,000"] }
            ]}
        ]
    },
    {
        id: "food",
        title: { en: "Food Selection", fr: "Sélection Cuisine" },
        type: "list",
        subsections: [
            {
                name: { en: "Pizzas", fr: "Pizzas" },
                items: [
                    { name: "Pizza Margherita", price: "6,500 FCFA" },
                    { name: "Pizza Reine", price: "7,500 FCFA" },
                    { name: "Pizza Tonno", price: "7,500 FCFA" },
                    { name: "Pizza Chicken", price: "8,000 FCFA" },
                    { name: "Pizza 4 Fromages", price: "7,000 FCFA" },
                    { name: "Pizza Pepperoni", price: "8,000 FCFA" },
                    { name: "Pizza Texane", price: "8,000 FCFA" },
                    { name: "Pizza Carnivore", price: "9,000 FCFA" }
                ]
            }
        ]
    },
    {
        id: "desserts",
        title: { en: "Desserts & Sweets", fr: "Desserts & Sucreries" },
        type: "list",
        subsections: [
            {
                name: { en: "Sweets", fr: "Sucrés" },
                items: [
                    { name: "Crêpes (Sucre / Chocolat)", price: "1,500 FCFA" },
                    { 
                        name: "Milkshake Sweet", 
                        price: "6,000 FCFA", 
                        description: { 
                            en: "Vanilla ice cream, milk, vanilla syrup, whipped cream", 
                            fr: "Glace vanille, lait, sirop de vanille, chantilly" 
                        } 
                    },
                    { 
                        name: "Milkshake Dark", 
                        price: "7,000 FCFA", 
                        description: { 
                            en: "Chocolate ice cream, milk, cookies syrup, whisky, whipped cream", 
                            fr: "Glace chocolat, lait, sirop de cookies, whisky, chantilly" 
                        } 
                    }
                ]
            },
            {
                name: { en: "Extras", fr: "Suppléments" },
                items: [
                    { name: { en: "Extra whipped cream", fr: "Supplément chantilly" }, price: "1,000 FCFA" },
                    { name: { en: "Extra ice cream", fr: "Supplément glace" }, price: "1,000 FCFA" },
                    { name: { en: "Extra coulis", fr: "Supplément coulis" }, price: "500 FCFA" }
                ]
            }
        ]
    }
];
