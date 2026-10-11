import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { censusManifestFileSchema, type CensusManifestFile } from "../src/domain/coverage-targets";
import { leafToParentCategory, type LeafTypeKey } from "../src/domain/departments";
import { catalogManifestV2Schema, type CatalogManifestV2, type ProductV2 } from "../src/domain/catalog-manifest";

function estimateSandboxPrice(leafKey: string, brand: string, modelName: string, attrs: Record<string, unknown>): number {
  const modelLower = modelName.toLowerCase();
  const brandLower = brand.toLowerCase();

  switch (leafKey) {
    case "laptops":
      if (brandLower === "apple") {
        if (modelLower.includes("pro 16")) return 249900;
        if (modelLower.includes("pro 14")) return 199900;
        if (modelLower.includes("air 15")) return 129900;
        return 99900;
      }
      if (modelLower.includes("razer blade 18") || modelLower.includes("titan") || modelLower.includes("rog strix scar")) return 329900;
      if (modelLower.includes("blade 16") || modelLower.includes("legion 9") || modelLower.includes("alienware m18")) return 279900;
      if (modelLower.includes("xps 16") || modelLower.includes("spectre x360 16") || modelLower.includes("thinkpad x1 carbon")) return 189900;
      if (modelLower.includes("xps 13") || modelLower.includes("zenbook") || modelLower.includes("gram 16") || modelLower.includes("surface laptop 7")) return 119900;
      if (modelLower.includes("framework")) return 104900;
      if (modelLower.includes("swift") || modelLower.includes("ideapad") || modelLower.includes("vivobook") || modelLower.includes("laptop go")) return 64900;
      return 99900;

    case "tablets":
      if (brandLower === "apple") {
        if (modelLower.includes("pro 13")) return 129900;
        if (modelLower.includes("pro 11")) return 99900;
        if (modelLower.includes("air 13")) return 79900;
        if (modelLower.includes("air 11")) return 59900;
        if (modelLower.includes("mini")) return 49900;
        return 34900;
      }
      if (modelLower.includes("ultra")) return 119900;
      if (modelLower.includes("surface pro")) return 99900;
      if (modelLower.includes("plus") || modelLower.includes("matepad pro")) return 69900;
      if (modelLower.includes("pad 6s pro") || modelLower.includes("oneplus pad 2")) return 54900;
      if (modelLower.includes("fire hd") || modelLower.includes("pad se") || modelLower.includes("tcl")) return 14900;
      return 39900;

    case "headphones":
      if (modelLower.includes("he 1") || modelLower.includes("susvara") || modelLower.includes("utopia")) return 399900;
      if (modelLower.includes("hd 800") || modelLower.includes("t1") || modelLower.includes("clear mg") || modelLower.includes("empyrean")) return 149900;
      if (modelLower.includes("beoplay h95") || modelLower.includes("px8") || modelLower.includes("bathys") || modelLower.includes("max")) return 69900;
      if (modelLower.includes("hd 660") || modelLower.includes("dt 1990") || modelLower.includes("wh-1000xm5") || modelLower.includes("quietcomfort ultra") || modelLower.includes("beoplay h100")) return 44900;
      if (modelLower.includes("dt 770") || modelLower.includes("dt 990") || modelLower.includes("ath-m50x") || modelLower.includes("srh840a")) return 16900;
      return 29900;

    case "wall-chargers":
      if (brandLower === "ambrane" || brandLower === "portronics") {
        if (modelLower.includes("100w")) return 3499;
        if (modelLower.includes("65w")) return 2299;
        if (modelLower.includes("45w")) return 1799;
        if (modelLower.includes("30w") || modelLower.includes("33w")) return 1299;
        return 999;
      }
      if (modelLower.includes("140w") || modelLower.includes("160w")) return 9999;
      if (modelLower.includes("100w")) return 7499;
      if (modelLower.includes("65w") || modelLower.includes("67w") || modelLower.includes("70w")) return 4999;
      if (modelLower.includes("45w") || modelLower.includes("35w")) return 3999;
      if (modelLower.includes("30w") || modelLower.includes("25w")) return 2999;
      return 2499;

    case "portable-ssds":
      if (modelLower.includes("extreme pro") || modelLower.includes("x10 pro") || modelLower.includes("envoy pro") || modelLower.includes("t9")) return 18999;
      if (modelLower.includes("extreme") || modelLower.includes("t7 shield") || modelLower.includes("x9 pro") || modelLower.includes("xs2000")) return 12999;
      if (modelLower.includes("t7") || modelLower.includes("xs1000") || modelLower.includes("rugged mini")) return 8999;
      return 7999;

    case "phones":
      if (brandLower === "apple") {
        if (modelLower.includes("pro max")) return 144900;
        if (modelLower.includes("pro")) return 119900;
        if (modelLower.includes("plus")) return 89900;
        if (modelLower.includes("se")) return 49900;
        return 79900;
      }
      if (modelLower.includes("fold") || modelLower.includes("flip")) return 139999;
      if (modelLower.includes("ultra") || modelLower.includes("rog phone") || modelLower.includes("x100 pro")) return 99999;
      if (modelLower.includes("pro+") || modelLower.includes("pro plus") || modelLower.includes("gt 6") || modelLower.includes("phone (2)")) return 44999;
      if (modelLower.includes("pro") || modelLower.includes("ultra") || modelLower.includes("nord 4")) return 29999;
      if (modelLower.includes("cmf") || modelLower.includes("narzo") || modelLower.includes("p1")) return 15999;
      return 24999;

    case "earbuds":
      if (modelLower.includes("momentum") || modelLower.includes("wf-1000xm5") || modelLower.includes("quietcomfort")) return 24990;
      if (modelLower.includes("pro 2") || modelLower.includes("technics") || modelLower.includes("se215") || modelLower.includes("ie 200")) return 19990;
      if (modelLower.includes("galaxy buds3 pro") || modelLower.includes("elite 10") || modelLower.includes("fh3")) return 14999;
      if (modelLower.includes("nothing ear") || modelLower.includes("linkbuds") || modelLower.includes("live pro 2")) return 9999;
      if (modelLower.includes("ear (a)") || modelLower.includes("wave beam")) return 4999;
      return 7999;

    case "speakers":
      if (modelLower.includes("beosound 2") || modelLower.includes("ls50")) return 189900;
      if (modelLower.includes("beosound level") || modelLower.includes("beolit") || modelLower.includes("zeppelin") || modelLower.includes("formation wedge") || modelLower.includes("lsx ii")) return 79900;
      if (modelLower.includes("authentics 500") || modelLower.includes("partybox") || modelLower.includes("era 300") || modelLower.includes("five") || modelLower.includes("soundsticks 4") || modelLower.includes("woburn")) return 44990;
      if (modelLower.includes("soundlink max") || modelLower.includes("xtreme 4") || modelLower.includes("boombox 3") || modelLower.includes("move 2") || modelLower.includes("stanmore") || modelLower.includes("aura studio") || modelLower.includes("a5+")) return 29990;
      if (modelLower.includes("beosound a1") || modelLower.includes("soundlink flex") || modelLower.includes("charge 5") || modelLower.includes("emberton") || modelLower.includes("era 100") || modelLower.includes("onyx studio") || modelLower.includes("ult field 7") || modelLower.includes("d12") || modelLower.includes("the one plus")) return 16990;
      if (modelLower.includes("flip 6") || modelLower.includes("roam 2") || modelLower.includes("willen") || modelLower.includes("ult field 1") || modelLower.includes("r1280dbs")) return 9990;
      return 5990;

    case "power-banks":
      if (brandLower === "ambrane" || brandLower === "portronics" || brandLower === "boat") {
        if (modelLower.includes("100w") || modelLower.includes("65w")) return 3299;
        if (modelLower.includes("45w") || modelLower.includes("30000mah") || modelLower.includes("27000mah")) return 2499;
        if (modelLower.includes("20000mah") || modelLower.includes("20k")) return 1799;
        if (modelLower.includes("wireless")) return 1599;
        return 999;
      }
      if (modelLower.includes("250w") || modelLower.includes("140w") || modelLower.includes("145w")) return 12999;
      if (modelLower.includes("200w") || modelLower.includes("100w") || modelLower.includes("130w")) return 8999;
      if (modelLower.includes("65w") || modelLower.includes("50w") || modelLower.includes("45w")) return 4999;
      if (modelLower.includes("30w") || modelLower.includes("33w") || modelLower.includes("25w") || modelLower.includes("qi2")) return 3499;
      return 2499;

    case "internal-ssds":
      if (modelLower.includes("gen5") || modelLower.includes("t705") || modelLower.includes("t700") || modelLower.includes("mp700") || modelLower.includes("rocket 5") || modelLower.includes("firecuda 540") || modelLower.includes("nn5pro")) return 22999;
      if (modelLower.includes("990 pro") || modelLower.includes("sn850x") || modelLower.includes("t500") || modelLower.includes("kc3000") || modelLower.includes("renegade") || modelLower.includes("platinum p41") || modelLower.includes("p44 pro") || modelLower.includes("firecuda 530") || modelLower.includes("s70 blade")) return 13999;
      if (modelLower.includes("980 pro") || modelLower.includes("990 evo") || modelLower.includes("sn770") || modelLower.includes("legend 960") || modelLower.includes("mp600") || modelLower.includes("g series")) return 8999;
      if (modelLower.includes("sata") || modelLower.includes("870 evo") || modelLower.includes("mx500") || modelLower.includes("sa510") || modelLower.includes("su800") || modelLower.includes("gold s31")) return 5499;
      return 6999;

    case "hard-drives":
      if (modelLower.includes("1big dock") || modelLower.includes("g-raid") || modelLower.includes("gemini")) return 49999;
      if (modelLower.includes("d2 professional") || modelLower.includes("g-drive enterprise") || modelLower.includes("drivestation")) return 21999;
      if (modelLower.includes("nas") || modelLower.includes("ironwolf") || modelLower.includes("red plus") || modelLower.includes("n300") || modelLower.includes("x300")) return 14999;
      if (modelLower.includes("rugged") || modelLower.includes("armor") || modelLower.includes("ministation extreme") || modelLower.includes("mercury elite")) return 11999;
      if (modelLower.includes("my passport") || modelLower.includes("one touch") || modelLower.includes("canvio advance") || modelLower.includes("storejet") || modelLower.includes("p10")) return 7499;
      return 5499;

    case "keyboards":
      if (modelLower.includes("azoth") || modelLower.includes("claymore") || modelLower.includes("q1 pro") || modelLower.includes("q2 pro") || modelLower.includes("q3 pro") || modelLower.includes("lemokey") || modelLower.includes("blackwidow v4 pro") || modelLower.includes("huntsman v3 pro") || modelLower.includes("k100")) return 21999;
      if (modelLower.includes("mx mechanical") || modelLower.includes("g915") || modelLower.includes("deathstalker v2 pro") || modelLower.includes("apex pro") || modelLower.includes("k70 max") || modelLower.includes("strix scope ii")) return 16999;
      if (modelLower.includes("mx keys s") || modelLower.includes("k2 pro") || modelLower.includes("k3 pro") || modelLower.includes("v1 max") || modelLower.includes("air75") || modelLower.includes("halo75") || modelLower.includes("field75") || modelLower.includes("one 3") || modelLower.includes("k65 plus") || modelLower.includes("rt100")) return 10999;
      if (modelLower.includes("alloy") || modelLower.includes("ek68") || modelLower.includes("th80") || modelLower.includes("apex 9")) return 7499;
      return 4999;

    case "mice":
      if (modelLower.includes("ultralightx") || modelLower.includes("starlight") || modelLower.includes("spatha x") || modelLower.includes("chakram x") || modelLower.includes("naga v2 pro")) return 18999;
      if (modelLower.includes("superlight 2") || modelLower.includes("viper v3 pro") || modelLower.includes("deathadder v3 pro") || modelLower.includes("basilisk v3 pro") || modelLower.includes("harpe ace") || modelLower.includes("ec2-cw") || modelLower.includes("ec1-cw")) return 14999;
      if (modelLower.includes("mx master 3s") || modelLower.includes("g502 x plus") || modelLower.includes("dark core") || modelLower.includes("cobra pro") || modelLower.includes("gladius iii") || modelLower.includes("x2 v2") || modelLower.includes("xlite v3") || modelLower.includes("model o 2 wireless")) return 9999;
      if (modelLower.includes("mx anywhere 3s") || modelLower.includes("lift vertical") || modelLower.includes("aerox 5") || modelLower.includes("scimitar") || modelLower.includes("haste 2") || modelLower.includes("op1we") || modelLower.includes("xm2we")) return 6999;
      return 4499;

    case "soundbars":
      if (modelLower.includes("amadeo") || modelLower.includes("theatre") || modelLower.includes("beosound")) return 249900;
      if (modelLower.includes("q990") || modelLower.includes("arc") || modelLower.includes("bar 1300") || modelLower.includes("bravia theatre bar 9")) return 119900;
      if (modelLower.includes("q930") || modelLower.includes("beam") || modelLower.includes("bar 800") || modelLower.includes("smart ultra") || modelLower.includes("cinema 800")) return 69900;
      if (modelLower.includes("q800") || modelLower.includes("bar 500") || modelLower.includes("yas-209") || modelLower.includes("sr-c30a")) return 34990;
      return 19990;

    case "cables":
      if (brandLower === "ambrane" || brandLower === "portronics" || brandLower === "boat") {
        if (modelLower.includes("100w") || modelLower.includes("thunderbolt") || modelLower.includes("hdmi 2.1")) return 999;
        return 499;
      }
      if (modelLower.includes("thunderbolt 4") || modelLower.includes("thunderbolt 5") || modelLower.includes("pro cable")) return 6999;
      if (modelLower.includes("240w") || modelLower.includes("usb4") || modelLower.includes("hdmi 2.1") || modelLower.includes("displayport 2.1")) return 2999;
      if (modelLower.includes("100w") || modelLower.includes("silicone") || modelLower.includes("braided")) return 1699;
      return 1199;

    case "memory-cards":
      if (modelLower.includes("cfexpress") || modelLower.includes("type b") || modelLower.includes("v90")) return 34999;
      if (modelLower.includes("v60") || modelLower.includes("extreme pro") || modelLower.includes("canvas react plus")) return 11999;
      if (modelLower.includes("extreme") || modelLower.includes("canvas go") || modelLower.includes("pro ultimate") || modelLower.includes("evo plus")) return 3999;
      return 1999;

    case "usb-flash-drives":
      if (modelLower.includes("ironkey") || modelLower.includes("securekey") || modelLower.includes("encrypted")) return 18999;
      if (modelLower.includes("extreme pro") || modelLower.includes("max") || modelLower.includes("voyager gtx") || modelLower.includes("dual drive luxe")) return 5999;
      if (modelLower.includes("ultra dual") || modelLower.includes("bar plus") || modelLower.includes("datatraveler max")) return 2999;
      return 1499;

    case "monitors":
      if (modelLower.includes("proart oled") || modelLower.includes("studio display") || modelLower.includes("pg32ucdm") || modelLower.includes("odyssey oled g9")) return 149900;
      if (modelLower.includes("ultrasharp") || modelLower.includes("odyssey g8") || modelLower.includes("ultrafine") || modelLower.includes("predator x34")) return 89900;
      if (modelLower.includes("pd2706u") || modelLower.includes("m8") || modelLower.includes("rog strix") || modelLower.includes("tuf") || modelLower.includes("vg279")) return 44900;
      if (modelLower.includes("s2722qc") || modelLower.includes("viewfinity") || modelLower.includes("evnia")) return 29900;
      return 18900;

    case "docks-hubs":
      if (modelLower.includes("thunderbolt 4") || modelLower.includes("ts4") || modelLower.includes("element hub") || modelLower.includes("tb4 dock") || modelLower.includes("triple display")) return 32900;
      if (modelLower.includes("dual display") || modelLower.includes("thunderbolt 3") || modelLower.includes("sd5700t")) return 21900;
      if (modelLower.includes("10-in-1") || modelLower.includes("11-in-1") || modelLower.includes("9-in-1") || modelLower.includes("usb4")) return 9900;
      if (modelLower.includes("7-in-1") || modelLower.includes("6-in-1") || modelLower.includes("5-in-1") || modelLower.includes("usb-c hub")) return 4900;
      return 2900;

    case "webcams":
      if (modelLower.includes("insta360 link 2") || modelLower.includes("facecam pro") || modelLower.includes("brio 4k") || modelLower.includes("obsbot tiny 2")) return 27900;
      if (modelLower.includes("streamcam") || modelLower.includes("kiyo pro") || modelLower.includes("facecam mk.2") || modelLower.includes("brio 500")) return 14900;
      if (modelLower.includes("c920") || modelLower.includes("c922") || modelLower.includes("kiyo") || modelLower.includes("live streamer cam")) return 7900;
      return 4500;

    case "routers":
      if (modelLower.includes("wi-fi 7") || modelLower.includes("be98") || modelLower.includes("orbi 970") || modelLower.includes("dream machine") || modelLower.includes("rog rapture")) return 69900;
      if (modelLower.includes("axe16000") || modelLower.includes("axe11000") || modelLower.includes("orbi rbke963") || modelLower.includes("deco be85")) return 44900;
      if (modelLower.includes("ax11000") || modelLower.includes("ax6000") || modelLower.includes("deco x90") || modelLower.includes("nighthawk rax120")) return 24900;
      if (modelLower.includes("ax3000") || modelLower.includes("ax1800") || modelLower.includes("deco x50") || modelLower.includes("archer ax73")) return 10900;
      return 5900;

    // Clothing (Luxury & Savile Row / High Craft)
    case "shirts":
      if (brandLower === "charvet" || brandLower === "brioni" || brandLower === "loro piana" || brandLower === "brunello cucinelli") return 74900;
      if (brandLower === "tom ford" || brandLower === "saint laurent" || brandLower === "prada" || brandLower === "dior" || brandLower === "armani") return 49900;
      if (brandLower === "zegna" || brandLower === "canali" || brandLower === "turnbull & asser" || brandLower === "emma willis") return 36900;
      return 18900;

    case "t-shirts":
      if (brandLower === "loro piana" || brandLower === "brunello cucinelli") return 48900;
      if (brandLower === "saint laurent" || brandLower === "prada" || brandLower === "dior" || brandLower === "tom ford") return 34900;
      if (brandLower === "armani" || brandLower === "zegna" || brandLower === "burberry") return 24900;
      return 11900;

    case "knitwear":
      if (brandLower === "loro piana" || brandLower === "brunello cucinelli") return 169900;
      if (brandLower === "tom ford" || brandLower === "saint laurent" || brandLower === "prada" || brandLower === "dior") return 98900;
      if (brandLower === "zegna" || brandLower === "john smedley" || brandLower === "armani" || brandLower === "canali") return 54900;
      return 29900;

    case "trousers":
      if (brandLower === "loro piana" || brandLower === "brunello cucinelli" || brandLower === "brioni") return 89900;
      if (brandLower === "tom ford" || brandLower === "saint laurent" || brandLower === "prada" || brandLower === "armani") return 58900;
      if (brandLower === "zegna" || brandLower === "canali" || brandLower === "rota") return 39900;
      return 21900;

    case "denim":
      if (brandLower === "saint laurent" || brandLower === "tom ford" || brandLower === "brunello cucinelli") return 64900;
      if (brandLower === "prada" || brandLower === "dior" || brandLower === "armani" || brandLower === "jacob cohen") return 42900;
      return 22900;

    case "dresses":
      if (brandLower === "dior" || brandLower === "valentino" || brandLower === "chanel") return 329000;
      if (brandLower === "saint laurent" || brandLower === "prada" || brandLower === "tom ford" || brandLower === "armani") return 195000;
      return 89000;

    case "suits":
      if (brandLower === "brioni" || brandLower === "loro piana" || brandLower === "tom ford" || brandLower === "cesare attolini") return 449000;
      if (brandLower === "zegna" || brandLower === "canali" || brandLower === "armani" || brandLower === "saint laurent") return 275000;
      return 145000;

    case "jackets":
      if (brandLower === "brioni" || brandLower === "loro piana" || brandLower === "brunello cucinelli") return 289000;
      if (brandLower === "tom ford" || brandLower === "saint laurent" || brandLower === "prada" || brandLower === "armani") return 185000;
      return 89000;

    case "coats":
      if (brandLower === "loro piana" || brandLower === "brunello cucinelli" || brandLower === "brioni") return 389000;
      if (brandLower === "burberry" || brandLower === "saint laurent" || brandLower === "prada" || brandLower === "tom ford") return 245000;
      return 119000;

    // Footwear
    case "loafers":
      if (brandLower === "john lobb" || brandLower === "berluti" || brandLower === "edward green") return 189000;
      if (brandLower === "loro piana" || brandLower === "brunello cucinelli" || brandLower === "crockett & jones") return 98900;
      if (brandLower === "tod's" || brandLower === "santoni" || brandLower === "ferragamo" || brandLower === "gucci") return 69900;
      return 39900;

    case "formal-shoes":
      if (brandLower === "john lobb" || brandLower === "edward green" || brandLower === "gaziano & girling") return 195000;
      if (brandLower === "crockett & jones" || brandLower === "church's" || brandLower === "alden") return 89900;
      if (brandLower === "santoni" || brandLower === "ferragamo") return 64900;
      return 39900;

    case "running-shoes":
      if (modelLower.includes("alphafly") || modelLower.includes("vaporfly") || modelLower.includes("metaspeed") || modelLower.includes("adizero adios pro")) return 24999;
      if (modelLower.includes("cloudmonster") || modelLower.includes("invincible") || modelLower.includes("kayano") || modelLower.includes("clifton") || modelLower.includes("endorphin pro")) return 17999;
      if (modelLower.includes("pegasus") || modelLower.includes("ghost") || modelLower.includes("cloudsurfer") || modelLower.includes("novablast")) return 13999;
      return 9999;

    case "lifestyle-sneakers":
      if (brandLower === "loro piana" || brandLower === "brunello cucinelli" || brandLower === "berluti") return 89900;
      if (brandLower === "saint laurent" || brandLower === "prada" || brandLower === "gucci" || brandLower === "golden goose" || brandLower === "tom ford") return 59900;
      if (brandLower === "common projects" || brandLower === "tod's" || brandLower === "santoni") return 38900;
      return 18900;

    case "boots":
      if (brandLower === "john lobb" || brandLower === "edward green" || brandLower === "berluti") return 215000;
      if (brandLower === "crockett & jones" || brandLower === "alden" || brandLower === "church's") return 98900;
      if (brandLower === "saint laurent" || brandLower === "prada" || brandLower === "tod's" || brandLower === "rm williams") return 74900;
      return 42900;

    // Lifestyle / Accessories
    case "watches":
      if (brandLower === "patek philippe" || brandLower === "audemars piguet" || brandLower === "vacheron constantin" || brandLower === "a. lange & söhne") return 2850000;
      if (brandLower === "rolex" || brandLower === "jaeger-lecoultre") return 1150000;
      if (brandLower === "omega" || brandLower === "cartier" || brandLower === "iwc" || brandLower === "grand seiko" || brandLower === "panerai" || brandLower === "breitling") return 649000;
      if (brandLower === "tudor" || brandLower === "tag heuer" || brandLower === "longines") return 275000;
      if (brandLower === "tissot") return 69500;
      return 145000;

    case "sunglasses":
      if (brandLower === "jacques marie mage" || brandLower === "matsuda" || brandLower === "dita") return 79900;
      if (brandLower === "cutler and gross" || brandLower === "mykita" || brandLower === "oliver peoples") return 42900;
      if (brandLower === "moscot" || brandLower === "persol" || brandLower === "maui jim" || brandLower === "saint laurent" || brandLower === "gucci" || brandLower === "prada") return 28900;
      if (brandLower === "ray-ban" || brandLower === "oakley") return 14900;
      return 18900;

    case "handbags":
      if (brandLower === "hermès" || brandLower === "chanel") return 590000;
      if (brandLower === "dior" || brandLower === "louis vuitton" || brandLower === "saint laurent" || brandLower === "prada" || brandLower === "bottega veneta" || brandLower === "gucci") return 265000;
      if (brandLower === "loewe" || brandLower === "celine" || brandLower === "ferragamo" || brandLower === "burberry") return 185000;
      return 95000;

    case "backpacks":
      if (brandLower === "louis vuitton" || brandLower === "prada" || brandLower === "saint laurent" || brandLower === "bottega veneta") return 195000;
      if (brandLower === "tumi" || brandLower === "rimowa" || brandLower === "montblanc") return 68900;
      return 32900;

    case "wallets":
      if (brandLower === "hermès" || brandLower === "chanel" || brandLower === "louis vuitton" || brandLower === "bottega veneta" || brandLower === "saint laurent" || brandLower === "prada") return 54900;
      if (brandLower === "ferragamo" || brandLower === "burberry" || brandLower === "tom ford" || brandLower === "valextra" || brandLower === "montblanc") return 36900;
      return 19900;

    case "fragrance":
      if (brandLower === "roja parfums" || brandLower === "clive christian" || brandLower === "amouage") return 38500;
      if (brandLower === "creed" || brandLower === "parfums de marly" || brandLower === "initio" || brandLower === "maison francis kurkdjian" || brandLower === "kilian") return 29500;
      if (brandLower === "tom ford" || brandLower === "frederic malle" || brandLower === "le labo" || brandLower === "byredo" || brandLower === "diptyque" || brandLower === "penhaligon's") return 22500;
      if (brandLower === "chanel" || brandLower === "dior" || brandLower === "hermès" || brandLower === "serge lutens" || brandLower === "maison margiela") return 16500;
      return 14500;

    // Skincare / Beauty
    case "cleansers":
      if (brandLower === "la prairie" || brandLower === "la mer") return 12500;
      if (brandLower === "sisley paris" || brandLower === "clé de peau beauté" || brandLower === "guerlain") return 8900;
      if (brandLower === "sk-ii" || brandLower === "chanel" || brandLower === "dior" || brandLower === "estée lauder" || brandLower === "shiseido") return 5400;
      return 3900;

    case "serums":
      if (brandLower === "la prairie" || brandLower === "la mer") return 48500;
      if (brandLower === "clé de peau beauté" || brandLower === "sisley paris" || brandLower === "guerlain") return 32500;
      if (brandLower === "sk-ii" || brandLower === "chanel" || brandLower === "dior" || brandLower === "estée lauder" || brandLower === "shiseido" || brandLower === "lancôme") return 16500;
      return 9500;

    case "moisturizers":
      if (brandLower === "la prairie" || brandLower === "la mer") return 39500;
      if (brandLower === "clé de peau beauté" || brandLower === "sisley paris" || brandLower === "guerlain") return 28500;
      if (brandLower === "sk-ii" || brandLower === "chanel" || brandLower === "dior" || brandLower === "estée lauder" || brandLower === "shiseido" || brandLower === "lancôme") return 14500;
      return 7900;

    case "sunscreens":
      if (brandLower === "la prairie" || brandLower === "la mer" || brandLower === "clé de peau beauté" || brandLower === "sisley paris") return 14500;
      if (brandLower === "chanel" || brandLower === "dior" || brandLower === "shiseido" || brandLower === "lancôme") return 6200;
      return 4200;

    // Home & Appliances
    case "kitchenware":
      if (brandLower === "le creuset" || brandLower === "staub" || brandLower === "mauviel 1830") return 34500;
      if (brandLower === "all-clad" || brandLower === "zwilling" || brandLower === "wüsthof" || brandLower === "demeyere") return 22500;
      if (brandLower === "de buyer" || brandLower === "cristel" || brandLower === "lodge") return 11500;
      return 8900;

    case "decor":
      if (brandLower === "baccarat" || brandLower === "lalique" || brandLower === "hermès") return 68900;
      if (brandLower === "georg jensen" || brandLower === "alessi" || brandLower === "iittala" || brandLower === "fornasetti") return 29500;
      if (brandLower === "marimekko" || brandLower === "hay" || brandLower === "muuto") return 14500;
      return 9500;

    case "home-textiles":
      if (brandLower === "frette" || brandLower === "pratesi" || brandLower === "sferra") return 74900;
      if (brandLower === "yves delorme" || brandLower === "matouk" || brandLower === "bellora") return 38500;
      if (brandLower === "society limonta" || brandLower === "tekla" || brandLower === "the white company") return 18500;
      return 12500;

    case "vacuum-cleaners":
      if (modelLower.includes("v15") || modelLower.includes("gen5detect") || modelLower.includes("s8 pro ultra") || modelLower.includes("x40 ultra") || modelLower.includes("deebot x2")) return 74900;
      if (modelLower.includes("v12") || modelLower.includes("q revo") || modelLower.includes("j9+") || modelLower.includes("triflex hx2") || modelLower.includes("pure f9")) return 49900;
      if (modelLower.includes("v8") || modelLower.includes("shark stratos") || modelLower.includes("complete c3") || modelLower.includes("roomba combo")) return 29900;
      return 19900;

    case "air-purifiers":
      if (modelLower.includes("big+quiet") || modelLower.includes("pure cool tp09") || modelLower.includes("healthprotect 7770") || modelLower.includes("aeris aair 3-in-1") || modelLower.includes("alps")) return 69900;
      if (modelLower.includes("tp07") || modelLower.includes("blueair protect 7440") || modelLower.includes("philips series 4000i") || modelLower.includes("iqair healthpro")) return 42900;
      if (modelLower.includes("blue 211+") || modelLower.includes("philips series 2000i") || modelLower.includes("coway airmega 250") || modelLower.includes("sharp fp-j80m")) return 24900;
      if (modelLower.includes("core 400s") || modelLower.includes("airmega 150") || modelLower.includes("mi air purifier 4 pro")) return 14900;
      return 9900;

    default:
      return 9999;
  }
}


export function compileCensusToManifest(censusPath: string): CatalogManifestV2 {
  const raw = JSON.parse(readFileSync(censusPath, "utf-8"));
  const census = censusManifestFileSchema.parse(raw);
  const leafKey = census.leafKey as LeafTypeKey;
  const parentCategory = leafToParentCategory[leafKey] || "accessories";

  const hostSet = new Set<string>();
  const products: ProductV2[] = [];

  for (const entry of census.entries) {
    const primaryUrl = entry.sourceUrls[0];
    const urlObj = new URL(primaryUrl);
    hostSet.add(urlObj.hostname);

    // Format clean product ID: e.g. PROD-LAPTOPS-APPLE-MBA13-M2
    const cleanId = `PROD-${leafKey.toUpperCase()}-${entry.canonicalBrand.toUpperCase()}-${entry.id.toUpperCase()}`
      .replace(/[^A-Za-z0-9_-]/g, "-")
      .slice(0, 75);

    const specs: string[] = [
      `Brand: ${entry.displayBrand}`,
      `Model: ${entry.modelName}`,
      `Line: ${entry.productLine || entry.canonicalBrand}`,
      `Generation / Release: ${entry.generationOrYear || "Current"}`,
    ];

    if (entry.collectedAttributes) {
      for (const [key, value] of Object.entries(entry.collectedAttributes)) {
        if (value !== undefined && value !== null) {
          specs.push(`${key}: ${value}`);
        }
      }
    }

    const price = estimateSandboxPrice(leafKey, entry.canonicalBrand, entry.modelName, entry.collectedAttributes);
    const color = entry.variants?.find((v) => !v.includes("GB") && !v.includes("TB") && !v.includes("RAM")) || "Standard";

    const cleanedAttrs: Record<string, unknown> = {
      brand: entry.canonicalBrand.toLowerCase(),
      modelName: entry.modelName.toLowerCase(),
    };
    if (entry.collectedAttributes) {
      for (const [k, v] of Object.entries(entry.collectedAttributes)) {
        if (v === undefined || v === null) continue;
        if (k === "batteryHours" && typeof v === "number" && v <= 0) {
          continue;
        }
        if (typeof v === "string" && v.length > 80) {
          cleanedAttrs[k] = v.slice(0, 80);
          continue;
        }
        cleanedAttrs[k] = v;
      }
    }

    const compatDevices: string[] = [];
    if (leafKey === "wall-chargers" || leafKey === "power-banks" || leafKey === "cables" || leafKey === "docks-hubs") {
      compatDevices.push("air13", "air15", "prom1", "airm1", "iphone-16-pro", "samsung-s24-ultra", "pixel-9-pro");
    } else if (leafKey === "headphones" || leafKey === "earbuds" || leafKey === "portable-ssds" || leafKey === "monitors" || leafKey === "webcams") {
      compatDevices.push("air13", "air15", "prom1", "airm1", "iphone-16-pro", "samsung-s24-ultra");
    }

    const product: ProductV2 = {
      id: cleanId,
      name: `${entry.displayBrand} ${entry.modelName}`,
      category: parentCategory,
      leafType: leafKey,
      brand: entry.canonicalBrand,
      modelName: entry.modelName,
      skuVariant: entry.variants?.[0] || "Standard",
      description: `${entry.displayBrand} ${entry.modelName} (${entry.generationOrYear || "Current"}). Official manufacturer specification recorded from ${entry.sourceRegion} technical documentation. DALE offer price and stock are simulated.`,
      price,
      stock: 25,
      sponsored: false,
      color,
      source: primaryUrl,
      familyId: `${entry.canonicalBrand.toLowerCase()}:${entry.id}`,
      provenance: "manufacturer_evidence",
      offerKind: "sandbox",
      specs,
      compatibleModels: [],
      deviceCompatibility: compatDevices,
      accessoryProtocols:
        leafKey === "wall-chargers" || leafKey === "power-banks"
          ? {
              pdSupported: true,
              totalWatts:
                entry.collectedAttributes?.totalWatts ||
                entry.collectedAttributes?.maxOutputWatts ||
                30,
              ppsSupported: Boolean(entry.collectedAttributes?.ppsSupported),
            }
          : undefined,
      evidence: {
        checkedAt: entry.observationDate,
        region: `${entry.sourceRegion} verified documentation`,
        missing: entry.missingAttributes || [],
        review: "specifications",
      },
      attributes: {
        ...cleanedAttrs,
        brand: entry.canonicalBrand.toLowerCase(),
      } as any,
      media: {
        url: entry.mediaSource?.url || `https://${urlObj.hostname}/images/products/${entry.id}.jpg`,

        source: primaryUrl,
        alt: `${entry.displayBrand} ${entry.modelName} official technical reference`,
        attribution: `Product specifications and photography © ${entry.canonicalBrand}`,
        reviewedAt: entry.observationDate,
        usage: "external_reference",
      },
    };

    products.push(product);
  }

  const manifestId = `${leafKey}-core-2026-10-11-v2`;
  const manifest: CatalogManifestV2 = {
    schemaVersion: "catalog-manifest-v2",
    id: manifestId,
    reviewedBy: `operator-census-compiler:${leafKey}`,
    reviewedAt: "2026-10-11",
    approvedSourceHosts: Array.from(hostSet),
    products,
  };

  return catalogManifestV2Schema.parse(manifest);
}

// CLI execution if called directly
if (process.argv[1]?.endsWith("build-reviewed-manifest.ts")) {
  const targetLeaf = process.argv[2] || "laptops";
  const censusPath = resolve(process.cwd(), `catalog/census/${targetLeaf}.json`);
  if (!existsSync(censusPath)) {
    console.error(`Census file not found: ${censusPath}`);
    process.exit(1);
  }
  const manifest = compileCensusToManifest(censusPath);
  const outPath = resolve(process.cwd(), `catalog/manifests/${targetLeaf}-core-2026-10-11-v2.json`);
  writeFileSync(outPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`Successfully compiled ${manifest.products.length} products to ${outPath}`);
}
