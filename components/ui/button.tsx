import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a154b] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 font-sans select-none min-h-[48px]",
  {
    variants: {
      variant: {
        // Primary: #4a154b, white, padding 14px 28px, border-radius 90px, font-weight 700, pressed #611f69
        default:
          "bg-[#4a154b] text-white hover:bg-[#481a54] active:bg-[#611f69] font-bold rounded-[90px] shadow-sm hover:shadow active:scale-[0.98]",
        primary:
          "bg-[#4a154b] text-white hover:bg-[#481a54] active:bg-[#611f69] font-bold rounded-[90px] shadow-sm hover:shadow active:scale-[0.98]",
        // Secondary: #f9f0ff, #1d1d1d, padding 10px 30px, border-radius 90px
        secondary:
          "bg-[#f9f0ff] text-[#1d1d1d] hover:bg-[#eedcfc] active:bg-[#e4caf7] font-semibold rounded-[90px] border border-[#e6e6e6]/50 active:scale-[0.98]",
        // Outline: white, #4a154b, 2px solid #4a154b, border-radius 90px
        outline:
          "bg-white text-[#4a154b] border-2 border-[#4a154b] hover:bg-[#f9f0ff] font-bold rounded-[90px] active:scale-[0.98]",
        // Destructive / Emergency: #cc4117
        destructive:
          "bg-[#cc4117] text-white hover:bg-[#b03713] active:bg-[#992e0e] font-bold rounded-[90px] shadow-sm active:scale-[0.98]",
        // Success / Resolved: #007a5a
        success:
          "bg-[#007a5a] text-white hover:bg-[#00664b] active:bg-[#00543d] font-bold rounded-[90px] shadow-sm active:scale-[0.98]",
        ghost:
          "text-[#1d1d1d] hover:bg-[#f9f0ff] hover:text-[#4a154b] rounded-[90px]",
        link:
          "text-[#1264a3] hover:text-[#3860be] underline-offset-4 hover:underline p-0 min-h-0 h-auto font-medium",
      },
      size: {
        default: "min-h-[48px] px-7 py-3.5 text-sm", // 14px 28px standard
        sm: "min-h-[40px] px-4 py-2 text-xs",
        lg: "min-h-[52px] px-8 py-4 text-base",
        icon: "h-12 w-12 min-h-[48px] min-w-[48px] p-0 rounded-full",
        "icon-sm": "h-9 w-9 min-h-[36px] min-w-[36px] p-0 rounded-full",
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
          <span className="inline-block animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
