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
      className={`h-16 border-b px-6 flex items-center justify-between backdrop-blur-md shrink-0 transition-colors duration-300 ${isDark
        ? "bg-[#0f172a]/85 border-white/10 text-white"
        : "bg-white/95 border-slate-200 text-black shadow-xs"
        }`}
    >
      {/* Search Bar on far left */}
      <div className="relative w-56 md:w-72">
        <Search
          className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-400" : "text-slate-600"
            }`}
        />
        <input
          type="text"
          placeholder="Cari dokumen, surat, jadwal..."
          className={`w-full rounded-lg pl-9 pr-3 h-9 text-xs font-medium transition-colors focus:outline-none focus:border-red-600 ${isDark
            ? "bg-[#0d1322] border border-[#1e293b] text-white placeholder-gray-400"
            : "bg-slate-50 border border-slate-300 text-black placeholder-slate-500 focus:bg-white"
            }`}
        />
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2.5">
        {/* Theme Switcher Quick Toggle */}
        <button
          onClick={onToggleTheme}
          className={`h-9 w-9 rounded-lg border transition-colors cursor-pointer flex items-center justify-center shrink-0 ${isDark
            ? "bg-[#0d1322] border-[#1e293b] text-white hover:text-red-400 hover:bg-[#1a233a]"
            : "bg-slate-50 border-slate-300 text-black hover:text-red-600 hover:bg-slate-100"
            }`}
          title={`Ganti ke ${isDark ? "Mode Terang" : "Mode Gelap"}`}
        >
          {isDark ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-black" />}
        </button>

        {/* Notification Icon */}
        <button
          className={`relative h-9 w-9 rounded-lg border transition-colors flex items-center justify-center shrink-0 ${isDark
            ? "border-[#1e293b] bg-[#0d1322] text-white hover:text-red-400"
            : "border-slate-300 bg-slate-50 text-black hover:text-red-600"
            }`}
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
        </button>

        {/* Divider */}
        <div className={`w-px h-6 mx-0.5 ${isDark ? "bg-[#1e293b]" : "bg-slate-200"}`} />

        {/* User Badge */}
        <div
          className={`flex items-center gap-2 pl-1 pr-3 h-9 rounded-lg border text-xs font-bold ${isDark
            ? "border-red-600/40 bg-red-950/30 text-white"
            : "border-red-200 bg-red-50 text-red-950"
            }`}
        >
          <div className="w-7 h-7 rounded-md bg-red-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-xs">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap">{currentUser?.name || "Pengguna"}</span>
            {userRole === "Admin" && (
              <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" />
                ADMIN
              </span>
            )}
          </div>
        </div>

        {/* Logout Button in Header */}
        <button
          onClick={logout}
          className={`h-9 w-9 rounded-lg border transition-colors cursor-pointer flex items-center justify-center shrink-0 ${isDark
            ? "border-[#1e293b] bg-[#0d1322] text-gray-300 hover:text-white hover:border-red-600 hover:bg-red-600"
            : "border-slate-300 bg-slate-50 text-slate-800 hover:text-white hover:border-red-600 hover:bg-red-600"
            }`}
          title="Keluar / Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
