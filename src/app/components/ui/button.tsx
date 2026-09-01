import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "danger"
  size?: "default" | "sm" | "lg" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    let variantStyles = "bg-[#dc2626] text-white hover:bg-[#b91c1c]"
    if (variant === "outline") variantStyles = "border border-[#1e293b] bg-transparent hover:bg-[#1e293b] text-gray-200"
    if (variant === "secondary") variantStyles = "bg-[#1e293b] text-gray-200 hover:bg-[#334155]"
    if (variant === "ghost") variantStyles = "hover:bg-[#1e293b]/60 text-gray-300 hover:text-white"
    if (variant === "danger") variantStyles = "bg-red-600 text-white hover:bg-red-700"

    let sizeStyles = "h-9 px-4 py-2 text-sm"
    if (size === "sm") sizeStyles = "h-8 rounded-md px-3 text-xs"
    if (size === "lg") sizeStyles = "h-10 rounded-md px-8 text-base"
    if (size === "icon") sizeStyles = "h-9 w-9 p-0 flex items-center justify-center rounded-lg"

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer rounded-lg ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
