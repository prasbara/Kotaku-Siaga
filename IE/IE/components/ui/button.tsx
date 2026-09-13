import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78716C] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 rounded-none shadow-none font-sans",
  {
    variants: {
      variant: {
        default:
          "bg-[#78716C] text-[#FAFAF9] border border-[#78716C] hover:bg-[#57534E] hover:border-[#57534E] active:bg-[#1C1917]",
        secondary:
          "bg-transparent text-[#78716C] border border-[#D6D3D1] hover:bg-[#F5F5F4] hover:text-[#1C1917]",
        outline:
          "border border-[#D6D3D1] bg-transparent text-[#1C1917] hover:bg-[#F5F5F4]",
        destructive:
          "bg-[#DC2626] text-[#FAFAF9] border border-[#DC2626] hover:bg-[#B91C1C]",
        ghost:
          "text-[#57534E] hover:bg-[#F5F5F4] hover:text-[#1C1917]",
        link:
          "text-[#78716C] underline-offset-4 hover:underline p-0 h-auto",
        warning:
          "bg-[#CA8A04] text-[#FAFAF9] border border-[#CA8A04] hover:bg-[#A16207]",
        critical:
          "bg-[#DC2626] text-[#FAFAF9] border border-[#DC2626] hover:bg-[#B91C1C]",
      },
      size: {
        default: "h-12 px-6 py-3", // 12px 24px
        sm: "h-9 px-3.5 py-1.5 text-xs",
        lg: "h-14 px-8 py-3.5 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="inline-block animate-spin mr-1.5">●</span>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
