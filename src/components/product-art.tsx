"use client";
import { useId } from "react";
import type { Product } from "@/domain/catalog";

export function ProductArt({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  const paint = (name: string) => `url(#${id}-${name})`;
  return (
    <div
      className={`product-art ${product.category} ${compact ? "compact" : ""}`}
    >
      <svg
        viewBox="0 0 420 330"
        role="img"
        aria-label={`${product.category} catalog illustration`}
      >
        <defs>
          <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#656565" />
            <stop offset=".28" stopColor="#303030" />
            <stop offset=".75" stopColor="#171717" />
            <stop offset="1" stopColor="#070707" />
          </linearGradient>
          <linearGradient id={`${id}-silver`} x1="0" y1="0" x2="1" y2=".65">
            <stop stopColor="#dededb" />
            <stop offset=".28" stopColor="#888886" />
            <stop offset=".45" stopColor="#c6c6c2" />
            <stop offset="1" stopColor="#525250" />
          </linearGradient>
          <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#999" />
            <stop offset=".4" stopColor="#363636" />
            <stop offset="1" stopColor="#121212" />
          </linearGradient>
          <radialGradient id={`${id}-shadow`}>
            <stop stopColor="#000" stopOpacity=".32" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <filter
            id={`${id}-lift`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feDropShadow dx="4" dy="14" stdDeviation="9" floodOpacity=".22" />
          </filter>
        </defs>
        <ellipse cx="210" cy="282" rx="137" ry="23" fill={paint("shadow")} />
        <g filter={paint("lift")}>
          {product.category === "audio" ? (
            <g transform="rotate(-16 210 165)">
              <path
                d="M120 186 V129 C120 24 299 24 299 129 V186"
                fill="none"
                stroke="#121212"
                strokeWidth="28"
                strokeLinecap="round"
              />
              <path
                d="M120 147 V127 C120 38 299 38 299 127 V147"
                fill="none"
                stroke={paint("edge")}
                strokeWidth="18"
              />
              <path
                d="M130 107 C149 44 267 44 287 107"
                fill="none"
                stroke="#777"
                strokeWidth="2"
                opacity=".65"
              />
              <path
                d="M116 144 V227 M303 144 V227"
                stroke={paint("silver")}
                strokeWidth="8"
              />
              <rect
                x="90"
                y="159"
                width="59"
                height="99"
                rx="27"
                fill={paint("body")}
                stroke="#555"
              />
              <rect
                x="271"
                y="159"
                width="59"
                height="99"
                rx="27"
                fill={paint("body")}
                stroke="#555"
              />
              <rect
                x="133"
                y="168"
                width="25"
                height="82"
                rx="12"
                fill="#111"
                stroke="#474747"
              />
              <rect
                x="262"
                y="168"
                width="25"
                height="82"
                rx="12"
                fill="#111"
                stroke="#474747"
              />
              <path
                d="M101 181 V224 M314 181 V224"
                stroke="#777"
                strokeWidth="1.5"
              />
              <text
                x="105"
                y="210"
                fill="#aaa"
                fontSize="9"
                letterSpacing="2"
                transform="rotate(90 105 210)"
              >
                BG
              </text>
            </g>
          ) : product.category === "chargers" ? (
            <g transform="rotate(-21 205 158)">
              <path
                d="M247 169 C330 128 360 219 301 242 C264 257 273 281 355 259"
                fill="none"
                stroke="#151515"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M248 167 C330 128 357 219 301 240"
                fill="none"
                stroke="#777"
                strokeWidth="1.2"
              />
              <rect
                x="150"
                y="53"
                width="14"
                height="47"
                rx="3"
                fill={paint("silver")}
              />
              <rect
                x="199"
                y="53"
                width="14"
                height="47"
                rx="3"
                fill={paint("silver")}
              />
              <path
                d="M126 102 L158 82 H229 Q251 82 251 105 V207 L225 230 H127Z"
                fill={paint("edge")}
                stroke="#555"
              />
              <rect
                x="112"
                y="101"
                width="115"
                height="137"
                rx="23"
                fill={paint("body")}
                stroke="#626262"
              />
              <path
                d="M121 122 Q121 110 136 110 H208"
                fill="none"
                stroke="#979797"
                strokeWidth="1"
              />
              <rect
                x="143"
                y="134"
                width="45"
                height="14"
                rx="6"
                fill="#080808"
                stroke="#757575"
              />
              <rect
                x="148"
                y="138"
                width="35"
                height="6"
                rx="3"
                fill="#353535"
              />
              <text
                x="170"
                y="202"
                fill="#929292"
                fontSize="13"
                letterSpacing="3"
                textAnchor="middle"
              >
                BG
              </text>
              <path
                d="M342 263 L370 253"
                stroke={paint("silver")}
                strokeWidth="11"
                strokeLinecap="round"
              />
              <path
                d="M338 263 L357 257"
                stroke="#151515"
                strokeWidth="13"
                strokeLinecap="round"
              />
            </g>
          ) : product.category === "accessories" ? (
            <g transform="rotate(-24 210 164)">
              <path
                d="M155 263 C115 219 129 72 199 59 C281 54 302 203 264 257 Q209 289 155 263Z"
                fill={paint("body")}
                stroke="#686868"
                strokeWidth="1.5"
              />
              <path
                d="M198 61 L208 149 M145 176 Q208 187 282 169"
                fill="none"
                stroke="#696969"
                strokeWidth="1"
              />
              <rect
                x="194"
                y="94"
                width="13"
                height="37"
                rx="6"
                fill={paint("silver")}
              />
              <text
                x="212"
                y="244"
                fill="#999"
                fontSize="12"
                letterSpacing="3"
                textAnchor="middle"
              >
                BG
              </text>
            </g>
          ) : product.category === "storage" ? (
            <g transform="rotate(-25 210 165)">
              <rect
                x="116"
                y="79"
                width="186"
                height="168"
                rx="19"
                fill={paint("silver")}
                stroke="#686868"
              />
              <rect
                x="120"
                y="83"
                width="178"
                height="160"
                rx="16"
                fill="none"
                stroke="#d1d1cd"
                strokeOpacity=".6"
              />
              {Array.from({ length: 23 }, (_, i) => (
                <path
                  key={i}
                  d={`M${130 + i * 7} 96 V230`}
                  stroke="#393939"
                  strokeOpacity=".16"
                />
              ))}
              <rect
                x="150"
                y="139"
                width="120"
                height="40"
                rx="2"
                fill="#272727"
              />
              <text
                x="210"
                y="164"
                fill="#ddd"
                fontSize="13"
                letterSpacing="5"
                textAnchor="middle"
              >
                BG / SSD
              </text>
            </g>
          ) : (
            <g transform="rotate(-19 210 165)">
              <path
                d="M112 164 C61 112 32 171 76 223"
                fill="none"
                stroke="#252525"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M76 223 L91 238"
                stroke={paint("silver")}
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d="M112 121 L145 98 H314 L329 120 V203 L303 228 H118Z"
                fill={paint("edge")}
                stroke="#555"
              />
              <rect
                x="105"
                y="120"
                width="199"
                height="107"
                rx="14"
                fill={paint("silver")}
                stroke="#6c6c6c"
              />
              <rect
                x="111"
                y="125"
                width="187"
                height="97"
                rx="10"
                fill={paint("body")}
                stroke="#919191"
              />
              <rect
                x="128"
                y="163"
                width="37"
                height="18"
                rx="2"
                fill="#080808"
                stroke="#929292"
              />
              <rect
                x="180"
                y="163"
                width="37"
                height="18"
                rx="2"
                fill="#080808"
                stroke="#929292"
              />
              <rect
                x="237"
                y="164"
                width="33"
                height="14"
                rx="6"
                fill="#080808"
                stroke="#929292"
              />
              <path
                d="M136 170 H157 M188 170 H209"
                stroke="#656565"
                strokeWidth="3"
              />
              <text
                x="211"
                y="209"
                fill="#999"
                fontSize="8"
                letterSpacing="2"
                textAnchor="middle"
              >
                BUYERGUARD
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
