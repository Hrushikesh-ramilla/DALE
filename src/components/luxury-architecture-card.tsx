import React from "react";
import type { Product } from "@/domain/catalog";

interface LuxuryArchitectureCardProps {
  product: Product;
}

interface SpecItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export function LuxuryArchitectureCard({ product }: LuxuryArchitectureCardProps) {
  const attrs = product.attributes || {};
  const cat = (product.category || "").toLowerCase();
  const prodId = (product.id || "").toLowerCase();
  const name = (product.name || "").toLowerCase();

  // 1. OLFACTORY ARCHITECTURE (Fragrance)
  const isFragrance =
    cat === "fragrance" ||
    !!attrs.perfumer ||
    !!attrs.topNotes ||
    !!attrs.olfactoryFamily;

  if (isFragrance) {
    return (
      <div
        className="luxury-architecture-card olfactory-card"
        style={cardContainerStyle}
      >
        <div style={headerStyle}>
          <span style={eyebrowStyle}>Olfactory Architecture</span>
          {attrs.concentration && (
            <span style={badgeStyle}>{String(attrs.concentration)}</span>
          )}
        </div>

        {attrs.perfumer && (
          <div style={{ marginBottom: "0.85rem" }}>
            <span style={fieldLabelStyle}>Master Perfumer (Nose)</span>
            <span style={perfumerValueStyle}>{String(attrs.perfumer)}</span>
          </div>
        )}

        <div style={gridStyle}>
          {attrs.topNotes && (
            <div>
              <span style={fieldLabelStyle}>Top Notes</span>
              <span style={fieldValueStyle}>{String(attrs.topNotes)}</span>
            </div>
          )}
          {attrs.heartNotes && (
            <div>
              <span style={fieldLabelStyle}>Heart / Middle Notes</span>
              <span style={fieldValueStyle}>{String(attrs.heartNotes)}</span>
            </div>
          )}
          {attrs.baseNotes && (
            <div>
              <span style={fieldLabelStyle}>Base Notes</span>
              <span style={fieldValueStyle}>{String(attrs.baseNotes)}</span>
            </div>
          )}
        </div>

        {attrs.olfactoryFamily && (
          <div style={footerRowStyle}>
            <span style={{ opacity: 0.6 }}>Olfactory Family: </span>
            <strong style={{ fontWeight: 600, color: "#f8e7a2" }}>
              {String(attrs.olfactoryFamily)}
            </strong>
          </div>
        )}
      </div>
    );
  }

  // 2. SARTORIAL ARCHITECTURE (Suits, Coats, Jackets, Shirts, Knitwear, Trousers, Denim, Dresses)
  const isClothing =
    cat === "clothing" ||
    !!attrs.canvassingType ||
    !!attrs.woolSuperCount ||
    !!attrs.lapelStyle ||
    !!attrs.coatStyle ||
    !!attrs.jacketType ||
    !!attrs.collarStyle ||
    !!attrs.knitGauge ||
    !!attrs.selvedge ||
    !!attrs.denimWeightOz ||
    !!attrs.silhouette ||
    !!attrs.riseType;

  if (isClothing) {
    const specs: SpecItem[] = [];
    if (attrs.canvassingType) specs.push({ label: "Tailoring Construction", value: String(attrs.canvassingType), highlight: true });
    if (attrs.woolSuperCount) specs.push({ label: "Cloth Super Count", value: `Super ${attrs.woolSuperCount}s Worsted Wool`, highlight: true });
    if (attrs.lapelStyle) specs.push({ label: "Lapel Architecture", value: String(attrs.lapelStyle) });
    if (attrs.buttonStance) specs.push({ label: "Button Stance & Vent", value: `${attrs.buttonStance}${attrs.ventType ? ` · ${attrs.ventType}` : ""}` });
    if (attrs.coatStyle) specs.push({ label: "Outerwear Cut", value: String(attrs.coatStyle), highlight: true });
    if (attrs.jacketType) specs.push({ label: "Silhouette / Type", value: String(attrs.jacketType) });
    if (attrs.collarStyle) specs.push({ label: "Collar Construction", value: String(attrs.collarStyle) });
    if (attrs.fitType || attrs.fitCut) specs.push({ label: "Tailored Fit", value: String(attrs.fitType || attrs.fitCut) });
    if (attrs.knitGauge) specs.push({ label: "Knit Gauge & Structure", value: String(attrs.knitGauge), highlight: true });
    if (attrs.yarnOrigin) specs.push({ label: "Yarn Provenance", value: String(attrs.yarnOrigin) });
    if (attrs.denimWeightOz) specs.push({ label: "Denim Caliber", value: `${attrs.denimWeightOz} oz ${attrs.selvedge ? "Japanese Selvedge" : "Ring-Spun Denim"}`, highlight: true });
    if (attrs.silhouette) specs.push({ label: "Couture Silhouette", value: String(attrs.silhouette) });
    if (attrs.neckline) specs.push({ label: "Neckline Cut", value: String(attrs.neckline) });
    if (attrs.fabricComposition || attrs.material || attrs.shellMaterial) {
      specs.push({ label: "Fabric & Fiber", value: String(attrs.fabricComposition || attrs.material || attrs.shellMaterial) });
    }
    if (attrs.lining || attrs.liningMaterial) specs.push({ label: "Interior Lining", value: String(attrs.lining || attrs.liningMaterial) });
    if (attrs.originCountry) specs.push({ label: "Atelier Provenance", value: `Handcrafted in ${attrs.originCountry}` });

    const badge = String(attrs.canvassingType || attrs.coatStyle || attrs.knitGauge || attrs.silhouette || "Haute Tailoring");

    return (
      <div className="luxury-architecture-card sartorial-card" style={cardContainerStyle}>
        <div style={headerStyle}>
          <span style={eyebrowStyle}>Sartorial Architecture</span>
          <span style={badgeStyle}>{badge}</span>
        </div>
        <div style={gridStyle}>
          {specs.map((item, idx) => (
            <div key={idx}>
              <span style={fieldLabelStyle}>{item.label}</span>
              <span style={item.highlight ? fieldHighlightValueStyle : fieldValueStyle}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. CORDWAINER & SOLING ARCHITECTURE (Loafers, Formal Shoes, Boots, Sneakers, Running Shoes)
  const isFootwear =
    cat === "shoes" ||
    cat === "footwear" ||
    !!attrs.weltType ||
    !!attrs.upperLeather ||
    !!attrs.soleConstruction ||
    !!attrs.upperMaterial ||
    !!attrs.soleMaterial ||
    !!attrs.lastNumber ||
    !!attrs.cushioningTechnology;

  if (isFootwear) {
    const specs: SpecItem[] = [];
    if (attrs.upperLeather || attrs.upperMaterial) {
      specs.push({ label: "Upper Leather & Tannery", value: String(attrs.upperLeather || attrs.upperMaterial), highlight: true });
    }
    if (attrs.weltType || attrs.soleConstruction || attrs.soleType) {
      specs.push({ label: "Welting & Construction", value: String(attrs.weltType || attrs.soleConstruction || attrs.soleType), highlight: true });
    }
    if (attrs.soleMaterial) specs.push({ label: "Sole Architecture", value: String(attrs.soleMaterial) });
    if (attrs.lastNumber) specs.push({ label: "Master Last", value: `Last Ref. ${attrs.lastNumber}` });
    if (attrs.bootStyle) specs.push({ label: "Boot Silhouette", value: `${attrs.bootStyle}${attrs.shaftHeightCm ? ` · ${attrs.shaftHeightCm}cm Shaft` : ""}` });
    if (attrs.cushioningTechnology) specs.push({ label: "Energy Return Foam", value: String(attrs.cushioningTechnology), highlight: true });
    if (attrs.stackHeightMm || attrs.heelDropMm) specs.push({ label: "Stack & Drop", value: `${attrs.stackHeightMm || 36}mm Stack · ${attrs.heelDropMm || 8}mm Drop` });
    if (attrs.hardwareType) specs.push({ label: "Hardware Accents", value: String(attrs.hardwareType) });
    if (attrs.lining) specs.push({ label: "Interior Lining", value: String(attrs.lining) });
    if (attrs.originCountry) specs.push({ label: "Cordwainer Atelier", value: `Benchmade in ${attrs.originCountry}` });

    const badge = String(attrs.weltType || attrs.soleConstruction || attrs.cushioningTechnology || "Artisanal Welting");

    return (
      <div className="luxury-architecture-card cordwainer-card" style={cardContainerStyle}>
        <div style={headerStyle}>
          <span style={eyebrowStyle}>Cordwainer Architecture</span>
          <span style={badgeStyle}>{badge}</span>
        </div>
        <div style={gridStyle}>
          {specs.map((item, idx) => (
            <div key={idx}>
              <span style={fieldLabelStyle}>{item.label}</span>
              <span style={item.highlight ? fieldHighlightValueStyle : fieldValueStyle}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. HAUTE MAROQUINERIE ARCHITECTURE (Handbags, Backpacks, Wallets)
  const isBags =
    cat === "bags" ||
    !!attrs.leatherType ||
    !!attrs.hardwareFinish ||
    !!attrs.cardSlots ||
    !!attrs.strapDropCm ||
    !!attrs.laptopCompartmentInches;

  if (isBags) {
    const specs: SpecItem[] = [];
    if (attrs.leatherType || attrs.material) {
      specs.push({ label: "Leather & Canvas Grade", value: String(attrs.leatherType || attrs.material), highlight: true });
    }
    if (attrs.hardwareFinish) specs.push({ label: "Hardware Plating & Finish", value: String(attrs.hardwareFinish), highlight: true });
    if (attrs.closureType) specs.push({ label: "Closure Mechanism", value: String(attrs.closureType) });
    if (attrs.cardSlots) {
      specs.push({
        label: "Interior Compartments",
        value: `${attrs.cardSlots} Card Slots${attrs.billCompartments ? ` · ${attrs.billCompartments} Bill Slots` : ""}${attrs.coinPocket ? " · Gusseted Coin Pocket" : ""}`,
      });
    }
    if (attrs.rfidProtected !== undefined) {
      specs.push({ label: "Shielding Technology", value: attrs.rfidProtected ? "RFID Secure Shielding Layer" : "Traditional Unlined Vault" });
    }
    if (attrs.laptopCompartmentInches) specs.push({ label: "Dedicated Tech Compartment", value: `Reinforced ${attrs.laptopCompartmentInches}" Laptop Sleeve` });
    if (attrs.volumeLiters) specs.push({ label: "Internal Volume", value: `${attrs.volumeLiters} Liters Capacity` });
    if (attrs.dimensionsCm || attrs.dimensionsMm) specs.push({ label: "Proportions", value: String(attrs.dimensionsCm ? `${attrs.dimensionsCm} cm` : `${attrs.dimensionsMm} mm`) });
    if (attrs.strapDropCm) specs.push({ label: "Strap Ergonomics", value: `${attrs.strapDropCm} cm Drop Length` });

    const badge = String(attrs.hardwareFinish || attrs.leatherType || "Haute Maroquinerie");

    return (
      <div className="luxury-architecture-card maroquinerie-card" style={cardContainerStyle}>
        <div style={headerStyle}>
          <span style={eyebrowStyle}>Haute Maroquinerie</span>
          <span style={badgeStyle}>{badge}</span>
        </div>
        <div style={gridStyle}>
          {specs.map((item, idx) => (
            <div key={idx}>
              <span style={fieldLabelStyle}>{item.label}</span>
              <span style={item.highlight ? fieldHighlightValueStyle : fieldValueStyle}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. OPTICS & FRAME ARCHITECTURE (Sunglasses)
  const isEyewear =
    cat === "sunglasses" ||
    cat === "eyewear" ||
    !!attrs.frameMaterial ||
    !!attrs.frameShape ||
    !!attrs.lensWidthMm;

  if (isEyewear) {
    const specs: SpecItem[] = [];
    if (attrs.frameMaterial) specs.push({ label: "Frame Material & Composition", value: String(attrs.frameMaterial), highlight: true });
    if (attrs.frameShape) specs.push({ label: "Sculptural Geometry", value: String(attrs.frameShape) });
    if (attrs.lensWidthMm || attrs.bridgeMm || attrs.templeMm) {
      specs.push({
        label: "Caliber Dimensions",
        value: `${attrs.lensWidthMm || 52}mm Lens · ${attrs.bridgeMm || 20}mm Bridge · ${attrs.templeMm || 145}mm Temple`,
        highlight: true,
      });
    }
    if (attrs.polarization !== undefined) {
      specs.push({ label: "Optical Polarization", value: attrs.polarization ? "High-Definition Polarized Coating" : "Precision Tinted Optical Glass" });
    }
    if (attrs.uvProtection) specs.push({ label: "UV Filtering Matrix", value: String(attrs.uvProtection) });

    return (
      <div className="luxury-architecture-card eyewear-card" style={cardContainerStyle}>
        <div style={headerStyle}>
          <span style={eyebrowStyle}>Optics & Frame Architecture</span>
          <span style={badgeStyle}>{attrs.polarization ? "Polarized Optics" : "100% UV400"}</span>
        </div>
        <div style={gridStyle}>
          {specs.map((item, idx) => (
            <div key={idx}>
              <span style={fieldLabelStyle}>{item.label}</span>
              <span style={item.highlight ? fieldHighlightValueStyle : fieldValueStyle}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 6. HOROLOGICAL ARCHITECTURE (Watches)
  const isWatches =
    cat === "watches" ||
    !!attrs.movement ||
    !!attrs.caseDiameterMm ||
    !!attrs.waterResistanceM;

  if (isWatches) {
    const specs: SpecItem[] = [];
    if (attrs.movement) specs.push({ label: "Calibre & Movement Architecture", value: String(attrs.movement), highlight: true });
    if (attrs.caseMaterial) specs.push({ label: "Case Metal & Metallurgy", value: String(attrs.caseMaterial), highlight: true });
    if (attrs.caseDiameterMm) specs.push({ label: "Case Caliber", value: `${attrs.caseDiameterMm} mm Diameter` });
    if (attrs.powerReserveHours) specs.push({ label: "Power Reserve", value: `${attrs.powerReserveHours} Hours Autonomous Reserve` });
    if (attrs.waterResistanceM) specs.push({ label: "Water Resistance Depth", value: `${attrs.waterResistanceM} Meters (${Math.round((Number(attrs.waterResistanceM) || 100) * 3.28)} Feet)` });
    if (attrs.crystal) specs.push({ label: "Sapphire Crystal", value: String(attrs.crystal) });

    return (
      <div className="luxury-architecture-card horological-card" style={cardContainerStyle}>
        <div style={headerStyle}>
          <span style={eyebrowStyle}>Horological Architecture</span>
          <span style={badgeStyle}>{String(attrs.movement || "Swiss Calibre")}</span>
        </div>
        <div style={gridStyle}>
          {specs.map((item, idx) => (
            <div key={idx}>
              <span style={fieldLabelStyle}>{item.label}</span>
              <span style={item.highlight ? fieldHighlightValueStyle : fieldValueStyle}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 7. ARTISANAL HERITAGE & HOME (Kitchenware, Decor, Textiles)
  const isHome =
    cat === "home" ||
    !!attrs.materialAlloy ||
    !!attrs.threadCount;

  if (isHome) {
    const specs: SpecItem[] = [];
    if (attrs.materialAlloy || attrs.material || attrs.fiberType) {
      specs.push({ label: "Material Alloy & Provenance", value: String(attrs.materialAlloy || attrs.material || attrs.fiberType), highlight: true });
    }
    if (attrs.designer) specs.push({ label: "Master Designer", value: String(attrs.designer) });
    if (attrs.threadCount) specs.push({ label: "Thread Density & Weave", value: `${attrs.threadCount} Thread Count ${attrs.weaveType || "Jacquard Sateen"}`, highlight: true });
    if (attrs.cooktopCompatibility || attrs.ovenSafeMaxTempC) {
      specs.push({
        label: "Culinary Compatibility",
        value: `${attrs.cooktopCompatibility || "All Cooktops"} · Oven safe to ${attrs.ovenSafeMaxTempC || 260}°C`,
      });
    }
    if (attrs.originCountry) specs.push({ label: "Manufactory Heritage", value: `Handcrafted in ${attrs.originCountry}` });

    const badge = String(attrs.materialAlloy || attrs.fiberType || "Artisanal Craft");

    return (
      <div className="luxury-architecture-card artisanal-card" style={cardContainerStyle}>
        <div style={headerStyle}>
          <span style={eyebrowStyle}>Artisanal Heritage & Engineering</span>
          <span style={badgeStyle}>{badge}</span>
        </div>
        <div style={gridStyle}>
          {specs.map((item, idx) => (
            <div key={idx}>
              <span style={fieldLabelStyle}>{item.label}</span>
              <span style={item.highlight ? fieldHighlightValueStyle : fieldValueStyle}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 9. ACOUSTIC ARCHITECTURE (Headphones, Speakers, Soundbars, Earbuds)
  const isAudio =
    cat === "audio" ||
    !!attrs.acousticDesign ||
    !!attrs.audioChannels ||
    !!attrs.driverMm ||
    !!attrs.powerWatts;

  if (isAudio) {
    const specs: SpecItem[] = [];
    if (attrs.acousticDesign) specs.push({ label: "Acoustic Chamber Architecture", value: String(attrs.acousticDesign), highlight: true });
    if (attrs.driverMm) specs.push({ label: "Precision Transducer", value: `${attrs.driverMm}mm High-Excursion Driver`, highlight: true });
    if (attrs.powerWatts) specs.push({ label: "Acoustic Power Output", value: `${attrs.powerWatts} Watts Peak Output`, highlight: true });
    if (attrs.audioChannels) specs.push({ label: "Spatial Sound Channels", value: `${attrs.audioChannels}${attrs.dolbyAtmos ? " · Dolby Atmos Spatial" : ""}` });
    if (attrs.frequencyResponse) specs.push({ label: "Frequency Range", value: String(attrs.frequencyResponse) });
    if (attrs.impedanceOhms) specs.push({ label: "Reference Impedance", value: `${attrs.impedanceOhms} Ohms` });
    if (attrs.batteryHours) specs.push({ label: "Battery Autonomy", value: `${attrs.batteryHours} Hours Wireless Playback` });

    return (
      <div className="luxury-architecture-card acoustic-card" style={cardContainerStyle}>
        <div style={headerStyle}>
          <span style={eyebrowStyle}>Acoustic Architecture</span>
          <span style={badgeStyle}>{String(attrs.acousticDesign || "High-Fidelity")}</span>
        </div>
        <div style={gridStyle}>
          {specs.map((item, idx) => (
            <div key={idx}>
              <span style={fieldLabelStyle}>{item.label}</span>
              <span style={item.highlight ? fieldHighlightValueStyle : fieldValueStyle}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// STYLES
const cardContainerStyle: React.CSSProperties = {
  margin: "1rem 0",
  padding: "1rem 1.15rem",
  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(212, 175, 55, 0.03) 100%)",
  border: "1px solid rgba(212, 175, 55, 0.2)",
  borderRadius: "10px",
  color: "#f3f3f3",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "0.75rem",
  paddingBottom: "0.5rem",
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--accent, #d4af37)",
};

const badgeStyle: React.CSSProperties = {
  fontSize: "0.7rem",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "2px 8px",
  borderRadius: "4px",
  background: "rgba(212, 175, 55, 0.12)",
  color: "#f8e7a2",
};

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.68rem",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  opacity: 0.55,
  marginBottom: "2px",
};

const perfumerValueStyle: React.CSSProperties = {
  fontSize: "0.92rem",
  fontWeight: 600,
  color: "#ffffff",
  letterSpacing: "0.02em",
};

const fieldValueStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "rgba(255, 255, 255, 0.92)",
};

const fieldHighlightValueStyle: React.CSSProperties = {
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#f8e7a2",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "0.65rem 1rem",
};

const footerRowStyle: React.CSSProperties = {
  marginTop: "0.5rem",
  paddingTop: "0.5rem",
  borderTop: "1px dashed rgba(255, 255, 255, 0.08)",
  fontSize: "0.78rem",
};
