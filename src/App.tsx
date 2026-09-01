import { useState } from "react"
import { AuthProvider, useAuth } from "./app/context/AuthContext"
import { LoginForm } from "./app/components/auth/LoginForm"
import { Header } from "./app/components/layout/Header"
import { Sidebar } from "./app/components/layout/Sidebar"
import { KiranaChatbot } from "./app/components/chatbot/KiranaChatbot"

// Views
import { DashboardView } from "./app/components/views/DashboardView"
import { RealisasiAnggaranView } from "./app/components/RealisasiAnggaran/RealisasiAnggaranView"
import { SuratView } from "./app/components/views/SuratView"
import { ArsipView } from "./app/components/views/ArsipView"
import { PengaturanView } from "./app/components/views/PengaturanView"
import { FAQView } from "./app/components/views/FAQView"
import { ProfilView } from "./app/components/views/ProfilView"
import { AdminDashboardView } from "./app/components/views/AdminDashboardView"
import { KelolaUserView } from "./app/components/views/KelolaUserView"
import { BugReportView } from "./app/components/views/BugReportView"
import { ArsipAdminView } from "./app/components/views/ArsipAdminView"

function MainLayout() {
  const { isAuthenticated } = useAuth()

  // Theme state: default is "light"
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("ptp_kpu_theme") as "light" | "dark") || "light"
  })

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeMenu, setActiveMenu] = useState("dashboard")

  const toggleTheme = (newTheme?: "light" | "dark") => {
    const next = newTheme || (theme === "light" ? "dark" : "light")
    setTheme(next)
    localStorage.setItem("ptp_kpu_theme", next)
  }

  if (!isAuthenticated) {
    return <LoginForm theme={theme} onToggleTheme={() => toggleTheme()} />
  }

  const isDark = theme === "dark"

  const renderContent = () => {
    switch (activeMenu) {
      case "dashboard":
        return <DashboardView theme={theme} />
      case "realisasi_anggaran":
      case "realization-summary":
        return <RealisasiAnggaranView theme={theme} subTab="ringkasan" />
      case "realization-transactions":
        return <RealisasiAnggaranView theme={theme} subTab="transaksi" />
      case "realization-reports":
        return <RealisasiAnggaranView theme={theme} subTab="laporan" />
      case "realization-verification":
        return <RealisasiAnggaranView theme={theme} subTab="verifikasi" />
      case "surat":
      case "surat-summary":
        return <SuratView theme={theme} subTab="ringkasan" />
      case "surat-masuk":
        return <SuratView theme={theme} subTab="masuk" />
      case "surat-keluar":
        return <SuratView theme={theme} subTab="keluar" />
      case "surat-arsip":
      case "arsip":
        return <ArsipView theme={theme} />
      case "pengaturan":
        return <PengaturanView theme={theme} onToggleTheme={() => toggleTheme()} />
      case "faq":
        return <FAQView theme={theme} />
      case "profil":
        return <ProfilView theme={theme} />

      // Admin views
      case "admin_dashboard":
        return <AdminDashboardView theme={theme} />
      case "kelola_user":
        return <KelolaUserView theme={theme} />
      case "bug_report":
        return <BugReportView theme={theme} />
      case "arsip_admin":
        return <ArsipAdminView theme={theme} />

      default:
        return <DashboardView theme={theme} />
    }
  }

  return (
    <div
      className={`flex h-screen font-sans overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#080c14] text-gray-100" : "bg-slate-100 text-slate-900"
      }`}
    >
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeMenu={activeMenu}
        onSelectMenu={(id: string) => setActiveMenu(id)}
        theme={theme}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header theme={theme} onToggleTheme={() => toggleTheme()} />

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>

      {/* Chatbot KIRANA Agent (Floating Widget) */}
      <KiranaChatbot theme={theme} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  )
}
