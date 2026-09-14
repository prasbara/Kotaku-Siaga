import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border border-[#e6e6e6] bg-white px-4 py-2.5 text-base text-[#1d1d1d] placeholder:text-[#696969]/60 focus-visible:outline-none focus-visible:border-[#4a154b] focus-visible:ring-2 focus-visible:ring-[#4a154b]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
