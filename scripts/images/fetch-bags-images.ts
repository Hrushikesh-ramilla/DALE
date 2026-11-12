import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export interface BagImageTarget {
  id: string;
  category: "handbags" | "backpacks" | "wallets";
  brand: string;
  model: string;
  filename: string;
  urls: string[];
}

export const BAG_TARGETS: BagImageTarget[] = [
  // ==========================================
  // HANDBAGS
  // ==========================================
  {
    id: "hermes-birkin",
    category: "handbags",
    brand: "Hermès",
    model: "Birkin 30 / 35 Togo Leather Bag",
    filename: "bags-hermes-birkin.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/9/9a/Hermes_Birkin.JPG",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "hermes-kelly",
    category: "handbags",
    brand: "Hermès",
    model: "Kelly 28 Sellier Box Calf Leather Bag",
    filename: "bags-hermes-kelly.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/1/13/Kelly_Bag.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/6f/Red_Crocodile_Kelly_Bag.jpg",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "hermes-constance",
    category: "handbags",
    brand: "Hermès",
    model: "Constance 18 Epsom Leather Shoulder Bag",
    filename: "bags-hermes-constance.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/e7/Hermes%E3%80%90Constance%E9%8C%A2%E5%8C%85%E6%89%8B%E5%8C%85-%E7%8E%AB%E7%91%B0-%E3%80%91_%E5%8E%9F%E5%BB%A0%E9%80%B2%E5%8F%A3%E9%A0%AD%E5%B1%A4%E7%89%9B%E7%9A%AE%E8%8D%94%E7%B4%8Btogo%E7%9A%AE_%E5%A4%9A%E5%8A%9F%E8%83%BD%E5%A4%A7%E5%AE%B9%E9%87%8F_%E7%9A%AE%E8%B3%AA%E7%B4%B0%E8%86%A9%E8%88%92%E9%81%A9_%E9%A1%8F%E8%89%B2%E9%BD%8A%E5%85%A8_%E6%98%A5%E5%A4%8F%E5%BF%85%E5%82%99%E6%AC%BE%E6%89%8B%E5%8C%85%E9%8C%A2%E5%8C%85_%E9%AB%98%E7%AB%AF%E5%A4%A7%E6%B0%A3%E4%B8%8A%E6%AA%94%E6%AC%A1_-%E8%AA%BF%E7%9A%AE-%E7%8F%BE%E8%B2%A8_%E5%B0%BA%E5%AF%B822cm%2A12cm-%E5%92%96%E5%95%A1-_%2837983387425%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/03/Hermes%E3%80%90Constance%E9%8C%A2%E5%8C%85%E6%89%8B%E5%8C%85-%E7%8E%AB%E7%91%B0-%E3%80%91_%E5%8E%9F%E5%BB%A0%E9%80%B2%E5%8F%A3%E9%A0%AD%E5%B1%A4%E7%89%9B%E7%9A%AE%E8%8D%94%E7%B4%8Btogo%E7%9A%AE_%E5%A4%9A%E5%8A%9F%E8%83%BD%E5%A4%A7%E5%AE%B9%E9%87%8F_%E7%9A%AE%E8%B3%AA%E7%B4%B0%E8%86%A9%E8%88%92%E9%81%A9_%E9%A1%8F%E8%89%B2%E9%BD%8A%E5%85%A8_%E6%98%A5%E5%A4%8F%E5%BF%85%E5%82%99%E6%AC%BE%E6%89%8B%E5%8C%85%E9%8C%A2%E5%8C%85_%E9%AB%98%E7%AB%AF%E5%A4%A7%E6%B0%A3%E4%B8%8A%E6%AA%94%E6%AC%A1_-%E8%AA%BF%E7%9A%AE-%E7%8F%BE%E8%B2%A8_%E5%B0%BA%E5%AF%B822cm%2A12cm-%E5%92%96%E5%95%A1-_%2838839757762%29.jpg",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chanel-classic-flap",
    category: "handbags",
    brand: "Chanel",
    model: "Classic Double Flap 11.12 Bag",
    filename: "bags-chanel-classic-flap.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/1/19/Chanel_CLASSIC_Double_Flap_2.55_.jpg",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chanel-255-reissue",
    category: "handbags",
    brand: "Chanel",
    model: "2.55 Reissue 226 Flap Bag",
    filename: "bags-chanel-255-reissue.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/9/9d/Chanel_2.55.jpg",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chanel-boy",
    category: "handbags",
    brand: "Chanel",
    model: "Boy Chanel Medium Flap Bag",
    filename: "bags-chanel-boy.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/7/7b/Chanel_Bag_%281099059431%29.jpg",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chanel-19",
    category: "handbags",
    brand: "Chanel",
    model: "Chanel 19 Large Flap Bag",
    filename: "bags-chanel-19.webp",
    urls: [
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chanel-22",
    category: "handbags",
    brand: "Chanel",
    model: "Chanel 22 Small Handbag",
    filename: "bags-chanel-22.webp",
    urls: [
      "https://images.unsplash.com/photo-1583623733237-4d5764a9dc82?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dior-lady-dior",
    category: "handbags",
    brand: "Dior",
    model: "Lady Dior Cannage Lambskin Bag",
    filename: "bags-dior-lady-dior.webp",
    urls: [
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dior-saddle",
    category: "handbags",
    brand: "Dior",
    model: "Saddle Bag with Strap Grained Calfskin",
    filename: "bags-dior-saddle.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/Dior-saddle-bag-blue-logo-1.jpg",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dior-book-tote",
    category: "handbags",
    brand: "Dior",
    model: "Medium Dior Book Tote Oblique Canvas",
    filename: "bags-dior-book-tote.webp",
    urls: [
      "https://images.unsplash.com/photo-1614179689702-355944cd0918?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dior-30-montaigne",
    category: "handbags",
    brand: "Dior",
    model: "30 Montaigne Flap Bag Box Calfskin",
    filename: "bags-dior-30-montaigne.webp",
    urls: [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "lv-neverfull",
    category: "handbags",
    brand: "Louis Vuitton",
    model: "Neverfull MM Monogram Canvas Tote",
    filename: "bags-lv-neverfull.webp",
    urls: [
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "lv-speedy-30",
    category: "handbags",
    brand: "Louis Vuitton",
    model: "Speedy 30 Bandoulière Damier Ebene Canvas",
    filename: "bags-lv-speedy-30.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/1/1d/Vuitton_Bag_%281187331740%29.jpg",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "lv-alma-bb",
    category: "handbags",
    brand: "Louis Vuitton",
    model: "Alma BB Handbag Epi Leather",
    filename: "bags-lv-alma-bb.webp",
    urls: [
      "https://images.unsplash.com/photo-1577733966973-d680bffd2e80?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "lv-capucines",
    category: "handbags",
    brand: "Louis Vuitton",
    model: "Capucines MM Taurillon Leather Handbag",
    filename: "bags-lv-capucines.webp",
    urls: [
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "goyard-saint-louis",
    category: "handbags",
    brand: "Goyard",
    model: "Saint Louis PM Goyardine Canvas Tote",
    filename: "bags-goyard-saint-louis.webp",
    urls: [
      "https://images.unsplash.com/photo-1575032617751-6ddec2089882?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "goyard-anjou",
    category: "handbags",
    brand: "Goyard",
    model: "Anjou PM Reversible Goyardine & Leather Tote",
    filename: "bags-goyard-anjou.webp",
    urls: [
      "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1575032617751-6ddec2089882?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "goyard-saigon",
    category: "handbags",
    brand: "Goyard",
    model: "Saïgon Structuré Mini Handbag",
    filename: "bags-goyard-saigon.webp",
    urls: [
      "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1575032617751-6ddec2089882?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "bv-cassette",
    category: "handbags",
    brand: "Bottega Veneta",
    model: "Cassette Padded Intreccio Crossbody Bag",
    filename: "bags-bv-cassette.webp",
    urls: [
      "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "bv-jodie",
    category: "handbags",
    brand: "Bottega Veneta",
    model: "Jodie Small Intrecciato Nappa Leather Hobo Bag",
    filename: "bags-bv-jodie.webp",
    urls: [
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "bv-andiamo",
    category: "handbags",
    brand: "Bottega Veneta",
    model: "Andiamo Medium Intrecciato Leather Handbag",
    filename: "bags-bv-andiamo.webp",
    urls: [
      "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "celine-triomphe",
    category: "handbags",
    brand: "Celine",
    model: "Triomphe Classique Bag in Shiny Calfskin",
    filename: "bags-celine-triomphe.webp",
    urls: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "celine-luggage",
    category: "handbags",
    brand: "Celine",
    model: "Luggage Nano Bag in Drummed Calfskin",
    filename: "bags-celine-luggage.webp",
    urls: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "celine-16",
    category: "handbags",
    brand: "Celine",
    model: "16 Small Bag in Satinated Calfskin",
    filename: "bags-celine-16.webp",
    urls: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "fendi-baguette",
    category: "handbags",
    brand: "Fendi",
    model: "Baguette Medium Leather Shoulder Bag",
    filename: "bags-fendi-baguette.webp",
    urls: [
      "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "fendi-peekaboo",
    category: "handbags",
    brand: "Fendi",
    model: "Peekaboo ISeeU Medium Leather Bag",
    filename: "bags-fendi-peekaboo.webp",
    urls: [
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "gucci-jackie",
    category: "handbags",
    brand: "Gucci",
    model: "Jackie 1961 Small Leather Shoulder Bag",
    filename: "bags-gucci-jackie.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/6/66/Gucci%2C_bamboo_bag%2C_1960-65_ca._%28firenze%2C_archivio_storico_gucci%29.jpg",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "gucci-horsebit",
    category: "handbags",
    brand: "Gucci",
    model: "Horsebit 1955 Small Shoulder Bag",
    filename: "bags-gucci-horsebit.webp",
    urls: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "gucci-dionysus",
    category: "handbags",
    brand: "Gucci",
    model: "Dionysus Small GG Supreme Shoulder Bag",
    filename: "bags-gucci-dionysus.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/44/Gucci_Bag_%281454356265%29.jpg",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "gucci-marmont",
    category: "handbags",
    brand: "Gucci",
    model: "GG Marmont Small Matelassé Shoulder Bag",
    filename: "bags-gucci-marmont.webp",
    urls: [
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "prada-galleria",
    category: "handbags",
    brand: "Prada",
    model: "Prada Galleria Medium Saffiano Leather Bag",
    filename: "bags-prada-galleria.webp",
    urls: [
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "prada-re-edition-2005",
    category: "handbags",
    brand: "Prada",
    model: "Re-Edition 2005 Saffiano Leather Bag",
    filename: "bags-prada-re-edition-2005.webp",
    urls: [
      "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "prada-cleo",
    category: "handbags",
    brand: "Prada",
    model: "Cleo Brushed Leather Shoulder Bag with Flap",
    filename: "bags-prada-cleo.webp",
    urls: [
      "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "ysl-loulou",
    category: "handbags",
    brand: "Saint Laurent",
    model: "Loulou Puffer Medium Bag in Quilted Lambskin",
    filename: "bags-ysl-loulou.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/4d/YSL_bag.jpg",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "ysl-sac-de-jour",
    category: "handbags",
    brand: "Saint Laurent",
    model: "Sac de Jour Small Supple Grained Leather Bag",
    filename: "bags-ysl-sac-de-jour.webp",
    urls: [
      "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "ysl-kate",
    category: "handbags",
    brand: "Saint Laurent",
    model: "Kate Small Reversible Chain Shoulder Bag",
    filename: "bags-ysl-kate.webp",
    urls: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "ysl-le-5-a-7",
    category: "handbags",
    brand: "Saint Laurent",
    model: "Le 5 à 7 Smooth Leather Shoulder Bag",
    filename: "bags-ysl-le-5-a-7.webp",
    urls: [
      "https://images.unsplash.com/photo-1520006403909-838d6b92c22e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "valentino-loco",
    category: "handbags",
    brand: "Valentino",
    model: "Locò Small Leather Shoulder Bag",
    filename: "bags-valentino-loco.webp",
    urls: [
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "valentino-rockstud",
    category: "handbags",
    brand: "Valentino",
    model: "Rockstud Grainy Calfskin Crossbody Bag",
    filename: "bags-valentino-rockstud.webp",
    urls: [
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "loewe-puzzle",
    category: "handbags",
    brand: "Loewe",
    model: "Puzzle Small Bag in Classic Calfskin",
    filename: "bags-loewe-puzzle.webp",
    urls: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "balenciaga-hourglass",
    category: "handbags",
    brand: "Balenciaga",
    model: "Hourglass Small Calfskin Handbag",
    filename: "bags-balenciaga-hourglass.webp",
    urls: [
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // BACKPACKS
  // ==========================================
  {
    id: "lv-christopher",
    category: "backpacks",
    brand: "Louis Vuitton",
    model: "Christopher PM Backpack Epi Leather",
    filename: "bags-lv-christopher.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/ed/Trendy_Backpack_%28Unsplash%29.jpg",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "lv-michael",
    category: "backpacks",
    brand: "Louis Vuitton",
    model: "Michael / Discovery PM Backpack",
    filename: "bags-lv-michael.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/9/90/Unsplash_Backpack_%28Unsplash_aOEkg_6sWsg%29.jpg",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "prada-re-nylon-backpack",
    category: "backpacks",
    brand: "Prada",
    model: "Re-Nylon Medium Backpack with Saffiano Details",
    filename: "bags-prada-re-nylon-backpack.webp",
    urls: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "rimowa-never-still-backpack",
    category: "backpacks",
    brand: "Rimowa",
    model: "Never Still Flap Backpack Canvas & Leather",
    filename: "bags-rimowa-never-still-backpack.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/1/12/Unsplash_Backpack_%28Unsplash%29.jpg",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "tumi-alpha-bravo-navigation",
    category: "backpacks",
    brand: "Tumi",
    model: "Alpha Bravo Navigation Backpack",
    filename: "bags-tumi-alpha-bravo-navigation.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/a/a4/HK_%E5%B0%BC%E9%BE%8D_Tumi_%E5%87%BA%E5%B7%AE_%E6%89%8B%E6%8F%90%E5%8C%85_%E9%9B%99%E8%82%A9%E5%8C%85_October_2022_Px3.jpg",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "montblanc-meisterstuck-backpack",
    category: "backpacks",
    brand: "Montblanc",
    model: "Meisterstück Selection Soft Leather Backpack",
    filename: "bags-montblanc-meisterstuck-backpack.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/43/Leather_backpack_Asian_Art_Museum_SF_2006.3.692.JPG",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "bv-backpack",
    category: "backpacks",
    brand: "Bottega Veneta",
    model: "Intrecciato Leather Classic Backpack",
    filename: "bags-bv-backpack.webp",
    urls: [
      "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "goyard-alpin-backpack",
    category: "backpacks",
    brand: "Goyard",
    model: "Alpin MM Goyardine Backpack",
    filename: "bags-goyard-alpin-backpack.webp",
    urls: [
      "https://images.unsplash.com/photo-1575032617751-6ddec2089882?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dior-rider-backpack",
    category: "backpacks",
    brand: "Dior",
    model: "Rider Backpack in Dior Oblique Jacquard",
    filename: "bags-dior-rider-backpack.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/5/5e/Dior-saddle-bag-blue-logo-1.jpg",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chanel-duma-backpack",
    category: "backpacks",
    brand: "Chanel",
    model: "Duma Vintage Quilted Lambskin Backpack",
    filename: "bags-chanel-duma-backpack.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/7/7b/Chanel_Bag_%281099059431%29.jpg",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "balenciaga-explorer-backpack",
    category: "backpacks",
    brand: "Balenciaga",
    model: "Explorer Nylon Backpack in Recycled Polyamide",
    filename: "bags-balenciaga-explorer-backpack.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/9/90/Unsplash_Backpack_%28Unsplash_aOEkg_6sWsg%29.jpg",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "ysl-city-backpack",
    category: "backpacks",
    brand: "Saint Laurent",
    model: "City Backpack in Matte Leather",
    filename: "bags-ysl-city-backpack.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/ed/Trendy_Backpack_%28Unsplash%29.jpg",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // WALLETS
  // ==========================================
  {
    id: "goyard-victoire",
    category: "wallets",
    brand: "Goyard",
    model: "Victoire Bifold Wallet in Goyardine Canvas",
    filename: "bags-goyard-victoire.webp",
    urls: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "goyard-saint-pierre",
    category: "wallets",
    brand: "Goyard",
    model: "Saint-Pierre Card Wallet in Goyardine Canvas",
    filename: "bags-goyard-saint-pierre.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/b/b8/La_Compagnie_Robinson_2017_%28Unsplash%29.jpg",
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "lv-multiple-wallet",
    category: "wallets",
    brand: "Louis Vuitton",
    model: "Multiple Wallet Damier Ebene",
    filename: "bags-lv-multiple-wallet.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/0/0b/Louis-vuitton-carteira-cartoes-vermelha-1200-1_%2826801994123%29.jpg",
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "lv-zippy-wallet",
    category: "wallets",
    brand: "Louis Vuitton",
    model: "Zippy Wallet Monogram",
    filename: "bags-lv-zippy-wallet.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/f/f3/Carteira-zipper-louis-vuitton-1_%2824308491564%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/15/Carteira-zipper-louis-vuitton-6_%2824821129472%29.jpg",
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "lv-brazza-wallet",
    category: "wallets",
    brand: "Louis Vuitton",
    model: "Brazza Wallet Taïga Leather",
    filename: "bags-lv-brazza-wallet.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/6/64/%22Sarah_Wallet%22_Louis_Vuitton.jpg",
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "hermes-bearn-compact",
    category: "wallets",
    brand: "Hermès",
    model: "Béarn Compact Wallet",
    filename: "bags-hermes-bearn-compact.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/e7/Hermes%E3%80%90Constance%E9%8C%A2%E5%8C%85%E6%89%8B%E5%8C%85-%E7%8E%AB%E7%91%B0-%E3%80%91_%E5%8E%9F%E5%BB%A0%E9%80%B2%E5%8F%A3%E9%A0%AD%E5%B1%A4%E7%89%9B%E7%9A%AE%E8%8D%94%E7%B4%8Btogo%E7%9A%AE_%E5%A4%9A%E5%8A%9F%E8%83%BD%E5%A4%A7%E5%AE%B9%E9%87%8F_%E7%9A%AE%E8%B3%AA%E7%B4%B0%E8%86%A9%E8%88%92%E9%81%A9_%E9%A1%8F%E8%89%B2%E9%BD%8A%E5%85%A8_%E6%98%A5%E5%A4%8F%E5%BF%85%E5%82%99%E6%AC%BE%E6%89%8B%E5%8C%85%E9%8C%A2%E5%8C%85_%E9%AB%98%E7%AB%AF%E5%A4%A7%E6%B0%A3%E4%B8%8A%E6%AA%94%E6%AC%A1_-%E8%AA%BF%E7%9A%AE-%E7%8F%BE%E8%B2%A8_%E5%B0%BA%E5%AF%B822cm%2A12cm-%E5%92%96%E5%95%A1-_%2837983387425%29.jpg",
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "hermes-kelly-pocket",
    category: "wallets",
    brand: "Hermès",
    model: "Kelly Pocket Slim Wallet",
    filename: "bags-hermes-kelly-pocket.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/1/11/Hermes-%E5%A4%AA%E9%99%BD--%E5%BE%97%E6%84%8F-kelly%E9%8C%A2%E5%8C%85%E6%89%8B%E5%8C%85_%E5%8E%9F%E5%BB%A0%E9%80%B2%E5%8F%A3%E9%A0%AD%E5%B1%A4%E7%89%9B%E7%9A%AE%E8%8D%94%E7%B4%8BTogo_%E9%A1%8F%E8%89%B2%E9%BD%8A%E5%85%A8_%E7%8F%BE%E8%B2%A8%E5%B0%BA%E5%AF%B8%EF%BC%9A20cm%2A11cm_%2827093542559%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/8/8e/Hermes-%E5%A4%AA%E9%99%BD--%E5%BE%97%E6%84%8F-kelly%E9%8C%A2%E5%8C%85%E6%89%8B%E5%8C%85_%E5%8E%9F%E5%BB%A0%E9%80%B2%E5%8F%A3%E9%A0%AD%E5%B1%A4%E7%89%9B%E7%9A%AE%E8%8D%94%E7%B4%8BTogo_%E9%A1%8F%E8%89%B2%E9%BD%8A%E5%85%A8_%E7%8F%BE%E8%B2%A8%E5%B0%BA%E5%AF%B8%EF%BC%9A20cm%2A11cm_%2824005243097%29.jpg",
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chanel-classic-flap-wallet",
    category: "wallets",
    brand: "Chanel",
    model: "Classic Small Flap Wallet Caviar",
    filename: "bags-chanel-classic-flap-wallet.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/1/19/Chanel_CLASSIC_Double_Flap_2.55_.jpg",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chanel-zipped-coin-purse",
    category: "wallets",
    brand: "Chanel",
    model: "Classic Zipped Coin Purse Wallet",
    filename: "bags-chanel-zipped-coin-purse.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/9/9d/Chanel_2.55.jpg",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "bv-bifold-wallet",
    category: "wallets",
    brand: "Bottega Veneta",
    model: "Intrecciato Slim Bi-Fold Wallet",
    filename: "bags-bv-bifold-wallet.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/d/d0/Isaac_Benhesed_2017_%28Unsplash%29.jpg",
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "bv-cassette-wallet",
    category: "wallets",
    brand: "Bottega Veneta",
    model: "Cassette Bi-Fold Wallet Intreccio",
    filename: "bags-bv-cassette-wallet.webp",
    urls: [
      "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "prada-saffiano-bifold-wallet",
    category: "wallets",
    brand: "Prada",
    model: "Saffiano Metal Lettering Small Flap Wallet",
    filename: "bags-prada-saffiano-bifold-wallet.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/eb/Carteira-pequena-prada-toda-couro-1_%2824312250793%29.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/9/94/Carteira-grande-prada-toda-couro-3_%2824643624540%29.jpg",
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "ysl-cassandre-wallet",
    category: "wallets",
    brand: "Saint Laurent",
    model: "Cassandre Matelassé Large Flap Wallet",
    filename: "bags-ysl-cassandre-wallet.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/4d/YSL_bag.jpg",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "gucci-marmont-wallet",
    category: "wallets",
    brand: "Gucci",
    model: "GG Marmont Bifold Wallet Chevron Leather",
    filename: "bags-gucci-marmont-wallet.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/44/Gucci_Bag_%281454356265%29.jpg",
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dior-lotus-wallet",
    category: "wallets",
    brand: "Dior",
    model: "Lady Dior Lotus Wallet Cannage Lambskin",
    filename: "bags-dior-lotus-wallet.webp",
    urls: [
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "fendi-baguette-wallet",
    category: "wallets",
    brand: "Fendi",
    model: "Baguette Micro Trifold Wallet",
    filename: "bags-fendi-baguette-wallet.webp",
    urls: [
      "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "montblanc-meisterstuck-wallet",
    category: "wallets",
    brand: "Montblanc",
    model: "Meisterstück 6cc Bi-Fold Wallet",
    filename: "bags-montblanc-meisterstuck-wallet.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/e9/Burberry_wallet.jpg",
      "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80",
    ],
  },
];

export async function fetchBagsImages() {
  const targetDir = path.resolve(process.cwd(), "public/images/products");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`Starting luxury bags image fetch for ${BAG_TARGETS.length} iconic models...`);
  let downloaded = 0;
  let failed = 0;

  for (const item of BAG_TARGETS) {
    const dest = path.join(targetDir, item.filename);

    // If file already exists and is healthy (>10KB), count as already downloaded
    if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) {
      console.log(`[EXISTS] ${item.model.padEnd(35)} -> ${item.filename} (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`);
      downloaded++;
      continue;
    }

    let success = false;
    for (const url of item.urls) {
      // Determine appropriate user-agent
      const isWikimedia = url.includes("wikimedia.org");
      const userAgent = isWikimedia
        ? "BuyerGuardLuxuryCatalog/1.0 (bot@buyerguard.luxury)"
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

      try {
        let res = await fetch(url, {
          headers: {
            "User-Agent": userAgent,
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
        });

        // If rate limited on Wikimedia, back off and retry once
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 1500));
          res = await fetch(url, {
            headers: {
              "User-Agent": userAgent,
              Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
          });
        }

        if (!res.ok) continue;

        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 500) continue;

        // Resize to 600x600, fit: "contain" on #fbfbfb, compress to WebP (quality 82, effort 6)
        const webp = await sharp(buf)
          .resize(600, 600, {
            fit: "contain",
            background: { r: 251, g: 251, b: 251, alpha: 1 },
          })
          .webp({ quality: 82, effort: 6 })
          .toBuffer();

        fs.writeFileSync(dest, webp);
        console.log(`[DOWNLOADED] ${item.model.padEnd(35)} -> ${item.filename} (${(webp.length / 1024).toFixed(1)} KB)`);
        success = true;
        downloaded++;
        break;
      } catch (err: any) {
        // try next fallback url
      }
    }

    if (!success) {
      console.error(`[FAILED] Could not download photo for: ${item.brand} - ${item.model}`);
      failed++;
    }

    // Polite delay between downloads
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\nFinished luxury bags images: ${downloaded} processed, ${failed} failed.`);
}

if (process.argv[1]?.includes("fetch-bags-images")) {
  fetchBagsImages().catch(console.error);
}
