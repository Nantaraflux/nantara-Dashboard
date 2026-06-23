import React from 'react'

export default function Spinner({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
    >
      <circle cx="12" cy="12" r="10" stroke="#1F2D40" strokeWidth="3" />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="#0F6E56"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
