import { ProductQuery, ProductImageResolution, makeImg } from "./types";

/**
 * Resolves authentic, distinct product photography for luxury watches and designer eyewear.
 * Every iconic model is mapped to its isolated studio WebP photograph on canvas #fbfbfb.
 */
export function resolveWatchesEyewearImage(
  product: ProductQuery
): ProductImageResolution | null {
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

  const isWatch =
    leaf === "watches" ||
    (leaf !== "sunglasses" &&
      leaf !== "eyewear" &&
      (fullText.includes("watch") ||
        fullText.includes("timepiece") ||
        fullText.includes("chronograph") ||
        brandLower.includes("rolex") ||
        brandLower.includes("omega") ||
        brandLower.includes("patek") ||
        brandLower.includes("audemars") ||
        brandLower.includes("tissot") ||
        brandLower.includes("breitling") ||
        brandLower.includes("iwc") ||
        brandLower.includes("grand seiko") ||
        brandLower.includes("vacheron") ||
        brandLower.includes("longines") ||
        brandLower.includes("tag heuer") ||
        brandLower.includes("seiko") ||
        brandLower.includes("breguet") ||
        brandLower.includes("girard") ||
        brandLower.includes("ulysse") ||
        brandLower.includes("lange") ||
        brandLower.includes("blancpain") ||
        ((brandLower.includes("apple") || brandLower.includes("samsung")) && (fullText.includes("watch") || leaf === "watches"))));

  const isEyewear =
    leaf === "sunglasses" ||
    leaf === "eyewear" ||
    fullText.includes("sunglass") ||
    fullText.includes("eyewear") ||
    fullText.includes("shades") ||
    fullText.includes("aviator classic") ||
    fullText.includes("wayfarer classic") ||
    brandLower.includes("ray-ban") ||
    brandLower.includes("persol") ||
    brandLower.includes("oliver peoples") ||
    brandLower.includes("oakley") ||
    brandLower.includes("dita");

  if (!isWatch && !isEyewear) {
    return null;
  }

  // =========================================================================
  // 1. WATCHES & HOROLOGY
  // =========================================================================
  if (isWatch && !isEyewear) {
    // --- ROLEX ---
    if (brandLower.includes("rolex") || fullText.includes("rolex")) {
      if (fullText.includes("daytona") || fullText.includes("cosmograph")) {
        return makeImg("watches-rolex-daytona.webp", "Rolex Cosmograph Daytona 40 Oystersteel chronograph", "Rolex");
      }
      if (fullText.includes("gmt") || fullText.includes("master ii") || fullText.includes("batman") || fullText.includes("pepsi")) {
        return makeImg("watches-rolex-gmt-master-ii.webp", "Rolex GMT-Master II 40 bidirectional Cerachrom bezel", "Rolex");
      }
      if (fullText.includes("datejust")) {
        return makeImg("watches-rolex-datejust-41.webp", "Rolex Datejust 41 fluted bezel Cyclops lens", "Rolex");
      }
      if (fullText.includes("day-date") || fullText.includes("president")) {
        return makeImg("watches-rolex-day-date.webp", "Rolex Day-Date 40 President bracelet luxury timepiece", "Rolex");
      }
      if (fullText.includes("oyster perpetual") || fullText.includes("explorer") || fullText.includes("sky-dweller") || fullText.includes("sea-dweller") || fullText.includes("yacht-master")) {
        return makeImg("watches-rolex-oyster-perpetual.webp", "Rolex Oyster Perpetual 41 calibre 3230 timepiece", "Rolex");
      }
      if (fullText.includes("submariner date")) {
        return makeImg("watches-rolex-submariner-date.webp", "Rolex Submariner Date 41 Cerachrom professional diver", "Rolex");
      }
      return makeImg("watches-rolex-submariner.webp", "Rolex Submariner 41 Cerachrom professional diver", "Rolex");
    }

    // --- OMEGA ---
    if (brandLower.includes("omega") || fullText.includes("omega")) {
      if (fullText.includes("speedmaster") || fullText.includes("moonwatch") || fullText.includes("dark side") || fullText.includes("calibre 321")) {
        return makeImg("watches-omega-speedmaster.webp", "Omega Speedmaster Professional Moonwatch chronograph", "Omega");
      }
      if (fullText.includes("aqua terra")) {
        return makeImg("watches-omega-aqua-terra.webp", "Omega Seamaster Aqua Terra 150M Co-Axial Master Chronometer", "Omega");
      }
      if (fullText.includes("constellation") || fullText.includes("globemaster") || fullText.includes("de ville")) {
        return makeImg("watches-omega-constellation.webp", "Omega Constellation Co-Axial Master Chronometer 41mm", "Omega");
      }
      if (fullText.includes("planet ocean") || fullText.includes("heritage")) {
        return makeImg("watches-omega-seamaster.webp", "Omega Seamaster Planet Ocean Co-Axial Master Chronometer", "Omega");
      }
      return makeImg("watches-omega-seamaster-diver-300m.webp", "Omega Seamaster Diver 300M Co-Axial Master Chronometer", "Omega");
    }

    // --- CARTIER ---
    if (brandLower.includes("cartier") || fullText.includes("cartier")) {
      if (fullText.includes("tank must") || fullText.includes("tank louis") || fullText.includes("française") || fullText.includes("francaise")) {
        return makeImg("watches-cartier-tank-must.webp", "Cartier Tank Must de Cartier geometric Roman numeral timepiece", "Cartier");
      }
      if (fullText.includes("tank")) {
        return makeImg("watches-cartier-tank.webp", "Cartier Tank classic dress watch", "Cartier");
      }
      if (fullText.includes("ballon bleu")) {
        return makeImg("watches-cartier-ballon-bleu.webp", "Cartier Ballon Bleu de Cartier rounded cabochon timepiece", "Cartier");
      }
      if (fullText.includes("panthère") || fullText.includes("panthere")) {
        return makeImg("watches-cartier-panthere.webp", "Panthère de Cartier flexible link jewelry timepiece", "Cartier");
      }
      return makeImg("watches-cartier-santos.webp", "Cartier Santos de Cartier exposed screws square bezel", "Cartier");
    }

    // --- PATEK PHILIPPE ---
    if (brandLower.includes("patek") || fullText.includes("patek")) {
      if (fullText.includes("aquanaut") || fullText.includes("5167") || fullText.includes("5164")) {
        return makeImg("watches-patek-aquanaut.webp", "Patek Philippe Aquanaut 5167 composite strap luxury sports watch", "Patek Philippe");
      }
      if (fullText.includes("calatrava") || fullText.includes("6119") || fullText.includes("5227") || fullText.includes("complications") || fullText.includes("perpetual")) {
        return makeImg("watches-patek-calatrava.webp", "Patek Philippe Calatrava clous de Paris hobnail bezel dress watch", "Patek Philippe");
      }
      return makeImg("watches-patek-nautilus.webp", "Patek Philippe Nautilus 5711 horizontally embossed blue dial", "Patek Philippe");
    }

    // --- AUDEMARS PIGUET ---
    if (brandLower.includes("audemars") || fullText.includes("royal oak")) {
      if (fullText.includes("chrono") || fullText.includes("26240") || fullText.includes("26420")) {
        return makeImg("watches-ap-royal-oak-chronograph.webp", "Audemars Piguet Royal Oak Chronograph 41mm tapisserie dial", "Audemars Piguet");
      }
      if (fullText.includes("jumbo") || fullText.includes("16202") || fullText.includes("extra-thin")) {
        return makeImg("watches-ap-royal-oak-jumbo.webp", "Audemars Piguet Royal Oak Jumbo Extra-Thin 39mm octagonal bezel", "Audemars Piguet");
      }
      return makeImg("watches-ap-royal-oak.webp", "Audemars Piguet Royal Oak Selfwinding timepiece", "Audemars Piguet");
    }

    // --- JAEGER-LECOULTRE ---
    if (brandLower.includes("jaeger") || brandLower.includes("lecoultre") || fullText.includes("reverso")) {
      if (fullText.includes("polaris") || fullText.includes("memovox")) {
        return makeImg("watches-jlc-polaris.webp", "Jaeger-LeCoultre Polaris Chronograph dual crowns luxury sports watch", "Jaeger-LeCoultre");
      }
      if (fullText.includes("classic")) {
        return makeImg("watches-jlc-reverso-classic.webp", "Jaeger-LeCoultre Reverso Classic reversible art deco case", "Jaeger-LeCoultre");
      }
      return makeImg("watches-jlc-reverso.webp", "Jaeger-LeCoultre Reverso Tribute Monoface timepiece", "Jaeger-LeCoultre");
    }

    // --- TISSOT ---
    if (brandLower.includes("tissot") || fullText.includes("tissot")) {
      if (fullText.includes("gentleman")) {
        return makeImg("watches-tissot-gentleman.webp", "Tissot Gentleman Powermatic 80 Silicium Swiss timepiece", "Tissot");
      }
      if (fullText.includes("seastar 2000")) {
        return makeImg("watches-tissot-seastar-2000.webp", "Tissot Seastar 2000 Professional Powermatic 80 Diver", "Tissot");
      }
      if (fullText.includes("seastar 1000") || fullText.includes("seastar")) {
        return makeImg("watches-tissot-seastar-1000.webp", "Tissot Seastar 1000 Powermatic 80 Diver", "Tissot");
      }
      if (fullText.includes("pr516")) {
        return makeImg("watches-tissot-pr516.webp", "Tissot PR516 Mechanical Chronograph", "Tissot");
      }
      if (fullText.includes("telemeter") || fullText.includes("1938")) {
        return makeImg("watches-tissot-telemeter-1938.webp", "Tissot Heritage 1938 Telemeter Swiss timepiece", "Tissot");
      }
      if (fullText.includes("heritage 1973") || fullText.includes("1973")) {
        return makeImg("watches-tissot-heritage-1973.webp", "Tissot Heritage 1973 Chronograph", "Tissot");
      }
      if (fullText.includes("visodate")) {
        return makeImg("watches-tissot-heritage-visodate.webp", "Tissot Heritage Visodate Swiss automatic watch", "Tissot");
      }
      if (fullText.includes("chemin")) {
        return makeImg("watches-tissot-chemin-des-tourelles.webp", "Tissot Chemin des Tourelles Powermatic 80", "Tissot");
      }
      if (fullText.includes("le locle")) {
        return makeImg("watches-tissot-le-locle.webp", "Tissot Le Locle Powermatic 80 Roman dial dress watch", "Tissot");
      }
      if (fullText.includes("ballade")) {
        return makeImg("watches-tissot-ballade.webp", "Tissot Ballade Powermatic 80 Silicium", "Tissot");
      }
      if (fullText.includes("carson")) {
        return makeImg("watches-tissot-carson.webp", "Tissot Carson Premium Swiss watch", "Tissot");
      }
      if (fullText.includes("chrono xl")) {
        return makeImg("watches-tissot-chrono-xl.webp", "Tissot Chrono XL Classic Swiss chronograph", "Tissot");
      }
      if (fullText.includes("classic dream")) {
        return makeImg("watches-tissot-classic-dream.webp", "Tissot Classic Dream Swiss timepiece", "Tissot");
      }
      if (fullText.includes("pr 100") || fullText.includes("pr100")) {
        return makeImg("watches-tissot-pr100.webp", "Tissot PR 100 Sport Classic Swiss watch", "Tissot");
      }
      if (fullText.includes("supersport")) {
        return makeImg("watches-tissot-supersport.webp", "Tissot Supersport Chrono Swiss racing watch", "Tissot");
      }
      if (fullText.includes("tradition")) {
        return makeImg("watches-tissot-tradition.webp", "Tissot Tradition Perpetual Calendar Swiss watch", "Tissot");
      }
      return makeImg("watches-tissot-prx.webp", "Tissot PRX Powermatic 80 integrated steel bracelet timepiece", "Tissot");
    }

    // --- SEIKO ---
    if ((brandLower === "seiko" || brandLower.includes("seiko")) && !brandLower.includes("grand seiko")) {
      if (fullText.includes("spb451") || fullText.includes("1965")) {
        return makeImg("watches-seiko-prospex-spb451.webp", "Seiko Prospex 1965 Heritage Diver SPB451", "Seiko");
      }
      if (fullText.includes("ssc813") || fullText.includes("speedtimer")) {
        return makeImg("watches-seiko-speedtimer-ssc813.webp", "Seiko Prospex Speedtimer SSC813 Solar Chronograph", "Seiko");
      }
      if (fullText.includes("srpb43") || fullText.includes("cocktail") || fullText.includes("skydiving")) {
        return makeImg("watches-seiko-presage-cocktail-srpb43.webp", "Seiko Presage Cocktail Time Skydiving SRPB43", "Seiko");
      }
      if (fullText.includes("spb121") || fullText.includes("alpinist")) {
        return makeImg("watches-seiko-alpinist-spb121.webp", "Seiko Prospex Alpinist SPB121 Compass", "Seiko");
      }
      if (fullText.includes("sje089") || fullText.includes("king seiko")) {
        return makeImg("watches-seiko-king-seiko-sje089.webp", "King Seiko KSK SJE089 Mechanical Slimline", "Seiko");
      }
      if (fullText.includes("ssk001") || fullText.includes("5 sports") || fullText.includes("gmt")) {
        return makeImg("watches-seiko-5-sports-gmt-ssk001.webp", "Seiko 5 Sports GMT SSK001", "Seiko");
      }
      return makeImg("watches-seiko-prospex-spb451.webp", "Seiko Prospex Heritage Timepiece", "Seiko");
    }

    // --- BREGUET ---
    if (brandLower.includes("breguet") || fullText.includes("breguet")) {
      if (fullText.includes("5177") || fullText.includes("classique")) {
        return makeImg("watches-breguet-classique-5177.webp", "Breguet Classique 5177 Grand Feu Enamel", "Breguet");
      }
      if (fullText.includes("5517") || fullText.includes("marine")) {
        return makeImg("watches-breguet-marine-5517.webp", "Breguet Marine 5517 Titanium", "Breguet");
      }
      if (fullText.includes("7097") || fullText.includes("tradition")) {
        return makeImg("watches-breguet-tradition-7097.webp", "Breguet Tradition 7097 Seconde Retrograde", "Breguet");
      }
      if (fullText.includes("2057") || fullText.includes("type xx")) {
        return makeImg("watches-breguet-type-xx-2057.webp", "Breguet Type XX Chronographe 2057", "Breguet");
      }
      if (fullText.includes("8918") || fullText.includes("naples")) {
        return makeImg("watches-breguet-reine-de-naples-8918.webp", "Breguet Reine de Naples 8918 Diamonds", "Breguet");
      }
      return makeImg("watches-breguet-classique-5177.webp", "Breguet Haute Horlogerie Timepiece", "Breguet");
    }

    // --- GIRARD-PERREGAUX ---
    if (brandLower.includes("girard") || fullText.includes("girard-perregaux") || fullText.includes("girard perregaux")) {
      if (fullText.includes("panda") || fullText.includes("chronograph") || fullText.includes("81020")) {
        return makeImg("watches-girard-perregaux-laureato-chrono-panda.webp", "Girard-Perregaux Laureato Chronograph Panda", "Girard-Perregaux");
      }
      if (fullText.includes("free bridge") || fullText.includes("82000")) {
        return makeImg("watches-girard-perregaux-free-bridge.webp", "Girard-Perregaux Free Bridge", "Girard-Perregaux");
      }
      if (fullText.includes("1966") || fullText.includes("49555")) {
        return makeImg("watches-girard-perregaux-1966-40.webp", "Girard-Perregaux 1966 40mm Opaline", "Girard-Perregaux");
      }
      if (fullText.includes("vintage 1945") || fullText.includes("25880")) {
        return makeImg("watches-girard-perregaux-vintage-1945.webp", "Girard-Perregaux Vintage 1945 XXL", "Girard-Perregaux");
      }
      return makeImg("watches-girard-perregaux-laureato-42-blue.webp", "Girard-Perregaux Laureato 42mm Blue", "Girard-Perregaux");
    }

    // --- ULYSSE NARDIN ---
    if (brandLower.includes("ulysse") || fullText.includes("ulysse nardin")) {
      if (fullText.includes("freak") || fullText.includes("2303")) {
        return makeImg("watches-ulysse-nardin-freak-x.webp", "Ulysse Nardin Freak X Titanium Flying Carrousel", "Ulysse Nardin");
      }
      if (fullText.includes("torpilleur") || fullText.includes("1183-310")) {
        return makeImg("watches-ulysse-nardin-marine-torpilleur.webp", "Ulysse Nardin Marine Torpilleur Chronometer", "Ulysse Nardin");
      }
      if (fullText.includes("great white") || fullText.includes("1183-170")) {
        return makeImg("watches-ulysse-nardin-diver-great-white.webp", "Ulysse Nardin Diver Chronometer 44mm Great White", "Ulysse Nardin");
      }
      if (fullText.includes("blast") || fullText.includes("tourbillon") || fullText.includes("1723")) {
        return makeImg("watches-ulysse-nardin-blast-tourbillon.webp", "Ulysse Nardin Blast Tourbillon Skeleton", "Ulysse Nardin");
      }
      return makeImg("watches-ulysse-nardin-diver-42-blue.webp", "Ulysse Nardin Diver 42mm Blue", "Ulysse Nardin");
    }

    // --- A. LANGE & SÖHNE ---
    if (brandLower.includes("lange") || fullText.includes("lange & söhne") || fullText.includes("lange & sohne")) {
      if (fullText.includes("saxonia") || fullText.includes("201.027")) {
        return makeImg("watches-a-lange-sohne-saxonia-thin.webp", "A. Lange & Söhne Saxonia Thin 37mm", "A. Lange & Söhne");
      }
      if (fullText.includes("1815") || fullText.includes("414.028")) {
        return makeImg("watches-a-lange-sohne-1815-chronograph.webp", "A. Lange & Söhne 1815 Chronograph", "A. Lange & Söhne");
      }
      if (fullText.includes("datograph") || fullText.includes("405.035")) {
        return makeImg("watches-a-lange-sohne-datograph-up-down.webp", "A. Lange & Söhne Datograph Up/Down Platinum", "A. Lange & Söhne");
      }
      if (fullText.includes("zeitwerk") || fullText.includes("142.028")) {
        return makeImg("watches-a-lange-sohne-zeitwerk.webp", "A. Lange & Söhne Zeitwerk Mechanical Digital", "A. Lange & Söhne");
      }
      return makeImg("watches-a-lange-sohne-lange-1.webp", "A. Lange & Söhne Lange 1", "A. Lange & Söhne");
    }

    // --- BLANCPAIN ---
    if (brandLower.includes("blancpain") || fullText.includes("blancpain")) {
      if (fullText.includes("bathyscaphe") || fullText.includes("5000")) {
        return makeImg("watches-blancpain-bathyscaphe-5000.webp", "Blancpain Fifty Fathoms Bathyscaphe 43mm", "Blancpain");
      }
      if (fullText.includes("ultraplate") || fullText.includes("6651")) {
        return makeImg("watches-blancpain-villeret-ultraplate.webp", "Blancpain Villeret Ultraplate 40mm", "Blancpain");
      }
      if (fullText.includes("quantieme") || fullText.includes("moonphase") || fullText.includes("6654")) {
        return makeImg("watches-blancpain-villeret-quantieme-complet.webp", "Blancpain Villeret Quantième Complet Moonphase", "Blancpain");
      }
      if (fullText.includes("42mm") || fullText.includes("5010")) {
        return makeImg("watches-blancpain-fifty-fathoms-42-titanium.webp", "Blancpain Fifty Fathoms 42mm Titanium", "Blancpain");
      }
      return makeImg("watches-blancpain-fifty-fathoms-5015.webp", "Blancpain Fifty Fathoms Automatique 45mm", "Blancpain");
    }

    // --- APPLE WATCH ---
    if ((brandLower.includes("apple") || fullText.includes("apple watch")) && (fullText.includes("watch") || leaf === "watches")) {
      if (fullText.includes("ultra 2") && (fullText.includes("black") || fullText.includes("ocean"))) {
        return makeImg("watches-apple-watch-ultra-2-black.webp", "Apple Watch Ultra 2 Black Titanium 49mm", "Apple");
      }
      if (fullText.includes("ultra 2") || fullText.includes("ultra")) {
        return makeImg("watches-apple-watch-ultra-2-titanium.webp", "Apple Watch Ultra 2 Natural Titanium 49mm", "Apple");
      }
      if (fullText.includes("hermes") || fullText.includes("grand h")) {
        return makeImg("watches-apple-watch-hermes-series-10.webp", "Apple Watch Hermès Series 10 Grand H Steel", "Apple");
      }
      if (fullText.includes("rose gold") || fullText.includes("42mm")) {
        return makeImg("watches-apple-watch-series-10-rose-gold.webp", "Apple Watch Series 10 Rose Gold Aluminum 42mm", "Apple");
      }
      if (fullText.includes("titanium") || fullText.includes("milanese")) {
        return makeImg("watches-apple-watch-series-10-titanium.webp", "Apple Watch Series 10 Natural Titanium 46mm", "Apple");
      }
      return makeImg("watches-apple-watch-series-10-jet-black.webp", "Apple Watch Series 10 Jet Black Aluminum 46mm", "Apple");
    }

    // --- SAMSUNG GALAXY WATCH ---
    if ((brandLower.includes("samsung") || fullText.includes("galaxy watch")) && (fullText.includes("watch") || leaf === "watches")) {
      if (fullText.includes("ultra") && fullText.includes("white")) {
        return makeImg("watches-samsung-galaxy-watch-ultra-white.webp", "Samsung Galaxy Watch Ultra 47mm Titanium White", "Samsung");
      }
      if (fullText.includes("ultra")) {
        return makeImg("watches-samsung-galaxy-watch-ultra-gray.webp", "Samsung Galaxy Watch Ultra 47mm Titanium Gray", "Samsung");
      }
      if (fullText.includes("classic") && (fullText.includes("silver") || fullText.includes("43"))) {
        return makeImg("watches-samsung-galaxy-watch-6-classic-43.webp", "Samsung Galaxy Watch 6 Classic 43mm Silver", "Samsung");
      }
      if (fullText.includes("classic") || fullText.includes("rotating bezel")) {
        return makeImg("watches-samsung-galaxy-watch-6-classic-47.webp", "Samsung Galaxy Watch 6 Classic 47mm Black", "Samsung");
      }
      if (fullText.includes("40mm") || fullText.includes("cream")) {
        return makeImg("watches-samsung-galaxy-watch-7-40-cream.webp", "Samsung Galaxy Watch 7 40mm Cream", "Samsung");
      }
      return makeImg("watches-samsung-galaxy-watch-7-44-green.webp", "Samsung Galaxy Watch 7 44mm Green", "Samsung");
    }

    // --- BREITLING ---
    if (brandLower.includes("breitling") || fullText.includes("breitling")) {
      if (fullText.includes("avenger chronograph")) {
        return makeImg("watches-breitling-avenger-chronograph.webp", "Breitling Avenger Chronograph 44 pilot watch", "Breitling");
      }
      if (fullText.includes("avenger")) {
        return makeImg("watches-breitling-avenger-automatic.webp", "Breitling Avenger Automatic 42 aviation watch", "Breitling");
      }
      if (fullText.includes("superocean")) {
        return makeImg("watches-breitling-superocean.webp", "Breitling Superocean Automatic 42 high-contrast diver", "Breitling");
      }
      if (fullText.includes("navitimer b01") || fullText.includes("b01")) {
        return makeImg("watches-breitling-navitimer-b01.webp", "Breitling Navitimer B01 Chronograph circular slide rule bezel", "Breitling");
      }
      return makeImg("watches-breitling-navitimer.webp", "Breitling Navitimer Automatic 41 circular slide rule timepiece", "Breitling");
    }

    // --- IWC ---
    if (brandLower.includes("iwc") || fullText.includes("portugieser") || fullText.includes("schaffhausen")) {
      if (fullText.includes("mark") || fullText.includes("pilot") || fullText.includes("big pilot")) {
        return makeImg("watches-iwc-pilots-watch-mark-xx.webp", "IWC Pilot's Watch Mark XX high-legibility aviation timepiece", "IWC");
      }
      return makeImg("watches-iwc-portugieser-chronograph.webp", "IWC Portugieser Chronograph 41 applied Arabic numerals", "IWC");
    }

    // --- GRAND SEIKO ---
    if (brandLower.includes("grand seiko") || fullText.includes("grand seiko") || fullText.includes("snowflake")) {
      return makeImg("watches-grand-seiko-snowflake.webp", "Grand Seiko Snowflake SBGA211 textured dial Spring Drive", "Grand Seiko");
    }

    // --- TAG HEUER ---
    if (brandLower.includes("tag heuer") || fullText.includes("tag heuer") || brandLower.includes("tag-heuer")) {
      if (fullText.includes("glassbox")) {
        return makeImg("watches-tag-heuer-carrera-glassbox.webp", "TAG Heuer Carrera Chronograph Glassbox 39mm blue dial", "TAG Heuer");
      }
      if (fullText.includes("carrera date")) {
        return makeImg("watches-tag-heuer-carrera-date.webp", "TAG Heuer Carrera Date 39mm automatic watch", "TAG Heuer");
      }
      if (fullText.includes("monaco")) {
        return makeImg("watches-tag-heuer-monaco.webp", "TAG Heuer Monaco Chronograph Calibre 11 square watch", "TAG Heuer");
      }
      if (fullText.includes("aquaracer 300") || fullText.includes("aquaracer professional 300")) {
        return makeImg("watches-tag-heuer-aquaracer-300.webp", "TAG Heuer Aquaracer Professional 300 diver watch", "TAG Heuer");
      }
      if (fullText.includes("aquaracer 200") || fullText.includes("solargraph")) {
        return makeImg("watches-tag-heuer-aquaracer-200.webp", "TAG Heuer Aquaracer Professional 200 Solargraph watch", "TAG Heuer");
      }
      if (fullText.includes("formula 1") || fullText.includes("formula-1")) {
        return makeImg("watches-tag-heuer-formula-1.webp", "TAG Heuer Formula 1 Chronograph 43mm racing watch", "TAG Heuer");
      }
      if (fullText.includes("chronosprint") || fullText.includes("porsche")) {
        return makeImg("watches-tag-heuer-chronosprint.webp", "TAG Heuer Carrera Chronosprint x Porsche watch", "TAG Heuer");
      }
      if (fullText.includes("autavia")) {
        return makeImg("watches-tag-heuer-autavia.webp", "TAG Heuer Autavia Chronometer Flyback Chronograph", "TAG Heuer");
      }
      return makeImg("watches-tag-heuer-carrera-glassbox.webp", "TAG Heuer Carrera Swiss luxury chronograph", "TAG Heuer");
    }

    // --- VACHERON CONSTANTIN ---
    if (brandLower.includes("vacheron") || fullText.includes("vacheron")) {
      if (fullText.includes("overseas chronograph")) {
        return makeImg("watches-vc-overseas-chronograph.webp", "Vacheron Constantin Overseas Chronograph 5500V", "Vacheron Constantin");
      }
      if (fullText.includes("overseas dual time")) {
        return makeImg("watches-vc-overseas-dual-time.webp", "Vacheron Constantin Overseas Dual Time 7900V", "Vacheron Constantin");
      }
      if (fullText.includes("overseas")) {
        return makeImg("watches-vc-overseas-self-winding.webp", "Vacheron Constantin Overseas Self-Winding 4500V blue dial", "Vacheron Constantin");
      }
      if (fullText.includes("patrimony retrograde") || fullText.includes("retrograde")) {
        return makeImg("watches-vc-patrimony-retrograde.webp", "Vacheron Constantin Patrimony Retrograde Day-Date", "Vacheron Constantin");
      }
      if (fullText.includes("patrimony")) {
        return makeImg("watches-vc-patrimony-manual.webp", "Vacheron Constantin Patrimony Manual-Winding 81180", "Vacheron Constantin");
      }
      if (fullText.includes("traditionnelle calendar") || fullText.includes("complete calendar")) {
        return makeImg("watches-vc-traditionnelle-calendar.webp", "Vacheron Constantin Traditionnelle Complete Calendar 4010T", "Vacheron Constantin");
      }
      if (fullText.includes("traditionnelle")) {
        return makeImg("watches-vc-traditionnelle-manual.webp", "Vacheron Constantin Traditionnelle Manual-Winding 82172", "Vacheron Constantin");
      }
      if (fullText.includes("1921") || fullText.includes("historiques")) {
        return makeImg("watches-vc-historiques-american-1921.webp", "Vacheron Constantin Historiques American 1921 cushion case", "Vacheron Constantin");
      }
      return makeImg("watches-vc-overseas-self-winding.webp", "Vacheron Constantin Swiss haute horlogerie timepiece", "Vacheron Constantin");
    }

    // --- LONGINES ---
    if (brandLower.includes("longines") || fullText.includes("longines")) {
      if (fullText.includes("zulu time") || fullText.includes("zulu")) {
        return makeImg("watches-longines-spirit-zulu-time.webp", "Longines Spirit Zulu Time GMT 39mm", "Longines");
      }
      if (fullText.includes("hydroconquest gmt")) {
        return makeImg("watches-longines-hydroconquest-gmt.webp", "Longines HydroConquest GMT 41mm diver", "Longines");
      }
      if (fullText.includes("hydroconquest")) {
        return makeImg("watches-longines-hydroconquest.webp", "Longines HydroConquest 300m ceramic bezel diver", "Longines");
      }
      if (fullText.includes("legend diver")) {
        return makeImg("watches-longines-legend-diver.webp", "Longines Legend Diver 39mm compressor case", "Longines");
      }
      if (fullText.includes("moonphase") || fullText.includes("master collection moonphase")) {
        return makeImg("watches-longines-master-moonphase.webp", "Longines Master Collection Moonphase 40mm", "Longines");
      }
      if (fullText.includes("master chronograph")) {
        return makeImg("watches-longines-master-chronograph.webp", "Longines Master Collection Chronograph", "Longines");
      }
      if (fullText.includes("ultra-chron")) {
        return makeImg("watches-longines-ultra-chron.webp", "Longines Ultra-Chron High-Frequency Diver 43mm", "Longines");
      }
      if (fullText.includes("conquest")) {
        return makeImg("watches-longines-conquest.webp", "Longines Conquest Automatic 41mm", "Longines");
      }
      if (fullText.includes("sector") || fullText.includes("heritage classic")) {
        return makeImg("watches-longines-heritage-classic.webp", "Longines Heritage Classic Sector Dial 38.5mm", "Longines");
      }
      if (fullText.includes("flagship")) {
        return makeImg("watches-longines-flagship-heritage.webp", "Longines Flagship Heritage 38.5mm dress watch", "Longines");
      }
      if (fullText.includes("dolcevita")) {
        return makeImg("watches-longines-dolcevita.webp", "Longines DolceVita rectangular art deco watch", "Longines");
      }
      if (fullText.includes("evidenza")) {
        return makeImg("watches-longines-evidenza.webp", "Longines Evidenza tonneau case Swiss timepiece", "Longines");
      }
      if (fullText.includes("primaluna")) {
        return makeImg("watches-longines-primaluna.webp", "Longines PrimaLuna round diamond bezel timepiece", "Longines");
      }
      if (fullText.includes("record")) {
        return makeImg("watches-longines-record.webp", "Longines Record COSC Chronometer certified watch", "Longines");
      }
      if (fullText.includes("flyback")) {
        return makeImg("watches-longines-spirit-flyback.webp", "Longines Spirit Flyback Chronograph 42mm", "Longines");
      }
      return makeImg("watches-longines-spirit.webp", "Longines Spirit Automatic 40mm aviation watch", "Longines");
    }

    return makeImg("watches-signature-chronograph.webp", `${product.name} luxury horology timepiece`, product.brand || "Swiss Manufacture");
  }

  // =========================================================================
  // 2. EYEWEAR & DESIGNER SUNGLASSES
  // =========================================================================
  if (isEyewear) {
    // --- OAKLEY ---
    if (brandLower.includes("oakley") || fullText.includes("oakley")) {
      if (fullText.includes("holbrook")) return makeImg("eyewear-oakley-holbrook.webp", "Oakley Holbrook sunglasses matte black", "Oakley");
      if (fullText.includes("frogskins")) return makeImg("eyewear-oakley-frogskins.webp", "Oakley Frogskins classic lifestyle sunglasses", "Oakley");
      if (fullText.includes("sutro")) return makeImg("eyewear-oakley-sutro.webp", "Oakley Sutro shield cycling sunglasses", "Oakley");
      if (fullText.includes("flak 2.0") || fullText.includes("flak")) return makeImg("eyewear-oakley-flak-2-0.webp", "Oakley Flak 2.0 XL sport performance sunglasses", "Oakley");
      if (fullText.includes("gascan")) return makeImg("eyewear-oakley-gascan.webp", "Oakley Gascan wraparound lifestyle sunglasses", "Oakley");
      if (fullText.includes("batwolf")) return makeImg("eyewear-oakley-batwolf.webp", "Oakley Batwolf single continuous lens sunglasses", "Oakley");
      if (fullText.includes("jawbreaker")) return makeImg("eyewear-oakley-jawbreaker.webp", "Oakley Jawbreaker cycling sport sunglasses", "Oakley");
      if (fullText.includes("half jacket")) return makeImg("eyewear-oakley-half-jacket.webp", "Oakley Half Jacket 2.0 XL sunglasses", "Oakley");
      if (fullText.includes("split shot")) return makeImg("eyewear-oakley-split-shot.webp", "Oakley Split Shot water sport sunglasses", "Oakley");
      if (fullText.includes("radar ev") || fullText.includes("radar")) return makeImg("eyewear-oakley-radar-ev.webp", "Oakley Radar EV Pitch sport sunglasses", "Oakley");
      return makeImg("eyewear-oakley-holbrook.webp", `${product.name} sport sunglasses`, "Oakley");
    }

    // --- DITA ---
    if (brandLower.includes("dita") || fullText.includes("dita")) {
      if (fullText.includes("flight 006") || fullText.includes("flight.006") || fullText.includes("flight")) return makeImg("eyewear-dita-flight-006.webp", "DITA Flight.006 titanium sunglasses", "DITA");
      if (fullText.includes("grandmaster-six") || fullText.includes("grandmaster")) return makeImg("eyewear-dita-grandmaster-six.webp", "DITA Grandmaster-Six oversized sunglasses", "DITA");
      if (fullText.includes("mach-six") || fullText.includes("mach")) return makeImg("eyewear-dita-mach-six.webp", "DITA Mach-Six aviator sunglasses", "DITA");
      if (fullText.includes("statesman-six") || fullText.includes("statesman")) return makeImg("eyewear-dita-statesman-six.webp", "DITA Statesman-Six browline sunglasses", "DITA");
      if (fullText.includes("subsystem")) return makeImg("eyewear-dita-subsystem.webp", "DITA Subsystem rectangular sunglasses", "DITA");
      if (fullText.includes("believer")) return makeImg("eyewear-dita-believer.webp", "DITA Believer round sunglasses", "DITA");
      if (fullText.includes("decade-two") || fullText.includes("decade")) return makeImg("eyewear-dita-decade-two.webp", "DITA Decade-Two aviator sunglasses", "DITA");
      if (fullText.includes("grand-evo")) return makeImg("eyewear-dita-grand-evo.webp", "DITA Grand-Evo One rimless sunglasses", "DITA");
      if (fullText.includes("initiator")) return makeImg("eyewear-dita-initiator.webp", "DITA Initiator square sunglasses", "DITA");
      if (fullText.includes("sekton")) return makeImg("eyewear-dita-sekton.webp", "DITA Sekton geometric sunglasses", "DITA");
      return makeImg("eyewear-dita-flight-006.webp", `${product.name} luxury titanium sunglasses`, "DITA");
    }

    // --- GUCCI EYEWEAR ---
    if (brandLower.includes("gucci") || fullText.includes("gucci")) {
      if (fullText.includes("gg0061s")) return makeImg("eyewear-gucci-gg0061s.webp", "Gucci GG0061S round metal sunglasses", "Gucci");
      if (fullText.includes("gg0034s")) return makeImg("eyewear-gucci-gg0034s.webp", "Gucci GG0034S square acetate sunglasses", "Gucci");
      if (fullText.includes("gg0010s")) return makeImg("eyewear-gucci-gg0010s.webp", "Gucci GG0010S aviator sunglasses", "Gucci");
      if (fullText.includes("gg0811s")) return makeImg("eyewear-gucci-gg0811s.webp", "Gucci GG0811S cat eye sunglasses", "Gucci");
      if (fullText.includes("gg0396s")) return makeImg("eyewear-gucci-gg0396s.webp", "Gucci GG0396S rectangular metal sunglasses", "Gucci");
      if (fullText.includes("gg0418s")) return makeImg("eyewear-gucci-gg0418s.webp", "Gucci GG0418S oversized square sunglasses", "Gucci");
      if (fullText.includes("gg0226s")) return makeImg("eyewear-gucci-gg0226s.webp", "Gucci GG0226S rimless star sunglasses", "Gucci");
      if (fullText.includes("gg1022s")) return makeImg("eyewear-gucci-gg1022s.webp", "Gucci GG1022S geometric sunglasses", "Gucci");
      if (fullText.includes("gg0053s")) return makeImg("eyewear-gucci-gg0053s.webp", "Gucci GG0053S square web sunglasses", "Gucci");
      if (fullText.includes("gg0528s")) return makeImg("eyewear-gucci-gg0528s.webp", "Gucci GG0528S navigator metal sunglasses", "Gucci");
      return makeImg("eyewear-gucci-gg0061s.webp", `${product.name} luxury sunglasses`, "Gucci");
    }

    // --- SAINT LAURENT EYEWEAR ---
    if (brandLower.includes("saint laurent") || fullText.includes("saint laurent") || brandLower.includes("ysl")) {
      if (fullText.includes("sl m94") || fullText.includes("sl-m94")) return makeImg("eyewear-saint-laurent-sl-m94.webp", "Saint Laurent SL M94 cat eye sunglasses", "Saint Laurent");
      if (fullText.includes("sl 51") || fullText.includes("sl-51")) return makeImg("eyewear-saint-laurent-sl-51.webp", "Saint Laurent SL 51 square sunglasses", "Saint Laurent");
      if (fullText.includes("276") || fullText.includes("mica")) return makeImg("eyewear-saint-laurent-sl-276-mica.webp", "Saint Laurent SL 276 Mica cat eye sunglasses", "Saint Laurent");
      if (fullText.includes("sl 461") || fullText.includes("sl-461")) return makeImg("eyewear-saint-laurent-sl-461.webp", "Saint Laurent SL 461 square acetate sunglasses", "Saint Laurent");
      if (fullText.includes("302") || fullText.includes("lisa")) return makeImg("eyewear-saint-laurent-sl-302-lisa.webp", "Saint Laurent SL 302 Lisa geometric wire sunglasses", "Saint Laurent");
      if (fullText.includes("sl m103") || fullText.includes("sl-m103")) return makeImg("eyewear-saint-laurent-sl-m103.webp", "Saint Laurent SL M103 oval sunglasses", "Saint Laurent");
      if (fullText.includes("sl 574") || fullText.includes("sl-574")) return makeImg("eyewear-saint-laurent-sl-574.webp", "Saint Laurent SL 574 rectangular sunglasses", "Saint Laurent");
      if (fullText.includes("sl 108") || fullText.includes("sl-108")) return makeImg("eyewear-saint-laurent-sl-108.webp", "Saint Laurent SL 108 aviator metal sunglasses", "Saint Laurent");
      if (fullText.includes("sl 402") || fullText.includes("sl-402")) return makeImg("eyewear-saint-laurent-sl-402.webp", "Saint Laurent SL 402 shield sunglasses", "Saint Laurent");
      if (fullText.includes("557") || fullText.includes("shade")) return makeImg("eyewear-saint-laurent-sl-557-shade.webp", "Saint Laurent SL 557 Shade round sunglasses", "Saint Laurent");
      return makeImg("eyewear-saint-laurent-sl-51.webp", `${product.name} luxury sunglasses`, "Saint Laurent");
    }

    // --- RAY-BAN ---
    if (brandLower.includes("ray-ban") || fullText.includes("ray-ban") || fullText.includes("rayban")) {
      if (fullText.includes("wayfarer classic") || fullText.includes("rb2140")) {
        return makeImg("eyewear-ray-ban-wayfarer.webp", "Ray-Ban Original Wayfarer Classic RB2140 acetate sunglasses", "Ray-Ban");
      }
      if (fullText.includes("new wayfarer") || fullText.includes("rb2132")) {
        return makeImg("eyewear-ray-ban-mega-wayfarer.webp", "Ray-Ban New Wayfarer RB2132 sunglasses", "Ray-Ban");
      }
      if (fullText.includes("clubmaster") || fullText.includes("rb3016")) {
        return makeImg("eyewear-ray-ban-clubmaster.webp", "Ray-Ban Clubmaster Classic RB3016 retro browline sunglasses", "Ray-Ban");
      }
      if (fullText.includes("round metal") || fullText.includes("rb3447")) {
        return makeImg("eyewear-ray-ban-round-metal.webp", "Ray-Ban Round Metal RB3447 curved brow bar sunglasses", "Ray-Ban");
      }
      if (fullText.includes("justin") || fullText.includes("rb4165")) {
        return makeImg("eyewear-ray-ban-justin.webp", "Ray-Ban Justin RB4165 rubberized sunglasses", "Ray-Ban");
      }
      if (fullText.includes("erika") || fullText.includes("rb4171")) {
        return makeImg("eyewear-ray-ban-erika.webp", "Ray-Ban Erika RB4171 round keyhole sunglasses", "Ray-Ban");
      }
      if (fullText.includes("hexagonal") || fullText.includes("rb3548n")) {
        return makeImg("eyewear-ray-ban-hexagonal.webp", "Ray-Ban Hexagonal Flat Lenses RB3548N sunglasses", "Ray-Ban");
      }
      if (fullText.includes("predator") || fullText.includes("rb2027")) {
        return makeImg("eyewear-ray-ban-predator.webp", "Ray-Ban Predator 2 RB2027 sport wraparound sunglasses", "Ray-Ban");
      }
      if (fullText.includes("caravan") || fullText.includes("rb3136")) {
        return makeImg("eyewear-ray-ban-caravan.webp", "Ray-Ban Caravan RB3136 geometric square metal sunglasses", "Ray-Ban");
      }
      return makeImg("eyewear-ray-ban-aviator.webp", "Ray-Ban Aviator Classic RB3025 teardrop crystal lens sunglasses", "Ray-Ban");
    }

    // --- PERSOL ---
    if (brandLower.includes("persol") || fullText.includes("persol")) {
      if (fullText.includes("714") || fullText.includes("mcqueen") || fullText.includes("folding")) {
        return makeImg("eyewear-persol-714-steve-mcqueen.webp", "Persol 714 Folding Steve McQueen pilot sunglasses", "Persol");
      }
      if (fullText.includes("3019s") || fullText.includes("square")) {
        return makeImg("eyewear-persol-3019s.webp", "Persol 3019S Square Italian sunglasses", "Persol");
      }
      if (fullText.includes("3092sm") || fullText.includes("3092")) {
        return makeImg("eyewear-persol-3092sm.webp", "Persol 3092SM Round keyhole bridge sunglasses", "Persol");
      }
      if (fullText.includes("3268s") || fullText.includes("3260s") || fullText.includes("rectangular")) {
        return makeImg("eyewear-persol-3260s.webp", "Persol Rectangular acetate sunglasses", "Persol");
      }
      if (fullText.includes("3225s") || fullText.includes("navigator")) {
        return makeImg("eyewear-persol-3225s.webp", "Persol 3225S Navigator double-bridge sunglasses", "Persol");
      }
      if (fullText.includes("3199s") || fullText.includes("browline")) {
        return makeImg("eyewear-persol-3199s.webp", "Persol 3199S Browline combination sunglasses", "Persol");
      }
      if (fullText.includes("2422sj") || fullText.includes("round metal")) {
        return makeImg("eyewear-persol-2422sj.webp", "Persol 2422SJ Round Metal sunglasses", "Persol");
      }
      if (fullText.includes("9649s") || fullText.includes("slim")) {
        return makeImg("eyewear-persol-9649s.webp", "Persol 9649S Slim pilot sunglasses", "Persol");
      }
      return makeImg("eyewear-persol-649-original.webp", "Persol 649 Original Victor Flex keyhole bridge sunglasses", "Persol");
    }

    // --- CARTIER EYEWEAR ---
    if (brandLower.includes("cartier") || fullText.includes("cartier")) {
      if (fullText.includes("première") || fullText.includes("premiere") || fullText.includes("rectangular")) {
        return makeImg("eyewear-cartier-premiere.webp", "Première de Cartier rectangular precious metal sunglasses", "Cartier");
      }
      return makeImg("eyewear-cartier-santos.webp", "Santos de Cartier Aviator precious gold-finish sunglasses", "Cartier");
    }

    // --- CHANEL EYEWEAR ---
    if (brandLower.includes("chanel") || fullText.includes("chanel")) {
      if (fullText.includes("shield") || fullText.includes("lambskin")) {
        return makeImg("eyewear-chanel-shield.webp", "Chanel Shield Sunglasses with Lambskin Temples", "Chanel");
      }
      return makeImg("eyewear-chanel-quilted-cat-eye.webp", "Chanel Classic Quilted Cat-Eye acetate sunglasses", "Chanel");
    }

    // --- DIOR EYEWEAR ---
    if (brandLower.includes("dior") || fullText.includes("dior")) {
      if (fullText.includes("midnight") || fullText.includes("diormidnight")) {
        return makeImg("eyewear-dior-diormidnight.webp", "DiorMidnight S1I cat-eye Christian Dior signature sunglasses", "Dior");
      }
      if (fullText.includes("30montaigne") || fullText.includes("montaigne")) {
        return makeImg("eyewear-dior-30montaigne.webp", "Dior 30Montaigne S2U CD functional hinge sunglasses", "Dior");
      }
      return makeImg("eyewear-dior-blacksuit.webp", "DiorBlackSuit S3I square engraved hinge sunglasses", "Dior");
    }

    // --- CELINE EYEWEAR ---
    if (brandLower.includes("celine") || fullText.includes("celine")) {
      if (fullText.includes("bold") || fullText.includes("3 dots") || fullText.includes("dots")) {
        return makeImg("eyewear-celine-bold-3-dots.webp", "Celine Bold 3 Dots rectangular thick acetate sunglasses", "Celine");
      }
      return makeImg("eyewear-celine-triomphe-oval.webp", "Celine Triomphe Metal 01 Oval gold monogram sunglasses", "Celine");
    }

    // --- VERSACE EYEWEAR ---
    if (brandLower.includes("versace") || fullText.includes("versace")) {
      if (fullText.includes("greca") || fullText.includes("ve2207")) {
        return makeImg("eyewear-versace-greca.webp", "Versace VE2207 Greca Navigator geometric metal sunglasses", "Versace");
      }
      return makeImg("eyewear-versace-medusa-biggie.webp", "Versace VE4361 Medusa Biggie low-lens gold medallion sunglasses", "Versace");
    }

    // --- TOM FORD EYEWEAR ---
    if (brandLower.includes("tom ford") || fullText.includes("tom ford")) {
      if (fullText.includes("marko") || fullText.includes("ft0144") || fullText.includes("aviator")) {
        return makeImg("eyewear-tom-ford-marko.webp", "Tom Ford FT0144 Marko metal aviator sunglasses", "Tom Ford");
      }
      if (fullText.includes("ft0237")) {
        return makeImg("eyewear-tom-ford-ft0237.webp", "Tom Ford FT0237 Snowdon thick-frame acetate sunglasses", "Tom Ford");
      }
      return makeImg("eyewear-tom-ford-snowdon.webp", "Tom Ford Snowdon FT0237 iconic T-logo temple sunglasses", "Tom Ford");
    }

    // --- PRADA EYEWEAR ---
    if (brandLower.includes("prada") || fullText.includes("prada")) {
      if (fullText.includes("17ws") || fullText.includes("pr 17")) {
        return makeImg("eyewear-prada-pr-17ws.webp", "Prada PR 17WS Symbole geometric angular faceted sunglasses", "Prada");
      }
      return makeImg("eyewear-prada-symbole.webp", "Prada Symbole rectangular three-dimensional temple sunglasses", "Prada");
    }

    // --- OLIVER PEOPLES ---
    if (brandLower.includes("oliver peoples") || fullText.includes("oliver peoples")) {
      if (fullText.includes("cary grant") || fullText.includes("5413")) {
        return makeImg("eyewear-oliver-peoples-cary-grant.webp", "Oliver Peoples Cary Grant Sun custom acetate sunglasses", "Oliver Peoples");
      }
      return makeImg("eyewear-oliver-peoples-gregory-peck.webp", "Oliver Peoples Gregory Peck Sun round keyhole bridge sunglasses", "Oliver Peoples");
    }

    // --- BALENCIAGA ---
    if (brandLower.includes("balenciaga") || fullText.includes("balenciaga")) {
      return makeImg("eyewear-balenciaga-bat.webp", "Balenciaga Bat Rectangle extreme architectural sunglasses", "Balenciaga");
    }

    return makeImg("eyewear-ray-ban-aviator.webp", `${product.name} designer UV400 sunglasses`, product.brand || "Luxury Eyewear");
  }

  return null;
}
