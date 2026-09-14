type LensMarkProps = {
  size?: number
  className?: string
  /** Fill behind the lens circle, so it "clears" the grid lines it sits over. */
  background?: string
}

/**
 * Original mark for CSV Lens: a spreadsheet's corner grid merged with a
 * loupe. The circle sights the bottom-right cell, and the handle exits the
 * frame like a magnifier lifted off the page. Pure stroke geometry so it
 * stays crisp from 16px favicons up to 512px marketing use.
 */
export function LensMark({ size = 24, className, background = 'var(--color-bg, #eef1ef)' }: LensMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 4H20V20H4V4Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2.25" />
      <path d="M12 4V20" stroke="currentColor" strokeWidth="2.25" />
      <circle
        cx="20"
        cy="20"
        r="7"
        fill={background}
        stroke="currentColor"
        strokeWidth="2.25"
      />
      <path
        d="M25 25L29.5 29.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  )
}
