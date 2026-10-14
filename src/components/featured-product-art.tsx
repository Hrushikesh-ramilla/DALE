"use client";
import { useId } from "react";
import type { Product } from "@/domain/catalog";

/** Original category illustrations; these are not manufacturer photographs. */
export function FeaturedProductArt({ product }: { product: Product }) {
  const id = useId().replaceAll(":", "");
  const paint = (name: string) => `url(#${id}-${name})`;
  return (
    <div className="featured-product-art">
      <svg
        viewBox="0 0 600 420"
        role="img"
        aria-label={`${product.name}; original category illustration, not a product photograph`}
      >
        <defs>
          <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#a1a3a5" />
            <stop offset=".25" stopColor="#36383c" />
            <stop offset=".65" stopColor="#16181c" />
            <stop offset="1" stopColor="#55585b" />
          </linearGradient>
          <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2=".3">
            <stop stopColor="#a89270" />
            <stop offset=".12" stopColor="#f4e9cf" />
            <stop offset=".4" stopColor="#c8af80" />
            <stop offset=".8" stopColor="#e2cc9c" />
            <stop offset="1" stopColor="#8b7353" />
          </linearGradient>
          <linearGradient id={`${id}-fabric`} x1="0" y1="0" x2="1" y2=".7">
            <stop stopColor="#796858" />
            <stop offset=".45" stopColor="#49392d" />
            <stop offset="1" stopColor="#211c19" />
          </linearGradient>
          <radialGradient id={`${id}-shadow`}>
            <stop stopColor="#151515" stopOpacity=".25" />
            <stop offset="1" stopColor="#151515" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="300" cy="370" rx="170" ry="25" fill={paint("shadow")} />
        {product.category === "phones" ? (
          <g transform="rotate(-9 300 210)">
            <rect
              x="212"
              y="32"
              width="177"
              height="324"
              rx="31"
              fill={paint("metal")}
              stroke="#81858a"
              strokeWidth="2"
            />
            <rect
              x="220"
              y="40"
              width="161"
              height="308"
              rx="25"
              fill="#202327"
              stroke="#494c50"
            />
            <rect
              x="231"
              y="51"
              width="99"
              height="68"
              rx="22"
              fill="#2e3237"
              stroke="#62666b"
            />
            {[255, 300].map((x) => (
              <g key={x}>
                <circle
                  cx={x}
                  cy="85"
                  r="19"
                  fill="#101215"
                  stroke="#82878d"
                  strokeWidth="3"
                />
                <circle cx={x} cy="85" r="11" fill="#171e27" />
                <circle cx={x - 3} cy="81" r="4" fill="#647383" opacity=".7" />
              </g>
            ))}
            <circle cx="350" cy="85" r="8" fill="#dbd9cf" />
            <path
              d="M231 136 V315 Q231 333 249 333"
              fill="none"
              stroke="#8c8f94"
              opacity=".3"
              strokeWidth="2"
            />
            <path
              d="M390 140 V191 M210 112 V139"
              stroke="#3e4247"
              strokeWidth="4"
            />
          </g>
        ) : product.category === "fragrance" ? (
          <g>
            <rect
              x="245"
              y="48"
              width="110"
              height="72"
              rx="5"
              fill={paint("metal")}
              stroke="#75716a"
            />
            <rect x="252" y="113" width="96" height="19" fill="#a98e54" />
            <path
              d="M225 130 H375 L385 345 Q300 361 215 345 Z"
              fill={paint("glass")}
              stroke="#ae9978"
              strokeWidth="2"
            />
            <path
              d="M227 144 V328 M371 144 V330"
              stroke="#fff9e5"
              strokeWidth="7"
              opacity=".6"
            />
            <rect
              x="239"
              y="179"
              width="122"
              height="117"
              fill="#f1e8d8"
              stroke="#9d8762"
            />
            <path d="M251 192 H349 V283 H251 Z" fill="none" stroke="#ad9774" />
            <text
              x="300"
              y="227"
              textAnchor="middle"
              fill="#493b2b"
              fontFamily="Georgia, serif"
              fontSize="16"
            >
              FRAGRANCE
            </text>
            <text
              x="300"
              y="253"
              textAnchor="middle"
              fill="#6d5a40"
              fontSize="11"
              letterSpacing="3"
            >
              {product.attributes?.volumeMl} ML
            </text>
          </g>
        ) : product.category === "bags" ? (
          <g>
            <path
              d="M223 167 V108 Q223 39 264 39 Q305 39 305 108 V167 M300 167 V108 Q300 39 341 39 Q382 39 382 108 V167"
              fill="none"
              stroke="#58432f"
              strokeWidth="13"
            />
            <path
              d="M166 149 L438 149 L414 346 Q300 372 185 346 Z"
              fill={paint("fabric")}
              stroke="#735a40"
              strokeWidth="3"
            />
            <path
              d="M171 154 Q300 176 432 154 M185 331 Q300 354 416 331"
              fill="none"
              stroke="#b99b74"
              strokeWidth="2"
            />
            <path
              d="M221 153 L229 333 M379 153 L370 337"
              stroke="#725036"
              strokeWidth="16"
            />
            <path
              d="M222 154 L230 332 M378 154 L369 337"
              stroke="#b2956c"
              strokeWidth="1"
            />
            <path
              d="M186 174 L203 317 M418 174 L404 318"
              stroke="#aa8d68"
              opacity=".25"
              strokeWidth="4"
            />
          </g>
        ) : (
          <g>
            <path
              d="M228 72 L269 54 Q300 78 331 54 L372 72 L460 135 L416 205 L372 175 L391 351 Q300 363 209 351 L228 175 L184 205 L140 135 Z"
              fill={paint("fabric")}
              stroke="#796353"
              strokeWidth="2"
            />
            <path
              d="M269 54 Q300 107 331 54"
              fill="none"
              stroke="#211c19"
              strokeWidth="9"
            />
            <path
              d="M239 111 Q256 212 233 336 M350 108 Q337 215 365 338"
              fill="none"
              stroke="#a08b79"
              opacity=".28"
              strokeWidth="5"
            />
            <path
              d="M150 143 L187 194 M450 143 L413 194 M218 340 Q300 350 382 340"
              fill="none"
              stroke="#b0977e"
              opacity=".4"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
