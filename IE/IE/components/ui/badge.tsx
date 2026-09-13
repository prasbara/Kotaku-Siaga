import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-none border px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border-[#E7E5E4] bg-[#F5F5F4] text-[#1C1917]",
        secondary: "border-[#E7E5E4] bg-[#EFEDEB] text-[#57534E]",
        destructive: "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]",
        outline: "border-[#D6D3D1] bg-transparent text-[#1C1917]",
        rendah: "border-[#E7E5E4] bg-[#F5F5F4] text-[#57534E]",
        sedang: "border-[#E7E5E4] bg-[#F5F5F4] text-[#78716C]",
        tinggi: "border-[#CA8A04] bg-[#CA8A04]/10 text-[#CA8A04]",
        kritis: "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]",
        submitted: "border-[#E7E5E4] bg-[#F5F5F4] text-[#57534E]",
        under_review: "border-[#D6D3D1] bg-[#F5F5F4] text-[#57534E]",
        verified: "border-[#78716C] bg-[#EFEDEB] text-[#1C1917]",
        in_progress: "border-[#CA8A04] bg-[#CA8A04]/10 text-[#CA8A04]",
        resolved: "border-[#65A30D] bg-[#65A30D]/10 text-[#65A30D]",
        rejected: "border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626]",
        duplicate: "border-[#E7E5E4] bg-[#F5F5F4] text-[#A8A29E]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
