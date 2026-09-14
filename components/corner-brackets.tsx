/**
 * Four viewfinder-style corner brackets, framing whatever sits inside the
 * relatively-positioned parent. Reinforces the "lens sighting a target"
 * concept from the empty state instead of a plain dashed dropzone box.
 */
export function CornerBrackets({ active = false }: { active?: boolean }) {
  const arm = 22
  const stroke = active ? 'stroke-accent' : 'stroke-border-strong'
  const base =
    'pointer-events-none absolute h-6 w-6 transition-colors duration-200 motion-reduce:transition-none'

  return (
    <>
      <svg className={`${base} -top-3 -left-3 ${stroke}`} viewBox="0 0 24 24" aria-hidden="true">
        <path d={`M2 ${arm}V2H${arm}`} fill="none" strokeWidth="2" />
      </svg>
      <svg className={`${base} -top-3 -right-3 ${stroke}`} viewBox="0 0 24 24" aria-hidden="true">
        <path d={`M${24 - arm} 2H22V${arm}`} fill="none" strokeWidth="2" />
      </svg>
      <svg className={`${base} -bottom-3 -left-3 ${stroke}`} viewBox="0 0 24 24" aria-hidden="true">
        <path d={`M2 ${24 - arm}V22H${arm}`} fill="none" strokeWidth="2" />
      </svg>
      <svg className={`${base} -bottom-3 -right-3 ${stroke}`} viewBox="0 0 24 24" aria-hidden="true">
        <path d={`M${24 - arm} 22H22V${24 - arm}`} fill="none" strokeWidth="2" />
      </svg>
    </>
  )
}
