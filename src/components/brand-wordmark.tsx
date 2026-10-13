export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-wordmark ${className}`}
      viewBox="0 0 176 54"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ overflow: "visible" }}
    >
      <text
        x="0"
        y="42"
        fontFamily="'Boska', 'Cormorant Garamond', Georgia, serif"
        fontWeight="700"
        fontSize="52"
        fill="currentColor"
      >
        <tspan x="0">D</tspan>
        <tspan x="43">A</tspan>
        <tspan x="86">L</tspan>
        <tspan x="126">E</tspan>
      </text>
    </svg>
  );
}
