import type { FC, SVGProps } from "react";

export interface LogoProps extends SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
  width?: number | string;
  height?: number | string;
}

// 1. Rolex: 5-Point Coronet + ROLEX serif wordmark
export const RolexLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 160 80"
    width={width ?? size * 2.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Rolex 5-Point Crown */}
    <path
      d="M80 6 C80.6 6 81 6.4 81 7 L81.5 25 L94 12 C94.5 11.5 95.3 11.5 95.7 12 L90 28 L105 21 C105.7 20.7 106.4 21.1 106.5 21.8 L97 34 L100 37 C100 38 99 39 98 39 L62 39 C61 39 60 38 60 37 L63 34 L53.5 21.8 C53.6 21.1 54.3 20.7 55 21 L70 28 L64.3 12 C64.7 11.5 65.5 11.5 66 12 L78.5 25 L79 7 C79 6.4 79.4 6 80 6 Z"
      fill="#d4af37"
    />
    <circle cx="80" cy="5" r="2.8" fill="#d4af37" />
    <circle cx="95.5" cy="10.5" r="2.5" fill="#d4af37" />
    <circle cx="107" cy="20.5" r="2.5" fill="#d4af37" />
    <circle cx="64.5" cy="10.5" r="2.5" fill="#d4af37" />
    <circle cx="53" cy="20.5" r="2.5" fill="#d4af37" />
    <ellipse cx="80" cy="41" rx="19" ry="2.2" fill="#d4af37" />
    {/* ROLEX Wordmark */}
    <text
      x="80"
      y="67"
      textAnchor="middle"
      fontFamily="'Garamond', 'Didot', 'Times New Roman', serif"
      fontSize="25"
      fontWeight="700"
      letterSpacing="4.5"
      fill="currentColor"
    >
      ROLEX
    </text>
  </svg>
);

// 2. Omega: Greek letter Ω + OMEGA wordmark
export const OmegaLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 160 80"
    width={width ?? size * 2.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Omega Symbol Ω */}
    <path
      d="M80 8 C69 8 60 16 60 27 C60 33.5 63.5 38 68 41 L59 41 C57.5 41 57 42.5 57 44 L57 45 L69 45 C72 45 73.5 43.5 74 41.5 C75.5 43 77.5 44 80 44 C82.5 44 84.5 43 86 41.5 C86.5 43.5 88 45 91 45 L103 45 L103 44 C103 42.5 102.5 41 101 41 L92 41 C96.5 38 100 33.5 100 27 C100 16 91 8 80 8 Z M80 13 C88 13 94 19 94 27 C94 33.5 89 39 80 39 C71 39 66 33.5 66 27 C66 19 72 13 80 13 Z"
      fill="#e21836"
    />
    {/* OMEGA Wordmark */}
    <text
      x="80"
      y="67"
      textAnchor="middle"
      fontFamily="'Futura', 'Helvetica Neue', 'Arial', sans-serif"
      fontSize="22"
      fontWeight="700"
      letterSpacing="6"
      fill="currentColor"
    >
      OMEGA
    </text>
  </svg>
);

// 3. Cartier: Signature elegant cursive serif
export const CartierLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 160 80"
    width={width ?? size * 2.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    <text
      x="80"
      y="48"
      textAnchor="middle"
      fontFamily="'Baskerville', 'Playfair Display', 'Brush Script MT', 'Didot', serif"
      fontSize="42"
      fontStyle="italic"
      fontWeight="400"
      letterSpacing="1"
      fill="currentColor"
    >
      Cartier
    </text>
    <text
      x="80"
      y="67"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="10"
      fontWeight="600"
      letterSpacing="4"
      opacity="0.8"
      fill="currentColor"
    >
      PARIS
    </text>
  </svg>
);

// 4. Patek Philippe: Calatrava Cross + PATEK PHILIPPE GENEVE
export const PatekPhilippeLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 160 80"
    width={width ?? size * 2.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Calatrava Cross Motif */}
    <g transform="translate(80, 22) scale(0.75)" fill="#c99f4a">
      <path d="M0 -18 C-3 -18 -5 -15 -5 -12 C-5 -9 -3 -7 0 -4 C3 -7 5 -9 5 -12 C5 -15 3 -18 0 -18 Z" />
      <path d="M0 18 C-3 18 -5 15 -5 12 C-5 9 -3 7 0 4 C3 7 5 9 5 12 C5 15 3 18 0 18 Z" />
      <path d="M-18 0 C-18 -3 -15 -5 -12 -5 C-9 -5 -7 -3 -4 0 C-7 3 -9 5 -12 5 C-15 5 -18 3 -18 0 Z" />
      <path d="M18 0 C18 -3 15 -5 12 -5 C9 -5 7 -3 4 0 C7 3 9 5 12 5 C15 5 18 3 18 0 Z" />
      <circle cx="0" cy="0" r="3.5" />
      <path d="M-3 -3 L3 3 M-3 3 L3 -3" stroke="#c99f4a" strokeWidth="2" />
    </g>
    <text
      x="80"
      y="54"
      textAnchor="middle"
      fontFamily="'Garamond', 'Times New Roman', serif"
      fontSize="15.5"
      fontWeight="700"
      letterSpacing="3"
      fill="currentColor"
    >
      PATEK PHILIPPE
    </text>
    <text
      x="80"
      y="69"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="10"
      fontWeight="500"
      letterSpacing="4"
      opacity="0.85"
      fill="currentColor"
    >
      GENEVE
    </text>
  </svg>
);

// 5. Audemars Piguet: Monogram AP + AUDEMARS PIGUET
export const AudemarsPiguetLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 180 80"
    width={width ?? size * 2.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Interlocking AP */}
    <g transform="translate(90, 20) scale(1)" textAnchor="middle" fontFamily="'Didot', 'Playfair Display', serif">
      <text x="-5" y="8" fontSize="24" fontWeight="700" fill="#d1b46a">A</text>
      <text x="6" y="8" fontSize="24" fontWeight="700" fill="currentColor">P</text>
    </g>
    <text
      x="90"
      y="52"
      textAnchor="middle"
      fontFamily="'Garamond', 'Didot', serif"
      fontSize="15"
      fontWeight="700"
      letterSpacing="2.2"
      fill="currentColor"
    >
      AUDEMARS PIGUET
    </text>
    <text
      x="90"
      y="67"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="9"
      fontWeight="500"
      letterSpacing="3"
      opacity="0.8"
      fill="currentColor"
    >
      LE BRASSUS
    </text>
  </svg>
);

// 6. Vacheron Constantin: Maltese Cross + VACHERON CONSTANTIN
export const VacheronConstantinLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 240 80"
    width={width ?? size * 2.8}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Maltese Cross */}
    <g transform="translate(120, 19) scale(0.75)" fill="#c99f4a">
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
      x="120"
      y="52"
      textAnchor="middle"
      fontFamily="'Garamond', 'Times New Roman', serif"
      fontSize="14"
      fontWeight="700"
      letterSpacing="2.5"
      fill="currentColor"
    >
      VACHERON CONSTANTIN
    </text>
    <text
      x="120"
      y="67"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="10"
      fontWeight="600"
      letterSpacing="4"
      opacity="0.85"
      fill="currentColor"
    >
      GENÈVE
    </text>
  </svg>
);

// 7. Jaeger-LeCoultre: JL Crest + JAEGER-LECOULTRE
export const JaegerLeCoultreLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 220 80"
    width={width ?? size * 2.6}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* JLC Interlaced Emblem */}
    <circle cx="110" cy="20" r="14" fill="none" stroke="#bda365" strokeWidth="1.6" />
    <text
      x="110"
      y="27"
      textAnchor="middle"
      fontFamily="'Cinzel', 'Playfair Display', serif"
      fontSize="17"
      fontWeight="700"
      fill="#bda365"
    >
      JL
    </text>
    <text
      x="110"
      y="52"
      textAnchor="middle"
      fontFamily="'Garamond', 'Playfair Display', serif"
      fontSize="14.5"
      fontWeight="700"
      letterSpacing="2.2"
      fill="currentColor"
    >
      JAEGER-LECOULTRE
    </text>
    <text
      x="110"
      y="67"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="9.5"
      fontWeight="500"
      letterSpacing="3.5"
      opacity="0.8"
      fill="currentColor"
    >
      VALLEE DE JOUX
    </text>
  </svg>
);

// 8. IWC Schaffhausen: IWC bold + SCHAFFHAUSEN
export const IWCLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 160 80"
    width={width ?? size * 2.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    <text
      x="80"
      y="38"
      textAnchor="middle"
      fontFamily="'Cinzel', 'Didot', 'Times New Roman', serif"
      fontSize="36"
      fontWeight="700"
      letterSpacing="7"
      fill="currentColor"
    >
      IWC
    </text>
    <text
      x="80"
      y="58"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', 'Arial', sans-serif"
      fontSize="12"
      fontWeight="600"
      letterSpacing="5"
      opacity="0.85"
      fill="currentColor"
    >
      SCHAFFHAUSEN
    </text>
  </svg>
);

// 9. Breitling: Winged Anchor B + BREITLING 1884
export const BreitlingLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 160 80"
    width={width ?? size * 2.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Aviation Wings & Anchor */}
    <g transform="translate(80, 20) scale(0.8)" fill="#d4af37">
      <path d="M-30 0 C-20 -8 -5 -5 0 2 C5 -5 20 -8 30 0 C18 -2 5 2 0 10 C-5 2 -18 -2 -30 0 Z" />
      <path d="M-2 -3 C-2 -7 2 -7 2 -3 L2 14 C4 13 8 10 10 6 L12 7 C9 13 4 16 0 16 C-4 16 -9 13 -12 7 L-10 6 C-8 10 -4 13 -2 14 Z" />
      <text x="0" y="4" textAnchor="middle" fontSize="16" fontFamily="'Brush Script MT', cursive" fontWeight="bold">B</text>
    </g>
    <text
      x="80"
      y="54"
      textAnchor="middle"
      fontFamily="'Copperplate', 'Futura', sans-serif"
      fontSize="18"
      fontWeight="800"
      letterSpacing="4.5"
      fill="currentColor"
    >
      BREITLING
    </text>
    <text
      x="80"
      y="69"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="9.5"
      fontWeight="600"
      letterSpacing="3.5"
      opacity="0.8"
      fill="currentColor"
    >
      1884
    </text>
  </svg>
);

// 10. Seiko: Iconic typography + SINCE 1881
export const SeikoLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 200 80"
    width={width ?? size * 2.5}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    <text
      x="100"
      y="46"
      textAnchor="middle"
      fontFamily="'Times New Roman', 'Baskerville', 'Didot', serif"
      fontSize="36"
      fontWeight="800"
      letterSpacing="4"
      fill="currentColor"
    >
      SEIKO
    </text>
    <text
      x="100"
      y="65"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="9.5"
      fontWeight="700"
      letterSpacing="3.5"
      opacity="0.85"
      fill="#bda365"
    >
      SINCE 1881
    </text>
  </svg>
);

// 10b. Breguet: Script wordmark + Pomme Hand Motif + DEPUIS 1775
export const BreguetLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 220 80"
    width={width ?? size * 2.6}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Breguet Hollow Pomme Hand Motif */}
    <g transform="translate(110, 16) scale(0.75)" fill="none" stroke="#d4af37" strokeWidth="2.2">
      <circle cx="0" cy="0" r="7" />
      <circle cx="2" cy="-2" r="3.2" fill="#d4af37" />
      <line x1="0" y1="7" x2="0" y2="15" strokeLinecap="round" />
    </g>
    <text
      x="110"
      y="51"
      textAnchor="middle"
      fontFamily="'Playfair Display', 'Edwardian Script ITC', 'Baskerville', 'Georgia', cursive, serif"
      fontSize="36"
      fontStyle="italic"
      fontWeight="600"
      letterSpacing="1"
      fill="currentColor"
    >
      Breguet
    </text>
    <text
      x="110"
      y="68"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="8.5"
      fontWeight="600"
      letterSpacing="4"
      opacity="0.85"
      fill="currentColor"
    >
      DEPUIS 1775
    </text>
  </svg>
);

// 10c. Girard-Perregaux: GP Crest + GIRARD-PERREGAUX 1791
export const GirardPerregauxLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 240 80"
    width={width ?? size * 2.8}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Interlocking GP */}
    <g transform="translate(120, 19) scale(0.9)" textAnchor="middle" fontFamily="'Didot', 'Playfair Display', serif">
      <text x="-7" y="6" fontSize="22" fontWeight="700" fill="#d1b46a">G</text>
      <text x="8" y="6" fontSize="22" fontWeight="700" fill="currentColor">P</text>
    </g>
    <text
      x="120"
      y="50"
      textAnchor="middle"
      fontFamily="'Garamond', 'Times New Roman', serif"
      fontSize="15"
      fontWeight="700"
      letterSpacing="3"
      fill="currentColor"
    >
      GIRARD-PERREGAUX
    </text>
    <text
      x="120"
      y="66"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="8.5"
      fontWeight="600"
      letterSpacing="3.5"
      opacity="0.8"
      fill="#bda365"
    >
      HAUTE HORLOGERIE DEPUIS 1791
    </text>
  </svg>
);

// 10d. Ulysse Nardin: Maritime Anchor + ULYSSE NARDIN LE LOCLE
export const UlysseNardinLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 240 80"
    width={width ?? size * 2.8}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Maritime Anchor Symbol */}
    <g transform="translate(120, 17) scale(0.7)" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="0" cy="-10" r="4" fill="none" stroke="#2563eb" strokeWidth="2.5" />
      <line x1="0" y1="-6" x2="0" y2="12" />
      <line x1="-8" y1="-3" x2="8" y2="-3" strokeWidth="2" />
      <path d="M-12 5 C-8 15 8 15 12 5" />
      <polygon points="-14,3 -12,6 -10,4" fill="#2563eb" stroke="none" />
      <polygon points="14,3 12,6 10,4" fill="#2563eb" stroke="none" />
    </g>
    <text
      x="120"
      y="50"
      textAnchor="middle"
      fontFamily="'Futura', 'Helvetica Neue', 'Arial', sans-serif"
      fontSize="16.5"
      fontWeight="800"
      letterSpacing="3.5"
      fill="currentColor"
    >
      ULYSSE NARDIN
    </text>
    <text
      x="120"
      y="66"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="8.5"
      fontWeight="600"
      letterSpacing="3"
      opacity="0.8"
      fill="currentColor"
    >
      LE LOCLE · SUISSE · 1846
    </text>
  </svg>
);

// 10e. A. Lange & Söhne: Arched Glashütte Typography
export const ALangeSohneLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 240 80"
    width={width ?? size * 2.8}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    <text
      x="120"
      y="38"
      textAnchor="middle"
      fontFamily="'Cinzel', 'Trajan Pro', 'Garamond', 'Times New Roman', serif"
      fontSize="16"
      fontWeight="800"
      letterSpacing="3"
      fill="currentColor"
    >
      A. LANGE &amp; SÖHNE
    </text>
    <line x1="60" y1="46" x2="180" y2="46" stroke="#bda365" strokeWidth="1" opacity="0.7" />
    <text
      x="120"
      y="61"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', 'Arial', sans-serif"
      fontSize="9"
      fontWeight="700"
      letterSpacing="4"
      fill="#bda365"
    >
      GLASHÜTTE I/SA
    </text>
  </svg>
);

// 10f. Blancpain: 1735 Haute Horlogerie
export const BlancpainLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 220 80"
    width={width ?? size * 2.6}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    <text
      x="110"
      y="42"
      textAnchor="middle"
      fontFamily="'Baskerville', 'Didot', 'Times New Roman', serif"
      fontSize="23"
      fontWeight="700"
      letterSpacing="4"
      fill="currentColor"
    >
      BLANCPAIN
    </text>
    <text
      x="110"
      y="58"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="7.5"
      fontWeight="600"
      letterSpacing="2.5"
      opacity="0.8"
      fill="currentColor"
    >
      MANUFACTURE DE HAUTE HORLOGERIE
    </text>
    <text
      x="110"
      y="70"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="7.5"
      fontWeight="700"
      letterSpacing="3"
      fill="#bda365"
    >
      1735
    </text>
  </svg>
);

// 10g. Apple: Iconic  Emblem
export const AppleWatchLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 100 80"
    width={width ?? size * 1.25}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    <g transform="translate(50, 36) scale(1.3)" fill="currentColor">
      <path d="M12 -4 C13 -8 11 -12 7 -14 C6 -10 9 -6 12 -4 Z" fill="currentColor" />
      <path d="M7 -2 C4 -2 2 -4 -2 -4 C-6 -4 -9 -2 -11 1 C-15 7 -13 18 -8 24 C-6 27 -3 30 0 30 C3 30 5 28 8 28 C11 28 13 30 16 30 C19 30 22 27 24 24 C26 21 27 18 27 17 C26 16.5 21 14.5 21 9 C21 4.5 25 2.5 25 2 C22 -2 18 -2.5 16 -2.5 C12 -2.5 9 -2 7 -2 Z" />
    </g>
  </svg>
);

// 10h. Samsung Galaxy Watch
export const SamsungWatchLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 220 80"
    width={width ?? size * 2.6}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    <text
      x="110"
      y="38"
      textAnchor="middle"
      fontFamily="'Samsung Sharp Sans', 'Helvetica Neue', 'Arial', sans-serif"
      fontSize="20"
      fontWeight="900"
      letterSpacing="3.5"
      fill="#1428a0"
    >
      SAMSUNG
    </text>
    <text
      x="110"
      y="58"
      textAnchor="middle"
      fontFamily="'Samsung One', 'Helvetica Neue', 'Arial', sans-serif"
      fontSize="14"
      fontWeight="600"
      letterSpacing="2"
      fill="currentColor"
    >
      Galaxy Watch
    </text>
  </svg>
);


// 11. Grand Seiko: Crowned Lion & GS + Grand Seiko
export const GrandSeikoLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 160 80"
    width={width ?? size * 2.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Monogram GS */}
    <text
      x="80"
      y="28"
      textAnchor="middle"
      fontFamily="'Cinzel', 'Old English Text MT', serif"
      fontSize="25"
      fontWeight="700"
      letterSpacing="2"
      fill="#bda365"
    >
      GS
    </text>
    <text
      x="80"
      y="54"
      textAnchor="middle"
      fontFamily="'Garamond', 'Georgia', serif"
      fontSize="19"
      fontWeight="700"
      letterSpacing="1.2"
      fill="currentColor"
    >
      Grand Seiko
    </text>
  </svg>
);

// 12. TAG Heuer: Two-tone Shield + TAG Heuer
export const TagHeuerLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 200 80"
    width={width ?? size * 2.5}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* TAG Heuer Shield */}
    <g transform="translate(100, 18) scale(0.75)">
      {/* Top green half */}
      <path d="M-18 -12 L18 -12 L18 0 L-18 0 Z" fill="#006341" />
      <text x="0" y="-2" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff" fontFamily="sans-serif">TAG</text>
      {/* Bottom red half */}
      <path d="M-18 0 L18 0 L18 4 C18 14 0 20 0 20 C0 20 -18 14 -18 4 Z" fill="#e21836" />
      <text x="0" y="11" textAnchor="middle" fontSize="9" fontWeight="900" fill="#fff" fontFamily="sans-serif">HEUER</text>
    </g>
    <text
      x="100"
      y="56"
      textAnchor="middle"
      fontFamily="'Futura', 'Arial Black', sans-serif"
      fontSize="16"
      fontWeight="900"
      letterSpacing="3.5"
      fill="currentColor"
    >
      TAG HEUER
    </text>
    <text
      x="100"
      y="70"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="8"
      fontWeight="600"
      letterSpacing="2.2"
      opacity="0.8"
      fill="currentColor"
    >
      SWISS AVANT-GARDE SINCE 1860
    </text>
  </svg>
);

// 13. Longines: Winged Hourglass + LONGINES
export const LonginesLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 160 80"
    width={width ?? size * 2.2}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Winged Hourglass */}
    <g transform="translate(80, 19) scale(0.75)">
      <path d="M-28 0 C-20 -7 -6 -5 0 1 C6 -5 20 -7 28 0 C16 -1 5 3 0 9 C-5 3 -16 -1 -28 0 Z" fill="#bda365" />
      <polygon points="-5,-6 5,-6 0,0 5,6 -5,6 0,0" fill="#fff" stroke="#bda365" strokeWidth="1.2" />
    </g>
    <text
      x="80"
      y="55"
      textAnchor="middle"
      fontFamily="'Didot', 'Bodoni MT', 'Times New Roman', serif"
      fontSize="21"
      fontWeight="700"
      letterSpacing="4.5"
      fill="currentColor"
    >
      LONGINES
    </text>
  </svg>
);

// 14. Tissot: Swiss Cross + TISSOT 1853
export const TissotLogo: FC<LogoProps> = ({ className = "", size = 80, width, height, ...props }) => (
  <svg
    viewBox="0 0 180 80"
    width={width ?? size * 2.3}
    height={height ?? size}
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Swiss Cross */}
    <g transform="translate(90, 16) scale(0.65)">
      <rect x="-14" y="-14" width="28" height="28" fill="#e21836" rx="2" />
      <rect x="-3" y="-9" width="6" height="18" fill="#fff" />
      <rect x="-9" y="-3" width="18" height="6" fill="#fff" />
    </g>
    <text
      x="90"
      y="53"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', 'Arial Black', sans-serif"
      fontSize="21"
      fontWeight="900"
      letterSpacing="4.5"
      fill="currentColor"
    >
      TISSOT
    </text>
    <text
      x="90"
      y="68"
      textAnchor="middle"
      fontFamily="'Helvetica Neue', sans-serif"
      fontSize="8.5"
      fontWeight="700"
      letterSpacing="2.5"
      opacity="0.85"
      fill="currentColor"
    >
      SWISS WATCHES SINCE 1853
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
        <span className={`default-brand-wordmark ${className}`} style={{ fontSize: (typeof size === 'number' ? size : 80) * 0.45, fontWeight: 700, letterSpacing: "0.1em" }}>
          {brand.toUpperCase()}
        </span>
      );
  }
}
