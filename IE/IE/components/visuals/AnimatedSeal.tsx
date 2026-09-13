'use client'

import React from 'react'

interface AnimatedSealProps {
  className?: string
}

export function AnimatedSeal({ className = 'w-14 h-14' }: AnimatedSealProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <circle cx="50" cy="50" r="46" stroke="#4cd7f6" strokeWidth="2" strokeDasharray="4 2" className="animate-spin" style={{ animationDuration: '20s' }} />
        <circle cx="50" cy="50" r="41" fill="#141c29" stroke="#4edea3" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="33" fill="#0c1421" stroke="#ffb95f" strokeWidth="1" />
        
        {/* Semarang Civic Emblem Representation */}
        <path d="M50 24L62 38H38L50 24Z" fill="#ffb95f" />
        <path d="M42 42H58V62H42V42Z" fill="#4cd7f6" opacity="0.8" />
        <path d="M36 64H64L50 78L36 64Z" fill="#4edea3" />
        <circle cx="50" cy="52" r="6" fill="#ffffff" />
      </svg>
    </div>
  )
}
