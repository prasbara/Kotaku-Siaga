import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[90px] border px-3 py-1 text-xs font-semibold tracking-wide transition-colors gap-1.5",
  {
    variants: {
      variant: {
        // Default Neutral
        default: "border-[#e6e6e6] bg-[#f4ede4] text-[#1d1d1d]",
        secondary: "border-[#eddcf7] bg-[#f9f0ff] text-[#4a154b]",
        outline: "border-[#e6e6e6] bg-transparent text-[#1d1d1d]",
        // Aubergine Brand
        primary: "border-[#481a54] bg-[#4a154b] text-white",
        // Urgency
        rendah: "border-[#e6e6e6] bg-[#f4ede4] text-[#696969]",
        sedang: "border-[#fef3c7] bg-[#fffbeb] text-[#b45309]",
        tinggi: "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]",
        kritis: "border-[#fecaca] bg-[#fef2f2] text-[#cc4117] font-bold",
        // Status Workflow
        submitted: "border-[#eddcf7] bg-[#f9f0ff] text-[#4a154b]",
        under_review: "border-[#fef3c7] bg-[#fffbeb] text-[#b45309]",
        verified: "border-[#d1fae5] bg-[#ecfdf5] text-[#007a5a] font-bold",
        in_progress: "border-[#bfdbfe] bg-[#eff6ff] text-[#1264a3]",
        resolved: "border-[#d1fae5] bg-[#007a5a] text-white font-bold",
        rejected: "border-[#fecaca] bg-[#fef2f2] text-[#cc4117]",
        suspicious: "border-[#fecaca] bg-[#fff1f2] text-[#be123c] font-bold",
        duplicate: "border-[#e6e6e6] bg-[#f5f5f5] text-[#737373]",
        destructive: "border-[#fecaca] bg-[#cc4117] text-white font-bold",
        success: "border-[#d1fae5] bg-[#007a5a] text-white font-bold",
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
