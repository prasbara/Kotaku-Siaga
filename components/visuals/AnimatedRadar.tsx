'use client'

import React from 'react'

interface AnimatedRadarProps {
  className?: string
  size?: number | string
}

export function AnimatedRadar({ className = 'w-full max-w-sm aspect-square', size }: AnimatedRadarProps) {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={size ? { width: size, height: size } : undefined}>
      <svg
        fill="none"
        height="100%"
        viewBox="0 0 400 400"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >
        <defs>
          <radialGradient cx="50%" cy="50%" id="radarScanGrad" r="50%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#0284C7" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#082F49" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="coastalWave" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#0EA5E9" />
          </linearGradient>
          <filter height="140%" id="radarSoftGlow" width="140%" x="-20%" y="-20%">
            <feGaussianBlur result="blur" stdDeviation="4" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <style>{`
          @keyframes radarSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes blipPulse {
            0%, 100% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.6); opacity: 0.3; }
          }
          .radar-beam {
            transform-origin: 200px 200px;
            animation: radarSpin 6s linear infinite;
          }
          .target-blip-1 {
            animation: blipPulse 2s ease-in-out infinite;
            transform-origin: 270px 140px;
          }
          .target-blip-2 {
            animation: blipPulse 2.5s ease-in-out infinite 0.7s;
            transform-origin: 130px 260px;
          }
        `}</style>

        {/* Concentric distance rings */}
        <circle cx="200" cy="200" r="180" stroke="#0E7490" strokeDasharray="4 6" strokeWidth="1" opacity="0.4" />
        <circle cx="200" cy="200" r="130" stroke="#06B6D4" strokeDasharray="2 4" strokeWidth="1" opacity="0.5" />
        <circle cx="200" cy="200" r="80" stroke="#22D3EE" strokeWidth="1" opacity="0.6" />
        <circle cx="200" cy="200" r="30" stroke="#22D3EE" strokeWidth="1.5" opacity="0.8" />

        {/* Crosshair coordinate axes */}
        <line stroke="#0891B2" strokeDasharray="2 4" strokeWidth="1" x1="20" x2="380" y1="200" y2="200" opacity="0.5" />
        <line stroke="#0891B2" strokeDasharray="2 4" strokeWidth="1" x1="200" x2="200" y1="20" y2="380" opacity="0.5" />

        {/* Rotating radar scan beam sweep */}
        <g className="radar-beam">
          <path
            d="M 200 200 L 380 200 A 180 180 0 0 0 270 45 Z"
            fill="url(#radarScanGrad)"
          />
          <line
            stroke="#67E8F9"
            strokeWidth="2"
            x1="200"
            x2="380"
            y1="200"
            y2="200"
            filter="url(#radarSoftGlow)"
          />
        </g>

        {/* Real-time telemetry targets */}
        <g className="target-blip-1">
          <circle cx="270" cy="140" fill="#EF4444" r="5" filter="url(#radarSoftGlow)" />
          <circle cx="270" cy="140" fill="none" stroke="#EF4444" strokeWidth="1.5" r="9" opacity="0.7" />
        </g>

        <g className="target-blip-2">
          <circle cx="130" cy="260" fill="#F59E0B" r="4.5" filter="url(#radarSoftGlow)" />
          <circle cx="130" cy="260" fill="none" stroke="#F59E0B" strokeWidth="1.5" r="8" opacity="0.7" />
        </g>

        {/* Center pivot point */}
        <circle cx="200" cy="200" fill="#22D3EE" r="4" filter="url(#radarSoftGlow)" />
        <circle cx="200" cy="200" fill="#082F49" r="2" />
      </svg>
    </div>
  )
}
