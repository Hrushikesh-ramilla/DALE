import { ProductQuery, ProductImageResolution, makeImg } from "./types";

export function resolveElectronicsImage(product: ProductQuery): ProductImageResolution | null {
  const leaf = (product.leafType || product.category || "").toLowerCase();
  const nameLower = (product.name || "").toLowerCase();
  const brandLower = (product.brand || "").toLowerCase();
  const modelLower = (
    product.modelName ||
    (product.attributes?.modelName as string) ||
    ""
  ).toLowerCase();
  const idLower = (product.id || "").toLowerCase();
  const fullText = `${nameLower} ${brandLower} ${modelLower} ${idLower}`;

  const electronicsLeaves = [
    "laptops", "tablets", "headphones", "earbuds", "speakers", "soundbars",
    "monitors", "keyboards", "mice", "docks-hubs",
    "power-banks", "wall-chargers", "portable-ssds", "cables"
  ];

  const isElectronics =
    electronicsLeaves.includes(leaf) ||
    product.category === "electronics" ||
    product.category === "audio" ||
    product.category === "chargers" ||
    product.category === "docks" ||
    product.category === "storage";

  if (!isElectronics) return null;

  // =========================================================================
  // 1. LAPTOPS & WORKSTATIONS
  // =========================================================================
  if (
    leaf === "laptops" ||
    fullText.includes("laptop") ||
    fullText.includes("notebook") ||
    fullText.includes("macbook") ||
    fullText.includes("thinkpad") ||
    fullText.includes("zenbook") ||
    fullText.includes("vivobook") ||
    fullText.includes("zephyrus") ||
    fullText.includes("ultrabook")
  ) {
    // Apple MacBook
    if (brandLower.includes("apple") || fullText.includes("macbook")) {
      if (fullText.includes("pro 16") || (fullText.includes("16") && fullText.includes("pro"))) {
        return makeImg("electronics-apple-macbook-pro-16.webp", "Apple MacBook Pro 16 M3 Max Space Black Liquid Retina XDR professional workstation", "Apple");
      }
      if (fullText.includes("pro 14") || fullText.includes("14 (m3)")) {
        return makeImg("laptops-apple-macbook-pro-14-m3.webp", "Apple MacBook Pro 14 M3 Space Black Liquid Retina XDR display laptop", "Apple");
      }
      if (fullText.includes("air 15")) {
        return makeImg("laptops-apple-macbook-air-15-m3.webp", "Apple MacBook Air 15 M3 Space Gray Liquid Retina laptop", "Apple");
      }
      if (fullText.includes("air 13 (m3)") || fullText.includes("air 13 m3")) {
        return makeImg("laptops-apple-macbook-air-13-m3.webp", "Apple MacBook Air 13 M3 Starlight ultrabook", "Apple");
      }
      if (fullText.includes("air 13 (m2)") || fullText.includes("air 13 m2")) {
        return makeImg("laptops-apple-macbook-air-13-m2.webp", "Apple MacBook Air 13 M2 Midnight ultrabook", "Apple");
      }
      return makeImg("laptops-apple-macbook-air.webp", "Apple MacBook Air M3 Liquid Retina lightweight aluminum ultrabook", "Apple");
    }

    // Samsung Galaxy Book
    if (brandLower.includes("samsung") || fullText.includes("galaxy book")) {
      if (fullText.includes("book4 ultra")) return makeImg("laptops-samsung-galaxy-book4-ultra.webp", "Samsung Galaxy Book4 Ultra laptop", "Samsung");
      if (fullText.includes("book4 pro 14")) return makeImg("laptops-samsung-galaxy-book4-pro-14.webp", "Samsung Galaxy Book4 Pro 14 laptop", "Samsung");
      if (fullText.includes("book4 pro 16")) return makeImg("laptops-samsung-galaxy-book4-pro-16.webp", "Samsung Galaxy Book4 Pro 16 laptop", "Samsung");
      if (fullText.includes("book4 pro 360")) return makeImg("laptops-samsung-galaxy-book4-pro-360.webp", "Samsung Galaxy Book4 Pro 360 2-in-1 laptop", "Samsung");
      if (fullText.includes("book4 360")) return makeImg("laptops-samsung-galaxy-book4-360.webp", "Samsung Galaxy Book4 360 convertible laptop", "Samsung");
      if (fullText.includes("book4 edge 14")) return makeImg("laptops-samsung-galaxy-book4-edge-14.webp", "Samsung Galaxy Book4 Edge 14 Snapdragon laptop", "Samsung");
      if (fullText.includes("book4 edge 16")) return makeImg("laptops-samsung-galaxy-book4-edge-16.webp", "Samsung Galaxy Book4 Edge 16 Snapdragon laptop", "Samsung");
      if (fullText.includes("book4 standard") || fullText.includes("book4")) return makeImg("laptops-samsung-galaxy-book4.webp", "Samsung Galaxy Book4 grey laptop", "Samsung");
      if (fullText.includes("book3 360")) return makeImg("laptops-samsung-galaxy-book3-360.webp", "Samsung Galaxy Book3 360 laptop", "Samsung");
      if (fullText.includes("book3 ultra")) return makeImg("laptops-samsung-galaxy-book3-ultra.webp", "Samsung Galaxy Book3 Ultra RTX laptop", "Samsung");
    }

    // LG gram & UltraPC
    if (brandLower.includes("lg") || fullText.includes("gram") || fullText.includes("ultrapc")) {
      if (fullText.includes("gram pro 2-in-1") || fullText.includes("16t90sp")) return makeImg("laptops-lg-gram-pro-2in1-16.webp", "LG gram Pro 2-in-1 16 convertible laptop", "LG");
      if (fullText.includes("gram 2-in-1") || fullText.includes("14t90s")) return makeImg("laptops-lg-gram-2in1-14.webp", "LG gram 2-in-1 14 convertible laptop", "LG");
      if (fullText.includes("superslim") || fullText.includes("15z90st")) return makeImg("laptops-lg-gram-superslim-15.webp", "LG gram SuperSlim 15 OLED laptop", "LG");
      if (fullText.includes("gram pro 16") || fullText.includes("16z90sp")) return makeImg("laptops-lg-gram-pro-16.webp", "LG gram Pro 16 OLED laptop", "LG");
      if (fullText.includes("gram pro 17") || fullText.includes("17z90sp")) return makeImg("laptops-lg-gram-pro-17.webp", "LG gram Pro 17 lightweight laptop", "LG");
      if (fullText.includes("gram 14") || fullText.includes("14z90s")) return makeImg("laptops-lg-gram-14.webp", "LG gram 14 lightweight laptop", "LG");
      if (fullText.includes("gram 15") || fullText.includes("15z90s")) return makeImg("laptops-lg-gram-15.webp", "LG gram 15 lightweight laptop", "LG");
      if (fullText.includes("gram 16") || fullText.includes("16z90s")) return makeImg("laptops-lg-gram-16.webp", "LG gram 16 lightweight laptop", "LG");
      if (fullText.includes("gram 17") || fullText.includes("17z90s")) return makeImg("laptops-lg-gram-17.webp", "LG gram 17 lightweight laptop", "LG");
      if (fullText.includes("ultrapc")) return makeImg("laptops-lg-ultrapc-16.webp", "LG UltraPC 16 laptop", "LG");
    }

    // Framework
    if (brandLower.includes("framework") || fullText.includes("framework")) {
      if (fullText.includes("16")) return makeImg("laptops-framework-16.webp", "Framework Laptop 16 modular gaming notebook", "Framework");
      return makeImg("laptops-framework-13.webp", "Framework Laptop 13 modular notebook", "Framework");
    }

    // ASUS (Zenbook, ROG, Vivobook, ExpertBook, TUF)
    if (
      brandLower.includes("asus") ||
      brandLower.includes("rog") ||
      fullText.includes("zenbook") ||
      fullText.includes("vivobook") ||
      fullText.includes("zephyrus") ||
      fullText.includes("strix") ||
      fullText.includes("expertbook") ||
      fullText.includes("tuf gaming")
    ) {
      if (fullText.includes("flow z13")) return makeImg("laptops-asus-rog-flow-z13.webp", "ROG Flow Z13 gaming tablet laptop", "ASUS");
      if (fullText.includes("zephyrus g14")) return makeImg("laptops-asus-rog-zephyrus-g14.webp", "ROG Zephyrus G14 gaming laptop", "ASUS");
      if (fullText.includes("zephyrus g16")) return makeImg("laptops-asus-rog-zephyrus-g16.webp", "ROG Zephyrus G16 gaming laptop", "ASUS");
      if (fullText.includes("scar 16") || fullText.includes("strix scar 16")) return makeImg("laptops-asus-rog-strix-scar-16.webp", "ROG Strix SCAR 16 gaming laptop", "ASUS");
      if (fullText.includes("scar 18") || fullText.includes("strix scar 18")) return makeImg("laptops-asus-rog-strix-scar-18.webp", "ROG Strix SCAR 18 gaming laptop", "ASUS");
      if (fullText.includes("tuf gaming")) return makeImg("laptops-asus-tuf-gaming-a15.webp", "ASUS TUF Gaming A15 laptop", "ASUS");
      if (fullText.includes("zenbook duo")) return makeImg("laptops-asus-zenbook-duo.webp", "ASUS Zenbook DUO dual-screen OLED laptop", "ASUS");
      if (fullText.includes("zenbook s 16") || fullText.includes("um5606")) return makeImg("laptops-asus-zenbook-s16.webp", "ASUS Zenbook S 16 Ceraluminum laptop", "ASUS");
      if (fullText.includes("expertbook")) return makeImg("laptops-asus-expertbook-b9.webp", "ASUS ExpertBook B9 OLED business laptop", "ASUS");
      if (fullText.includes("vivobook s 14")) return makeImg("laptops-asus-vivobook-s14.webp", "ASUS Vivobook S 14 OLED laptop", "ASUS");
      if (fullText.includes("vivobook s 15")) return makeImg("laptops-asus-vivobook-s15.webp", "ASUS Vivobook S 15 OLED laptop", "ASUS");
      if (fullText.includes("vivobook pro 15")) return makeImg("laptops-asus-vivobook-pro.webp", "ASUS Vivobook Pro 15 OLED laptop", "ASUS");
      return makeImg("laptops-asus-zenbook.webp", "ASUS Zenbook 14 OLED ultrathin Ceraluminum precision laptop", "ASUS");
    }

    // Acer (Swift, Aspire, Predator, Nitro, TravelMate)
    if (
      brandLower.includes("acer") ||
      brandLower.includes("predator") ||
      fullText.includes("swift") ||
      fullText.includes("aspire") ||
      fullText.includes("predator") ||
      fullText.includes("nitro") ||
      fullText.includes("travelmate")
    ) {
      if (fullText.includes("edge 16") || fullText.includes("sfe16")) return makeImg("laptops-acer-swift-edge-16.webp", "Acer Swift Edge 16 OLED laptop", "Acer");
      if (fullText.includes("swift x") || fullText.includes("sfx14")) return makeImg("laptops-acer-swift-x-14.webp", "Acer Swift X 14 creator laptop", "Acer");
      if (fullText.includes("go 14") || fullText.includes("sfg14")) return makeImg("laptops-acer-swift-go-14.webp", "Acer Swift Go 14 OLED laptop", "Acer");
      if (fullText.includes("go 16") || fullText.includes("sfg16")) return makeImg("laptops-acer-swift-go-16.webp", "Acer Swift Go 16 OLED laptop", "Acer");
      if (fullText.includes("aspire vero")) return makeImg("laptops-acer-aspire-vero-16.webp", "Acer Aspire Vero 16 eco laptop", "Acer");
      if (fullText.includes("aspire 5")) return makeImg("laptops-acer-aspire-5.webp", "Acer Aspire 5 15 laptop", "Acer");
      if (fullText.includes("helios 16") || fullText.includes("ph16")) return makeImg("laptops-acer-predator-helios-16.webp", "Predator Helios 16 gaming laptop", "Acer");
      if (fullText.includes("helios 18") || fullText.includes("ph18")) return makeImg("laptops-acer-predator-helios-18.webp", "Predator Helios 18 gaming laptop", "Acer");
      if (fullText.includes("triton neo") || fullText.includes("ptn16")) return makeImg("laptops-acer-predator-triton-neo-16.webp", "Predator Triton Neo 16 gaming laptop", "Acer");
      if (fullText.includes("nitro 16") || fullText.includes("an16")) return makeImg("laptops-acer-nitro-16.webp", "Acer Nitro 16 gaming laptop", "Acer");
      if (fullText.includes("travelmate")) return makeImg("laptops-acer-travelmate-p6.webp", "Acer TravelMate P6 magnesium laptop", "Acer");
      return makeImg("laptops-acer-swift.webp", "Acer Swift Go lightweight aluminum OLED laptop", "Acer");
    }

    // Dell & Alienware
    if (brandLower.includes("dell") || brandLower.includes("alienware") || fullText.includes("xps") || fullText.includes("alienware")) {
      if (fullText.includes("m18")) return makeImg("laptops-dell-alienware-m18-r2.webp", "Alienware m18 R2 gaming laptop", "Dell");
      if (fullText.includes("m16")) return makeImg("laptops-dell-alienware-m16-r2.webp", "Alienware m16 R2 gaming laptop", "Dell");
      if (fullText.includes("x16")) return makeImg("laptops-dell-alienware-x16-r2.webp", "Alienware x16 R2 gaming laptop", "Dell");
      if (fullText.includes("xps 16") || fullText.includes("9640")) return makeImg("laptops-dell-xps-16.webp", "Dell XPS 16 9640 OLED workstation laptop", "Dell");
      if (fullText.includes("xps 15") || fullText.includes("9530")) return makeImg("electronics-dell-xps-15.webp", "Dell XPS 15 9530 laptop", "Dell");
      if (fullText.includes("xps 14") || fullText.includes("9440")) return makeImg("laptops-dell-xps-14.webp", "Dell XPS 14 9440 laptop", "Dell");
      if (fullText.includes("inspiron 16") || fullText.includes("7640")) return makeImg("laptops-dell-inspiron-16-plus.webp", "Dell Inspiron 16 Plus laptop", "Dell");
      if (fullText.includes("inspiron 14") || fullText.includes("7440")) return makeImg("laptops-dell-inspiron-14-plus.webp", "Dell Inspiron 14 Plus laptop", "Dell");
      if (fullText.includes("latitude 7450")) return makeImg("laptops-dell-latitude-7450.webp", "Dell Latitude 7450 business laptop", "Dell");
      if (fullText.includes("latitude 9450")) return makeImg("laptops-dell-latitude-9450.webp", "Dell Latitude 9450 2-in-1 business laptop", "Dell");
      if (fullText.includes("precision 3591")) return makeImg("laptops-dell-precision-3591.webp", "Dell Precision 3591 mobile workstation", "Dell");
      if (fullText.includes("precision 5690")) return makeImg("laptops-dell-precision-5690.webp", "Dell Precision 5690 mobile workstation", "Dell");
      return makeImg("laptops-dell-xps.webp", "Dell XPS InfinityEdge precision machined aluminum ultrabook", "Dell");
    }

    // HP (Spectre, Envy, Pavilion, OMEN, Victus, EliteBook)
    if (
      brandLower.includes("hp") ||
      fullText.includes("spectre") ||
      fullText.includes("envy") ||
      fullText.includes("pavilion") ||
      fullText.includes("omen") ||
      fullText.includes("victus") ||
      fullText.includes("elitebook")
    ) {
      if (fullText.includes("spectre") && fullText.includes("14")) return makeImg("laptops-hp-spectre-x360-14.webp", "HP Spectre x360 14 2-in-1 laptop", "HP");
      if (fullText.includes("spectre") && fullText.includes("16")) return makeImg("laptops-hp-spectre-x360-16.webp", "HP Spectre x360 16 2-in-1 laptop", "HP");
      if (fullText.includes("envy") && fullText.includes("14")) return makeImg("laptops-hp-envy-x360-14.webp", "HP Envy x360 14 2-in-1 laptop", "HP");
      if (fullText.includes("envy") && fullText.includes("16")) return makeImg("laptops-hp-envy-x360-16.webp", "HP Envy x360 16 2-in-1 laptop", "HP");
      if (fullText.includes("pavilion") && fullText.includes("14")) return makeImg("laptops-hp-pavilion-plus-14.webp", "HP Pavilion Plus 14 OLED laptop", "HP");
      if (fullText.includes("pavilion") && fullText.includes("16")) return makeImg("laptops-hp-pavilion-plus-16.webp", "HP Pavilion Plus 16 laptop", "HP");
      if (fullText.includes("transcend 14")) return makeImg("laptops-hp-omen-transcend-14.webp", "HP OMEN Transcend 14 gaming laptop", "HP");
      if (fullText.includes("transcend 16")) return makeImg("laptops-hp-omen-transcend-16.webp", "HP OMEN Transcend 16 gaming laptop", "HP");
      if (fullText.includes("omen 16")) return makeImg("laptops-hp-omen-16.webp", "HP OMEN 16 gaming laptop", "HP");
      if (fullText.includes("victus")) return makeImg("laptops-hp-victus-16.webp", "HP Victus 16 gaming laptop", "HP");
      if (fullText.includes("elitebook 840")) return makeImg("laptops-hp-elitebook-840-g11.webp", "HP EliteBook 840 G11 notebook", "HP");
      if (fullText.includes("elitebook 1040")) return makeImg("laptops-hp-elitebook-1040-g11.webp", "HP EliteBook 1040 G11 premium notebook", "HP");
      return makeImg("laptops-hp-spectre-x360.webp", "HP Spectre x360 2-in-1 convertible OLED touchscreen laptop", "HP");
    }

    // Lenovo (ThinkPad, Yoga, IdeaPad, Legion)
    if (
      brandLower.includes("lenovo") ||
      brandLower.includes("legion") ||
      fullText.includes("thinkpad") ||
      fullText.includes("yoga") ||
      fullText.includes("ideapad")
    ) {
      if (fullText.includes("x1 2-in-1")) return makeImg("laptops-lenovo-thinkpad-x1-2in1.webp", "Lenovo ThinkPad X1 2-in-1 Gen 9 convertible", "Lenovo");
      if (fullText.includes("x1") || fullText.includes("carbon")) return makeImg("laptops-lenovo-thinkpad-x1.webp", "Lenovo ThinkPad X1 Carbon Gen 12 ultrabook", "Lenovo");
      if (fullText.includes("t14s")) return makeImg("laptops-lenovo-thinkpad-t14s.webp", "Lenovo ThinkPad T14s Gen 5 laptop", "Lenovo");
      if (fullText.includes("t16")) return makeImg("laptops-lenovo-thinkpad-t16.webp", "Lenovo ThinkPad T16 Gen 3 laptop", "Lenovo");
      if (fullText.includes("p1 gen") || fullText.includes("thinkpad p1")) return makeImg("laptops-lenovo-thinkpad-p1.webp", "Lenovo ThinkPad P1 Gen 7 workstation", "Lenovo");
      if (fullText.includes("p16 gen") || fullText.includes("thinkpad p16")) return makeImg("laptops-lenovo-thinkpad-p16.webp", "Lenovo ThinkPad P16 Gen 2 workstation", "Lenovo");
      if (fullText.includes("yoga 9i")) return makeImg("laptops-lenovo-yoga-9i.webp", "Lenovo Yoga 9i 2-in-1 Gen 9 laptop", "Lenovo");
      if (fullText.includes("yoga pro 9i")) return makeImg("laptops-lenovo-yoga-pro-9i.webp", "Lenovo Yoga Pro 9i 16 creator laptop", "Lenovo");
      if (fullText.includes("yoga slim 7x")) return makeImg("laptops-lenovo-yoga-slim-7x.webp", "Lenovo Yoga Slim 7x Snapdragon laptop", "Lenovo");
      if (fullText.includes("ideapad slim 5")) return makeImg("laptops-lenovo-ideapad-slim-5.webp", "Lenovo IdeaPad Slim 5 14 laptop", "Lenovo");
      if (fullText.includes("ideapad pro 5")) return makeImg("laptops-lenovo-ideapad-pro-5.webp", "Lenovo IdeaPad Pro 5 16 laptop", "Lenovo");
      if (fullText.includes("legion 7i")) return makeImg("laptops-lenovo-legion-7i.webp", "Lenovo Legion 7i Gen 9 gaming laptop", "Lenovo");
      if (fullText.includes("legion 9i")) return makeImg("laptops-lenovo-legion-9i.webp", "Lenovo Legion 9i Gen 9 liquid cooled laptop", "Lenovo");
      if (fullText.includes("legion pro 5i")) return makeImg("laptops-lenovo-legion-pro-5i.webp", "Lenovo Legion Pro 5i Gen 9 gaming laptop", "Lenovo");
      return makeImg("laptops-thinkpad.webp", "Lenovo ThinkPad enterprise business laptop with TrackPoint keyboard", "Lenovo");
    }

    // Microsoft Surface Laptop
    if (brandLower.includes("microsoft") || fullText.includes("surface laptop")) {
      if (fullText.includes("laptop studio 2")) return makeImg("laptops-microsoft-surface-laptop-studio-2.webp", "Microsoft Surface Laptop Studio 2", "Microsoft");
      if (fullText.includes("laptop go 3")) return makeImg("laptops-microsoft-surface-laptop-go-3.webp", "Microsoft Surface Laptop Go 3 compact laptop", "Microsoft");
      if (fullText.includes("laptop 7") && fullText.includes("15")) return makeImg("laptops-microsoft-surface-laptop-7-15.webp", "Microsoft Surface Laptop 7 15 Copilot+ PC", "Microsoft");
      if (fullText.includes("laptop 7") && (fullText.includes("13.8") || fullText.includes("13"))) return makeImg("laptops-microsoft-surface-laptop-7-13.webp", "Microsoft Surface Laptop 7 13.8 Copilot+ PC", "Microsoft");
      if (fullText.includes("laptop 6") && fullText.includes("15")) return makeImg("laptops-microsoft-surface-laptop-6-15.webp", "Microsoft Surface Laptop 6 15 for Business", "Microsoft");
      if (fullText.includes("laptop 6") && (fullText.includes("13.5") || fullText.includes("13"))) return makeImg("laptops-microsoft-surface-laptop-6-13.webp", "Microsoft Surface Laptop 6 13.5 for Business", "Microsoft");
      return makeImg("laptops-microsoft-surface-laptop.webp", "Microsoft Surface Laptop 7 Copilot+ PC PixelSense touchscreen ultrabook", "Microsoft");
    }

    // Razer Blade
    if (brandLower.includes("razer") || fullText.includes("blade") || fullText.includes("razer book")) {
      if (fullText.includes("blade 14")) return makeImg("laptops-razer-blade-14.webp", "Razer Blade 14 gaming laptop", "Razer");
      if (fullText.includes("blade 18")) return makeImg("laptops-razer-blade-18.webp", "Razer Blade 18 4K gaming laptop", "Razer");
      if (fullText.includes("blade 15")) return makeImg("laptops-razer-blade-15.webp", "Razer Blade 15 QHD OLED gaming laptop", "Razer");
      if (fullText.includes("blade 17")) return makeImg("laptops-razer-blade-17.webp", "Razer Blade 17 gaming laptop", "Razer");
      if (fullText.includes("book 13")) return makeImg("laptops-razer-book-13.webp", "Razer Book 13 productivity ultrabook", "Razer");
      return makeImg("electronics-razer-blade-16.webp", "Razer Blade 16 Dual-Mode Mini-LED anodized black gaming laptop", "Razer");
    }

    // MSI
    if (brandLower.includes("msi")) {
      if (fullText.includes("raider ge78")) return makeImg("laptops-msi-raider-ge78.webp", "MSI Raider GE78 HX gaming laptop", "MSI");
      if (fullText.includes("stealth 16")) return makeImg("laptops-msi-stealth-16.webp", "MSI Stealth 16 AI Studio laptop", "MSI");
      if (fullText.includes("stealth 14")) return makeImg("laptops-msi-stealth-14.webp", "MSI Stealth 14 AI Studio laptop", "MSI");
      if (fullText.includes("vector 16")) return makeImg("laptops-msi-vector-16.webp", "MSI Vector 16 HX gaming laptop", "MSI");
      if (fullText.includes("katana 15")) return makeImg("laptops-msi-katana-15.webp", "MSI Katana 15 gaming laptop", "MSI");
      if (fullText.includes("cyborg 15")) return makeImg("laptops-msi-cyborg-15.webp", "MSI Cyborg 15 translucent gaming laptop", "MSI");
      if (fullText.includes("prestige 16")) return makeImg("laptops-msi-prestige-16.webp", "MSI Prestige 16 AI Evo laptop", "MSI");
      if (fullText.includes("prestige 13")) return makeImg("laptops-msi-prestige-13.webp", "MSI Prestige 13 AI Evo laptop", "MSI");
      if (fullText.includes("summit e16")) return makeImg("laptops-msi-summit-e16.webp", "MSI Summit E16 AI Studio convertible laptop", "MSI");
      if (fullText.includes("modern 14")) return makeImg("laptops-msi-modern-14.webp", "MSI Modern 14 slim laptop", "MSI");
      return makeImg("electronics-msi-titan-18.webp", "MSI Titan 18 HX extreme performance gaming and workstation laptop", "MSI");
    }

    // Fallback laptop
    return makeImg("laptops-dell-xps.webp", `${product.name} precision ultrabook laptop`, product.brand || "Dell");
  }

  // =========================================================================
  // 2. TABLETS
  // =========================================================================
  if (
    leaf === "tablets" ||
    fullText.includes("tablet") ||
    fullText.includes("ipad") ||
    fullText.includes("galaxy tab") ||
    fullText.includes("surface pro")
  ) {
    // Apple iPad
    if (brandLower.includes("apple") || fullText.includes("ipad")) {
      if (fullText.includes("pro 13") || (fullText.includes("ipad pro") && fullText.includes("13"))) return makeImg("electronics-apple-ipad-pro-13.webp", "Apple iPad Pro 13 M4 tandem OLED Ultra Retina XDR display tablet", "Apple");
      if (fullText.includes("pro 11") || (fullText.includes("ipad pro") && fullText.includes("11"))) return makeImg("electronics-ipad-pro-13.webp", "Apple iPad Pro 11 M4 tandem OLED Ultra Retina XDR display tablet", "Apple");
      if (fullText.includes("air 13")) return makeImg("tablets-apple-ipad-air-13.webp", "Apple iPad Air 13 M2 Liquid Retina creative tablet", "Apple");
      if (fullText.includes("air 11") || fullText.includes("ipad air")) return makeImg("electronics-apple-ipad-air-11.webp", "Apple iPad Air 11 M2 Liquid Retina lightweight creative tablet", "Apple");
      if (fullText.includes("mini 6") || fullText.includes("mini")) return makeImg("tablets-apple-ipad-mini-6.webp", "Apple iPad mini 6th Gen compact tablet", "Apple");
      if (fullText.includes("10th gen") || fullText.includes("ipad 10")) return makeImg("tablets-apple-ipad-10th-gen.webp", "Apple iPad 10th Gen all-screen design tablet", "Apple");
      return makeImg("electronics-ipad-air-11.webp", "Apple iPad Liquid Retina display tablet", "Apple");
    }

    // Samsung Galaxy Tab
    if (brandLower.includes("samsung") || fullText.includes("galaxy tab")) {
      if (fullText.includes("s10 fe")) return makeImg("tablets-samsung-galaxy-tab-s10-fe.webp", "Samsung Galaxy Tab S10 FE S-Pen tablet", "Samsung");
      if (fullText.includes("s9 ultra")) return makeImg("electronics-samsung-galaxy-tab-s9-ultra.webp", "Samsung Galaxy Tab S9 Ultra Dynamic AMOLED 2X tablet", "Samsung");
      if (fullText.includes("s9+") || fullText.includes("s9 plus")) return makeImg("tablets-samsung-galaxy-tab-s9-plus.webp", "Samsung Galaxy Tab S9+ Dynamic AMOLED 2X tablet", "Samsung");
      if (fullText.includes("s9 fe+")) return makeImg("tablets-samsung-galaxy-tab-s9-fe-plus.webp", "Samsung Galaxy Tab S9 FE+ water resistant tablet", "Samsung");
      if (fullText.includes("s9 fe")) return makeImg("tablets-samsung-galaxy-tab-s9-fe.webp", "Samsung Galaxy Tab S9 FE S-Pen tablet", "Samsung");
      if (fullText.includes("tab s9")) return makeImg("tablets-samsung-galaxy-tab-s9.webp", "Samsung Galaxy Tab S9 Dynamic AMOLED tablet", "Samsung");
      if (fullText.includes("a9+")) return makeImg("tablets-samsung-galaxy-tab-a9-plus.webp", "Samsung Galaxy Tab A9+ 11-inch 90Hz tablet", "Samsung");
      if (fullText.includes("a9")) return makeImg("tablets-samsung-galaxy-tab-a9.webp", "Samsung Galaxy Tab A9 compact tablet", "Samsung");
      if (fullText.includes("s6 lite")) return makeImg("tablets-samsung-galaxy-tab-s6-lite.webp", "Samsung Galaxy Tab S6 Lite 2024 S-Pen tablet", "Samsung");
      if (fullText.includes("active5")) return makeImg("tablets-samsung-galaxy-tab-active5.webp", "Samsung Galaxy Tab Active5 rugged IP68 tablet", "Samsung");
      if (fullText.includes("active4")) return makeImg("tablets-samsung-galaxy-tab-active4-pro.webp", "Samsung Galaxy Tab Active4 Pro rugged tablet", "Samsung");
      return makeImg("electronics-samsung-galaxy-tab-s9-ultra.webp", "Samsung Galaxy Tab Dynamic AMOLED tablet", "Samsung");
    }

    // Huawei MatePad
    if (brandLower.includes("huawei") || fullText.includes("matepad")) {
      if (fullText.includes("pro 13.2") || fullText.includes("pro 13")) return makeImg("tablets-huawei-matepad-pro-13-2.webp", "Huawei MatePad Pro 13.2 flexible OLED tablet", "Huawei");
      if (fullText.includes("11.5s") || fullText.includes("11.5")) return makeImg("tablets-huawei-matepad-11-5s.webp", "Huawei MatePad 11.5S PaperMatte tablet", "Huawei");
      if (fullText.includes("air")) return makeImg("tablets-huawei-matepad-air.webp", "Huawei MatePad Air 144Hz lightweight tablet", "Huawei");
      if (fullText.includes("se 11")) return makeImg("tablets-huawei-matepad-se-11.webp", "Huawei MatePad SE 11 metal unibody tablet", "Huawei");
      return makeImg("tablets-huawei-matepad-pro-13-2.webp", "Huawei MatePad tablet", "Huawei");
    }

    // Xiaomi & Redmi Pad
    if (brandLower.includes("xiaomi") || fullText.includes("redmi pad") || fullText.includes("pad 6")) {
      if (fullText.includes("6s pro")) return makeImg("tablets-xiaomi-pad-6s-pro.webp", "Xiaomi Pad 6S Pro 12.4 3K tablet", "Xiaomi");
      if (fullText.includes("pad 6")) return makeImg("tablets-xiaomi-pad-6.webp", "Xiaomi Pad 6 144Hz WQHD+ tablet", "Xiaomi");
      if (fullText.includes("pad pro")) return makeImg("tablets-redmi-pad-pro.webp", "Redmi Pad Pro 12.1 120Hz tablet", "Xiaomi");
      if (fullText.includes("se 8.7")) return makeImg("tablets-redmi-pad-se-8-7.webp", "Redmi Pad SE 8.7 compact pocket tablet", "Xiaomi");
      if (fullText.includes("pad se")) return makeImg("tablets-redmi-pad-se.webp", "Redmi Pad SE 11 FHD+ tablet", "Xiaomi");
      return makeImg("tablets-xiaomi-pad-6.webp", "Xiaomi Pad tablet", "Xiaomi");
    }

    // OnePlus Pad
    if (brandLower.includes("oneplus") || fullText.includes("oneplus pad")) {
      if (fullText.includes("pad 2")) return makeImg("tablets-oneplus-pad-2.webp", "OnePlus Pad 2 3K 144Hz Snapdragon 8 Gen 3 tablet", "OnePlus");
      if (fullText.includes("pad go")) return makeImg("tablets-oneplus-pad-go.webp", "OnePlus Pad Go 2.4K eye care tablet", "OnePlus");
      if (fullText.includes("pad")) return makeImg("tablets-oneplus-pad.webp", "OnePlus Pad ReadFit display tablet", "OnePlus");
    }

    // Google Pixel Tablet
    if (brandLower.includes("google") || fullText.includes("pixel tablet")) {
      return makeImg("tablets-google-pixel-tablet.webp", "Google Pixel Tablet with Speaker Dock", "Google");
    }

    // HONOR Pad
    if (brandLower.includes("honor") || fullText.includes("honor pad")) {
      if (fullText.includes("pad 9")) return makeImg("tablets-honor-pad-9.webp", "HONOR Pad 9 12.1 120Hz 2.5K tablet", "HONOR");
      if (fullText.includes("pad x9")) return makeImg("tablets-honor-pad-x9.webp", "HONOR Pad X9 11.5 120Hz tablet", "HONOR");
      if (fullText.includes("pad x8a")) return makeImg("tablets-honor-pad-x8a.webp", "HONOR Pad X8a 11 90Hz metal tablet", "HONOR");
      if (fullText.includes("pad 8")) return makeImg("tablets-honor-pad-8.webp", "HONOR Pad 8 12 2K FullView tablet", "HONOR");
      return makeImg("tablets-honor-pad-9.webp", "HONOR Pad tablet", "HONOR");
    }

    // Amazon Fire
    if (brandLower.includes("amazon") || fullText.includes("fire hd") || fullText.includes("fire max") || fullText.includes("fire 7")) {
      if (fullText.includes("max 11")) return makeImg("tablets-amazon-fire-max-11.webp", "Amazon Fire Max 11 aluminum tablet", "Amazon");
      if (fullText.includes("hd 10")) return makeImg("tablets-amazon-fire-hd-10.webp", "Amazon Fire HD 10 1080p tablet", "Amazon");
      if (fullText.includes("hd 8")) return makeImg("tablets-amazon-fire-hd-8.webp", "Amazon Fire HD 8 tablet", "Amazon");
      if (fullText.includes("fire 7")) return makeImg("tablets-amazon-fire-7.webp", "Amazon Fire 7 compact tablet", "Amazon");
      return makeImg("tablets-amazon-fire-hd-10.webp", "Amazon Fire tablet", "Amazon");
    }

    // realme Pad
    if (brandLower.includes("realme") || fullText.includes("realme pad")) {
      if (fullText.includes("pad 2 lite")) return makeImg("tablets-realme-pad-2-lite.webp", "realme Pad 2 Lite 90Hz tablet", "realme");
      if (fullText.includes("pad 2")) return makeImg("tablets-realme-pad-2.webp", "realme Pad 2 120Hz 2K tablet", "realme");
      if (fullText.includes("pad mini")) return makeImg("tablets-realme-pad-mini.webp", "realme Pad mini ultra-slim tablet", "realme");
      if (fullText.includes("pad x")) return makeImg("tablets-realme-pad-x.webp", "realme Pad X 11 2K WUXGA+ tablet", "realme");
      return makeImg("tablets-realme-pad-2.webp", "realme Pad tablet", "realme");
    }

    // TCL NXTPAPER
    if (brandLower.includes("tcl") || fullText.includes("nxtpaper")) {
      if (fullText.includes("14")) return makeImg("tablets-tcl-nxtpaper-14.webp", "TCL NXTPAPER 14 matte paper-like tablet", "TCL");
      return makeImg("tablets-tcl-nxtpaper-11.webp", "TCL NXTPAPER 11 nano-chemical paper tablet", "TCL");
    }

    // Lenovo Tab
    if (brandLower.includes("lenovo") || brandLower.includes("yoga") || fullText.includes("tab p12") || fullText.includes("tab p11") || fullText.includes("tab m") || fullText.includes("legion tab") || fullText.includes("yoga tab")) {
      if (fullText.includes("legion tab") || fullText.includes("y700")) return makeImg("tablets-lenovo-legion-tab-y700.webp", "Lenovo Legion Tab Gen 2 Y700 gaming tablet", "Lenovo");
      if (fullText.includes("yoga tab 13")) return makeImg("tablets-lenovo-yoga-tab-13.webp", "Lenovo Yoga Tab 13 alcantara kickstand tablet", "Lenovo");
      if (fullText.includes("yoga tab 11")) return makeImg("tablets-lenovo-yoga-tab-11.webp", "Lenovo Yoga Tab 11 fabric kickstand tablet", "Lenovo");
      if (fullText.includes("p12 pro")) return makeImg("tablets-lenovo-tab-p12-pro.webp", "Lenovo Tab P12 Pro 12.6 AMOLED tablet", "Lenovo");
      if (fullText.includes("tab p12")) return makeImg("electronics-lenovo-tab-p12.webp", "Lenovo Tab P12 3K entertainment tablet", "Lenovo");
      if (fullText.includes("p11 pro")) return makeImg("tablets-lenovo-tab-p11-pro.webp", "Lenovo Tab P11 Pro Gen 2 OLED tablet", "Lenovo");
      if (fullText.includes("tab p11")) return makeImg("tablets-lenovo-tab-p11.webp", "Lenovo Tab P11 Gen 2 120Hz tablet", "Lenovo");
      if (fullText.includes("m10 plus")) return makeImg("tablets-lenovo-tab-m10-plus.webp", "Lenovo Tab M10 Plus Gen 3 2K tablet", "Lenovo");
      if (fullText.includes("tab m11")) return makeImg("tablets-lenovo-tab-m11.webp", "Lenovo Tab M11 90Hz quad speakers tablet", "Lenovo");
      if (fullText.includes("tab m9")) return makeImg("tablets-lenovo-tab-m9.webp", "Lenovo Tab M9 compact tablet", "Lenovo");
      return makeImg("electronics-lenovo-tab-p12.webp", "Lenovo Tab tablet", "Lenovo");
    }

    // Microsoft Surface Pro
    if (brandLower.includes("microsoft") || fullText.includes("surface pro") || fullText.includes("surface go")) {
      if (fullText.includes("surface pro 11")) return makeImg("electronics-microsoft-surface-pro-11.webp", "Microsoft Surface Pro 11 Copilot+ 2-in-1 tablet", "Microsoft");
      if (fullText.includes("surface pro 10")) return makeImg("tablets-microsoft-surface-pro-10.webp", "Microsoft Surface Pro 10 for Business", "Microsoft");
      if (fullText.includes("surface pro 9")) return makeImg("tablets-microsoft-surface-pro-9.webp", "Microsoft Surface Pro 9 sapphire blue tablet", "Microsoft");
      if (fullText.includes("surface go 4") || fullText.includes("surface go")) return makeImg("tablets-microsoft-surface-go-4.webp", "Microsoft Surface Go 4 for Business compact tablet", "Microsoft");
      return makeImg("electronics-microsoft-surface-pro-11.webp", "Microsoft Surface Pro tablet", "Microsoft");
    }

    return makeImg("electronics-apple-ipad-pro-13.webp", `${product.name} pro tablet`, product.brand || "Apple");
  }

  // =========================================================================
  // 3. AUDIO: HEADPHONES & EARBUDS
  // =========================================================================
  if (
    leaf === "headphones" ||
    leaf === "earbuds" ||
    fullText.includes("headphone") ||
    fullText.includes("earphone") ||
    fullText.includes("earbuds") ||
    fullText.includes("airpods")
  ) {
    // Apple AirPods Max
    if (fullText.includes("airpods max") || (brandLower.includes("apple") && fullText.includes("max"))) {
      return makeImg(
        "electronics-apple-airpods-max.webp",
        "Apple AirPods Max stainless steel canopy and memory foam over-ear headphones",
        "Apple"
      );
    }

    // Apple AirPods Pro & Wireless Earbuds
    if (fullText.includes("airpods pro") || fullText.includes("airpods") || leaf === "earbuds") {
      return makeImg(
        "electronics-apple-airpods-pro-2.webp",
        "Apple AirPods Pro 2 active noise cancelling wireless earbuds with MagSafe case",
        "Apple"
      );
    }

    // Sony Over-Ear
    if (brandLower.includes("sony") || fullText.includes("1000xm5") || fullText.includes("1000xm4") || fullText.includes("wh-")) {
      return makeImg(
        "electronics-sony-wh1000xm5.webp",
        "Sony WH-1000XM5 premium active noise cancelling wireless over-ear headphones",
        "Sony"
      );
    }

    // Bose
    if (brandLower.includes("bose") || fullText.includes("quietcomfort") || fullText.includes("qc ")) {
      return makeImg(
        "electronics-bose-qc-ultra.webp",
        "Bose QuietComfort Ultra spatial audio noise-canceling headphones",
        "Bose"
      );
    }

    // Sennheiser
    if (brandLower.includes("sennheiser") || fullText.includes("momentum")) {
      return makeImg(
        "electronics-sennheiser-momentum-4.webp",
        "Sennheiser MOMENTUM 4 60-hour battery audiophile noise-cancelling headphones",
        "Sennheiser"
      );
    }

    // Fallbacks
    if (leaf === "earbuds") {
      return makeImg(
        "electronics-apple-airpods-pro-2.webp",
        `${product.name} active noise cancelling true wireless earbuds`,
        product.brand || "Apple"
      );
    }
    return makeImg(
      "electronics-sony-wh1000xm5.webp",
      `${product.name} wireless noise-cancelling over-ear headphones`,
      product.brand || "Sony"
    );
  }

  // =========================================================================
  // 4. AUDIO: SPEAKERS & SOUNDBARS
  // =========================================================================
  if (
    leaf === "speakers" ||
    leaf === "soundbars" ||
    fullText.includes("speaker") ||
    fullText.includes("soundbar")
  ) {
    // Devialet Phantom
    if (brandLower.includes("devialet") || fullText.includes("phantom")) {
      if (fullText.includes("phantom ii") || fullText.includes("98 db") || fullText.includes("95 db")) {
        return makeImg(
          "electronics-devialet-phantom-ii.webp",
          "Devialet Phantom II 98dB ultra-compact high-fidelity speaker",
          "Devialet"
        );
      }
      return makeImg(
        "electronics-devialet-phantom-i.webp",
        "Devialet Phantom I 108dB audiophile spherical wireless acoustic speaker",
        "Devialet"
      );
    }

    // Bang & Olufsen
    if (brandLower.includes("olufsen") || brandLower.includes("b&o") || fullText.includes("beosound") || fullText.includes("beolab")) {
      if (fullText.includes("beolab 28") || fullText.includes("beolab 8") || fullText.includes("beolab")) {
        return makeImg(
          "electronics-bang-olufsen-beolab-28.webp",
          "Bang & Olufsen Beolab 28 motorized oak acoustic stereo speaker",
          "Bang & Olufsen"
        );
      }
      return makeImg(
        "electronics-bang-olufsen-beosound-2.webp",
        "Bang & Olufsen Beosound 2 conical aluminum multiroom acoustic speaker",
        "Bang & Olufsen"
      );
    }

    // Bowers & Wilkins
    if (brandLower.includes("bowers") || fullText.includes("wilkins") || fullText.includes("b&w") || fullText.includes("nautilus") || fullText.includes("zeppelin")) {
      if (fullText.includes("nautilus")) {
        return makeImg(
          "electronics-bowers-wilkins-nautilus.webp",
          "Bowers & Wilkins Nautilus spiral acoustic chamber statement loudspeaker",
          "Bowers & Wilkins"
        );
      }
      return makeImg(
        "electronics-bowers-wilkins-zeppelin.webp",
        "Bowers & Wilkins Zeppelin iconic airship-inspired high-resolution smart speaker",
        "Bowers & Wilkins"
      );
    }

    // Sonos Soundbars & Speakers
    if (brandLower.includes("sonos") || fullText.includes("arc") || fullText.includes("era 300")) {
      if (leaf === "soundbars" || fullText.includes("arc") || fullText.includes("soundbar") || fullText.includes("beam")) {
        return makeImg(
          "electronics-sonos-arc.webp",
          "Sonos Arc premium 3D Dolby Atmos panoramic cinematic soundbar",
          "Sonos"
        );
      }
      return makeImg(
        "electronics-sonos-era-300.webp",
        "Sonos Era 300 hourglass spatial audio smart speaker with Dolby Atmos",
        "Sonos"
      );
    }

    // Soundbars Fallback
    if (leaf === "soundbars" || fullText.includes("soundbar")) {
      return makeImg(
        "electronics-sonos-arc.webp",
        `${product.name} Dolby Atmos cinematic multi-channel soundbar`,
        product.brand || "Sonos"
      );
    }

    // Speakers Fallback
    return makeImg(
      "electronics-devialet-phantom-i.webp",
      `${product.name} high-fidelity audiophile acoustic speaker`,
      product.brand || "Devialet"
    );
  }

  // =========================================================================
  // 5. DISPLAYS & MONITORS
  // =========================================================================
  if (
    leaf === "monitors" ||
    fullText.includes("monitor") ||
    fullText.includes("display")
  ) {
    if (fullText.includes("ultrasharp") || (brandLower.includes("dell") && (fullText.includes("u32") || fullText.includes("u27") || fullText.includes("u40")))) {
      return makeImg(
        "electronics-dell-ultrasharp-32.webp",
        "Dell UltraSharp 32 4K IPS Black HDR400 USB-C Hub professional monitor",
        "Dell"
      );
    }

    if (fullText.includes("odyssey") || fullText.includes("g9") || (brandLower.includes("samsung") && fullText.includes("curved"))) {
      return makeImg(
        "electronics-samsung-odyssey-oled-g9.webp",
        "Samsung Odyssey OLED G9 49-inch 32:9 dual QHD curved 240Hz gaming display",
        "Samsung"
      );
    }

    if (fullText.includes("ultragear") || (brandLower.includes("lg") && (fullText.includes("oled") || fullText.includes("gs95")))) {
      return makeImg(
        "electronics-lg-ultragear-oled.webp",
        "LG UltraGear OLED 240Hz 0.03ms ultra-fast response curved gaming monitor",
        "LG"
      );
    }

    if (fullText.includes("proart") || (brandLower.includes("asus") && fullText.includes("pa"))) {
      return makeImg(
        "electronics-asus-proart.webp",
        "ASUS ProArt PA329CRV 4K UHD 98% DCI-P3 factory-calibrated color monitor",
        "ASUS"
      );
    }

    return makeImg(
      "electronics-dell-ultrasharp-32.webp",
      `${product.name} 4K professional color-accurate computer monitor`,
      product.brand || "Dell"
    );
  }

  // =========================================================================
  // 6. COMPUTER PERIPHERALS: KEYBOARDS & MICE
  // =========================================================================
  if (leaf === "mice" || fullText.includes("mouse")) {
    if (fullText.includes("deathadder") || (brandLower.includes("razer") && fullText.includes("v3"))) {
      return makeImg(
        "electronics-razer-deathadder-v3.webp",
        "Razer DeathAdder V3 Pro ultra-lightweight esports wireless gaming mouse",
        "Razer"
      );
    }
    return makeImg(
      "electronics-logitech-mx-master-3s.webp",
      "Logitech MX Master 3S quiet click 8K DPI MagSpeed electromagnetic scroll mouse",
      "Logitech"
    );
  }

  if (leaf === "keyboards" || fullText.includes("keyboard")) {
    if (fullText.includes("mx mechanical") || (brandLower.includes("logitech") && fullText.includes("mechanical"))) {
      return makeImg(
        "electronics-logitech-mx-mechanical.webp",
        "Logitech MX Mechanical low-profile tactile quiet wireless keyboard",
        "Logitech"
      );
    }
    if (fullText.includes("keychron") || fullText.includes("q1") || fullText.includes("qmk")) {
      return makeImg(
        "electronics-keychron-q1-pro.webp",
        "Keychron Q1 Pro CNC aluminum hot-swappable custom mechanical keyboard",
        "Keychron"
      );
    }
    return makeImg(
      "electronics-keychron-q1-pro.webp",
      `${product.name} aluminum mechanical tactile keyboard`,
      product.brand || "Keychron"
    );
  }

  // =========================================================================
  // 7. DOCKS & HUBS
  // =========================================================================
  if (leaf === "docks-hubs" || fullText.includes("dock") || fullText.includes("hub")) {
    if (brandLower.includes("caldigit") || fullText.includes("ts4") || fullText.includes("ts3")) {
      return makeImg(
        "electronics-caldigit-ts4.webp",
        "CalDigit TS4 Thunderbolt 4 18-port 98W power delivery aluminum workstation dock",
        "CalDigit"
      );
    }
    if (brandLower.includes("anker") || fullText.includes("778") || fullText.includes("575")) {
      return makeImg(
        "electronics-anker-778-dock.webp",
        "Anker 778 Thunderbolt 4 12-in-1 100W 8K multi-display docking station",
        "Anker"
      );
    }
    return makeImg(
      "electronics-caldigit-ts4.webp",
      `${product.name} Thunderbolt 4 multi-port docking hub`,
      product.brand || "CalDigit"
    );
  }

  // =========================================================================
  // 8. POWER BANKS & CHARGERS
  // =========================================================================
  if (leaf === "power-banks" || fullText.includes("power bank") || fullText.includes("powercore") || fullText.includes("portable charger")) {
    return makeImg(
      "electronics-anker-737-powerbank.webp",
      "Anker 737 PowerCore 24K 140W two-way fast charging smart display power bank",
      "Anker"
    );
  }

  // =========================================================================
  // 9. NETWORKING & ROUTERS
  // =========================================================================
  if (leaf === "routers" || fullText.includes("router") || fullText.includes("mesh wi-fi") || fullText.includes("wi-fi 7")) {
    if (fullText.includes("orbi") || (brandLower.includes("netgear") && fullText.includes("970"))) {
      return makeImg(
        "electronics-netgear-orbi-970.webp",
        "Netgear Orbi 970 Series quad-band Wi-Fi 7 whole-home mesh satellite tower",
        "Netgear"
      );
    }
    if (fullText.includes("rapture") || (brandLower.includes("asus") && fullText.includes("rog"))) {
      return makeImg(
        "electronics-asus-rog-rapture.webp",
        "ASUS ROG Rapture quad-band Wi-Fi 7 dual 10G gaming router with spider antennas",
        "ASUS"
      );
    }
    if (fullText.includes("deco") || (brandLower.includes("tp-link") && fullText.includes("be85"))) {
      return makeImg(
        "electronics-tplink-deco-be85.webp",
        "TP-Link Deco BE85 tri-band 10Gbps Wi-Fi 7 whole home mesh networking system",
        "TP-Link"
      );
    }
    return makeImg(
      "electronics-tplink-deco-be85.webp",
      `${product.name} tri-band low-latency Wi-Fi 7 networking router`,
      product.brand || "TP-Link"
    );
  }

  // =========================================================================
  // 10. STORAGE (SSDS & DRIVES)
  // =========================================================================
  if (
    leaf === "portable-ssds" ||
    leaf === "internal-ssds" ||
    leaf === "hard-drives" ||
    fullText.includes("ssd") ||
    fullText.includes("nvme") ||
    fullText.includes("solid state")
  ) {
    if (leaf === "internal-ssds" || fullText.includes("990 pro") || fullText.includes("m.2") || fullText.includes("pcie")) {
      return makeImg(
        "electronics-samsung-990-pro.webp",
        "Samsung 990 PRO PCIe 4.0 NVMe M.2 internal gaming solid state drive",
        "Samsung"
      );
    }
    return makeImg(
      "electronics-sandisk-extreme-pro.webp",
      "SanDisk Extreme PRO rugged 2000MB/s NVMe portable solid state drive",
      "SanDisk"
    );
  }

  // =========================================================================
  // 11. WEBCAMS
  // =========================================================================
  if (leaf === "webcams" || fullText.includes("webcam")) {
    if (fullText.includes("facecam") || brandLower.includes("elgato")) {
      return makeImg(
        "electronics-elgato-facecam-pro.webp",
        "Elgato Facecam Pro 4K 60fps ultra HD studio optics creator webcam",
        "Elgato"
      );
    }
    return makeImg(
      "electronics-logitech-brio-4k.webp",
      "Logitech Brio 4K Pro HDR RightLight 3 streaming webcam",
      "Logitech"
    );
  }

  return null;
}
