export function BrandWordmark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`brand-wordmark ${className}`}
      viewBox="0 0 315 84"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        d="M5 5h29c26 0 41 14 41 37S60 79 34 79H5v-2h9V7H5V5Zm23 3v68h6c18 0 25-13 25-34S52 8 34 8h-6Z"
      />
      <path
        fillRule="evenodd"
        d="M78 79v-2h8l27-72h4l29 72h7v2h-35v-2h9l-9-24H97l-8 24h10v2H78Zm21-29h18l-9-25-9 25Z"
      />
      <path d="M157 5h39v2h-12v69h14c13 0 17-7 22-19h2l-4 22h-61v-2h10V7h-10V5Z" />
      <path d="M231 5h65v20h-2c-3-12-7-17-19-17h-18v32h11c9 0 11-4 12-13h2v29h-2c-1-10-3-13-12-13h-11v33h19c14 0 20-5 25-20h2l-4 23h-68v-2h10V7h-10V5Z" />
    </svg>
  );
}
