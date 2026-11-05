import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  getDepartmentById,
  getDepartmentLeafs,
  leafTitles,
  type LeafTypeKey,
} from "@/domain/departments";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductArt } from "@/components/product-art";
import { getDepartmentPreviews } from "@/server/catalog-store";
import { formatMoney } from "@/domain/money";

const leafDescriptions: Partial<Record<LeafTypeKey, string>> = {
  // Electronics
  phones:
    "Flagship smartphones with verified displays, cameras, and connectivity.",
  laptops:
    "High-performance portable workstations for precision creative and enterprise tasks.",
  tablets:
    "Stylus-enabled digital canvases and ultra-lightweight computing slabs.",
  headphones:
    "Audiophile-grade over-ear transducers with reference acoustics and active noise cancellation.",
  earbuds:
    "Ultra-compact true wireless stereo buds engineered for high fidelity and comfort.",
  speakers:
    "High-fidelity acoustic monitors and multi-room wireless sound systems.",
  soundbars:
    "Cinematic Dolby Atmos multi-channel soundbars for immersion and spatial separation.",
  "wall-chargers":
    "GaN fast-charging power adapters with verified multi-port power delivery.",
  "power-banks":
    "High-capacity portable energy banks with USB-C PD and pass-through charging.",
  "portable-ssds":
    "Ruggedized high-speed NVMe external storage with hardware encryption.",
  monitors:
    "Color-accurate 4K, 5K, and OLED creative displays with USB-C hub connectivity.",
  "docks-hubs":
    "Thunderbolt 4 and multi-stream USB-C docking hubs for multi-display setups.",
  keyboards:
    "Mechanical and low-profile precision keyboards with tactile actuation.",
  mice: "Ergonomic high-DPI pointing devices with multi-device wireless pairing.",
  cables:
    "Certified 240W Thunderbolt 4 and braided USB-C high-bandwidth cables.",
  // Clothing
  suits:
    "Full-canvas Neapolitan and Savile Row tailoring with Super 130s–180s wool.",
  coats: "Iconic cashmere, alpaca, and virgin wool double-breasted outerwear.",
  jackets:
    "Precision tailored blazers, leather aviators, and technical luxury jackets.",
  shirts:
    "Hand-finished button-down shirts in Sea Island and Egyptian long-staple cotton.",
  knitwear:
    "Pure Mongolian cashmere, fine merino, and silk-blend textured sweaters.",
  trousers:
    "Tailored wool trousers and pleated chinos with sartorial waistband details.",
  denim: "Japanese selvedge and artisanal washed luxury denim cuts.",
  dresses:
    "Haute couture evening wear and silk silhouettes from premier fashion houses.",
  "t-shirts":
    "Heavyweight mercerized cotton and relaxed-fit luxury designer tees.",
  // Lifestyle & Footwear
  fragrance:
    "Iconic haute parfumerie formulated by master noses with rich note pyramids.",
  watches:
    "High-horology timepieces with in-house mechanical calibres and precious metals.",
  sunglasses:
    "Handcrafted Mazzucchelli acetate and titanium frames with mineral optics.",
  handbags:
    "Hand-stitched leather totes, flap bags, and iconic luxury silhouettes.",
  backpacks:
    "Artisanal leather and coated canvas rucksacks with palladium hardware.",
  wallets:
    "Grained calfskin cardholders and continental wallets with edge lacquering.",
  loafers:
    "Goodyear-welted and Blake-stitched penny, horsebit, and tassel loafers.",
  "formal-shoes":
    "Master-lasted wholecuts, oxfords, and Louboutin red-sole dress shoes.",
  "running-shoes":
    "Cushioned carbon-plate marathoners and designer performance runners.",
  "lifestyle-sneakers":
    "Iconic luxury leather sneakers with cupsole construction and patina.",
  boots:
    "Lug-sole Chelsea boots, combat boots, and Goodyear-welted leather footwear.",
  // Home & Living
  kitchenware:
    "Enameled cast iron, 5-ply copper stainless alloys, and artisanal cutlery.",
  decor:
    "Hand-blown crystal, Limoges porcelain, and Italian ceramic design objects.",
  "home-textiles":
    "Egyptian long-staple cotton percale and pure cashmere blankets.",
};

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const department = getDepartmentById(id);

  if (!department) {
    notFound();
  }

  if (department.id === "watches") {
    redirect("/category/watches");
  }

  const candidates = getDepartmentLeafs(department.id);
  const previews = await getDepartmentPreviews(candidates);
  const leafs = candidates.filter((leaf) => previews[leaf]?.count > 0);
  if (!leafs.length) notFound();

  return (
    <div className="department-page">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: department.title }]}
      />

      <header className="department-hero">
        <div className="eyebrow">CURATED DEPARTMENT</div>
        <h1>{department.title}</h1>
        <p>{department.description}</p>
        <div className="department-stats-bar">
          <span className="pill">{leafs.length} Categories</span>
          <span>Product references, recorded variants and specifications</span>
        </div>
      </header>

      <section aria-label={`${department.title} Categories`}>
        <div className="department-categories-grid">
          {leafs.map((leaf) => {
            const title = leafTitles[leaf] || leaf;
            const desc =
              leafDescriptions[leaf] ||
              "Explore product references, recorded variants and specifications.";
            const preview = previews[leaf];
            const heroProduct = preview?.heroProduct;
            const count = preview?.count || 0;
            const minPrice = preview?.minPrice;
            const brands = preview?.brands?.length
              ? preview.brands.slice(0, 5).join(" · ")
              : "";
            const imageUrl = heroProduct?.media?.url;

            return (
              <Link
                key={leaf}
                href={`/category/${leaf}`}
                className="department-category-card"
              >
                <div className="card-visual">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={heroProduct?.name || title}
                      width={380}
                      height={260}
                      quality={85}
                      style={{
                        maxWidth: "86%",
                        maxHeight: "86%",
                        objectFit: "contain",
                      }}
                    />
                  ) : heroProduct ? (
                    <ProductArt product={heroProduct} />
                  ) : (
                    <div style={{ color: "#94a3b8", fontSize: 13 }}>
                      {title}
                    </div>
                  )}
                  <span className="count-badge">
                    {count > 0 ? `${count} Models` : "Curated Collection"}
                  </span>
                  {minPrice ? (
                    <span className="price-badge">
                      From {formatMoney(minPrice)}
                    </span>
                  ) : null}
                </div>
                <div className="card-content">
                  <h3>{title}</h3>
                  <p className="card-desc">{desc}</p>
                  {brands && <div className="card-brands">{brands}</div>}
                  <span className="card-action">
                    <span>Explore {title}</span>
                    <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
