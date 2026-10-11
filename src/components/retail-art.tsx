import type { Product } from "@/domain/catalog";
export function RetailArt({
  product,
  compact,
  id,
}: {
  product: Product;
  compact: boolean;
  id: string;
}) {
  const fill = `url(#${id}-retail)`;
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
          <linearGradient id={`${id}-retail`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ddd8cc" />
            <stop offset=".45" stopColor="#9f9a91" />
            <stop offset="1" stopColor="#403e3a" />
          </linearGradient>
        </defs>
        <ellipse cx="210" cy="280" rx="115" ry="14" fill="#000" opacity=".2" />
        {product.category === "clothing" ? (
          <g>
            <path
              d="M160 78 L188 64 Q210 87 232 64 L260 78 L315 120 L285 165 L260 148 L272 270 L148 270 L160 148 L135 165 L105 120 Z"
              fill={fill}
              stroke="#7d786e"
              strokeWidth="2"
            />
            <path
              d="M188 64 Q210 103 232 64 M163 150 L158 257 M257 150 L262 257"
              fill="none"
              stroke="#57534d"
              strokeWidth="2"
            />
            <path
              d="M178 112 Q190 182 177 248 M225 110 Q242 185 234 250"
              fill="none"
              stroke="#f4f1e9"
              opacity=".22"
              strokeWidth="4"
            />
          </g>
        ) : product.category === "bags" ? (
          <g>
            <path
              d="M159 119 V91 Q159 44 210 44 Q261 44 261 91 V119"
              fill="none"
              stroke="#58554d"
              strokeWidth="15"
            />
            <path
              d="M127 107 H293 L311 270 H109 Z"
              fill={fill}
              stroke="#706b62"
              strokeWidth="2"
            />
            <path
              d="M149 112 L137 257 M271 112 L283 257"
              stroke="#e7e1d3"
              strokeWidth="2"
              opacity=".5"
            />
            <rect
              x="184"
              y="175"
              width="52"
              height="27"
              rx="3"
              fill="#403d37"
            />
            <text
              x="210"
              y="193"
              textAnchor="middle"
              fontSize="10"
              fill="#ded8ca"
              letterSpacing="2"
            >
              DALE
            </text>
          </g>
        ) : product.category === "home" ? (
          <g>
            <path
              d="M170 61 H250 L242 125 Q286 161 282 215 Q278 265 210 269 Q142 265 138 215 Q134 161 178 125 Z"
              fill={fill}
              stroke="#827b70"
              strokeWidth="2"
            />
            <ellipse cx="210" cy="61" rx="40" ry="9" fill="#4e4942" />
            <path
              d="M174 169 Q157 211 177 247"
              fill="none"
              stroke="#f7f4ea"
              strokeWidth="7"
              opacity=".45"
            />
          </g>
        ) : (
          <g>
            <rect
              x="166"
              y="52"
              width="88"
              height="40"
              rx="4"
              fill="#1a1a19"
              stroke="#78746c"
            />
            <rect
              x="159"
              y="89"
              width="102"
              height="17"
              rx="3"
              fill="#726d63"
            />
            <rect
              x="140"
              y="104"
              width="140"
              height="164"
              rx={product.category === "beauty" ? "24" : "7"}
              fill={fill}
              stroke="#aaa294"
              strokeWidth="2"
            />
            <path
              d="M151 119 V246"
              stroke="#fff"
              opacity=".5"
              strokeWidth="5"
            />
            <rect
              x="158"
              y="148"
              width="104"
              height="82"
              fill="#e9e5db"
              opacity=".88"
            />
            <text
              x="210"
              y="174"
              textAnchor="middle"
              fill="#262521"
              fontSize="18"
              fontFamily="serif"
              letterSpacing="5"
            >
              DALE
            </text>
            <text
              x="210"
              y="198"
              textAnchor="middle"
              fill="#625e55"
              fontSize="9"
              letterSpacing="2"
            >
              {product.category === "beauty" ? "CARE" : "FRAGRANCE"}
            </text>
            <text
              x="210"
              y="216"
              textAnchor="middle"
              fill="#625e55"
              fontSize="9"
            >
              {product.attributes?.volumeMl} ml
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
