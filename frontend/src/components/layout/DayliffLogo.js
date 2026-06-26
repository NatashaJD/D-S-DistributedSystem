/* Davis & Shirtliff Logo — SVG Recreation
   Full logo with icon + wordmark + tagline */

export function DayliffLogoFull({ height = 40 }) {
  return (
    <svg
      viewBox="0 0 280 72"
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Davis & Shirtliff"
    >
      {/* Icon Box */}
      <rect x="1" y="1" width="68" height="54" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="1.5"/>

      {/* D&S text inside box */}
      <text x="8" y="18" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="800" fill="#111827">D&amp;S</text>

      {/* Wave 1 (bottom) */}
      <path
        d="M4 42 Q12 36 20 40 Q28 44 36 40 Q44 36 52 40 Q60 44 66 40 L66 56 Q60 52 52 48 Q44 44 36 48 Q28 52 20 48 Q12 44 4 48 Z"
        fill="#0077CC"
        opacity="0.9"
      />
      {/* Wave 2 (middle) */}
      <path
        d="M4 34 Q12 28 20 32 Q28 36 36 32 Q44 28 52 32 Q60 36 66 32 L66 42 Q60 38 52 34 Q44 30 36 34 Q28 38 20 34 Q12 30 4 34 Z"
        fill="#0099DD"
        opacity="0.7"
      />
      {/* Wave 3 (top) */}
      <path
        d="M4 27 Q12 22 20 25 Q28 28 36 25 Q44 22 52 25 Q60 28 66 25 L66 34 Q60 30 52 27 Q44 24 36 27 Q28 30 20 27 Q12 24 4 27 Z"
        fill="#33B5E8"
        opacity="0.5"
      />

      {/* DAVIS & */}
      <text x="78" y="22" fontFamily="Arial Black, Arial, sans-serif" fontSize="18" fontWeight="900" fill="#EDF4FF" letterSpacing="0.5">DAVIS &amp;</text>
      {/* SHIRTLIFF */}
      <text x="78" y="42" fontFamily="Arial Black, Arial, sans-serif" fontSize="18" fontWeight="900" fill="#EDF4FF" letterSpacing="0.5">SHIRTLIFF</text>
      {/* Tagline */}
      <text x="79" y="57" fontFamily="Arial, sans-serif" fontSize="9.5" fontStyle="italic" fill="#7B9EC0" letterSpacing="0.2">
        know H₂Ow through experience
      </text>
    </svg>
  );
}

export function DayliffIcon({ size = 36 }) {
  return (
    <svg
      viewBox="0 0 70 56"
      width={size}
      height={size * 0.8}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="D&S"
    >
      <rect x="1" y="1" width="68" height="54" rx="6" fill="white" stroke="rgba(0,119,204,0.3)" strokeWidth="1.5"/>
      <text x="8" y="18" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="800" fill="#0B1220">D&amp;S</text>

      <path
        d="M4 42 Q12 36 20 40 Q28 44 36 40 Q44 36 52 40 Q60 44 66 40 L66 56 Q60 52 52 48 Q44 44 36 48 Q28 52 20 48 Q12 44 4 48 Z"
        fill="#0077CC"
      />
      <path
        d="M4 34 Q12 28 20 32 Q28 36 36 32 Q44 28 52 32 Q60 36 66 32 L66 42 Q60 38 52 34 Q44 30 36 34 Q28 38 20 34 Q12 30 4 34 Z"
        fill="#0099DD"
        opacity="0.75"
      />
      <path
        d="M4 27 Q12 22 20 25 Q28 28 36 25 Q44 22 52 25 Q60 28 66 25 L66 34 Q60 30 52 27 Q44 24 36 27 Q28 30 20 27 Q12 24 4 27 Z"
        fill="#33B5E8"
        opacity="0.5"
      />
    </svg>
  );
}
