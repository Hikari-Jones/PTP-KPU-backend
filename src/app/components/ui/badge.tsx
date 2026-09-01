import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "info" | "outline" | "draft" | "terkirim" | "diterima" | "diproses"
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  let variantStyles = "bg-red-500/10 text-red-400 border border-red-500/20"
  
  if (variant === "terkirim" || variant === "success") {
    variantStyles = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
  } else if (variant === "diterima" || variant === "info") {
    variantStyles = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
  } else if (variant === "diproses" || variant === "warning") {
    variantStyles = "bg-blue-500/15 text-blue-400 border border-blue-500/30"
  } else if (variant === "draft" || variant === "secondary") {
    variantStyles = "bg-gray-800 text-gray-400 border border-gray-700"
  } else if (variant === "outline") {
    variantStyles = "text-gray-300 border border-gray-700"
  }

  return (
    <div
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors font-mono ${variantStyles} ${className}`}
      {...props}
    />
  )
}
