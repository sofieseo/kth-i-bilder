interface VintageMagnifierProps {
  className?: string;
  size?: number;
}

/**
 * Old-fashioned magnifying glass: yellowed/aged glass lens with a black handle.
 * Used in loading states to match the paper/lightbox aesthetic.
 */
export function VintageMagnifier({ className, size = 40 }: VintageMagnifierProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {/* Handle (black, thick, slightly tapered) */}
      <line
        x1="40"
        y1="40"
        x2="58"
        y2="58"
        stroke="#1a1208"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Handle grip ring */}
      <circle cx="56" cy="56" r="4" fill="#1a1208" />
      {/* Outer brass/black ring */}
      <circle cx="26" cy="26" r="20" fill="none" stroke="#1a1208" strokeWidth="4" />
      {/* Inner aged glass */}
      <circle cx="26" cy="26" r="17" fill="#f4f1ea" fillOpacity="0.92" />
      {/* Subtle highlight on glass */}
      <path
        d="M14 20 Q18 12 28 12"
        stroke="#ffffff"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}
