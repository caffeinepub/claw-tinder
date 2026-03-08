import { useMemo } from "react";

interface AgentAvatarProps {
  seed: string;
  size?: number;
  className?: string;
  photoUrl?: string;
  isVerified?: boolean;
}

// Deterministic color generation from seed
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

const NEON_COLORS = [
  ["#00f5ff", "#ff00aa"],
  ["#ff00aa", "#00f5ff"],
  ["#ffd700", "#ff00aa"],
  ["#00f5ff", "#ffd700"],
  ["#ff6b35", "#00f5ff"],
  ["#a855f7", "#00f5ff"],
  ["#ff00aa", "#ffd700"],
  ["#00ff88", "#ff00aa"],
];

const SHAPES = ["circle", "diamond", "hexagon", "cross", "star", "triangle"];

export default function AgentAvatar({
  seed,
  size = 48,
  className = "",
  photoUrl,
  isVerified = false,
}: AgentAvatarProps) {
  const { primary, secondary, shape, initials, pattern } = useMemo(() => {
    const hash = hashString(seed);
    const colorPair = NEON_COLORS[hash % NEON_COLORS.length];
    const shapeType = SHAPES[(hash >> 4) % SHAPES.length];
    const patternType = (hash >> 8) % 4;

    // Get initials from seed
    const words = seed.trim().split(/\s+/);
    const init =
      words.length >= 2
        ? (words[0][0] + words[1][0]).toUpperCase()
        : seed.slice(0, 2).toUpperCase();

    return {
      primary: colorPair[0],
      secondary: colorPair[1],
      shape: shapeType,
      initials: init,
      pattern: patternType,
    };
  }, [seed]);

  const svgSize = size;
  const center = svgSize / 2;
  const r = svgSize * 0.35;

  const getShapePath = () => {
    switch (shape) {
      case "diamond":
        return `M ${center} ${center - r} L ${center + r} ${center} L ${center} ${center + r} L ${center - r} ${center} Z`;
      case "hexagon": {
        const pts = Array.from({ length: 6 }, (_, i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        });
        return `M ${pts.join(" L ")} Z`;
      }
      case "cross": {
        const t = r * 0.35;
        return `M ${center - t} ${center - r} L ${center + t} ${center - r} L ${center + t} ${center - t} L ${center + r} ${center - t} L ${center + r} ${center + t} L ${center + t} ${center + t} L ${center + t} ${center + r} L ${center - t} ${center + r} L ${center - t} ${center + t} L ${center - r} ${center + t} L ${center - r} ${center - t} L ${center - t} ${center - t} Z`;
      }
      case "star": {
        const outerR = r;
        const innerR = r * 0.45;
        const pts = Array.from({ length: 10 }, (_, i) => {
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const rad = i % 2 === 0 ? outerR : innerR;
          return `${center + rad * Math.cos(angle)},${center + rad * Math.sin(angle)}`;
        });
        return `M ${pts.join(" L ")} Z`;
      }
      case "triangle":
        return `M ${center} ${center - r} L ${center + r * 0.866} ${center + r * 0.5} L ${center - r * 0.866} ${center + r * 0.5} Z`;
      default:
        return "";
    }
  };

  // Badge size proportional to avatar
  const badgeSize = Math.max(14, Math.round(size * 0.28));
  const badgeOffset = Math.round(badgeSize * 0.15);

  if (photoUrl) {
    return (
      <div
        className={`relative shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={photoUrl}
          alt={`${seed} avatar`}
          className="w-full h-full object-cover"
          style={{ display: "block" }}
        />
        {isVerified && (
          <div
            className="absolute flex items-center justify-center rounded-full bg-yellow-400"
            style={{
              width: badgeSize,
              height: badgeSize,
              bottom: badgeOffset,
              right: badgeOffset,
              filter: "drop-shadow(0 0 4px #FFD700)",
              zIndex: 10,
            }}
          >
            <svg
              width={badgeSize * 0.6}
              height={badgeSize * 0.6}
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Verified"
            >
              <title>Verified</title>
              <path
                d="M2 6l3 3 5-5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`${seed} avatar`}
      >
        <title>{seed} avatar</title>
        <defs>
          <linearGradient
            id={`grad-${seed}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={primary} stopOpacity="0.2" />
            <stop offset="100%" stopColor={secondary} stopOpacity="0.2" />
          </linearGradient>
          <filter id={`glow-${seed}`}>
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect width={svgSize} height={svgSize} fill="#0d0d0d" />
        <rect width={svgSize} height={svgSize} fill={`url(#grad-${seed})`} />

        {/* Pattern lines */}
        {pattern === 0 && (
          <>
            <line
              x1="0"
              y1={svgSize * 0.33}
              x2={svgSize}
              y2={svgSize * 0.33}
              stroke={primary}
              strokeOpacity="0.15"
              strokeWidth="0.5"
            />
            <line
              x1="0"
              y1={svgSize * 0.66}
              x2={svgSize}
              y2={svgSize * 0.66}
              stroke={secondary}
              strokeOpacity="0.15"
              strokeWidth="0.5"
            />
          </>
        )}
        {pattern === 1 && (
          <>
            <line
              x1={svgSize * 0.33}
              y1="0"
              x2={svgSize * 0.33}
              y2={svgSize}
              stroke={primary}
              strokeOpacity="0.15"
              strokeWidth="0.5"
            />
            <line
              x1={svgSize * 0.66}
              y1="0"
              x2={svgSize * 0.66}
              y2={svgSize}
              stroke={secondary}
              strokeOpacity="0.15"
              strokeWidth="0.5"
            />
          </>
        )}
        {pattern === 2 && (
          <circle
            cx={center}
            cy={center}
            r={r * 1.2}
            fill="none"
            stroke={primary}
            strokeOpacity="0.15"
            strokeWidth="0.5"
          />
        )}

        {/* Main shape */}
        {shape === "circle" ? (
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke={primary}
            strokeWidth="1.5"
            filter={`url(#glow-${seed})`}
          />
        ) : (
          <path
            d={getShapePath()}
            fill="none"
            stroke={primary}
            strokeWidth="1.5"
            filter={`url(#glow-${seed})`}
          />
        )}

        {/* Inner accent */}
        <circle
          cx={center}
          cy={center}
          r={r * 0.3}
          fill={secondary}
          fillOpacity="0.3"
        />
        <circle
          cx={center}
          cy={center}
          r={r * 0.15}
          fill={secondary}
          fillOpacity="0.6"
        />

        {/* Initials */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fill={primary}
          fontSize={svgSize * 0.22}
          fontFamily="'Space Mono', monospace"
          fontWeight="bold"
          filter={`url(#glow-${seed})`}
        >
          {initials}
        </text>
      </svg>
      {/* Verified badge overlay on SVG avatar */}
      {isVerified && (
        <div
          className="absolute flex items-center justify-center rounded-full bg-yellow-400"
          style={{
            width: badgeSize,
            height: badgeSize,
            bottom: badgeOffset,
            right: badgeOffset,
            filter: "drop-shadow(0 0 4px #FFD700)",
            zIndex: 10,
          }}
        >
          <svg
            width={badgeSize * 0.6}
            height={badgeSize * 0.6}
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Verified"
          >
            <title>Verified</title>
            <path
              d="M2 6l3 3 5-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
