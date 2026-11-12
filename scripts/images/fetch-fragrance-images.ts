import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export interface FragranceImageTarget {
  id: string;
  brand: string;
  model: string;
  filename: string;
  urls: string[];
}

export const FRAGRANCE_TARGETS: FragranceImageTarget[] = [
  // ==========================================
  // 1. DIOR (Christian Dior)
  // ==========================================
  {
    id: "dior-sauvage",
    brand: "Dior",
    model: "Sauvage Eau de Parfum",
    filename: "fragrance-dior-sauvage.webp",
    urls: [
      "https://www.dior.com/on/demandware.static/-/Sites-master_dior/default/dwb2cb1143/Y0785220/Y0785220_C099600180_E01_GHC.jpg",
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dior-sauvage-elixir",
    brand: "Dior",
    model: "Sauvage Elixir",
    filename: "fragrance-dior-sauvage-elixir.webp",
    urls: [
      "https://www.dior.com/on/demandware.static/-/Sites-master_dior/default/dwe7638975/Y0998004/Y0998004_C099600456_E01_GHC.jpg",
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dior-homme",
    brand: "Dior",
    model: "Dior Homme Intense",
    filename: "fragrance-dior-homme.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/8/87/Dior_Homme_bottle.jpg",
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dior-fahrenheit",
    brand: "Dior",
    model: "Fahrenheit Eau de Toilette",
    filename: "fragrance-dior-fahrenheit.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/c5/DIor_Fahreneit.png",
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dior-jadore",
    brand: "Dior",
    model: "J'adore l'Or Essence de Parfum",
    filename: "fragrance-dior-jadore.webp",
    urls: [
      "https://www.dior.com/on/demandware.static/-/Sites-master_dior/default/dwd7b03ae5/Y0997096/Y0997096_C099700474_E01_GHC.jpg",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dior-miss-dior",
    brand: "Dior",
    model: "Miss Dior Eau de Parfum",
    filename: "fragrance-dior-miss-dior.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/b/b3/Miss_Dior_Ch%C3%A9rie_bottle.jpg",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dior-gris-dior",
    brand: "Dior",
    model: "Gris Dior La Collection Privée",
    filename: "fragrance-dior-gris-dior.webp",
    urls: [
      "https://www.dior.com/on/demandware.static/-/Sites-master_dior/default/dw52f4d73d/Y0959160/Y0959160_F075442709_E01_GHC.jpg",
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 2. CHANEL
  // ==========================================
  {
    id: "chanel-bleu",
    brand: "Chanel",
    model: "Bleu de Chanel Eau de Parfum",
    filename: "fragrance-chanel-bleu.webp",
    urls: [
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
      "https://upload.wikimedia.org/wikipedia/commons/4/4e/Bleu_de_Chanel.jpg",
    ],
  },
  {
    id: "chanel-no5",
    brand: "Chanel",
    model: "Chanel No. 5 Eau de Parfum",
    filename: "fragrance-chanel-no5.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/7/7c/CHANEL_N%C2%B05.jpg",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chanel-coco-mademoiselle",
    brand: "Chanel",
    model: "Coco Mademoiselle Eau de Parfum",
    filename: "fragrance-chanel-coco-mademoiselle.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/0/0f/Coco_Mademoiselle_2001.jpg",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chanel-allure-homme-sport",
    brand: "Chanel",
    model: "Allure Homme Sport Eau Extrême",
    filename: "fragrance-chanel-allure-homme-sport.webp",
    urls: [
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chanel-chance",
    brand: "Chanel",
    model: "Chance Eau Tendre Eau de Parfum",
    filename: "fragrance-chanel-chance.webp",
    urls: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 3. CREED
  // ==========================================
  {
    id: "creed-aventus",
    brand: "Creed",
    model: "Aventus Eau de Parfum",
    filename: "fragrance-creed-aventus.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0271/3298/5441/files/Aventus_100ml_Mobile_1_0e7694fb-2806-484a-83ca-197c61011d63.jpg",
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "creed-green-irish-tweed",
    brand: "Creed",
    model: "Green Irish Tweed Eau de Parfum",
    filename: "fragrance-creed-green-irish-tweed.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0271/3298/5441/files/Green_Irish_Tweed_100ml_Mobile_1_4f5c7edc-a867-40d3-9d76-c2911288b0bb.jpg",
    ],
  },
  {
    id: "creed-silver-mountain-water",
    brand: "Creed",
    model: "Silver Mountain Water Eau de Parfum",
    filename: "fragrance-creed-silver-mountain-water.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0271/3298/5441/files/Silver_Mountain_Water_100ml_Mobile_1_c7bc2a96-089e-4ab9-b177-d495d800351f.jpg",
    ],
  },
  {
    id: "creed-millesime-imperial",
    brand: "Creed",
    model: "Millésime Impérial Eau de Parfum",
    filename: "fragrance-creed-millesime-imperial.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0271/3298/5441/files/Millesime_Imperial_100ml_Mobile_1_4c847f31-e0f0-42ae-a9b4-5184c35e4706.jpg",
    ],
  },
  {
    id: "creed-royal-oud",
    brand: "Creed",
    model: "Royal Oud Eau de Parfum",
    filename: "fragrance-creed-royal-oud.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0271/3298/5441/files/Royal_Oud_100ml_Mobile_1_1.jpg",
    ],
  },
  {
    id: "creed-viking",
    brand: "Creed",
    model: "Viking Eau de Parfum",
    filename: "fragrance-creed-viking.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0271/3298/5441/files/Viking_100ml_Mobile_1.jpg",
    ],
  },
  {
    id: "creed-original-vetiver",
    brand: "Creed",
    model: "Original Vetiver Eau de Parfum",
    filename: "fragrance-creed-original-vetiver.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0271/3298/5441/files/Original_Vetiver_100ml_Mobile_1_2.jpg",
    ],
  },
  {
    id: "creed-aventus-cologne",
    brand: "Creed",
    model: "Aventus Cologne Eau de Parfum",
    filename: "fragrance-creed-aventus-cologne.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0271/3298/5441/files/Aventus_Cologne_100ml_Mobile_1_90e98ed6-228f-4d34-8ce3-a62573884d26.jpg",
    ],
  },
  {
    id: "creed-carmina",
    brand: "Creed",
    model: "Carmina Eau de Parfum",
    filename: "fragrance-creed-carmina.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0271/3298/5441/files/Carmina_75ml_Mobile_1.jpg",
    ],
  },
  {
    id: "creed-virgin-island-water",
    brand: "Creed",
    model: "Virgin Island Water Eau de Parfum",
    filename: "fragrance-creed-virgin-island-water.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0271/3298/5441/files/Silver_Mountain_Water_100ml_Mobile_1_c7bc2a96-089e-4ab9-b177-d495d800351f.jpg",
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 4. TOM FORD
  // ==========================================
  {
    id: "tom-ford-tobacco-vanille",
    brand: "Tom Ford",
    model: "Tobacco Vanille Eau de Parfum",
    filename: "fragrance-tom-ford-tobacco-vanille.webp",
    urls: [
      "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "tom-ford-oud-wood",
    brand: "Tom Ford",
    model: "Oud Wood Eau de Parfum",
    filename: "fragrance-tom-ford-oud-wood.webp",
    urls: [
      "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "tom-ford-lost-cherry",
    brand: "Tom Ford",
    model: "Lost Cherry Eau de Parfum",
    filename: "fragrance-tom-ford-lost-cherry.webp",
    urls: [
      "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "tom-ford-neroli-portofino",
    brand: "Tom Ford",
    model: "Neroli Portofino Eau de Parfum",
    filename: "fragrance-tom-ford-neroli-portofino.webp",
    urls: [
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "tom-ford-black-orchid",
    brand: "Tom Ford",
    model: "Black Orchid Eau de Parfum",
    filename: "fragrance-tom-ford-black-orchid.webp",
    urls: [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "tom-ford-tuscan-leather",
    brand: "Tom Ford",
    model: "Tuscan Leather Eau de Parfum",
    filename: "fragrance-tom-ford-tuscan-leather.webp",
    urls: [
      "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 5. MAISON FRANCIS KURKDJIAN (MFK)
  // ==========================================
  {
    id: "mfk-baccarat-rouge-540",
    brand: "Maison Francis Kurkdjian",
    model: "Baccarat Rouge 540 Eau de Parfum",
    filename: "fragrance-mfk-baccarat-rouge-540.webp",
    urls: [
      "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "mfk-grand-soir",
    brand: "Maison Francis Kurkdjian",
    model: "Grand Soir Eau de Parfum",
    filename: "fragrance-mfk-grand-soir.webp",
    urls: [
      "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "mfk-724",
    brand: "Maison Francis Kurkdjian",
    model: "724 Eau de Parfum",
    filename: "fragrance-mfk-724.webp",
    urls: [
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "mfk-aqua-universalis",
    brand: "Maison Francis Kurkdjian",
    model: "Aqua Universalis Forte",
    filename: "fragrance-mfk-aqua-universalis.webp",
    urls: [
      "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 6. KILIAN PARIS
  // ==========================================
  {
    id: "kilian-angels-share",
    brand: "Kilian Paris",
    model: "Angels' Share Eau de Parfum",
    filename: "fragrance-kilian-angels-share.webp",
    urls: [
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "kilian-love-dont-be-shy",
    brand: "Kilian Paris",
    model: "Love, Don't Be Shy Eau de Parfum",
    filename: "fragrance-kilian-love-dont-be-shy.webp",
    urls: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "kilian-black-phantom",
    brand: "Kilian Paris",
    model: "Black Phantom Memento Mori",
    filename: "fragrance-kilian-black-phantom.webp",
    urls: [
      "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 7. PARFUMS DE MARLY
  // ==========================================
  {
    id: "pdm-layton",
    brand: "Parfums de Marly",
    model: "Layton Eau de Parfum",
    filename: "fragrance-pdm-layton.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0555/6279/7250/files/LAYTON-PERFUME-125-PACK1-1X1_CENTERED_3_2f1f594a-44ab-4241-b739-4eefd3086b09.png",
      "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "pdm-herod",
    brand: "Parfums de Marly",
    model: "Herod Eau de Parfum",
    filename: "fragrance-pdm-herod.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0555/6279/7250/files/HEROD-PERFUME-125-PACK1-1X1_CENTERED_3e70cfc5-b970-4b93-b7dc-9142dd852943.png",
    ],
  },
  {
    id: "pdm-pegasus",
    brand: "Parfums de Marly",
    model: "Pegasus Eau de Parfum",
    filename: "fragrance-pdm-pegasus.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0555/6279/7250/files/PEGASUS-PERFUME-125-PACK1-1X1_CENTERED_d3297627-c8b1-4b62-b09f-d14238ee595d.png",
    ],
  },
  {
    id: "pdm-carlisle",
    brand: "Parfums de Marly",
    model: "Carlisle Eau de Parfum",
    filename: "fragrance-pdm-carlisle.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0555/6279/7250/files/CARLISLE-PERFUME-125-PACK1-1X1-NO_SHADOW_CENTERED.png",
    ],
  },
  {
    id: "pdm-greenley",
    brand: "Parfums de Marly",
    model: "Greenley Eau de Parfum",
    filename: "fragrance-pdm-greenley.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0555/6279/7250/files/GREENLEY-PERFUME-125-PACK1-1X1_CENTERED_11a7cc98-7117-44dd-9963-d896c74970dd.png",
    ],
  },
  {
    id: "pdm-sedley",
    brand: "Parfums de Marly",
    model: "Sedley Eau de Parfum",
    filename: "fragrance-pdm-sedley.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0555/6279/7250/files/SEDLEY-PERFUME-125-PACK1-1X1_CENTERED_fc558275-a756-43b7-a5ca-c1076cb6f98b.png",
    ],
  },
  {
    id: "pdm-delina",
    brand: "Parfums de Marly",
    model: "Delina Eau de Parfum",
    filename: "fragrance-pdm-delina.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0555/6279/7250/files/DELINA-PERFUME-75-PACK1-1X1_CENTERED_1.png",
    ],
  },
  {
    id: "pdm-haltane",
    brand: "Parfums de Marly",
    model: "Haltane Eau de Parfum",
    filename: "fragrance-pdm-haltane.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0555/6279/7250/files/HALTHANE-PERFUME-125-PACK1-1X1_CENTERED_1_3f3f50ac-61c9-43f1-a3fe-39108f25b209.png",
    ],
  },
  {
    id: "pdm-althair",
    brand: "Parfums de Marly",
    model: "Althaïr Eau de Parfum",
    filename: "fragrance-pdm-althair.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0555/6279/7250/files/ALTHAIR-PERFUME-125-PACK1-1X1_CENTERED_1_04b177cf-0bde-4900-8332-7f56ec21ad6f.png",
    ],
  },
  {
    id: "pdm-valaya",
    brand: "Parfums de Marly",
    model: "Valaya Eau de Parfum",
    filename: "fragrance-pdm-valaya.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0555/6279/7250/files/VALAYA-PERFUME-75-PACK1-1X1_CENTERED_1_4d701a3c-bf47-4f28-8872-c018a0200cf9.png",
    ],
  },
  {
    id: "pdm-percival",
    brand: "Parfums de Marly",
    model: "Percival Eau de Parfum",
    filename: "fragrance-pdm-percival.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0555/6279/7250/files/SEDLEY-PERFUME-125-PACK1-1X1_CENTERED_fc558275-a756-43b7-a5ca-c1076cb6f98b.png",
    ],
  },

  // ==========================================
  // 8. HERMÈS
  // ==========================================
  {
    id: "hermes-terre",
    brand: "Hermès",
    model: "Terre d'Hermès Parfum",
    filename: "fragrance-hermes-terre.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/5/59/Terre_d%E2%80%99Herm%C3%A8s_%28cropped%29.JPG",
      "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "hermes-un-jardin-sur-le-nil",
    brand: "Hermès",
    model: "Un Jardin sur le Nil Eau de Toilette",
    filename: "fragrance-hermes-un-jardin-sur-le-nil.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/6/6d/Herm%C3%A8s_Jardin_sur_le_Nil.jpg",
      "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "hermes-twilly",
    brand: "Hermès",
    model: "Twilly d'Hermès Eau de Parfum",
    filename: "fragrance-hermes-twilly.webp",
    urls: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "hermes-h24",
    brand: "Hermès",
    model: "H24 Eau de Parfum",
    filename: "fragrance-hermes-h24.webp",
    urls: [
      "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 9. YVES SAINT LAURENT (YSL)
  // ==========================================
  {
    id: "ysl-y",
    brand: "Yves Saint Laurent",
    model: "Y Eau de Parfum",
    filename: "fragrance-ysl-y.webp",
    urls: [
      "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "ysl-libre",
    brand: "Yves Saint Laurent",
    model: "Libre Eau de Parfum",
    filename: "fragrance-ysl-libre.webp",
    urls: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "ysl-la-nuit-de-lhomme",
    brand: "Yves Saint Laurent",
    model: "La Nuit de L'Homme Eau de Toilette",
    filename: "fragrance-ysl-la-nuit-de-lhomme.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/ca/Opium_pour_Homme.jpg",
      "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "ysl-black-opium",
    brand: "Yves Saint Laurent",
    model: "Black Opium Eau de Parfum",
    filename: "fragrance-ysl-black-opium.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/e8/Black_opium.jpg",
      "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "ysl-tuxedo",
    brand: "Yves Saint Laurent",
    model: "Tuxedo Le Vestiaire des Parfums",
    filename: "fragrance-ysl-tuxedo.webp",
    urls: [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 10. GIORGIO ARMANI
  // ==========================================
  {
    id: "armani-acqua",
    brand: "Giorgio Armani",
    model: "Acqua di Giò Parfum",
    filename: "fragrance-armani-acqua.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/7/74/Armani_acqua_di_Gio_M.jpg",
      "https://images.unsplash.com/photo-1592914610354-fd354ea45e48?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "armani-code",
    brand: "Giorgio Armani",
    model: "Armani Code Parfum",
    filename: "fragrance-armani-code.webp",
    urls: [
      "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "armani-si",
    brand: "Giorgio Armani",
    model: "Sì Eau de Parfum Intense",
    filename: "fragrance-armani-si.webp",
    urls: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "armani-stronger-with-you",
    brand: "Giorgio Armani",
    model: "Stronger With You Intensely",
    filename: "fragrance-armani-stronger-with-you.webp",
    urls: [
      "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "armani-my-way",
    brand: "Giorgio Armani",
    model: "My Way Parfum",
    filename: "fragrance-armani-my-way.webp",
    urls: [
      "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 11. JEAN PAUL GAULTIER (JPG)
  // ==========================================
  {
    id: "jpg-lemale",
    brand: "Jean Paul Gaultier",
    model: "Le Male Eau de Toilette",
    filename: "fragrance-jpg-lemale.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/f/fa/Gaultier_Le_M%C3%A2le.jpg",
      "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "jpg-ultra-male",
    brand: "Jean Paul Gaultier",
    model: "Ultra Male Eau de Toilette Intense",
    filename: "fragrance-jpg-ultra-male.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/e/eb/Jean-Paul_Gaultier_Ultra_Male.jpg",
    ],
  },
  {
    id: "jpg-le-beau",
    brand: "Jean Paul Gaultier",
    model: "Le Beau Le Parfum",
    filename: "fragrance-jpg-le-beau.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/47/JP-Gaultier-Lemale-byRestrepo.png",
      "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "jpg-scandal",
    brand: "Jean Paul Gaultier",
    model: "Scandal Pour Homme",
    filename: "fragrance-jpg-scandal.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/d/d1/JP-Gaultier-ByRestrepo.png",
      "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 12. INITIO PARFUMS PRIVÉS
  // ==========================================
  {
    id: "initio-oud",
    brand: "Initio",
    model: "Oud for Greatness Eau de Parfum",
    filename: "fragrance-initio-oud.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0607/4816/9444/files/OFG_NEW_MCUS.png",
      "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "initio-side-effect",
    brand: "Initio",
    model: "Side Effect Eau de Parfum",
    filename: "fragrance-initio-side-effect.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0607/4816/9444/files/SIDEEFFECT_MasterProductPackshot_8713eda8-0884-482b-a35c-a88fbbaf7fba.png",
    ],
  },
  {
    id: "initio-rehab",
    brand: "Initio",
    model: "Rehab Extrait de Parfum",
    filename: "fragrance-initio-rehab.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0607/4816/9444/files/REHAB_MasterProductPackshot_077032ad-052d-4f8a-aeba-bc213bf5bedd.png",
    ],
  },
  {
    id: "initio-atomic-rose",
    brand: "Initio",
    model: "Atomic Rose Eau de Parfum",
    filename: "fragrance-initio-atomic-rose.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0607/4816/9444/files/ATOMICROSE_MasterProductPackshot_0_a9874dd8-6459-4d30-b525-44839e2c9ad6.png",
    ],
  },
  {
    id: "initio-musk-therapy",
    brand: "Initio",
    model: "Musk Therapy Extrait de Parfum",
    filename: "fragrance-initio-musk-therapy.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0607/4816/9444/files/MasterProductPackshot_MuskTherapy_Desktop_2c4ae589-3c2a-4d9c-b25b-1666cbf80bf3.png",
    ],
  },
  {
    id: "initio-psychedelic-love",
    brand: "Initio",
    model: "Psychedelic Love Eau de Parfum",
    filename: "fragrance-initio-psychedelic-love.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0607/4816/9444/files/PSYCHEDELIC_LOVE_MasterProductPackshot_524708b6-4956-40df-8411-83784853ccc5.png",
    ],
  },
  {
    id: "initio-paragon",
    brand: "Initio",
    model: "Paragon Extrait de Parfum",
    filename: "fragrance-initio-paragon.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0607/4816/9444/files/PARAGON_MasterProductPackshot_15e005e8-6d8b-4ef1-9b8c-3937dfc94315.png",
    ],
  },
  {
    id: "initio-narcotic-delight",
    brand: "Initio",
    model: "Narcotic Delight Eau de Parfum",
    filename: "fragrance-initio-narcotic-delight.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0607/4816/9444/files/NARCOTICDELIGHT_MasterProductPackshot_25a2d42b-3dd0-4bc9-81f0-ce6d7cddb4cc.png",
    ],
  },
  {
    id: "initio-blessed-baraka",
    brand: "Initio",
    model: "Blessed Baraka Eau de Parfum",
    filename: "fragrance-initio-blessed-baraka.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0607/4816/9444/files/BLESSEDBARAKA_MasterProductPackshot_BlessedBaraka_63438446-6603-4a72-a86f-6ceca29e8a5c.png",
    ],
  },
  {
    id: "initio-oud-for-happiness",
    brand: "Initio",
    model: "Oud for Happiness Eau de Parfum",
    filename: "fragrance-initio-oud-for-happiness.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0607/4816/9444/files/OUDFORHAPPINESS_MasterProductPackshot_517cbedc-e6f8-40c6-bca6-447066de9d95.png",
    ],
  },

  // ==========================================
  // 13. GUERLAIN
  // ==========================================
  {
    id: "guerlain-shalimar",
    brand: "Guerlain",
    model: "Shalimar Eau de Parfum",
    filename: "fragrance-guerlain-shalimar.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/9/9c/Shalimar.jpg",
      "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "guerlain-lhomme-ideal",
    brand: "Guerlain",
    model: "L'Homme Idéal Eau de Parfum",
    filename: "fragrance-guerlain-lhomme-ideal.webp",
    urls: [
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "guerlain-mon-guerlain",
    brand: "Guerlain",
    model: "Mon Guerlain Eau de Parfum",
    filename: "fragrance-guerlain-mon-guerlain.webp",
    urls: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "guerlain-habit-rouge",
    brand: "Guerlain",
    model: "Habit Rouge Rouge Privé",
    filename: "fragrance-guerlain-habit-rouge.webp",
    urls: [
      "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 14. VALENTINO
  // ==========================================
  {
    id: "valentino-born-in-roma",
    brand: "Valentino",
    model: "Born in Roma Uomo Eau de Toilette",
    filename: "fragrance-valentino-born-in-roma.webp",
    urls: [
      "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "valentino-uomo-intense",
    brand: "Valentino",
    model: "Valentino Uomo Intense Eau de Parfum",
    filename: "fragrance-valentino-uomo-intense.webp",
    urls: [
      "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "valentino-donna-born-in-roma",
    brand: "Valentino",
    model: "Born in Roma Donna Eau de Parfum",
    filename: "fragrance-valentino-donna-born-in-roma.webp",
    urls: [
      "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 15. VERSACE
  // ==========================================
  {
    id: "versace-eros",
    brand: "Versace",
    model: "Eros Eau de Toilette",
    filename: "fragrance-versace-eros.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/2/2a/VersaceEros121.jpg",
      "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "versace-dylan-blue",
    brand: "Versace",
    model: "Dylan Blue Eau de Toilette",
    filename: "fragrance-versace-dylan-blue.webp",
    urls: [
      "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "versace-pour-homme",
    brand: "Versace",
    model: "Versace Pour Homme Eau de Toilette",
    filename: "fragrance-versace-pour-homme.webp",
    urls: [
      "https://images.unsplash.com/photo-1592914610354-fd354ea45e48?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "versace-bright-crystal",
    brand: "Versace",
    model: "Bright Crystal Eau de Toilette",
    filename: "fragrance-versace-bright-crystal.webp",
    urls: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 16. PACO RABANNE
  // ==========================================
  {
    id: "rabanne-1-million",
    brand: "Paco Rabanne",
    model: "1 Million Eau de Toilette",
    filename: "fragrance-rabanne-1-million.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/0/03/Paco_Rabanne_1_Million_Parfum_-_1.jpg",
      "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "rabanne-invictus",
    brand: "Paco Rabanne",
    model: "Invictus Eau de Toilette",
    filename: "fragrance-rabanne-invictus.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/2/27/1_Million_PL.JPG",
      "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "rabanne-phantom",
    brand: "Paco Rabanne",
    model: "Phantom Eau de Toilette",
    filename: "fragrance-rabanne-phantom.webp",
    urls: [
      "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "rabanne-fame",
    brand: "Paco Rabanne",
    model: "Fame Eau de Parfum",
    filename: "fragrance-rabanne-fame.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/2/27/1_Million_PL.JPG",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 17. PRADA
  // ==========================================
  {
    id: "prada-luna-rossa",
    brand: "Prada",
    model: "Luna Rossa Black Eau de Parfum",
    filename: "fragrance-prada-luna-rossa.webp",
    urls: [
      "https://images.unsplash.com/photo-1583445013765-46c20c4a6772?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "prada-paradoxe",
    brand: "Prada",
    model: "Prada Paradoxe Eau de Parfum",
    filename: "fragrance-prada-paradoxe.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/7/74/2023_Woda_perfumowana_Prada_Paradoxe_%281%29.jpg",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "prada-lhomme",
    brand: "Prada",
    model: "L'Homme Prada Eau de Toilette",
    filename: "fragrance-prada-lhomme.webp",
    urls: [
      "https://images.unsplash.com/photo-1582211594533-268f4f1edcb9?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "prada-infusion-diris",
    brand: "Prada",
    model: "Les Infusions de Prada Infusion d'Iris",
    filename: "fragrance-prada-infusion-diris.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/48/Prada_Infusion_d%27Iris_Cedre.jpg",
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 18. SERGE LUTENS
  // ==========================================
  {
    id: "serge-lutens-chergui",
    brand: "Serge Lutens",
    model: "Chergui Eau de Parfum",
    filename: "fragrance-serge-lutens-chergui.webp",
    urls: [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "serge-lutens-ambre-sultan",
    brand: "Serge Lutens",
    model: "Ambre Sultan Eau de Parfum",
    filename: "fragrance-serge-lutens-ambre-sultan.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/7/73/Parfum_Serge_Lutens.JPG",
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "serge-lutens-feminite-du-bois",
    brand: "Serge Lutens",
    model: "Féminité du Bois Eau de Parfum",
    filename: "fragrance-serge-lutens-feminite-du-bois.webp",
    urls: [
      "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 19. AMOUAGE (10 Models - Official Omani Amouage CDN)
  // ==========================================
  {
    id: "amouage-interlude",
    brand: "Amouage",
    model: "Interlude Man Eau de Parfum",
    filename: "fragrance-amouage-interlude.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0823/5099/7796/files/INTERLUDE_MAN_100_ML.jpg",
      "https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "amouage-reflection-man",
    brand: "Amouage",
    model: "Reflection Man Eau de Parfum",
    filename: "fragrance-amouage-reflection-man.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0823/5099/7796/files/REFLECTION_100_ML.jpg",
    ],
  },
  {
    id: "amouage-jubilation-xxv",
    brand: "Amouage",
    model: "Jubilation XXV Man Eau de Parfum",
    filename: "fragrance-amouage-jubilation-xxv.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0823/5099/7796/files/JUBILATION_MAN_100_ML.jpg",
    ],
  },
  {
    id: "amouage-guidance",
    brand: "Amouage",
    model: "Guidance Eau de Parfum",
    filename: "fragrance-amouage-guidance.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0823/5099/7796/files/GUIDANCE_100_ML.jpg",
    ],
  },
  {
    id: "amouage-epic-man",
    brand: "Amouage",
    model: "Epic Man Eau de Parfum",
    filename: "fragrance-amouage-epic-man.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0823/5099/7796/files/EPIC_MAN_100ML.jpg",
    ],
  },
  {
    id: "amouage-honour-man",
    brand: "Amouage",
    model: "Honour Man Eau de Parfum",
    filename: "fragrance-amouage-honour-man.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0823/5099/7796/files/HONOUR_MAN.jpg",
    ],
  },
  {
    id: "amouage-dia-man",
    brand: "Amouage",
    model: "Dia Man Eau de Parfum",
    filename: "fragrance-amouage-dia-man.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0823/5099/7796/files/DIA_MAN_100_ML.jpg",
    ],
  },
  {
    id: "amouage-gold-man",
    brand: "Amouage",
    model: "Gold Man Eau de Parfum",
    filename: "fragrance-amouage-gold-man.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0823/5099/7796/files/GOLD_MAN_100_ML.jpg",
    ],
  },
  {
    id: "amouage-enclave",
    brand: "Amouage",
    model: "Enclave Eau de Parfum",
    filename: "fragrance-amouage-enclave.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0823/5099/7796/files/ENCLAVE_100_ML_MAN.jpg",
    ],
  },
  {
    id: "amouage-royal-tobacco",
    brand: "Amouage",
    model: "Royal Tobacco Extrait de Parfum",
    filename: "fragrance-amouage-royal-tobacco.webp",
    urls: [
      "https://cdn.shopify.com/s/files/1/0823/5099/7796/files/Amouage_Library_CS_Photo_OpusXIV_RoyalTobacco_1.jpg",
    ],
  },

  // ==========================================
  // 20. DOLCE & GABBANA
  // ==========================================
  {
    id: "dolce-gabbana-light-blue",
    brand: "Dolce & Gabbana",
    model: "Light Blue Pour Homme",
    filename: "fragrance-dolce-gabbana-light-blue.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/d/d9/Light_blue.jpg",
      "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "dolce-gabbana-the-one",
    brand: "Dolce & Gabbana",
    model: "The One for Men Eau de Parfum",
    filename: "fragrance-dolce-gabbana-the-one.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/c1/The_one%2C_D%26G.JPG",
    ],
  },
  {
    id: "dolce-gabbana-k",
    brand: "Dolce & Gabbana",
    model: "K by Dolce & Gabbana",
    filename: "fragrance-dolce-gabbana-k.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/7/79/Dolce-Intenso.png",
      "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 21. BVLGARI
  // ==========================================
  {
    id: "bvlgari-man-in-black",
    brand: "Bvlgari",
    model: "Man in Black Eau de Parfum",
    filename: "fragrance-bvlgari-man-in-black.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/9/97/Bulgari_Black_crop.jpg",
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "bvlgari-aqva-pour-homme",
    brand: "Bvlgari",
    model: "Aqva Pour Homme Eau de Toilette",
    filename: "fragrance-bvlgari-aqva-pour-homme.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/48/Bvlgari_AQVA.jpg",
    ],
  },
  {
    id: "bvlgari-omnia",
    brand: "Bvlgari",
    model: "Omnia Crystalline Eau de Toilette",
    filename: "fragrance-bvlgari-omnia.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/d/d3/BulgariPerfume.jpg",
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // ==========================================
  // 22. MAISON MARGIELA
  // ==========================================
  {
    id: "margiela-jazz-club",
    brand: "Maison Margiela",
    model: "Replica Jazz Club Eau de Toilette",
    filename: "fragrance-margiela-jazz-club.webp",
    urls: [
      "https://images.unsplash.com/photo-1557170334-a9632e77c6e4?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "margiela-by-the-fireplace",
    brand: "Maison Margiela",
    model: "Replica By the Fireplace Eau de Toilette",
    filename: "fragrance-margiela-by-the-fireplace.webp",
    urls: [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1557170334-a9632e77c6e4?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "margiela-beach-walk",
    brand: "Maison Margiela",
    model: "Replica Beach Walk Eau de Toilette",
    filename: "fragrance-margiela-beach-walk.webp",
    urls: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1557170334-a9632e77c6e4?auto=format&fit=crop&w=800&q=80",
    ],
  },
];

export async function fetchFragranceImages() {
  const targetDir = path.resolve(process.cwd(), "public/images/products");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`Starting fragrance image fetch for ${FRAGRANCE_TARGETS.length} iconic models...`);

  let downloaded = 0;
  let failed = 0;

  for (const item of FRAGRANCE_TARGETS) {
    const dest = path.join(targetDir, item.filename);
    let success = false;

    for (const rawUrl of item.urls) {
      const url = rawUrl.startsWith("//") ? `https:${rawUrl}` : rawUrl;
      try {
        const isWiki = url.includes("wikimedia.org") || url.includes("wikipedia.org");
        const headers: Record<string, string> = {
          "User-Agent": isWiki
            ? "BuyerGuardFragranceBot/1.0 (https://buyerguard.luxury; contact@buyerguard.luxury)"
            : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        };

        const res = await fetch(url, { headers });
        if (!res.ok) continue;

        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 500) continue;

        // Process with sharp:
        // Resize to 600x600, contain on studio canvas #fbfbfb, WebP quality 82, effort 6
        const webp = await sharp(buf)
          .resize(600, 600, {
            fit: "contain",
            background: { r: 251, g: 251, b: 251, alpha: 1 },
          })
          .webp({ quality: 82, effort: 6 })
          .toBuffer();

        fs.writeFileSync(dest, webp);
        const sizeKB = (webp.length / 1024).toFixed(1);
        console.log(`[SAVED] ${item.brand.padEnd(16)} | ${item.model.padEnd(36)} -> ${item.filename} (${sizeKB} KB)`);
        success = true;
        downloaded++;
        break;
      } catch (err: any) {
        // Try fallback URL
      }
    }

    if (!success) {
      console.error(`[FAILED] Could not download photo for: ${item.brand} - ${item.model}`);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Fragrance Image Fetch Summary:`);
  console.log(`Total Targets: ${FRAGRANCE_TARGETS.length}`);
  console.log(`Successfully Saved: ${downloaded}`);
  console.log(`Failed: ${failed}`);
  console.log(`========================================\n`);
}

if (process.argv[1]?.includes("fetch-fragrance-images")) {
  fetchFragranceImages().catch(console.error);
}
