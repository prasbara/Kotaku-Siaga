'use client'

import React, { useRef, useEffect, KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react'

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  autoFocus?: boolean
  onComplete?: (code: string) => void
  className?: string
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
  onComplete,
  className = '',
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Ensure digits array matches length
  const digits = Array.from({ length }, (_, i) => value[i] || '')

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus, disabled])

  const handleInputChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '')
    if (!rawVal) {
      // Emptying the current box
      const newDigits = [...digits]
      newDigits[index] = ''
      const newVal = newDigits.join('')
      onChange(newVal)
      return
    }

    // If typing single digit
    const digit = rawVal.slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    const newVal = newDigits.join('')
    onChange(newVal)

    // Auto-focus next input if available
    if (index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus()
      inputRefs.current[index + 1]?.select()
    }

    if (newVal.length === length && onComplete) {
      onComplete(newVal)
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Current box is empty, move to previous box and clear it
        const newDigits = [...digits]
        newDigits[index - 1] = ''
        const newVal = newDigits.join('')
        onChange(newVal)
        inputRefs.current[index - 1]?.focus()
        inputRefs.current[index - 1]?.select()
        e.preventDefault()
      } else if (digits[index]) {
        // Clear current box
        const newDigits = [...digits]
        newDigits[index] = ''
        const newVal = newDigits.join('')
        onChange(newVal)
        e.preventDefault()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
      inputRefs.current[index - 1]?.select()
      e.preventDefault()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
      inputRefs.current[index + 1]?.select()
      e.preventDefault()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pastedData) return

    onChange(pastedData)

    // Focus on the next empty box or the last box
    const focusIndex = Math.min(pastedData.length, length - 1)
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex]?.focus()
      inputRefs.current[focusIndex]?.select()
    }

    if (pastedData.length === length && onComplete) {
      onComplete(pastedData)
    }
  }

  return (
    <div className={`flex items-center gap-2 sm:gap-3 justify-center ${className}`}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digits[i] || ''}
          onChange={(e) => handleInputChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit OTP ${i + 1}`}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center font-mono text-xl font-bold rounded-xl border-2 transition-all duration-150 outline-none
            ${
              digits[i]
                ? 'border-[#4a154b] bg-white text-[#4a154b] shadow-xs'
                : 'border-[#d0c8be] bg-[#fcfaf7] text-[#1d1d1d] hover:border-[#4a154b]/50'
            }
            focus:border-[#4a154b] focus:bg-white focus:ring-2 focus:ring-[#4a154b]/20
            disabled:opacity-50 disabled:bg-[#f3f0ea] disabled:cursor-not-allowed
          `}
        />
      ))}
    </div>
  )
}
