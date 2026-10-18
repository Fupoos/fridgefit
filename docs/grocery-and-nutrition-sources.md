# FridgeFit data sources: QLD grocery catalogue and USDA nutrition

Checked on **2026-10-18**. Files: `qld_grocery.json` (catalogue), `foods_fdc.json` (nutrition per 100 g), and this note.

## 1. Grocery catalogue (`qld_grocery.json`)

There are 60 products covering 53 of the 62 food ids: ALDI 32, Woolworths 25, Coles 3. 60 of 60 have a live price.

> Prices are ONLINE prices read from the public Woolworths, Coles and ALDI Australia websites on 2026-10-18, read-only, without logging in and without setting a postcode or store, so they are each site's default prices, not those of a specific Brisbane store. In-store and other-store prices may differ, and specials change weekly. All three chains trade in Queensland. Products come from each chain's regular range (house brands and major brands); ALDI Special Buys, 'While Stocks Last' items and Woolworths marketplace sellers were excluded. packGrams is the labelled net weight unless the item's notes say otherwise (approximate edible weights for 'each' items, variable-weight packs, net weight of canned goods including liquid, and 1 mL = 1 g for liquids).

| # | foodId | Store | Product | Pack | packGrams | Price | Unit price (as shown) | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | chicken_breast | Woolworths | [Woolworths RSPCA Approved Chicken Breast Fillets 650g](https://www.woolworths.com.au/shop/productdetails/6078623/woolworths-rspca-approved-chicken-breast-fillets) | 650g | 650 | $9.40 | $14.46 / 1KG |  |
| 2 | chicken_breast | ALDI | [Broad Oak Farms RSPCA Approved Chicken Breast Fillets per kg](https://www.aldi.com.au/product/broad-oak-farms-rspca-approved-chicken-breast-fillets-per-kg-000000000000401713) | approx. 0.6 kg per package | 600 | $7.19 | $11.99 per 1 kg | variable weight |
| 3 | chicken_breast | Coles | [The Bare Bird Chicken Breast Fillet](https://www.coles.com.au/product/the-bare-bird-chicken-breast-fillet-600g-7362270) | 600g | 600 | $13.50 | $22.50/ 1kg |  |
| 4 | chicken_thigh | Woolworths | [Woolworths RSPCA Approved Chicken Thigh Fillets 550g](https://www.woolworths.com.au/shop/productdetails/6078692/woolworths-rspca-approved-chicken-thigh-fillets) | 550g | 550 | $9.90 | $18.00 / 1KG |  |
| 5 | chicken_thigh | Coles | [Coles RSPCA Chicken Thigh Fillets Small Pack](https://www.coles.com.au/product/coles-rspca-chicken-thigh-fillets-small-pack-approx.-700g-2263317) | approx. 700g | 700 | $12.60 | $18.00/ 1kg | variable weight |
| 6 | beef_mince | ALDI | [Jindurra Station Extra Lean Beef Mince 500g](https://www.aldi.com.au/product/jindurra-station-extra-lean-beef-mince-500g-000000000000398905) | 500 g | 500 | $8.99 | $17.98 per 1 kg |  |
| 7 | beef_mince | Coles | [Coles No Added Hormone Beef Lean Mince](https://www.coles.com.au/product/coles-no-added-hormone-beef-lean-mince-800g-3449795) | 800g | 800 | $15.50 | $19.38/ 1kg |  |
| 8 | pork_loin | Woolworths | [Woolworths Loin Steaks Pork 500g](https://www.woolworths.com.au/shop/productdetails/829116/woolworths-loin-steaks-pork) | 500g | 500 | $10.00 | $20.00 / 1KG |  |
| 9 | salmon | ALDI | [The Fishmonger Fresh Tasmanian Salmon Fillets Skin On 4 Pack 460g](https://www.aldi.com.au/product/the-fishmonger-fresh-tasmanian-salmon-fillets-skin-on-4-pack-460g-000000000000405629) | 460 g | 460 | $15.99 | $34.76 per 1 kg |  |
| 10 | prawns | ALDI | [Ocean Royale Raw Peeled Tail Off Prawns 500g](https://www.aldi.com.au/product/ocean-royale-raw-peeled-tail-off-prawns-500g-000000000000473967) | 500 g | 500 | $13.49 | $26.98 per 1 kg |  |
| 11 | tuna_can | ALDI | [Portview Tuna Chunks in Springwater 425g](https://www.aldi.com.au/product/portview-tuna-chunks-in-springwater-425g-000000000200924003) | 425 g | 425 | $3.29 | $7.74 per 1 kg | net wt incl. liquid |
| 12 | tuna_can | Woolworths | [Woolworths Tuna In Springwater 95g](https://www.woolworths.com.au/shop/productdetails/476700/woolworths-tuna-in-springwater) | 95g | 95 | $1.00 | $10.53 / 1KG | net wt incl. liquid |
| 13 | eggs | Woolworths | [Woolworths 12 Pack Extra Large Cage Free Eggs 700g](https://www.woolworths.com.au/shop/productdetails/165367/woolworths-12-pack-extra-large-cage-free-eggs) | 700g | 604 | $5.70 | $0.81 / 100G | approx. edible g |
| 14 | tofu | ALDI | [Earth Grown Firm Tofu 450g](https://www.aldi.com.au/product/earth-grown-firm-tofu-450g-000000000000398430) | 450 g | 450 | $2.59 | $0.58 per 100 g |  |
| 15 | tempeh | Woolworths | [Macro Plain Tempeh 300g](https://www.woolworths.com.au/shop/productdetails/88186/macro-plain-tempeh) | 300g | 300 | $4.50 | $15.00 / 1KG |  |
| 16 | lentils_can | Woolworths | [Woolworths Lentils 420g](https://www.woolworths.com.au/shop/productdetails/907051/woolworths-lentils) | 420g | 420 | $0.95 | $2.26 / 1KG | net wt incl. liquid |
| 17 | chickpeas_can | ALDI | [New Season Chick Peas 420g](https://www.aldi.com.au/product/new-season-chick-peas-420g-000000000000457349) | 420 g | 420 | $0.89 | $2.12 per 1 kg | net wt incl. liquid |
| 18 | black_beans_can | Woolworths | [Woolworths Black Beans 420g](https://www.woolworths.com.au/shop/productdetails/907377/woolworths-black-beans) | 420g | 420 | $0.90 | $2.14 / 1KG | net wt incl. liquid |
| 19 | edamame | Woolworths | [Umami Frozen Edamame Whole Baby Soy Beans 1kg](https://www.woolworths.com.au/shop/productdetails/386006/umami-frozen-edamame-whole-baby-soy-beans) | 1kg | 1000 | $7.50 | $7.50 / 1KG |  |
| 20 | ham | ALDI | [Berg Leg Shaved Ham 250g](https://www.aldi.com.au/product/berg-leg-shaved-ham-250g-000000000000399264) | 250 g | 250 | $3.49 | $13.96 per 1 kg |  |
| 21 | sausages | Woolworths | [Woolworths 10 Pack Beef Sausages 550g](https://www.woolworths.com.au/shop/productdetails/901649/woolworths-10-pack-beef-sausages) | 550g | 550 | $6.50 | $11.82 / 1KG |  |
| 22 | whey | Woolworths | [Musashi 100% Whey Protein Vanilla Milkshake Flavour 900g](https://www.woolworths.com.au/shop/productdetails/304171/musashi-100-whey-protein-vanilla-milkshake-flavour) | 900g | 900 | $59.50 | $6.61 / 100G | special |
| 23 | greek_yogurt | Woolworths | [Chobani Greek Yoghurt Natural Light Plain 907g](https://www.woolworths.com.au/shop/productdetails/717518/chobani-greek-yoghurt-natural-light-plain) | 907g | 907 | $8.80 | $0.97 / 100G |  |
| 24 | greek_yogurt | Woolworths | [Woolworths Natural Greek Style Yoghurt 1kg](https://www.woolworths.com.au/shop/productdetails/571487/woolworths-natural-greek-style-yoghurt) | 1kg | 1000 | $4.20 | $0.42 / 100G |  |
| 25 | cottage_cheese | Woolworths | [Brancourts Low Fat Cottage Cheese 200g](https://www.woolworths.com.au/shop/productdetails/902834/brancourts-low-fat-cottage-cheese) | 200g | 200 | $4.20 | $21.00 / 1KG |  |
| 26 | milk | ALDI | [Farmdale Full Cream Milk 2L](https://www.aldi.com.au/product/farmdale-full-cream-milk-2l-000000000000398689) | 2 l | 2000 | $3.39 | $1.70 per 1 L | 1 mL = 1 g |
| 27 | milk_skim | Woolworths | [Woolworths Skim Milk 1L](https://www.woolworths.com.au/shop/productdetails/51379/woolworths-skim-milk) | 1L | 1000 | $1.75 | $1.75 / 1L | 1 mL = 1 g |
| 28 | cheddar | ALDI | [Westacre Dairy Tasty Cheese Block 500g](https://www.aldi.com.au/product/westacre-dairy-tasty-cheese-block-500g-000000000000403409) | 500 g | 500 | $5.99 | $11.98 per 1 kg |  |
| 29 | soy_milk | Woolworths | [PureHarvest Organic Soy Unsweetened Long Life Milk 1L](https://www.woolworths.com.au/shop/productdetails/192366/pureharvest-organic-soy-unsweetened-long-life-milk) | 1L | 1000 | $2.20 | $2.20 / 1L | 1 mL = 1 g |
| 30 | sweet_potato | Woolworths | [Woolworths Gold Sweet Potatoes Bag 1kg](https://www.woolworths.com.au/shop/productdetails/156015/woolworths-gold-sweet-potatoes-bag) | 1kg | 1000 | $4.90 | $4.90 / 1KG | as purchased |
| 31 | potato | ALDI | [White Potatoes 4kg](https://www.aldi.com.au/product/no-brand-white-potatoes-4kg-000000000000380363) | 4 kg | 4000 | $8.49 | $2.12 per 1 kg | as purchased |
| 32 | rice | ALDI | [Imperial Grain Long Grain Rice 2kg](https://www.aldi.com.au/product/imperial-grain-long-grain-rice-2kg-000000000000262809) | 2 kg | 2000 | $3.59 | $0.18 per 100 g |  |
| 33 | rice | Woolworths | [Woolworths Essentials Long Grain Rice 5kg](https://www.woolworths.com.au/shop/productdetails/72779/woolworths-essentials-long-grain-rice-long-grain) | 5kg | 5000 | $8.50 | $0.17 / 100G |  |
| 34 | pasta | ALDI | [Cucina Pasta Spaghetti 500g](https://www.aldi.com.au/product/cucina-pasta-spaghetti-500g-000000000000656172) | 500 g | 500 | $0.89 | $0.18 per 100 g |  |
| 35 | oats | ALDI | [Hillcrest Rolled Oats 750g](https://www.aldi.com.au/product/hillcrest-rolled-oats-750g-000000000000619060) | 750 g | 750 | $1.49 | $0.20 per 100 g |  |
| 36 | bread_wholemeal | ALDI | [Billie's Bakehouse Wholemeal Loaf 800g](https://www.aldi.com.au/product/billie-s-bakehouse-wholemeal-loaf-800g-000000000000617909) | 800 g | 800 | $2.99 | $0.37 per 100 g |  |
| 37 | wraps | ALDI | [Bakers Life Large White Wraps 8 Pack 560g](https://www.aldi.com.au/product/bakers-life-large-white-wraps-8-pack-560g-000000000000473384) | 560 g | 560 | $3.49 | $0.62 per 100 g |  |
| 38 | broccoli | ALDI | [Broccoli per kg](https://www.aldi.com.au/product/no-brand-broccoli-per-kg-000000000000380208) | 1 kg (sold loose by weight) | 1000 | $5.99 | $5.99 /1 kg | variable weight, as purchased |
| 39 | spinach | ALDI | [Baby Spinach 280g](https://www.aldi.com.au/product/no-brand-baby-spinach-280g-000000000000380188) | 280 g | 280 | $3.99 | $14.25 per 1 kg |  |
| 40 | carrot | ALDI | [Carrots 1kg](https://www.aldi.com.au/product/no-brand-carrots-1kg-000000000000380228) | 1 kg | 1000 | $1.49 | $1.49 per 1 kg | as purchased |
| 41 | capsicum | Woolworths | [Red Capsicum each](https://www.woolworths.com.au/shop/productdetails/135306/red-capsicum) | each | 119 | $1.98 | $1.98 / 1EA | approx. edible g |
| 42 | tomato | ALDI | [Tomatoes 800g](https://www.aldi.com.au/product/no-brand-tomatoes-800g-000000000000380347) | 800 g | 800 | $5.49 | $6.86 per 1 kg | as purchased |
| 43 | onion | Woolworths | [Woolworths Onion Brown Bag 1kg](https://www.woolworths.com.au/shop/productdetails/144336/woolworths-onion-brown-bag) | 1kg | 1000 | $2.50 | $2.50 / 1KG | as purchased |
| 44 | mushrooms | ALDI | [White Cup Mushrooms 500g](https://www.aldi.com.au/product/no-brand-white-cup-mushrooms-500g-000000000000380369) | 500 g | 500 | $6.29 | $12.58 per 1 kg |  |
| 45 | cucumber | ALDI | [Lebanese Cucumbers 600g](https://www.aldi.com.au/product/no-brand-lebanese-cucumbers-600g-000000000000380125) | 600 g | 600 | $4.99 | $8.32 per 1 kg |  |
| 46 | frozen_veg | Woolworths | [Woolworths Essentials Frozen Mixed Vegetables 1kg](https://www.woolworths.com.au/shop/productdetails/93915/woolworths-essentials-frozen-mixed-vegetables) | 1kg | 1000 | $2.80 | $2.80 / 1KG |  |
| 47 | peas_frozen | Woolworths | [Woolworths Essentials Frozen Peas 1kg](https://www.woolworths.com.au/shop/productdetails/96845/woolworths-essentials-frozen-peas) | 1kg | 1000 | $2.50 | $2.50 / 1KG |  |
| 48 | berries_frozen | ALDI | [Orchard & Vine Mixed Berries 500g](https://www.aldi.com.au/product/orchard-vine-mixed-berries-500g-000000000000635644) | 500 g | 500 | $5.99 | $11.98 per 1 kg |  |
| 49 | banana | Woolworths | [Cavendish Bananas each](https://www.woolworths.com.au/shop/productdetails/133211/cavendish-bananas) | each | 115 | $0.81 | $0.81 / 1EA | approx. edible g |
| 50 | apple | ALDI | [Red Apples 1kg](https://www.aldi.com.au/product/no-brand-red-apples-1kg-000000000000380292) | 1 kg | 1000 | $3.69 | $3.69 per 1 kg | as purchased |
| 51 | orange | ALDI | [Navel Oranges 1.5kg](https://www.aldi.com.au/product/no-brand-navel-oranges-1-5kg-000000000000380154) | 1.5 kg | 1500 | $4.99 | $3.33 per 1 kg | as purchased |
| 52 | avocado | ALDI | [Hass Avocados 5 Pack](https://www.aldi.com.au/product/no-brand-hass-avocados-5-pack-000000000000380094) | 5 each | 680 | $8.49 | $1.70 per 1 each | approx. edible g |
| 53 | olive_oil | ALDI | [The Olive Tree Olive Oil 1L](https://www.aldi.com.au/product/the-olive-tree-olive-oil-1l-000000000000593280) | 1 l | 1000 | $8.79 | $0.88 per 100 ml | 1 mL = 1 g |
| 54 | peanut_butter | ALDI | [Bramwells Smooth Peanut Butter 500g](https://www.aldi.com.au/product/bramwells-smooth-peanut-butter-500g-000000000000366866) | 500 g | 500 | $2.99 | $0.60 per 100 g |  |
| 55 | almonds | Woolworths | [Woolworths Almonds Kernels 750g](https://www.woolworths.com.au/shop/productdetails/176411/woolworths-almonds-kernels) | 750g | 750 | $13.50 | $18.00 / 1KG |  |
| 56 | butter | ALDI | [Pure Valley Salted Butter 250g](https://www.aldi.com.au/product/pure-valley-salted-butter-250g-000000000000399913) | 250 g | 250 | $3.99 | $1.60 per 100 g |  |
| 57 | instant_noodles | Woolworths | [Indomie Mi Goreng Instant Noodles 425g 5 pack](https://www.woolworths.com.au/shop/productdetails/177972/indomie-mi-goreng-instant-noodles) | 425g 5 pack | 425 | $3.95 | $0.93 / 100G |  |
| 58 | chocolate | ALDI | [Dairy Fine Milk Chocolate Block 180g](https://www.aldi.com.au/product/dairy-fine-milk-chocolate-block-180g-000000000000398417) | 180 g | 180 | $3.49 | $1.94 per 100 g |  |
| 59 | muesli_bar | ALDI | [Hillcrest Muesli Bars 6 Pack 185g](https://www.aldi.com.au/product/hillcrest-muesli-bars-6-pack-185g-000000000000367817) | 185 g | 185 | $2.09 | $1.13 per 100 g |  |
| 60 | soft_drink | ALDI | [Coca-Cola Coke Classic Soft Drink 2L](https://www.aldi.com.au/product/coca-cola-coke-classic-soft-drink-2l-000000000000770123) | 2 l | 2000 | $3.99 | $2.00 per 1 L | 1 mL = 1 g |

The full note for each product is in its `notes` field in the JSON.

### Method

- **Woolworths:** I sent plain HTTPS GET requests to the JSON search endpoint behind the public search page (`https://www.woolworths.com.au/apis/ui/Search/products?searchTerm=...`). Name, `Price`, `CupString` (the unit price shown on the site), `WasPrice` and the special flags come from that response. I did not use the in-store price fields. I skipped marketplace (third-party seller) items. Product links have the form `/shop/productdetails/{stockcode}/{slug}`; three spot-checked links returned HTTP 200 with the matching product title.
- **Coles:** I read the search page `https://www.coles.com.au/search/products?q=...` and parsed the embedded `__NEXT_DATA__` JSON (`pricing.now`, `pricing.comparable` = unit price shown, `pricing.was`, `isWeighted`). Product links match the `href` values in the same page.
- **ALDI:** I parsed the public search results page `https://www.aldi.com.au/results?q=...`, taking the tile name, brand, size, price and comparison price. I also opened eight product pages to confirm details: broccoli price per kg, frozen berries, Hass avocado count, egg packs, prawns, frozen broccoli, and that the chickpeas are canned. I excluded tiles badged "While Stocks Last" or "On Sale <date>" (Special Buys). I also left out ALDI egg cartons, because neither the tile nor the product page gives the egg count.
- **Rules followed:** read-only access, no login, no cart, no cookie acceptance, no postcode or store selection, and no form other than search queries. I did not use any browser automation. Prices, names, pack sizes, unit-price strings and URLs were parsed by script from the saved raw responses. A few values were entered into the selection file by hand, each copied from a saved page or table: the ALDI broccoli unit-price string (from its product page), the FDC portion gram weights for "each" items (from the FDC food_portion tables), and the approximate weights of variable-weight packs (from the listing text).
- **Gram weights:** packGrams is the labelled net weight. The exceptions are flagged in notes: (a) for "each" items (banana, capsicum, avocado 5-pack, dozen eggs) it is an approximate edible weight from USDA FDC portion tables, with the FDC id and portion cited; (b) variable-weight meat packs use the stated approximate weight; (c) loose ALDI broccoli uses 1 kg as a reference quantity for its per-kg price; (d) liquids use 1 mL = 1 g.

### Limitations

- **Coles coverage is thin (3 products).** After 5 search requests, Coles returned an anti-bot interstitial page ("Pardon Our Interruption", Imperva) instead of results. I stopped requesting Coles at that point and did not try the browser fallback. The 3 Coles products come from the 5 valid pages.
- **Prices are each website's default online prices** with no location set, so they may not match a particular Brisbane store or the in-store price. Specials (flagged in notes with the "was" price) are temporary. ALDI product pages include this disclaimer: "ALDI's website only displays current prices for reduced items" and "the product information may differ from the product available for purchase at your nearest ALDI store".
- **Canned legumes and tuna:** packGrams is net weight including liquid. The listings give no drained weight, so cost per 100 g of drained food is understated. Where Woolworths lists the ingredient share (e.g. "Lentils (60%), Water, Salt"), it is quoted in notes.
- **Fresh produce:** packGrams is the as-purchased weight including peel, skin or core. FDC values are per 100 g of edible portion.
- **Edamame:** the only frozen edamame products found do not say whether they are shelled or in pods (see notes).
- Not catalogued: lettuce (only sold "each"/2-pack with no weight), zucchini, frozen pizza, chips, ice cream, energy drink, orange juice and beer (the task asked for only a few snacks and drinks).
- **Seasonal produce bonus:** `seasonalOctoberSEQ` is `null`. A quick search found no Queensland Government or Growcom October calendar for South-East Queensland. The closest industry source was a Brisbane Markets weekly report (https://brisbanemarkets.com.au/brisbane-produce-report-12-october/), dated 12 October 2023. It is a market-supply report, not a seasonal calendar; for example it lists brown onions from Gatton and cauliflower from the Lockyer Valley. I judged it too weak to tag foods as "in season in SEQ".

## 2. Nutrition per 100 g (`foods_fdc.json`)

All 62 foods have FDC values (SR Legacy 33, Foundation 28, Survey (FNDDS) 1). Values are per 100 g of the state described in `food_ids.json`.

### Method

- **Finding candidates:** I searched the official FDC bulk downloads locally (https://fdc.nal.usda.gov/download-datasets): SR Legacy CSV 2018-04, Foundation CSV 2026-04-30 and FNDDS (Survey) CSV 2024-10-31. This avoided spending the DEMO_KEY quota on searches. The API response headers showed `X-Ratelimit-Limit: 10` for DEMO_KEY.
- **Values:** taken from the FDC API batch endpoint `GET /v1/foods?fdcIds=...&format=abridged&nutrients=208,203,204,205,957,958&api_key=DEMO_KEY` (5 batch calls, plus 1 test call and 1 Branded search; 7 API requests in total). I cross-checked them against the unrounded bulk-CSV values and found no differences beyond rounding.
- **Energy rule** (the field used is recorded in `energyField`): `Energy` (208) if present, else `Energy (Atwater Specific Factors)` (958), else `Energy (Atwater General Factors)` (957). Specific factors come before General because they are tailored to each food.
- **Preference order:** Foundation or SR Legacy, then FNDDS (used once, for mixed frozen berries). No Branded record was used.
- **Sanity check** |kcal - (4P + 4C + 9F)| / kcal < 0.15: beer fails as expected (alcohol energy). These high-fibre, low-energy vegetables also fail: broccoli, baby spinach, capsicum, tomato, lettuce, mushrooms and zucchini. Their gaps are listed in each record's notes.

### Caveats

- **sausages:** no raw beef sausage exists in Foundation, SR Legacy or FNDDS. The record used (174618) is **cooked** fresh beef sausage. A Branded search returned only pre-cooked or smoked US products.
- **lentils_can:** proxy is SR 175254, boiled lentils with salt. The FNDDS "from canned" record includes added fat.
- **frozen_pizza:** the SR record is "frozen, cooked" (as eaten after baking).
- **bread_wholemeal and peanut_butter:** the Foundation records are in the bulk file but were not returned by the API, so the SR Legacy equivalents were used.
- FDC is US data. Australian products (fortification, lean-mince grading, flavoured items) can differ. Treat these as reference values, not label values.

Look up any record with `https://api.nal.usda.gov/fdc/v1/food/{fdcId}?api_key=DEMO_KEY`.

| id | fdcId | dataType | energyField | kcal | protein | fat | carbs |
|---|---|---|---|---|---|---|---|
| chicken_breast | 2646170 | Foundation | Energy (Atwater Specific Factors) | 112 | 22.5 | 1.93 | 0.0 |
| chicken_thigh | 2646171 | Foundation | Energy (Atwater Specific Factors) | 149 | 18.6 | 7.92 | 0.0 |
| beef_mince | 2514743 | Foundation | Energy (Atwater Specific Factors) | 190 | 18.2 | 12.8 | 0.0 |
| pork_loin | 2646168 | Foundation | Energy (Atwater Specific Factors) | 174 | 21.1 | 9.47 | 0.0 |
| salmon | 175167 | SR Legacy | Energy | 208 | 20.4 | 13.4 | 0.0 |
| prawns | 2684443 | Foundation | Energy (Atwater Specific Factors) | 75.7 | 15.6 | 0.801 | 0.485 |
| tuna_can | 334194 | Foundation | Energy | 90.0 | 19.0 | 0.94 | 0.08 |
| eggs | 748967 | Foundation | Energy | 148 | 12.4 | 9.96 | 0.96 |
| tofu | 172448 | SR Legacy | Energy | 78.0 | 9.04 | 4.17 | 2.85 |
| tempeh | 174272 | SR Legacy | Energy | 192 | 20.3 | 10.8 | 7.64 |
| lentils_can | 175254 | SR Legacy | Energy | 114 | 9.02 | 0.38 | 19.5 |
| chickpeas_can | 2644288 | Foundation | Energy (Atwater Specific Factors) | 133 | 7.02 | 3.1 | 20.3 |
| black_beans_can | 2644285 | Foundation | Energy (Atwater Specific Factors) | 115 | 6.91 | 1.27 | 19.8 |
| edamame | 168410 | SR Legacy | Energy | 109 | 11.2 | 4.73 | 7.61 |
| ham | 332397 | Foundation | Energy | 106 | 16.7 | 3.73 | 0.27 |
| sausages | 174618 | SR Legacy | Energy | 332 | 18.2 | 28.0 | 0.35 |
| whey | 173180 | SR Legacy | Energy | 352 | 78.1 | 1.56 | 6.25 |
| greek_yogurt | 170903 | SR Legacy | Energy | 73.0 | 9.95 | 1.92 | 3.94 |
| cottage_cheese | 328841 | Foundation | Energy | 84.0 | 11.0 | 2.3 | 4.31 |
| milk | 746782 | Foundation | Energy | 60.0 | 3.27 | 3.2 | 4.63 |
| milk_skim | 746776 | Foundation | Energy | 34.0 | 3.43 | 0.08 | 4.92 |
| cheddar | 328637 | Foundation | Energy | 408 | 23.3 | 34.0 | 2.44 |
| soy_milk | 1999630 | Foundation | Energy (Atwater Specific Factors) | 38.5 | 3.55 | 2.12 | 1.29 |
| broccoli | 747447 | Foundation | Energy | 31.0 | 2.57 | 0.34 | 6.27 |
| spinach | 1999632 | Foundation | Energy (Atwater Specific Factors) | 20.7 | 2.85 | 0.619 | 2.41 |
| carrot | 2258586 | Foundation | Energy (Atwater Specific Factors) | 45.0 | 0.941 | 0.351 | 10.3 |
| capsicum | 170108 | SR Legacy | Energy | 26.0 | 0.99 | 0.3 | 6.03 |
| tomato | 170457 | SR Legacy | Energy | 18.0 | 0.88 | 0.2 | 3.89 |
| cucumber | 2346406 | Foundation | Energy (Atwater Specific Factors) | 13.9 | 0.625 | 0.178 | 2.95 |
| lettuce | 746769 | Foundation | Energy | 17.0 | 1.24 | 0.26 | 3.24 |
| onion | 790646 | Foundation | Energy | 38.0 | 0.83 | 0.05 | 8.61 |
| mushrooms | 169251 | SR Legacy | Energy | 22.0 | 3.09 | 0.34 | 3.26 |
| zucchini | 2685568 | Foundation | Energy (Atwater Specific Factors) | 16.0 | 0.984 | 0.205 | 3.27 |
| frozen_veg | 170471 | SR Legacy | Energy | 72.0 | 3.33 | 0.52 | 13.5 |
| peas_frozen | 170016 | SR Legacy | Energy | 77.0 | 5.22 | 0.4 | 13.6 |
| banana | 1105314 | Foundation | Energy | 97.0 | 0.74 | 0.29 | 23.0 |
| apple | 171688 | SR Legacy | Energy | 52.0 | 0.26 | 0.17 | 13.8 |
| orange | 169097 | SR Legacy | Energy | 47.0 | 0.94 | 0.12 | 11.8 |
| mango | 169910 | SR Legacy | Energy | 60.0 | 0.82 | 0.38 | 15.0 |
| berries_frozen | 2709272 | Survey (FNDDS) | Energy | 52.0 | 0.76 | 0.34 | 12.5 |
| avocado | 2710824 | Foundation | Energy (Atwater Specific Factors) | 206 | 1.81 | 20.3 | 8.32 |
| sweet_potato | 2346404 | Foundation | Energy (Atwater Specific Factors) | 77.4 | 1.58 | 0.375 | 17.3 |
| potato | 170026 | SR Legacy | Energy | 77.0 | 2.05 | 0.09 | 17.5 |
| rice | 2512381 | Foundation | Energy (Atwater Specific Factors) | 370 | 7.04 | 1.03 | 80.3 |
| pasta | 168927 | SR Legacy | Energy | 371 | 13.0 | 1.51 | 74.7 |
| oats | 173904 | SR Legacy | Energy | 379 | 13.2 | 6.52 | 67.7 |
| bread_wholemeal | 172688 | SR Legacy | Energy | 252 | 12.4 | 3.5 | 42.7 |
| wraps | 167535 | SR Legacy | Energy | 297 | 8.01 | 7.58 | 49.3 |
| instant_noodles | 171177 | SR Legacy | Energy | 440 | 10.2 | 17.6 | 60.3 |
| olive_oil | 171413 | SR Legacy | Energy | 884 | 0.0 | 100 | 0.0 |
| peanut_butter | 174266 | SR Legacy | Energy | 598 | 22.2 | 51.4 | 22.3 |
| almonds | 2346393 | Foundation | Energy (Atwater Specific Factors) | 584 | 21.5 | 51.1 | 20.0 |
| butter | 173410 | SR Legacy | Energy | 717 | 0.85 | 81.1 | 0.06 |
| frozen_pizza | 170317 | SR Legacy | Energy | 268 | 10.4 | 12.3 | 29.0 |
| chocolate | 167587 | SR Legacy | Energy | 535 | 7.65 | 29.7 | 59.4 |
| chips | 169677 | SR Legacy | Energy | 532 | 6.39 | 34.0 | 53.8 |
| ice_cream | 167575 | SR Legacy | Energy | 207 | 3.5 | 11.0 | 23.6 |
| muesli_bar | 167954 | SR Legacy | Energy | 443 | 7.4 | 17.2 | 67.3 |
| soft_drink | 174852 | SR Legacy | Energy | 42.0 | 0.0 | 0.25 | 10.4 |
| energy_drink | 173210 | SR Legacy | Energy | 43.0 | 0.46 | 0.0 | 10.2 |
| orange_juice | 2003597 | Foundation | Energy (Atwater Specific Factors) | 45.0 | 0.812 | 0.356 | 10.0 |
| beer | 168746 | SR Legacy | Energy | 43.0 | 0.46 | 0.0 | 3.55 |
