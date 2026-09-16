import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "info" | "outline" | "draft" | "terkirim" | "diterima" | "diproses"
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  let variantStyles = "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 font-bold"

  if (variant === "terkirim" || variant === "success" || variant === "diterima") {
    variantStyles = "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border border-slate-700 dark:border-slate-300 font-bold shadow-xs"
  } else if (variant === "diproses" || variant === "info") {
    variantStyles = "bg-red-600 text-white border border-red-700 font-bold shadow-xs"
  } else if (variant === "warning") {
    variantStyles = "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30 font-bold"
  } else if (variant === "draft" || variant === "secondary") {
    variantStyles = "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-gray-200 border border-slate-300 dark:border-slate-700 font-bold"
  } else if (variant === "outline") {
    variantStyles = "bg-transparent text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-bold"
  }

  return (
    <div
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors font-mono ${variantStyles} ${className}`}
      {...props}
    />
  )
}
