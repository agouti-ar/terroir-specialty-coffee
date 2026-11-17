const DEFAULT_PRODUCTS = [
    {
        id: 'prod-special-andy',
        title: "Andy's Special Roast #25",
        titleKey: 'shop_item_andy_title',
        price: 18.90,
        notes: 'Blood orange · milk chocolate · caramel',
        notesKey: 'notes_andy',
        storyKey: 'story_andy',
        badge: 'SPECIAL',
        badgeKey: 'badge_special',
        image: 'assets/coffee/andy.jpg',
        isSpecial: true,
        category: 'special'
    },
    {
        id: 'prod-1',
        title: 'Ethiopia Yirgacheffe',
        titleKey: 'shop_item1_title',
        price: 14.50,
        notes: 'Jasmine · bergamot · black tea',
        notesKey: 'notes_ethiopia',
        storyKey: 'story_ethiopia',
        badge: 'Best Seller',
        badgeKey: 'badge_bestseller',
        image: 'assets/coffee/ethiopia.jpg',
        category: 'bestseller'
    },
    {
        id: 'prod-2',
        title: 'Colombia El Paraiso',
        titleKey: 'shop_item2_title',
        price: 16.80,
        notes: 'Strawberry · white chocolate · yogurt',
        notesKey: 'notes_colombia',
        storyKey: 'story_colombia',
        badge: 'New',
        badgeKey: 'badge_new',
        image: 'assets/coffee/colombia.jpg',
        category: 'new'
    },
    {
        id: 'prod-3',
        title: 'Guatemala Huehuetenango',
        titleKey: 'shop_item3_title',
        price: 15.20,
        notes: 'Red apple · milk chocolate · hazelnut',
        notesKey: 'notes_guatemala',
        storyKey: 'story_guatemala',
        badge: 'Single Origin',
        badgeKey: 'badge_single_origin',
        image: 'assets/coffee/guatemala.jpg',
        category: 'single_origin'
    },
    {
        id: 'prod-4',
        title: 'Brazil Cerrado Mineiro',
        titleKey: 'shop_item4_title',
        price: 13.90,
        notes: 'Dark chocolate · toasted almond · caramel',
        notesKey: 'notes_brazil',
        storyKey: 'story_brazil',
        badge: 'Signature',
        badgeKey: 'badge_signature',
        image: 'assets/coffee/brazil.jpg',
        category: 'bestseller'
    },
    {
        id: 'prod-6',
        title: 'Costa Rica Tarrazu',
        titleKey: 'shop_item6_title',
        price: 15.80,
        notes: 'Honey · orange blossom · milk chocolate',
        notesKey: 'notes_costa_rica',
        storyKey: 'story_costa_rica',
        badge: 'Single Origin',
        badgeKey: 'badge_single_origin',
        image: 'assets/coffee/costa-rica.jpg',
        category: 'single_origin'
    }
];

if (typeof module !== "undefined") module.exports = DEFAULT_PRODUCTS;
