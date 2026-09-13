import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-none border border-[#D6D3D1] bg-[#FAFAF9] px-4 py-2 text-base text-[#1C1917] placeholder:text-[#A8A29E] focus-visible:outline-none focus-visible:border-[#78716C] focus-visible:ring-2 focus-visible:ring-[#78716C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAF9] disabled:cursor-not-allowed disabled:opacity-50 transition-colors font-sans",
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
