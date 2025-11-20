// Products and attributes per Experiment Structure (trimmed to essentials).
// Condition rule in the app: Low Load => show 3 attributes; High Load => show 6 attributes.

export const CATEGORIES_FOR_TASK2 = ["Detergent", "Smartwatch", "Speaker", "Water Bottle","Electric Toothbrush", "Backpacks"]; // "Speaker" = Bluetooth-Speaker list

export const PRODUCTS = {
  Detergent: [
    {
      id: "det_ariel",
      name: "Ariel All-in-1 Pods",
      price: "14,95€",
      image: "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_440,w_500/v1754976243/assets/pas/images/1c7a0d5b-b1aa-4686-b120-f66b575fd471/ariel-vollwaschmittel-pods",
      attrs: [
        "All-purpose detergent",
        "Loads: 50",
        "Texture: Caps / Tabs",
        "Temperature: 20–95°C",
        "Excellent stain removal at cold washing temperatures",
        "Your laundry looks sparkling clean and smells fresh"
      ]
    },
    {
      id: "det_persil",
      name: "Persil Sensitive Gel",
      price: "7,95€",
      image: "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_440,w_500/v1747442092/assets/pas/images/c78af9ce-dd89-47dd-9729-9b2ba0ab42be/persil-vollwaschmittel-sensitive-gel",
      attrs: [
        "All-purpose detergent",
        "Loads: 25",
        "Texture: Liquid",
        "Temperature: 20–95°C",
        "Skin- and allergy-friendly",
        "No perfume, no colourants",

      ]
    },
    {
      id: "det_ecover",
      name: "Ecover Eco",
      price: "6,75€",
      image: "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_440,w_500/v1747501685/assets/pas/images/a34feb33-ad0c-4219-88e9-0fd814d99d31/ecover-waschmittel-fluessig-universal-hibiskus-und-jasmin",
      attrs: [
        "All-purpose detergent",
        "Loads: 21",
        "Texture: Liquid",
        "Temperature: 30–60°C",
        "Scent of hibiscus & jasmine",
        "Bottle 100% recycled plastic"
      ]
    },
    {
      id: "det_lenor",
      name: "Lenor Powder",
      price: "16,95€",
      image: "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_440,w_500/v1755001060/assets/pas/images/4942c9c6-26a1-46aa-bbb9-b27559d7784b/lenor-vollwaschmittel-pulver-aprilfrisch",
      attrs: [
        "All-purpose detergent",
        "Loads: 90",
        "Texture: Powder",
        "Temperature: 20–90°C",
        "Protects colors and textiles",
        "Effective smell removal even with cold washes",
      ]
    },
    {
      id: "det_denkmit",
      name: "Denk mit – Ultra Sensitive",
      price: "3,45€",
      image: "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_440,w_500/v1748562588/assets/pas/images/a2909d5f-f5e4-4d48-bfb5-f5b0e1159964/denkmit-vollwaschmittel-pulver-ultra-sensitive",
      attrs: [
        "All-purpose detergent",
        "Loads: 20",
        "Texture: Powder",
        "Temperature: 20–95°C",
        "Skin- and allergy-friendly",
        "Avoids the use of colourants, preservatives, and perfumes"
      ]
    },
    {
      id: "det_weisser",
      name: "Weißer Riese",
      price: "8,95€",
      image: "https://products.dm-static.com/images/f_auto,q_auto,c_fit,h_440,w_500/v1747441886/assets/pas/images/2367d3eb-1baa-46a1-8752-03d1bc7b0442/weisser-riese-vollwaschmittel-pulver",
      attrs: [
        "All-purpose detergent",
        "Loads: 50",
        "Texture: Powder",
        "Temperature: 20–95°C",
        "Ideal for families with children",
        "Cold-active formula allows for energy-saving washing"
      ]
    }
  ],
  Smartwatch: [
    {
      id: "sw_venu4",
      name: "Garmin Venu 4",
      price: "549,99€",
      image: "https://res.garmin.com/transform/image/upload/b_rgb:FFFFFF,c_pad,dpr_2.0,f_auto,h_400,q_auto,w_400/c_pad,h_400,w_400/v1/Product_Images/de_DE/products/010-03014-00/v/cf-xl?pgw=1",
      attrs: [
        "Purpose: Fitness & Health Smartwatch",
        "Battery: Up to 10 days",
        "Weight: 33g",
        "Health sensors: ECG, HRV status, skin temperature etc.",
        "Lifestyle Logging: track habits (e.g., caffeine) and effects",
        "More than 80 preloaded GPS and indoor sports apps",
        "Built-in LED flashlight, useful for outdoor or low-light use"
      ]
    },
    {
      id: "sw_fr970",
      name: "Garmin Forerunner 970",
      price: "749,99€",
      image: "https://res.garmin.com/transform/image/upload/b_rgb:FFFFFF,c_pad,dpr_2.0,f_auto,h_400,q_auto,w_400/c_pad,h_400,w_400/v1/Product_Images/de_DE/products/010-02969-10/v/cf-xl?pgw=1",
      attrs: [
        "Purpose: Running",
        "Battery: Up to 26 hours",
        "Weight: 56g",
        "Advanced running metrics: Running Economy, etc.",
        "Suggests Recovery time before your next workout",
        "Built-in maps + navigation features",
        "Advanced heart-health sensing: ECG capability + optical heart rate sensor",
      ]
    },
    {
      id: "sw_aw11",
      name: "Apple Watch Series 11",
      price: "449,00€",
      image: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MXM23ref_FV99_VW_34FR+watch-case-46-aluminum-jetblack-cell-s11_VW_34FR+watch-face-46-aluminum-jetblack-s11_VW_34FR?wid=752&hei=720&bgc=fafafa&trim=1&fmt=p-jpg&qlt=80&.v=TnVrdDZWRlZzTURKbHFqOGh0dGpVRW5TeWJ6QW43NUFnQ2V4cmRFc1VnYUdWejZ5THhpKzJwRmRDYlhxN2o5aSsxa3lRL0RPQXl4d1oyaFZIWm1QL1F1Z0RaeFB5LzRxZEliRVE2WkswOW5YNUh6UG9VcVpLK2VQampYMHFQR0ZjcUFHc2U4eFMrUHFHdndTN3dIcncxRVpGM0VTYkFEYWkrVUpmdm5HMEsvZzdYL1dmbHI1ck0vS0dDZmJkTUNtcXlYK1hMV0U1ZW9xcCtlRHF3V3gyY2xEQTFSTTlGejVrSXBGN25PbzMrMG9sZHMyTzFzVWNkVE1VWVVod0hOSw",
      attrs: [
        "Purpose: Multifunctional Smartwatch",
        "Battery: Up to 24 hours",
        "Weight: 37.8g (Alu GPS)",
        "Cellular connectivity: Supports 5G",
        "Sleep Score based on sleep stages, consistency, etc. ",
        "High blood pressure notifications"
      ]
    },
    {
      id: "sw_vantagev3",
      name: "Polar Vantage V3",
      price: "599,90€",
      image: "https://images.bike24.com/i/mb/32/b7/58/polar-vantage-v3-nightblack-1-1570405.jpg",
      attrs: [
        "Purpose: Multisport Smartwatch",
        "Battery: Up to 43 hours",
        "Weight: 57g",
        "Training tools: Running power, Training Load, Recovery",
        "Sensors: Heart rate, SpO₂, skin temperature, ECG, etc.",
        "Touchscreen + five physical buttons"
      ]
    },
    {
      id: "sw_watch8",
      name: "Samsung Galaxy Watch 8",
      price: "579,00€",
      image: "https://i.otto.de/i/otto/4a72d61d-6f5b-5010-a6d6-b889a0eba734/samsung-galaxy-watch-8-classic-smartwatch-13-zoll-wear-os-by-samsung-schwarz.jpg?$formatz$",
      attrs: [
        "Purpose: All-around smartwatch",
        "Battery: Up to 30h",
        "Weight: 34g",
        "Health Metrics: ECGs, SpO₂, skin temperature, etc.",
        "Personalized Training Plans",
        "Deep Sleep & Bedtime Guidance",
        "AI Features: Gemini AI for voice / context-aware tasks"
      ]
    },
    {
      id: "sw_scanwatch2",
      name: "Withings ScanWatch 2",
      price: "287,99€",
      image: "https://image.coolblue.de/max/700xauto/products/1982025",
      attrs: [
        "Purpose: Hybrid design with classic look",
        "Battery: Up to 30 days",
        "Weight: 52.6g",
        "Sensors: ECG, SpO₂ , Skin Temperature, Heart Rate, etc.",
        "Activity Tracking: steps, calorie burn, type of activity",
        "Supports connected GPS (via smartphone)"
      ]
    }
  ],
  Speaker: [
    {
      id: "sp_bose_flex",
      name: "Bose SoundLink Flex",
      price: "99,95€",
      image: "https://content.abt.com/image.php/bose-portable-bluetooth-speaker-887612-0300-front.jpg?image=/images/products/BDP_Images/bose-portable-bluetooth-speaker-887612-0300-front.jpg&canvas=1&width=750&height=550",
      attrs: [
        "Portable",
        "Dimensions: 9×20×5 cm (HxWxD), 0.6 kg",
        "Battery: Up to 12h",
        "Wireless range: Up to 9m",
        "Protection: Dust- and waterproof, floats in water",
        "Sound: One custom-designed transducer + two passive radiators",
        "Bluetooth only (no auxiliary / wired input)"
      ]
    },
    {
      id: "sp_sonos_era100",
      name: "Sonos Era 100",
      price: "189,00€",
      image: "https://image.euronics.de/media/image/a1/23/d6/ea4aabf0-4e6d-44a5-8c45-2515d63c6d60.jpg",
      attrs: [
        "Non-portable (no battery, mains powered)",
        "Dimensions: 182.5×120×130.5 mm (HxWxD), 2.02 kg ",
        "Wi-Fi 6 support for streaming over home network",
        "Protection: Humidity-resistant design",
        "Sound: two angled tweeters + one mid-woofer",
        "Voice assistance: built-in Alexa",
      ]
    },
    {
      id: "sp_jbl_charge5",
      name: "JBL Charge 5",
      price: "129,99€",
      image: "https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MP_138455711?x=536&y=402&format=jpg&quality=80&sp=yes&strip=yes&trim&ex=536&ey=402&align=center&resizesource&unsharp=1.5x1+0.7+0.02&cox=0&coy=0&cdx=536&cdy=402",
      attrs: [
        "Portable",
        "Dimensions: 22×9.6×9.3 cm (HxWxD), 0.96 kg",
        "Battery: Up to ~20h",
        "Protection: Dust- and waterproof",
        "Sound: 2-way system: optimized long-excursion woofer + separate tweeter",
        "Bluetooth for wireless audio, no aux",
        "Supports pairing with another JBL speaker"
      ]
    },
    {
      id: "sp_boom4",
      name: "Logitech Boom 4",
      price: "149,99€",
      image: "https://m.media-amazon.com/images/I/81M+rQhI3mL.jpg",
      attrs: [
        "Portable",
        "Dimensions: 184×73×73 mm (HxWxD), 0.62 kg",
        "Battery: Up to 15h",
        "Sound: two active drivers and two passive radiators",
        "Wireless range: 45 meters (Bluetooth)",
        "Can pair with other UE speakers",
        "Design: Cylindrical shape with 360° sound output"
      ]
    },
    {
      id: "sp_kilburn2",
      name: "Marshall Kilburn II",
      price: "225,00€",
      image: "https://m.media-amazon.com/images/I/815C-Vie4OL.jpg",
      attrs: [
        "Portable",
        "Dimensions: 243×162×140 mm (HxWxD), 2.5 kg",
        "Battery: Up to 20h",
        "Protection: Water Resistance (not fully waterproof)",
        "Sound: two 0.75-inch dome tweeters, one 4-inch cone woofer", 
        "Connectivity: Bluetooth with Multi-Host Functionality", 
        
      ]
    },
    {
      id: "sp_beosound_explore",
      name: "B&O Beosound Explore",
      price: "299,00€",
      image: "https://images.hifiklubben.com/image/5795f7bb-d360-4cb3-a964-3022f384295e/pdp_e/boexplore.jpg",
      attrs: [
        "Portable",
        "Dimensions: 8.1×12.4 cm (ØxH), 0.63 kg",
        "Battery: Up to 27h",
        "Protection: Dustproof and water-resistant",
        "Sound: True 360° sound",
        "Connectivity: Bluetooth",
        "Stereo pairing: You can link two Beosound Explore units for stereo sound"
        
      ]
    }
  ],

  "Water Bottle": [
    {
      id: "wb_24_urban",
      name: "24 Bottles - Urban Bottle",
      price: "20,00€",
      image: "https://24bottles.com/cdn/shop/files/146__urban__gravity__1_900x.png?v=1710504354",
      attrs: [
        "Non-insulated, single-wall bottle",
        "Size: 500 ml",
        "Weight: 117g",
        "Material: food-grade stainless steel",
        "Most lightweight stainless steel bottle on the market",
        "Optional accessories available (e.g., different lids)"
      ]
    },
    {
      id: "wb_24_clima",
      name: "24 Bottles - Clima Bottle",
      price: "45,00€",
      image: "https://24bottles.com/cdn/shop/files/143__clima__atlantic_bay__1_900x.png?v=1710503068",
      attrs: [
        "Thermal-insulated bottle",
        "Keeps drinks hot up to 12h / cold up to 24h",
        "Size: 850 ml",
        "Weight: 274g",
        "Material: food-grade stainless steel",
        "Wide mouth opening for easy filling and cleaning"
      ]
    },
    {
      id: "wb_720_nolimit",
      name: "720° DGREE noLimit Bottle",
      price: "29,99€",
      image: "https://720dgree.de/cdn/shop/products/noLimit_950ml_stone_gray.png?v=1738845378&width=1080", 
      attrs: [
        "Vacuum-insulated double-wall bottle",
        "Keeps drinks up to 16h cold / 8h hot",
        "Size: 710 ml",
        "Weight: 373g",
        "Interior is flavour- and odour-neutral",
        "Design: many colour and finish variants"
      ]
    },
    {
      id: "wb_spottle_glass",
      name: "Spottle Glass Bottle",
      price: "20,00€",
      image: "https://www.myspottle.com/cdn/shop/files/glasflasche-schwarz-750ml.webp?v=1713704537&width=700",
      attrs: [
        "Glass bottle",
        "Size: 750 ml",
        "Weight: 380g",
        "Suitable for carbonated beverages",
        "Suitable for hot beverages (up to 100°C)",
        "Odour- and flavour-neutral materials"
      ]
    },
    {
      id: "wb_nalgene",
      name: "Nalgene Water Bottle",
      price: "13,50€",
      image: "https://nalgene.eu/wp-content/uploads/2023/05/wide-mouth-new-color_03-front-tran.jpg",
      attrs: [
        "BPA- and BPS-free plastic bottle",
        "Size: 1 L",
        "Weight: 180g",
        "Durable materials handle rough use",
        "Volume markings to track intake",
        "Tolerates -40 to 100°C (not insulated)"
      ]
    },
    {
      id: "wb_waterdrop_sport",
      name: "Waterdrop All-Purpose Sport Bottle",
      price: "28,90€",
      image: "https://www.waterdrop.de/cdn/shop/files/All_Purpose_12_L_Ultralight_black_loop.png?v=1750144717", 
      attrs: [
        "Lightweight single-wall steel bottle",
        "Size: 800 ml",
        "Weight: 213g",
        "Usable for hot and cold drinks (not insulated)",
        "3-finger handle/loop for carrying or fastening",
        "Leakproof loop lid with tight closure"
      ]
    }
  ], 

    "Electric Toothbrush": [
    {
      id: "etb_philips_5300",
      name: "Philips Sonicare Series 5300",
      price: "89,99€",
      image: "https://images.philips.com/is/image/philipsconsumer/f4272190e0c74cbaa63db137013054ca?wid=700&hei=700&$pnglarge$",
      attrs: [
        "Technology: Next-Generation magnetic sonic",
        "Speed: 62,000 moves/min",
        "Battery: ~21 days",
        "Cleaning: up to 7× more plaque removal",
        "Guidance: Smart Pressure Sensor",
        "Intensity: 2 levels (low / high)",
        "Timer: Smartimer + QuadPacer",
        "Smart Maintenance: BrushSync replacement reminder"
      ]
    },
    {
      id: "etb_oralb_io5",
      name: "Oral-B iO Series 5",
      price: "95,99€",
      image: "https://shop.oralb.de/images?url=https://static.thcdn.com/productimg/original/13936267-1305147294871948.jpg&format=webp&auto=avif&width=1000&height=1000&fit=cover",
      attrs: [
        "Technology: iO magnetic drive",
        "Speed: 8,700 oscillations/min",
        "Battery: ~17 days",
        "Modes: Daily Clean, Intense, Sensitive, Whitening",
        "Guidance: Smart Pressure Sensor",
        "App: AI brushing recognition and real-time tracking",
        "Travel case: Included"
      ]
    },
    {
      id: "etb_oralb_pro3_3500",
      name: "Oral-B Pro Series 3 (3500)",
      price: "49,99€",
      image: "https://m.media-amazon.com/images/I/71JtVNK8BCL._AC_UF1000,1000_QL80_.jpg",
      attrs: [
        "Technology: 3D cleaning (Oscillate-Rotate-Pulsate)",
        "Speed: 9,900 oscillations/min",
        "Battery: ~20 days",
        "Modes: 3 – Daily Clean, Sensitive, Whitening",
        "Timer: 2-min with 30-sec quad pacer",
        "Pressure control: 360° visual indicator",
        "Travel case: Included"
      ]
    },
    {
      id: "etb_wondersmile_pro",
      name: "Wondersmile – WonderBrush PRO",
      price: "69,90€",
      image: "https://www.wondersmile.eu/cdn/shop/files/0174_Wondersmile_Amazon_Produktbilder_Zahnbuersten_A_B_100_Tage_testen36_91adc5e8-3576-4598-8449-b591fd1618bc.jpg?v=1754658059&width=700",
      attrs: [
        "Technology: Sonic cleaning",
        "Speed: ~40,000 vibrations/min",
        "Battery: ~60 days",
        "Modes: 4 – Clean, White, Polish, Gum Care",
        "Intensity: 3 levels",
        "Guidance: 2-min timer with quadrant pacer",
        "Waterproof: IPX8"
      ]
    },
    {
      id: "etb_philips_7100",
      name: "Philips Sonicare Series 7100",
      price: "149,99€",
      image: "https://images.philips.com/is/image/philipsconsumer/1606522c6ec54e31aa44b137011ff125?wid=700&hei=700&$pnglarge$",
      attrs: [
        "Technology: Next-Generation magnetic sonic",
        "Speed: 62,000 moves/min",
        "Battery: ~21 days",
        "Cleaning: up to 10× more plaque removal",
        "Modes: 4 – Clean, White, Gum Health, Sensitive",
        "Intensity: 3 levels (low/medium/high)",
        "Protection: Visible pressure sensor + haptic/audio feedback",
        "Guidance: SmartTimer (2 min) + BrushPacer"
      ]
    },
    {
      id: "etb_oralb_pulsonic_4500",
      name: "Oral-B Pulsonic Slim Luxe 4500",
      price: "67,99€",
      image: "https://images.ctfassets.net/xi87dgyeemmk/5Ilv7iwxlHSUaa0gc7oxlr/f7fcf632a3917311b223fab369c49b12/pulsonic2__1_.png?fm=webp&q=85",
      attrs: [
        "Technology: Sonic cleaning",
        "Speed: ~31,000 movements/min",
        "Battery: ~14 days",
        "Modes: 3 – Daily Clean, Whitening, Sensitive",
        "Guidance: 2-min timer + 30-sec quadrant pacer",
        "Design: Ultra-slim, super-light handle",
        "Brush heads: Pulsonic elongated sonic heads",
        "Travel case: Included"
      ]
    }
  ],
  "Backpack" : [
  {
    id: "bp_aevor_trip_pack",
    name: "AEVOR Trip Pack",
    price: "109,00€",
    image: "https://www.aevor.com/cdn/shop/products/AVR-TRW-001-801-AEVOR-Trip-Pack-Proof-Black-02_713x.jpg?v=1759937024", 
    attrs: [
      "Volume: 26–33 L (expandable via roll-top)",
      "Size: 31 × 18 × 50 cm (W×D×H)",
      "Laptop: 15″ compartment",
      "Access: Roll-top + all-round zip",
      "Comfort: Ergonomic padded shoulder straps + back",
      "Materials: 100% recycled PET; water-repellent"
    ]
  },
  {
    id: "bp_db_daypack_17l",
    name: "DB Daypack",
    price: "129,00€",
    image: "https://dbjourney.com/cdn/shop/files/Daypack_17L_Fogbow_Beige_1000502101501.png?v=1755701243&width=900",
    attrs: [
      "Volume: 17 L",
      "Size: 43 × 28 × 12 cm (H×W×D)",
      "Laptop: 16″ sleeve",
      "Organization: External zip pocket + key hook",
      "Front utility straps",
      "Materials: recycled polyester/polyamide; water-resistant"
    ]
  },
  {
    id: "bp_kapten_helsinki_pro",
    name: "Kapten & Son Helsinki Pro",
    price: "159,90€",
    image: "https://kns-live.cdn.aboutyou.cloud/images/560d448a36c250cd93411687d911486a.jpg?brightness=1&impolicy=imdb-transparent-background&width=580&height=774&quality=75&bg=FFFFFF",
    attrs: [
      "Volume: 24 L",
      "Size: 52 × 30 × 15.5 cm (H×W×D)",
      "Laptop: 15″ padded sleeve",
      "Dual access: roll-top look + full around-zip; fold-out back",
      "Comfort: padded straps & back; adjustable chest strap",
      "Travel-Friendly: trolley sleeve"
    ]
  },
  {
    id: "bp_patagonia_black_hole_micro_22l",
    name: "Patagonia Black Hole Micro",
    price: "150,00€",
    image: "https://eu.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw07032160/images/hi-res/49260_BLK.jpg?sw=1920&sh=1920&sfrm=png&q=90&bgcolor=f3f4ef",
    attrs: [
      "Volume: 22 L",
      "Size: 46 × 30 × 19 cm (H×W×D)",
      "Laptop: 15″ padded electronics compartment",
      "Carry: 3-way — backpack, shoulder, briefcase",
      "Organization: mesh divider; multiple admin pockets",
      "Travel-friendly: carry-on size + trolley sleeve"
    ]
  },
  {
    id: "bp_pinqponq_purik_cliff",
    name: "pinqponq Purik Cliff",
    price: "99,90€",
    image: "https://www.taschenklub.de/img/157668/pinqponq-ppc-pur-001-70059-purik-cliff-beige-1.jpg?options=rs:fit:1080:1080/g:ce/dpr:1/ex:1",
    attrs: [
      "Volume: 21 L",
      "Size: 28 × 15 × 45 cm (W×D×H)",
      "Laptop: 15″ padded compartment",
      "Internal organization: pen loop; key ring; front zip pocket",
      "Carry: padded back panel and ergonomic straps",
      "Material: Pure Woven (recycled PET); water-repellent"
    ]
  },
  {
    id: "bp_tnf_base_camp_fuse_box",
    name: "The North Face Base Camp",
    price: "145,00€",
    image: "https://assets.thenorthface.eu/images/t_img/f_auto,h_462,e_sharpen:60,w_462/dpr_2.0/v1753206436/NF0A3KVR4HF-HERO/Base-Camp-Fuse-Box.jpg",
    attrs: [
      "Volume: 30 L",
      "Size: 46 × 33 × 15 cm (H×W×D)",
      "Laptop: 15″ padded sleeve",
      "Access: Top lid with wide zip opening",
      "Organization: mesh zip pocket + key hook",
      "Carry: boxy urban shape with side compression straps"
    ]
  }
]

};

