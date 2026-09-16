interface HeaderProps {
  theme?: "light" | "dark"
  onToggleTheme?: () => void
}

export function Header({ theme }: HeaderProps) {
  const isDark = theme === "dark"

  return (
    <header
      className={`h-16 border-b px-6 flex items-center justify-between backdrop-blur-md shrink-0 transition-colors duration-300 ${isDark
        ? "bg-[#0f172a]/85 border-white/10 text-white"
        : "bg-white/95 border-slate-200 text-black shadow-xs"
        }`}
    >
      {/* Empty header - navigation moved to sidebar */}
      <div />
    </header>
  )
}
