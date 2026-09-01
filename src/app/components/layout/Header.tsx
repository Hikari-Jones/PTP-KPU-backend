import { Search, Bell, User as UserIcon, LogOut, Sun, Moon, Shield } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

interface HeaderProps {
  theme: "light" | "dark"
  onToggleTheme: () => void
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const { currentUser, logout, userRole } = useAuth()
  const isDark = theme === "dark"

  return (
    <header
      className={`h-16 border-b-2 px-6 flex items-center justify-between backdrop-blur-sm shrink-0 transition-colors duration-300 ${
        isDark
          ? "bg-[#080c14]/80 border-red-600/25 text-gray-100"
          : "bg-white/90 border-red-600/15 text-slate-800 shadow-xs"
      }`}
    >
      {/* Search Bar on far left */}
      <div className="relative w-56 md:w-72">
        <Search
          className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
            isDark ? "text-gray-500" : "text-slate-400"
          }`}
        />
        <input
          type="text"
          placeholder="Cari dokumen, surat, jadwal..."
          className={`w-full rounded-lg pl-9 pr-3 h-9 text-xs transition-colors focus:outline-none focus:border-red-500 ${
            isDark
              ? "bg-[#0d1322] border border-[#1e293b] text-gray-200 placeholder-gray-500"
              : "bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white"
          }`}
        />
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2.5">
        {/* Theme Switcher Quick Toggle */}
        <button
          onClick={onToggleTheme}
          className={`h-9 w-9 rounded-lg border transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
            isDark
              ? "bg-[#0d1322] border-[#1e293b] text-amber-400 hover:text-amber-300 hover:bg-[#1a233a]"
              : "bg-slate-50 border-slate-300 text-slate-700 hover:text-red-600 hover:bg-slate-100"
          }`}
          title={`Ganti ke ${isDark ? "Mode Terang" : "Mode Gelap"}`}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notification Icon */}
        <button
          className={`relative h-9 w-9 rounded-lg border transition-colors flex items-center justify-center shrink-0 ${
            isDark
              ? "border-[#1e293b] bg-[#0d1322] text-gray-400 hover:text-white"
              : "border-slate-300 bg-slate-50 text-slate-600 hover:text-slate-900"
          }`}
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Divider */}
        <div className={`w-px h-6 mx-0.5 ${isDark ? "bg-[#1e293b]" : "bg-slate-200"}`} />

        {/* User Badge */}
        <div
          className={`flex items-center gap-2 pl-1 pr-3 h-9 rounded-lg border text-xs ${
            isDark
              ? "border-red-500/30 bg-red-950/20 text-gray-200"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${isDark ? "bg-red-600 text-white" : "bg-red-600 text-white"}`}>
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold whitespace-nowrap">{currentUser?.name || "Pengguna"}</span>
            {userRole === "Admin" && (
              <span className="bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" />
                ADMIN
              </span>
            )}
          </div>
        </div>

        {/* Logout Button in Header */}
        <button
          onClick={logout}
          className={`h-9 w-9 rounded-lg border transition-colors cursor-pointer flex items-center justify-center shrink-0 ${
            isDark
              ? "border-[#1e293b] bg-[#0d1322] text-gray-400 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/30"
              : "border-slate-300 bg-slate-50 text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
          }`}
          title="Keluar / Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
