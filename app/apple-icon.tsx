import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#12181A',
          borderRadius: 38,
        }}
      >
        <svg width="180" height="180" viewBox="0 0 32 32" fill="none">
          <path d="M7 7H21V21H7V7Z" stroke="#EEF1EF" strokeWidth="2.25" strokeLinejoin="round" />
          <path d="M7 14H21" stroke="#EEF1EF" strokeWidth="2.25" />
          <path d="M14 7V21" stroke="#EEF1EF" strokeWidth="2.25" />
          <circle cx="21" cy="21" r="6.5" fill="#12181A" stroke="#0FB39F" strokeWidth="2.25" />
          <path d="M25.6 25.6L29 29" stroke="#0FB39F" strokeWidth="2.25" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
