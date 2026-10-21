import type { FC, SVGProps } from "react";

export interface LogoProps extends SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
  width?: number | string;
  height?: number | string;
}

// 1. Rolex: 5-Point Coronet + ROLEX serif wordmark
export const RolexLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 200 80"
    width={width ?? size * 2.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* Rolex 5-Point Crown */}
    <g transform="translate(100, 24) scale(1)">
      <path
        d="M0 -18 C0.6 -18 1 -17.6 1 -17 L1.5 1 L14 -12 C14.5 -12.5 15.3 -12.5 15.7 -12 L10 4 L25 -3 C25.7 -3.3 26.4 -2.9 26.5 -2.2 L17 10 L20 13 C20 14 19 15 18 15 L-18 15 C-19 15 -20 14 -20 13 L-17 10 L-26.5 -2.2 C-26.4 -2.9 -25.7 -3.3 -25 -3 L-10 4 L-15.7 -12 C-15.3 -12.5 -14.5 -12.5 -14 -12 L-1.5 1 L-1 -17 C-1 -17.6 -0.6 -18 0 -18 Z"
        fill="#d4af37"
      />
      <circle cx="0" cy="-19" r="2.8" fill="#d4af37" />
      <circle cx="15.5" cy="-13.5" r="2.5" fill="#d4af37" />
      <circle cx="27" cy="-3.5" r="2.5" fill="#d4af37" />
      <circle cx="-15.5" cy="-13.5" r="2.5" fill="#d4af37" />
      <circle cx="-27" cy="-3.5" r="2.5" fill="#d4af37" />
      <ellipse cx="0" cy="17" rx="19" ry="2.2" fill="#d4af37" />
    </g>
    <text
      x="100"
      y="66"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Garamond', 'Didot', serif"
      fontSize="26"
      fontWeight="700"
      letterSpacing="5"
      fill="currentColor"
    >
      ROLEX
    </text>
  </svg>
);

// 2. Omega: Greek letter Ω + OMEGA wordmark
export const OmegaLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 200 80"
    width={width ?? size * 2.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* Omega Symbol Ω */}
    <g transform="translate(100, 24) scale(1)">
      <path
        d="M0 -16 C-11 -16 -20 -8 -20 3 C-20 9.5 -16.5 14 -12 17 L-21 17 C-22.5 17 -23 18.5 -23 20 L-23 21 L-11 21 C-8 21 -6.5 19.5 -6 17.5 C-4.5 19 -2.5 20 0 20 C2.5 20 4.5 19 6 17.5 C6.5 19.5 8 21 11 21 L23 21 L23 20 C23 18.5 22.5 17 21 17 L12 17 C16.5 14 20 9.5 20 3 C20 -8 11 -16 0 -16 Z M0 -11 C8 -11 14 -5 14 3 C14 9.5 9 15 0 15 C-9 15 -14 9.5 -14 3 C-14 -5 -8 -11 0 -11 Z"
        fill="#e21836"
      />
    </g>
    <text
      x="100"
      y="67"
      textAnchor="middle"
      fontFamily="'Futura', 'Helvetica Neue', 'Arial', sans-serif"
      fontSize="24"
      fontWeight="700"
      letterSpacing="6.5"
      fill="currentColor"
    >
      OMEGA
    </text>
  </svg>
);

// 3. Cartier: Signature elegant cursive serif
export const CartierLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 220 80"
    width={width ?? size * 2.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    <text
      x="110"
      y="54"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Baskerville', 'Didot', serif"
      fontSize="52"
      fontStyle="italic"
      fontWeight="400"
      letterSpacing="1.5"
      fill="currentColor"
    >
      Cartier
    </text>
  </svg>
);

// 4. Patek Philippe: Calatrava Cross + PATEK PHILIPPE
export const PatekPhilippeLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 260 80"
    width={width ?? size * 2.5}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* Calatrava Cross Motif */}
    <g transform="translate(130, 24) scale(0.85)" fill="#c99f4a">
      <path d="M0 -18 C-3 -18 -5 -15 -5 -12 C-5 -9 -3 -7 0 -4 C3 -7 5 -9 5 -12 C5 -15 3 -18 0 -18 Z" />
      <path d="M0 18 C-3 18 -5 15 -5 12 C-5 9 -3 7 0 4 C3 7 5 9 5 12 C5 15 3 18 0 18 Z" />
      <path d="M-18 0 C-18 -3 -15 -5 -12 -5 C-9 -5 -7 -3 -4 0 C-7 3 -9 5 -12 5 C-15 5 -18 3 -18 0 Z" />
      <path d="M18 0 C18 -3 15 -5 12 -5 C9 -5 7 -3 4 0 C7 3 9 5 12 5 C15 5 18 3 18 0 Z" />
      <circle cx="0" cy="0" r="3.5" />
      <path d="M-3 -3 L3 3 M-3 3 L3 -3" stroke="#c99f4a" strokeWidth="2" />
    </g>
    <text
      x="130"
      y="60"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Garamond', serif"
      fontSize="19"
      fontWeight="700"
      letterSpacing="3.5"
      fill="currentColor"
    >
      PATEK PHILIPPE
    </text>
  </svg>
);

// 5. Audemars Piguet: Monogram AP + AUDEMARS PIGUET
export const AudemarsPiguetLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 260 80"
    width={width ?? size * 2.5}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* Interlocking AP */}
    <g transform="translate(130, 22) scale(1.15)" textAnchor="middle" fontFamily="'Playfair Display', 'Boska', 'Voska', 'Didot', serif">
      <text x="-5" y="8" fontSize="24" fontWeight="700" fill="#d1b46a">A</text>
      <text x="6" y="8" fontSize="24" fontWeight="700" fill="currentColor">P</text>
    </g>
    <text
      x="130"
      y="58"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Garamond', serif"
      fontSize="18.5"
      fontWeight="700"
      letterSpacing="2.8"
      fill="currentColor"
    >
      AUDEMARS PIGUET
    </text>
  </svg>
);

// 6. Vacheron Constantin: Maltese Cross + VACHERON CONSTANTIN (Never Clipped)
export const VacheronConstantinLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 340 80"
    width={width ?? size * 3.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* Maltese Cross */}
    <g transform="translate(170, 22) scale(0.9)" fill="#c99f4a">
      <polygon points="0,-3 -12,-18 -3,-12 -6,0 0,0" />
      <polygon points="0,-3 12,-18 3,-12 6,0 0,0" />
      <polygon points="3,0 18,-12 12,-3 0,-6 0,0" />
      <polygon points="3,0 18,12 12,3 0,6 0,0" />
      <polygon points="0,3 12,18 3,12 6,0 0,0" />
      <polygon points="0,3 -12,18 -3,12 -6,0 0,0" />
      <polygon points="-3,0 -18,12 -12,3 0,6 0,0" />
      <polygon points="-3,0 -18,-12 -12,-3 0,-6 0,0" />
    </g>
    <text
      x="170"
      y="58"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Garamond', serif"
      fontSize="18"
      fontWeight="700"
      letterSpacing="3.5"
      fill="currentColor"
    >
      VACHERON CONSTANTIN
    </text>
  </svg>
);

// 7. Jaeger-LeCoultre: JL Crest + JAEGER-LECOULTRE
export const JaegerLeCoultreLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 280 80"
    width={width ?? size * 2.8}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* JLC Interlaced Emblem */}
    <circle cx="140" cy="22" r="14" fill="none" stroke="#bda365" strokeWidth="1.6" />
    <text
      x="140"
      y="29"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Cinzel', serif"
      fontSize="17"
      fontWeight="700"
      fill="#bda365"
    >
      JL
    </text>
    <text
      x="140"
      y="58"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Garamond', serif"
      fontSize="18"
      fontWeight="700"
      letterSpacing="3"
      fill="currentColor"
    >
      JAEGER-LECOULTRE
    </text>
  </svg>
);

// 8. IWC Schaffhausen: IWC bold
export const IWCLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 180 80"
    width={width ?? size * 2.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    <text
      x="90"
      y="56"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Cinzel', 'Didot', serif"
      fontSize="48"
      fontWeight="800"
      letterSpacing="9"
      fill="currentColor"
    >
      IWC
    </text>
  </svg>
);

// 9. Breitling: Winged Anchor B + BREITLING
export const BreitlingLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 220 80"
    width={width ?? size * 2.4}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* Aviation Wings & Anchor */}
    <g transform="translate(110, 22) scale(0.9)" fill="#d4af37">
      <path d="M-30 0 C-20 -8 -5 -5 0 2 C5 -5 20 -8 30 0 C18 -2 5 2 0 10 C-5 2 -18 -2 -30 0 Z" />
      <path d="M-2 -3 C-2 -7 2 -7 2 -3 L2 14 C4 13 8 10 10 6 L12 7 C9 13 4 16 0 16 C-4 16 -9 13 -12 7 L-10 6 C-8 10 -4 13 -2 14 Z" />
      <text x="0" y="4" textAnchor="middle" fontSize="16" fontFamily="'Brush Script MT', cursive" fontWeight="bold">B</text>
    </g>
    <text
      x="110"
      y="58"
      textAnchor="middle"
      fontFamily="'Copperplate', 'Futura', sans-serif"
      fontSize="22"
      fontWeight="800"
      letterSpacing="5"
      fill="currentColor"
    >
      BREITLING
    </text>
  </svg>
);

// 10. Seiko: Iconic bold typography
export const SeikoLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 220 80"
    width={width ?? size * 2.5}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    <text
      x="110"
      y="54"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Baskerville', serif"
      fontSize="44"
      fontWeight="800"
      letterSpacing="5.5"
      fill="currentColor"
    >
      SEIKO
    </text>
  </svg>
);

// 10b. Breguet: Script wordmark + Pomme Hand Motif
export const BreguetLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 240 80"
    width={width ?? size * 2.6}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* Breguet Hollow Pomme Hand Motif */}
    <g transform="translate(120, 18) scale(0.85)" fill="none" stroke="#d4af37" strokeWidth="2.2">
      <circle cx="0" cy="0" r="7" />
      <circle cx="2" cy="-2" r="3.2" fill="#d4af37" />
      <line x1="0" y1="7" x2="0" y2="15" strokeLinecap="round" />
    </g>
    <text
      x="120"
      y="56"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Baskerville', 'Georgia', cursive, serif"
      fontSize="42"
      fontStyle="italic"
      fontWeight="600"
      letterSpacing="1"
      fill="currentColor"
    >
      Breguet
    </text>
  </svg>
);

// 10c. Girard-Perregaux: GP Crest + GIRARD-PERREGAUX
export const GirardPerregauxLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 280 80"
    width={width ?? size * 2.8}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* Interlocking GP */}
    <g transform="translate(140, 22) scale(1)" textAnchor="middle" fontFamily="'Playfair Display', 'Boska', 'Voska', 'Didot', serif">
      <text x="-7" y="6" fontSize="22" fontWeight="700" fill="#d1b46a">G</text>
      <text x="8" y="6" fontSize="22" fontWeight="700" fill="currentColor">P</text>
    </g>
    <text
      x="140"
      y="58"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Garamond', serif"
      fontSize="18"
      fontWeight="700"
      letterSpacing="3.5"
      fill="currentColor"
    >
      GIRARD-PERREGAUX
    </text>
  </svg>
);

// 10d. Ulysse Nardin: Maritime Anchor + ULYSSE NARDIN (Never Clipped)
export const UlysseNardinLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 280 80"
    width={width ?? size * 2.8}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* Maritime Anchor Symbol */}
    <g transform="translate(140, 20) scale(0.9)" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="0" cy="-10" r="4" fill="none" stroke="#2563eb" strokeWidth="2.5" />
      <line x1="0" y1="-6" x2="0" y2="12" />
      <line x1="-8" y1="-3" x2="8" y2="-3" strokeWidth="2" />
      <path d="M-12 5 C-8 15 8 15 12 5" />
      <polygon points="-14,3 -12,6 -10,4" fill="#2563eb" stroke="none" />
      <polygon points="14,3 12,6 10,4" fill="#2563eb" stroke="none" />
    </g>
    <text
      x="140"
      y="58"
      textAnchor="middle"
      fontFamily="'Futura', 'Helvetica Neue', 'Arial', sans-serif"
      fontSize="19.5"
      fontWeight="800"
      letterSpacing="4"
      fill="currentColor"
    >
      ULYSSE NARDIN
    </text>
  </svg>
);

// 10e. A. Lange & Söhne: Arched Glashütte Typography
export const ALangeSohneLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 300 80"
    width={width ?? size * 3}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    <text
      x="150"
      y="52"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Cinzel', serif"
      fontSize="21"
      fontWeight="800"
      letterSpacing="4"
      fill="currentColor"
    >
      A. LANGE &amp; SÖHNE
    </text>
  </svg>
);

// 10f. Blancpain: Haute Horlogerie
export const BlancpainLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 260 80"
    width={width ?? size * 2.6}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    <text
      x="130"
      y="54"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Baskerville', serif"
      fontSize="34"
      fontWeight="700"
      letterSpacing="5.5"
      fill="currentColor"
    >
      BLANCPAIN
    </text>
  </svg>
);

// 10g. Apple: Iconic  Emblem (Authentic Canonical Official Vector)
export const AppleWatchLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width={width ?? size}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    <path
      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 3.65c.66-.8 1.1-1.92.98-3.05-1.05.04-2.32.7-3.07 1.57-.61.7-.99 1.83-.85 2.95 1.17.09 2.28-.67 2.94-1.47"
      fill="currentColor"
    />
  </svg>
);

// 10h. Samsung Watch
export const SamsungWatchLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 240 80"
    width={width ?? size * 2.6}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    <text
      x="120"
      y="52"
      textAnchor="middle"
      fontFamily="'Samsung Sharp Sans', 'Helvetica Neue', 'Arial', sans-serif"
      fontSize="28"
      fontWeight="900"
      letterSpacing="4.5"
      fill="#1428a0"
    >
      SAMSUNG
    </text>
  </svg>
);

// 11. Grand Seiko: Crowned Lion & GS + Grand Seiko
export const GrandSeikoLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 220 80"
    width={width ?? size * 2.4}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* Monogram GS */}
    <text
      x="110"
      y="28"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Cinzel', serif"
      fontSize="26"
      fontWeight="700"
      letterSpacing="2"
      fill="#bda365"
    >
      GS
    </text>
    <text
      x="110"
      y="56"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Garamond', serif"
      fontSize="21"
      fontWeight="700"
      letterSpacing="1.5"
      fill="currentColor"
    >
      Grand Seiko
    </text>
  </svg>
);

// 12. TAG Heuer: Two-tone Shield + TAG Heuer
export const TagHeuerLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 240 90"
    width={width ?? size * 2.5}
    height={height ?? size * 1.12}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* TAG Heuer Shield with crisp enamel colors & border */}
    <g transform="translate(120, 24) scale(1.15)">
      {/* Top green half */}
      <path d="M-19 -14 L19 -14 L19 0 L-19 0 Z" fill="#006341" stroke="#ffffff" strokeWidth="0.8" />
      <text x="0" y="-3.5" textAnchor="middle" fontSize="10.5" fontWeight="900" fill="#ffffff" fontFamily="'Futura', 'Arial Black', sans-serif">TAG</text>
      {/* Bottom red half */}
      <path d="M-19 0 L19 0 L19 5 C19 16 0 23 0 23 C0 23 -19 16 -19 5 Z" fill="#e21836" stroke="#ffffff" strokeWidth="0.8" />
      <text x="0" y="11.5" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#ffffff" fontFamily="'Futura', 'Arial Black', sans-serif">HEUER</text>
    </g>
    <text
      x="120"
      y="74"
      textAnchor="middle"
      fontFamily="'Futura', 'Arial Black', 'Helvetica Neue', sans-serif"
      fontSize="22"
      fontWeight="900"
      letterSpacing="4.5"
      fill="currentColor"
    >
      TAG HEUER
    </text>
  </svg>
);

// 13. Longines: Winged Hourglass + LONGINES
export const LonginesLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 220 80"
    width={width ?? size * 2.4}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* Winged Hourglass */}
    <g transform="translate(110, 20) scale(0.85)">
      <path d="M-28 0 C-20 -7 -6 -5 0 1 C6 -5 20 -7 28 0 C16 -1 5 3 0 9 C-5 3 -16 -1 -28 0 Z" fill="#bda365" />
      <polygon points="-5,-6 5,-6 0,0 5,6 -5,6 0,0" fill="#fff" stroke="#bda365" strokeWidth="1.2" />
    </g>
    <text
      x="110"
      y="58"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Boska', 'Voska', 'Didot', serif"
      fontSize="23"
      fontWeight="700"
      letterSpacing="5"
      fill="currentColor"
    >
      LONGINES
    </text>
  </svg>
);

// 14. Tissot: Swiss Cross + TISSOT
export const TissotLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, style, ...props }) => (
  <svg
    viewBox="0 0 220 80"
    width={width ?? size * 2.4}
    height={height ?? size}
    fill="currentColor"
    className={className}
    style={{ overflow: "visible", ...style }}
    {...props}
  >
    {/* Swiss Cross */}
    <g transform="translate(110, 20) scale(0.85)">
      <rect x="-14" y="-14" width="28" height="28" fill="#e21836" rx="3" />
      <rect x="-3" y="-9" width="6" height="18" fill="#fff" />
      <rect x="-9" y="-3" width="18" height="6" fill="#fff" />
    </g>
    <text
      x="110"
      y="58"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', 'Arial Black', sans-serif"
      fontSize="25"
      fontWeight="900"
      letterSpacing="5"
      fill="currentColor"
    >
      TISSOT
    </text>
  </svg>
);

// Brand Logo Component Resolver
export function WatchBrandLogo({
  brand,
  size = 80,
  width,
  height,
  className = "",
}: {
  brand: string;
  size?: number;
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  const norm = brand.trim().toLowerCase();
  const commonProps = { size, width, height, className };
  switch (norm) {
    case "rolex":
      return <RolexLogo {...commonProps} />;
    case "omega":
      return <OmegaLogo {...commonProps} />;
    case "cartier":
      return <CartierLogo {...commonProps} />;
    case "patek philippe":
      return <PatekPhilippeLogo {...commonProps} />;
    case "audemars piguet":
      return <AudemarsPiguetLogo {...commonProps} />;
    case "vacheron constantin":
      return <VacheronConstantinLogo {...commonProps} />;
    case "jaeger-lecoultre":
    case "jaeger lecoultre":
      return <JaegerLeCoultreLogo {...commonProps} />;
    case "iwc":
    case "iwc schaffhausen":
      return <IWCLogo {...commonProps} />;
    case "breitling":
      return <BreitlingLogo {...commonProps} />;
    case "seiko":
      return <SeikoLogo {...commonProps} />;
    case "grand seiko":
      return <GrandSeikoLogo {...commonProps} />;
    case "breguet":
      return <BreguetLogo {...commonProps} />;
    case "girard-perregaux":
    case "girard perregaux":
    case "girard":
      return <GirardPerregauxLogo {...commonProps} />;
    case "ulysse nardin":
    case "ulysse":
      return <UlysseNardinLogo {...commonProps} />;
    case "a. lange & söhne":
    case "a. lange & sohne":
    case "a lange & sohne":
    case "a. lange":
    case "lange":
      return <ALangeSohneLogo {...commonProps} />;
    case "blancpain":
      return <BlancpainLogo {...commonProps} />;
    case "apple":
    case "apple watch":
      return <AppleWatchLogo {...commonProps} />;
    case "samsung":
    case "samsung watch":
    case "samsung galaxy watch":
      return <SamsungWatchLogo {...commonProps} />;
    case "tag heuer":
      return <TagHeuerLogo {...commonProps} />;
    case "longines":
      return <LonginesLogo {...commonProps} />;
    case "tissot":
      return <TissotLogo {...commonProps} />;
    default:
      return (
        <span
          className={`default-brand-wordmark ${className}`}
          style={{
            fontFamily: "'Playfair Display', 'Boska', 'Voska', 'Cormorant Garamond', serif",
            fontSize: (typeof size === "number" ? size : 80) * 0.45,
            fontWeight: 700,
            letterSpacing: "0.1em",
            overflow: "visible",
          }}
        >
          {brand.toUpperCase()}
        </span>
      );
  }
}
