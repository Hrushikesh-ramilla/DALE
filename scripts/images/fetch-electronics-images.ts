import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export interface ElectronicsImageTarget {
  slug: string;
  category:
    | "laptops"
    | "tablets"
    | "headphones"
    | "earbuds"
    | "speakers"
    | "soundbars"
    | "monitors"
    | "keyboards"
    | "mice"
    | "docks-hubs"
    | "routers"
    | "power-banks"
    | "storage"
    | "webcams";
  brand: string;
  model: string;
  urls: string[];
  alt: string;
  localFallback?: string;
  aliases?: string[];
}

export const ELECTRONICS_TARGETS: ElectronicsImageTarget[] = [
  // =========================================================================
  // 1. LAPTOPS
  // =========================================================================
  {
    slug: "apple-macbook-pro-16",
    category: "laptops",
    brand: "Apple",
    model: "MacBook Pro 16 M3 Max Space Black",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/2/21/Apple_MacBook_Pro_16%22_M2_Max.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/a6/M3_Macbook_Pro_14_inch_Space_Grey_model.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/40/Apple_MacBook_Pro_%28M3%29.jpg"
    ],
    alt: "Apple MacBook Pro 16 M3 Max Space Black Liquid Retina XDR professional workstation",
    localFallback: "laptops-apple-macbook.webp",
    aliases: ["macbook-pro-16"]
  },
  {
    slug: "apple-macbook-air-13",
    category: "laptops",
    brand: "Apple",
    model: "MacBook Air 13 M3 Midnight",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/1/1a/MacBook_Air_M2.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/7/7b/Apple_MacBook_Air_M2.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/09/MacBook_Air_keyboard_2.jpg"
    ],
    alt: "Apple MacBook Air 13 M3 Midnight anodized aluminum ultrabook",
    localFallback: "laptops-apple-macbook.webp",
    aliases: ["macbook-air-13"]
  },
  {
    slug: "dell-xps-15",
    category: "laptops",
    brand: "Dell",
    model: "XPS 15 9530 InfinityEdge",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/d/df/Dell_XPS_15_%282017%29.png",
      "https://upload.wikimedia.org/wikipedia/commons/1/18/Dell_XPS_15_%282015%29.png"
    ],
    alt: "Dell XPS 15 9530 InfinityEdge CNC machined aluminum and carbon fiber laptop",
    localFallback: "laptops-dell-xps.webp"
  },
  {
    slug: "dell-xps-13",
    category: "laptops",
    brand: "Dell",
    model: "XPS 13 Plus 9340",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/8/8f/Dell_XPS_13_%282018%29.png",
      "https://upload.wikimedia.org/wikipedia/commons/d/d2/Dell_XPS_13_%282017%29.png"
    ],
    alt: "Dell XPS 13 Plus minimalist zero-lattice keyboard compact ultrabook",
    localFallback: "laptops-dell-xps.webp"
  },
  {
    slug: "lenovo-thinkpad-x1",
    category: "laptops",
    brand: "Lenovo",
    model: "ThinkPad X1 Carbon Gen 12",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/48/Lenovo_ThinkPad_X1_Carbon_Ultrabook.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/e/e9/ThinkPad_X1_Carbon_gen7_%280%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/59/Lenovo_ThinkPad_X1_Ultrabook_%28Nov_16%2C_2012%29.png"
    ],
    alt: "Lenovo ThinkPad X1 Carbon Gen 12 carbon-fiber weave business ultrabook",
    localFallback: "laptops-thinkpad.webp"
  },
  {
    slug: "razer-blade-16",
    category: "laptops",
    brand: "Razer",
    model: "Blade 16 Dual-Mode Mini-LED",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/6/6d/Razer_Blade_Pro_1_2018-02-13.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/7/7a/Razer_Blade_Stealth_Late_2017.png"
    ],
    alt: "Razer Blade 16 Dual-Mode Mini-LED anodized black gaming laptop",
    localFallback: "laptops-gaming.webp"
  },
  {
    slug: "asus-rog-zephyrus-g16",
    category: "laptops",
    brand: "ASUS",
    model: "ROG Zephyrus G16 OLED Gaming Laptop",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/c6/ASUS_ROG_Zephyrus_2026-08-15_G14.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/c8/ASUS_ROG_G751JY_Gaming_Laptop_20150604.jpg"
    ],
    alt: "ASUS ROG Zephyrus G16 OLED Slash Lighting slim aluminum gaming laptop",
    localFallback: "laptops-gaming.webp"
  },
  {
    slug: "hp-spectre-x360",
    category: "laptops",
    brand: "HP",
    model: "Spectre x360 14/16",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/5/57/Hp_Spectre_x360.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/b9/Hp_Spectre_x360_13t.jpg"
    ],
    alt: "HP Spectre x360 2-in-1 convertible OLED touchscreen laptop",
    localFallback: "laptops-dell-xps.webp"
  },
  {
    slug: "acer-swift",
    category: "laptops",
    brand: "Acer",
    model: "Swift Go 14 / Swift Edge",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/2/25/Acer_Swift_3_rear-right_edge.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/3/31/Acer_Swift_3_rear-left_edge.jpg"
    ],
    alt: "Acer Swift Go 14 lightweight aluminum OLED laptop",
    localFallback: "laptops-dell-xps.webp"
  },
  {
    slug: "msi-titan-18",
    category: "laptops",
    brand: "MSI",
    model: "Titan 18 HX A14V",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/8/8c/MSI_GT76_Titan_20190601.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/c9/MSI_Gaming_Laptop_on_wood_floor.jpg"
    ],
    alt: "MSI Titan 18 HX extreme performance gaming and workstation laptop",
    localFallback: "laptops-gaming.webp"
  },

  // =========================================================================
  // 2. TABLETS
  // =========================================================================
  {
    slug: "apple-ipad-pro-13",
    category: "tablets",
    brand: "Apple",
    model: "iPad Pro 13 M4 Ultra Retina XDR OLED",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/7/70/Apple_iPad_Pro_11.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/d8/IPad_Pro_11_mockup.png"
    ],
    alt: "Apple iPad Pro 13 M4 tandem OLED Ultra Retina XDR display tablet",
    localFallback: "tablets-signature-pro.webp",
    aliases: ["ipad-pro-13"]
  },
  {
    slug: "apple-ipad-air-11",
    category: "tablets",
    brand: "Apple",
    model: "iPad Air 11 M2 Liquid Retina",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/8/8d/IPad_Air.png",
      "https://upload.wikimedia.org/wikipedia/commons/1/19/IPad_and_iPad_Pro.jpg"
    ],
    alt: "Apple iPad Air 11 M2 Liquid Retina lightweight creative tablet",
    localFallback: "tablets-signature-pro.webp",
    aliases: ["ipad-air-11"]
  },
  {
    slug: "samsung-galaxy-tab-s9-ultra",
    category: "tablets",
    brand: "Samsung",
    model: "Galaxy Tab S9 Ultra Dynamic AMOLED 2X",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/8/80/Samsung_Galaxy_Tab_S5e.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/8/8c/Samsung_Galaxy_Tab_S.png"
    ],
    alt: "Samsung Galaxy Tab S9 Ultra 14.6-inch Dynamic AMOLED 2X flagship tablet",
    localFallback: "tablets-signature-pro.webp"
  },
  {
    slug: "microsoft-surface-pro-11",
    category: "tablets",
    brand: "Microsoft",
    model: "Surface Pro 11 Copilot+ Snapdragon X Elite",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/2/2a/Microsoft_Surface_Pro_3_with_Type_Cover.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/bd/Microsoft_Surface_Pro_3_-_1.jpg"
    ],
    alt: "Microsoft Surface Pro 11 Copilot+ 2-in-1 tablet with kickstand",
    localFallback: "tablets-signature-pro.webp"
  },
  {
    slug: "lenovo-tab-p12",
    category: "tablets",
    brand: "Lenovo",
    model: "Lenovo Tab P12 3K LCD Tablet",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/c5/Lenovo_Tab_M10_FHD_Plus_%282026%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/62/Lenovo_tablet_%282021%29.jpg"
    ],
    alt: "Lenovo Tab P12 high-resolution entertainment and productivity tablet",
    localFallback: "tablets-signature-pro.webp"
  },

  // =========================================================================
  // 3. AUDIO, HEADPHONES, EARBUDS, SOUNDBARS & SPEAKERS
  // =========================================================================
  {
    slug: "sony-wh1000xm5",
    category: "headphones",
    brand: "Sony",
    model: "WH-1000XM5 Noise-Canceling Wireless Headphones",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/b/b2/Sony_Headphones_%2840476165073%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/bb/Headphones_Sony_super-light.jpg"
    ],
    alt: "Sony WH-1000XM5 premium active noise cancelling wireless over-ear headphones",
    localFallback: "headphones-sony-wh1000xm5.webp"
  },
  {
    slug: "bose-qc-ultra",
    category: "headphones",
    brand: "Bose",
    model: "QuietComfort Ultra Headphones",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/8/86/Bose_QuietComfort_25_Acoustic_Noise_Cancelling_Headphones.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/0a/Bose_QuietComfort_25_Acoustic_Noise_Cancelling_Headphones_with_Carry_Case.jpg"
    ],
    alt: "Bose QuietComfort Ultra spatial audio noise-canceling headphones",
    localFallback: "headphones-bose-qc.webp"
  },
  {
    slug: "apple-airpods-max",
    category: "headphones",
    brand: "Apple",
    model: "AirPods Max Space Gray",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/7/7e/Apple_airpods_max_1.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/68/Apple_airpods_max_3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/3/33/Apple_airpods_max_with_case.jpg"
    ],
    alt: "Apple AirPods Max stainless steel canopy and memory foam over-ear headphones",
    localFallback: "headphones-sony-wh1000xm5.webp"
  },
  {
    slug: "apple-airpods-pro-2",
    category: "earbuds",
    brand: "Apple",
    model: "AirPods Pro (2nd Generation) with MagSafe Case",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/2/2f/AirPods_Pro_%282nd_generation%29.jpg"
    ],
    alt: "Apple AirPods Pro 2 active noise cancelling wireless earbuds with MagSafe case",
    localFallback: "earbuds-apple-airpods-pro.webp"
  },
  {
    slug: "devialet-phantom-i",
    category: "speakers",
    brand: "Devialet",
    model: "Phantom I 108dB Wireless Speaker",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/6/6a/Devialet_Phantom_speaker_%2816948765420%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/60/Devialet_Phantom_side_view_%282015-04-16_14.50.41_by_c-g.%29.jpg"
    ],
    alt: "Devialet Phantom I 108dB audiophile spherical wireless acoustic speaker",
    localFallback: "speakers-devialet-phantom.webp"
  },
  {
    slug: "devialet-phantom-ii",
    category: "speakers",
    brand: "Devialet",
    model: "Phantom II 98dB Compact Wireless Speaker",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/6/60/Devialet_Phantom_side_view_%282015-04-16_14.50.41_by_c-g.%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/6a/Devialet_Phantom_speaker_%2816948765420%29.jpg"
    ],
    alt: "Devialet Phantom II 98dB ultra-compact high-fidelity speaker",
    localFallback: "speakers-devialet-phantom.webp"
  },
  {
    slug: "bang-olufsen-beosound-2",
    category: "speakers",
    brand: "Bang & Olufsen",
    model: "Beosound 2 Luxury Acoustic Speaker",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/d/d8/Bang_%26_Olufsen_BeoVision_tv_and_BeoLab14_speakers_%2814865163179%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/d0/Bang_%26_Olufsen_Beoplay_Charging_Pad.jpg"
    ],
    alt: "Bang & Olufsen Beosound 2 conical aluminum multiroom acoustic speaker",
    localFallback: "speakers-devialet-phantom.webp"
  },
  {
    slug: "bang-olufsen-beolab-28",
    category: "speakers",
    brand: "Bang & Olufsen",
    model: "Beolab 28 Luxury Acoustic Column Speaker",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/d/d8/Bang_%26_Olufsen_BeoVision_tv_and_BeoLab14_speakers_%2814865163179%29.jpg"
    ],
    alt: "Bang & Olufsen Beolab 28 motorized oak acoustic stereo speaker",
    localFallback: "speakers-devialet-phantom.webp"
  },
  {
    slug: "bowers-wilkins-zeppelin",
    category: "speakers",
    brand: "Bowers & Wilkins",
    model: "Zeppelin Wireless Smart Speaker",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/1/12/Bowers_%26_Wilkins_Zeppelin_on_red_furniture.jpg"
    ],
    alt: "Bowers & Wilkins Zeppelin iconic airship-inspired high-resolution smart speaker",
    localFallback: "speakers-devialet-phantom.webp"
  },
  {
    slug: "bowers-wilkins-nautilus",
    category: "speakers",
    brand: "Bowers & Wilkins",
    model: "Nautilus Luxury Acoustic Speaker",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/d/d0/Bowers_%26_Wilkins_DM5.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/8/8b/Bowers_%26_Wilkins_CM1.jpg"
    ],
    alt: "Bowers & Wilkins Nautilus spiral acoustic chamber statement loudspeaker",
    localFallback: "speakers-devialet-phantom.webp"
  },
  {
    slug: "sonos-arc",
    category: "soundbars",
    brand: "Sonos",
    model: "Sonos Arc Dolby Atmos Smart Soundbar",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/2/20/Sonos_soundbar%2C_2021.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/cd/Samsung_TV_UE55F9000_with_Sonos_soundbar.jpg"
    ],
    alt: "Sonos Arc premium 3D Dolby Atmos panoramic cinematic soundbar",
    localFallback: "soundbars-sonos-arc.webp"
  },
  {
    slug: "sonos-era-300",
    category: "speakers",
    brand: "Sonos",
    model: "Sonos Era 300 Spatial Audio Speaker",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/ca/Sonos_PLAY_5_Wireless_speaker_with_pencil_as_size_comparison.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/2/25/Sonos_PLAY5_Wireless_speaker_with_remote_control_as_size_comparison.jpeg"
    ],
    alt: "Sonos Era 300 hourglass spatial audio smart speaker with Dolby Atmos",
    localFallback: "speakers-devialet-phantom.webp"
  },
  {
    slug: "sennheiser-momentum-4",
    category: "headphones",
    brand: "Sennheiser",
    model: "MOMENTUM 4 Wireless Headphones",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/3/32/Momentum1_0.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/a2/Sennheiser_hd-25_headphones.jpg"
    ],
    alt: "Sennheiser MOMENTUM 4 60-hour battery audiophile noise-cancelling headphones",
    localFallback: "headphones-sony-wh1000xm5.webp"
  },

  // =========================================================================
  // 4. DISPLAYS & COMPUTER PERIPHERALS
  // =========================================================================
  {
    slug: "dell-ultrasharp-32",
    category: "monitors",
    brand: "Dell",
    model: "UltraSharp 32 4K USB-C Hub Monitor U3223QE",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/7/73/Monitor_-_Flickr_-_davispuh.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/3/37/3x_Dell_Ultrasharps.jpg"
    ],
    alt: "Dell UltraSharp 32 4K IPS Black HDR400 USB-C Hub professional monitor",
    localFallback: "monitors-dell-ultrasharp.webp"
  },
  {
    slug: "samsung-odyssey-oled-g9",
    category: "monitors",
    brand: "Samsung",
    model: "Odyssey OLED G9 49-inch Curved Gaming Monitor",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/5/5d/Monitor_-_Flickr_-_davispuh_%285%29.jpg"
    ],
    alt: "Samsung Odyssey OLED G9 49-inch 32:9 dual QHD curved 240Hz gaming display",
    localFallback: "monitors-dell-ultrasharp.webp"
  },
  {
    slug: "lg-ultragear-oled",
    category: "monitors",
    brand: "LG",
    model: "UltraGear OLED Gaming Monitor",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/1/13/Monitor_-_Flickr_-_davispuh_%281%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/5d/Monitor_-_Flickr_-_davispuh_%285%29.jpg"
    ],
    alt: "LG UltraGear OLED 240Hz 0.03ms ultra-fast response curved gaming monitor",
    localFallback: "monitors-dell-ultrasharp.webp"
  },
  {
    slug: "asus-proart",
    category: "monitors",
    brand: "ASUS",
    model: "ProArt Professional 4K Color-Accurate Monitor",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/42/Asus_ProArt_PA246Q_monitor_3.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/6/64/Asus_ProArt_PA246Q_monitor_5.JPG"
    ],
    alt: "ASUS ProArt PA329CRV 4K UHD 98% DCI-P3 factory-calibrated color monitor",
    localFallback: "monitors-dell-ultrasharp.webp"
  },
  {
    slug: "logitech-mx-master-3s",
    category: "mice",
    brand: "Logitech",
    model: "MX Master 3S Performance Wireless Mouse",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/e0/Logitech_MX_Master_3S_HS19.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/13/Logitech_MX_Master_3S_HS21.jpg"
    ],
    alt: "Logitech MX Master 3S quiet click 8K DPI MagSpeed electromagnetic scroll mouse",
    localFallback: "accessories-logitech-mxmaster.webp"
  },
  {
    slug: "razer-deathadder-v3",
    category: "mice",
    brand: "Razer",
    model: "DeathAdder V3 Pro Wireless Gaming Mouse",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/0/01/Razer_DeathAdder_Elite-front_oblique-ar_16to10-fs_PNr%C2%B00465.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/19/Razer_DeathAdder_2013_Edition-front_oblique-ar_16to10-fs_PNr%C2%B00400.jpg"
    ],
    alt: "Razer DeathAdder V3 Pro ultra-lightweight esports wireless gaming mouse",
    localFallback: "accessories-logitech-mxmaster.webp"
  },
  {
    slug: "keychron-q1-pro",
    category: "keyboards",
    brand: "Keychron",
    model: "Keychron Q1 Pro Custom QMK/VIA Mechanical Keyboard",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/0/00/Keychron_K8_Non-Backlight_Wireless_Mechanical_Keyboard_-_52772912798.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/7/7d/Keychron_K8_Non-Backlight_Wireless_Mechanical_Keyboard_-_52772428371.jpg"
    ],
    alt: "Keychron Q1 Pro CNC aluminum hot-swappable custom mechanical keyboard",
    localFallback: "accessories-keychron-keyboard.webp"
  },
  {
    slug: "logitech-mx-mechanical",
    category: "keyboards",
    brand: "Logitech",
    model: "MX Mechanical Wireless Keyboard",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/5/5b/Mechanical_Logitech_keyboard.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/4b/Logitech_Mechanical_Keyboard_%2849279967096%29.jpg"
    ],
    alt: "Logitech MX Mechanical low-profile tactile quiet wireless keyboard",
    localFallback: "accessories-keychron-keyboard.webp"
  },
  {
    slug: "caldigit-ts4",
    category: "docks-hubs",
    brand: "CalDigit",
    model: "TS4 Thunderbolt 4 18-Port Docking Station",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/43/OWC_Thunderbolt_3_Dock.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/6f/Thunderbolt_3_Cable_connected_to_OWC_Thunderbolt_3_Dock.jpg"
    ],
    alt: "CalDigit TS4 Thunderbolt 4 18-port 98W power delivery aluminum workstation dock",
    localFallback: "accessories-usb-dock.webp"
  },
  {
    slug: "anker-778-dock",
    category: "docks-hubs",
    brand: "Anker",
    model: "778 Thunderbolt 4 Docking Station (12-in-1)",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/cb/Anker_PowerExpand_8-in-1-2186.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/08/Anker_PowerExpand_8-in-1-2192.jpg"
    ],
    alt: "Anker 778 Thunderbolt 4 12-in-1 100W 8K multi-display docking station",
    localFallback: "accessories-usb-dock.webp"
  },
  {
    slug: "anker-737-powerbank",
    category: "power-banks",
    brand: "Anker",
    model: "737 Power Bank (PowerCore 24K) 140W",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/4e/Anker_power_bank_lit.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/e/ee/Anker_power_bank_and_cable.jpg"
    ],
    alt: "Anker 737 PowerCore 24K 140W two-way fast charging smart display power bank",
    localFallback: "accessories-power-bank.webp"
  },
  {
    slug: "tplink-deco-be85",
    category: "routers",
    brand: "TP-Link",
    model: "Deco BE85 Wi-Fi 7 Mesh Router",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/3/36/Wifi_mesh_TP-link_deco_m4r.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/9/94/Wi-Fi_mesh_system_Deco_M9_Plus.jpg"
    ],
    alt: "TP-Link Deco BE85 tri-band 10Gbps Wi-Fi 7 whole home mesh networking system",
    localFallback: "accessories-signature-router.webp"
  },
  {
    slug: "asus-rog-rapture",
    category: "routers",
    brand: "ASUS",
    model: "ROG Rapture GT-BE98 Pro Gaming Router",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/c8/ASUS_ROG_Rapture_GT-AX11000_Pro_sample_20231216.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/d3/ASUS_ROG_Strix_GS-BE18000_Gaming_Router.jpg"
    ],
    alt: "ASUS ROG Rapture quad-band Wi-Fi 7 dual 10G gaming router with spider antennas",
    localFallback: "accessories-signature-router.webp"
  },
  {
    slug: "netgear-orbi-970",
    category: "routers",
    brand: "Netgear",
    model: "Orbi 970 Series Quad-Band Wi-Fi 7 Mesh",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/40/Netgear_Orbi_1_2017-10-23.jpg"
    ],
    alt: "Netgear Orbi 970 Series quad-band Wi-Fi 7 whole-home mesh satellite tower",
    localFallback: "accessories-signature-router.webp"
  },
  {
    slug: "sandisk-extreme-pro",
    category: "storage",
    brand: "SanDisk",
    model: "SanDisk Extreme PRO Portable SSD V2",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/7/7c/SanDisk_Extreme_Portable_SSD_1_TB_-_front_view.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/43/SanDisk_Extreme_Portable_SSD_1_TB_-_front_view_with_cable.jpg"
    ],
    alt: "SanDisk Extreme PRO rugged 2000MB/s NVMe portable solid state drive",
    localFallback: "storage-sandisk-extreme.webp"
  },
  {
    slug: "samsung-990-pro",
    category: "storage",
    brand: "Samsung",
    model: "Samsung 990 PRO NVMe M.2 SSD",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/46/SAMSUNG_M.2_NVMe_SSD_990_PRO_4TB.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/b8/SAMSUNG_M.2_NVMe_SSD_990_PRO_4TB_%282%29.jpg"
    ],
    alt: "Samsung 990 PRO PCIe 4.0 NVMe M.2 internal gaming solid state drive",
    localFallback: "storage-sandisk-extreme.webp"
  },
  {
    slug: "logitech-brio-4k",
    category: "webcams",
    brand: "Logitech",
    model: "Logitech Brio 4K Pro Webcam",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/5/54/Logitech_Brio_301_webcam_HS1.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/19/Logitech_Brio_301_webcam_HS2.jpg"
    ],
    alt: "Logitech Brio 4K Pro HDR RightLight 3 streaming webcam",
    localFallback: "electronics-webcam.webp"
  },
  {
    slug: "elgato-facecam-pro",
    category: "webcams",
    brand: "Elgato",
    model: "Elgato Facecam Pro 4K 60fps Webcam",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/e5/Logitech_Brio_301_webcam_HS3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/54/Logitech_Brio_301_webcam_HS1.jpg"
    ],
    alt: "Elgato Facecam Pro 4K 60fps ultra HD studio optics creator webcam",
    localFallback: "electronics-webcam.webp"
  }
];

export async function fetchAndProcessElectronicsImages() {
  const targetDir = path.join(process.cwd(), "public", "images", "products");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  let success = 0;
  let fallbackCount = 0;
  let failed = 0;

  console.log(`[Electronics Specialist] Processing ${ELECTRONICS_TARGETS.length} iconic hardware models...`);

  for (const item of ELECTRONICS_TARGETS) {
    const filename = `electronics-${item.slug}.webp`;
    const dest = path.join(targetDir, filename);

    let imageBuffer: Buffer | null = null;
    let usedSource = "";

    // 1. Try remote authentic Wikimedia Commons URLs
    for (const url of item.urls) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          // Delay to respect rate limits
          await new Promise((resolve) => setTimeout(resolve, 600));

          const res = await fetch(url, {
            headers: {
              "User-Agent": "ElectronicsCatalogBot/1.0 (https://buyerguard.luxury; dev@buyerguard.luxury)",
              Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
            }
          });

          if (res.status === 429) {
            console.warn(`  [429 RATE LIMIT] Backing off 2.5s for ${item.model}...`);
            await new Promise((resolve) => setTimeout(resolve, 2500));
            continue;
          }

          if (!res.ok) {
            continue;
          }

          const rawBuf = Buffer.from(await res.arrayBuffer());
          if (rawBuf.length < 500) {
            continue;
          }

          imageBuffer = rawBuf;
          usedSource = `remote: ${url.split("/").pop()?.slice(0, 30)}`;
          break;
        } catch {
          // try next
        }
      }
      if (imageBuffer) break;
    }

    // 2. Fallback to high-quality existing local base photography if remote unavailable
    if (!imageBuffer && item.localFallback) {
      const localPath = path.join(targetDir, item.localFallback);
      if (fs.existsSync(localPath)) {
        imageBuffer = fs.readFileSync(localPath);
        usedSource = `local fallback: ${item.localFallback}`;
        fallbackCount++;
      }
    }

    if (!imageBuffer) {
      console.error(`[FAILED] No source found for: ${item.model}`);
      failed++;
      continue;
    }

    try {
      // Resize to 600x600, fit "contain" on #fbfbfb, compress to WebP (quality 82, 15-30 KB)
      const webpBuffer = await sharp(imageBuffer)
        .resize(600, 600, {
          fit: "contain",
          background: { r: 251, g: 251, b: 251, alpha: 1 }
        })
        .webp({
          quality: 82,
          effort: 6
        })
        .toBuffer();

      fs.writeFileSync(dest, webpBuffer);
      const kb = (webpBuffer.length / 1024).toFixed(1);
      console.log(
        `[SAVED] ${filename.padEnd(38)} -> ${kb.padStart(5)} KB (${usedSource})`
      );
      success++;

      // Write any configured aliases
      if (item.aliases && item.aliases.length > 0) {
        for (const alias of item.aliases) {
          const aliasFilename = `electronics-${alias}.webp`;
          const aliasDest = path.join(targetDir, aliasFilename);
          fs.writeFileSync(aliasDest, webpBuffer);
          console.log(`  └─ [ALIAS] ${aliasFilename.padEnd(34)} -> synced`);
        }
      }
    } catch (err: any) {
      console.error(`[ERROR] Processing ${filename}: ${err.message}`);
      failed++;
    }
  }

  console.log(
    `\n[Electronics Specialist] Complete: ${success} saved (${fallbackCount} via high-res local base), ${failed} failed.`
  );
  return { success, failed };
}

if (process.argv[1]?.includes("fetch-electronics-images")) {
  fetchAndProcessElectronicsImages()
    .then(({ failed }) => {
      if (failed > 0) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
