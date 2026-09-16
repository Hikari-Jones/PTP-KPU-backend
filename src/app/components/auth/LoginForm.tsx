import React, { useState } from "react"
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldAlert,
  UserCheck,
  IdCard,
  FileText,
  Wallet,
  ShieldCheck,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

interface LoginFormProps {
  theme?: "light" | "dark"
  onToggleTheme?: () => void
}

export function LoginForm({ theme = "light", onToggleTheme }: LoginFormProps) {
  const { login } = useAuth()
  const [nip, setNip] = useState("199208052021011002")
  const [password, setPassword] = useState("123456")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isDark = theme === "dark"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    setTimeout(() => {
      const res = login(nip, password)
      setIsLoading(false)
      if (!res.success) {
        setErrorMessage(res.error || "NIP/Kata Sandi Tidak Valid")
      }
    }, 400)
  }

  const handleSelectDemo = (demoNip: string, demoPass: string) => {
    setNip(demoNip)
    setPassword(demoPass)
    setErrorMessage(null)
  }

  const handleNipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 18)
    setNip(digitsOnly)
  }

  const highlights = [
    { icon: FileText, text: "Surat-menyurat kedinasan terpusat & tertelusur" },
    { icon: Wallet, text: "Pemantauan realisasi anggaran secara real-time" },
    { icon: ShieldCheck, text: "Akses berbasis NIP dengan kendali peran pengguna" },
  ]

  const inputBase = isDark
    ? "bg-[#0d1322] border-[#1e293b] text-gray-100"
    : "bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:bg-white"

  return (
    <div
      className={`min-h-screen w-full flex font-sans transition-colors duration-300 ${
        isDark ? "bg-[#060a12] text-gray-100" : "bg-slate-100 text-slate-900"
      }`}
    >
      {/* Panel Kiri — Identitas Institusi */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative flex-col justify-between overflow-hidden bg-gradient-to-br from-[#3f0a0a] via-[#7f1d1d] to-red-800 text-white p-10 xl:p-14">
        <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-black/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 top-1/3 w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300" />

        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-md bg-white/10 border border-white/25 flex items-center justify-center font-black text-lg tracking-wide">
            KPU
          </div>
          <div className="leading-tight">
            <p className="font-bold text-sm tracking-wide">KOMISI PEMILIHAN UMUM</p>
            <p className="text-[11px] uppercase tracking-widest text-red-200/80">Provinsi Sulawesi Utara</p>
          </div>
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
              Platform Terpadu
              <br />
              Penunjang KPU
            </h1>
            <p className="mt-3 text-sm text-red-100/80 max-w-sm leading-relaxed">
              Portal internal resmi bagi Aparatur Sipil Negara dan personel Sekretariat KPU
              Sulawesi Utara untuk mendukung tata kelola administrasi kepemiluan.
            </p>
          </div>

          {/* Kartu identitas ringkas — menegaskan login berbasis NIP */}
          <div className="rounded-xl border border-white/15 bg-white/5 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/15 border border-amber-300/30 flex items-center justify-center shrink-0">
              <IdCard className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-red-50">Masuk dengan Identitas Kepegawaian</p>
              <p className="text-red-200/70 mt-0.5">Autentikasi menggunakan Nomor Induk Pegawai (NIP) resmi</p>
            </div>
          </div>

          <div className="space-y-3.5 border-t border-white/15 pt-6">
            {highlights.map((h, i) => {
              const Icon = h.icon
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-amber-300" />
                  </div>
                  <span className="text-xs font-medium text-red-50/90">{h.text}</span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="relative text-[10px] text-red-200/60 tracking-wide">
          &copy; {new Date().getFullYear()} Sekretariat KPU Provinsi Sulawesi Utara. Akses internal terbatas.
        </p>
      </div>

      {/* Panel Kanan — Form Login */}
      <div className={`flex-1 flex items-center justify-center p-6 sm:p-10 relative ${isDark ? "bg-[#060a12]" : "bg-white"}`}>


        <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-300">
          {/* Branding ringkas untuk layar kecil */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-md bg-red-700 flex items-center justify-center font-black text-white text-sm border border-red-500/40">
              KPU
            </div>
            <div className="leading-tight">
              <p className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>KPU Sulawesi Utara</p>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                Platform Terpadu Penunjang KPU
              </p>
            </div>
          </div>

          <div className="mb-7">
            <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Masuk ke Portal
            </h2>
            <p className={`text-xs mt-1.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              Gunakan Nomor Induk Pegawai (NIP) dan kata sandi kedinasan Anda.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in zoom-in-95">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          <div className={`mb-5 p-3 rounded-lg border text-xs space-y-1.5 ${isDark ? "border-[#1e293b] bg-[#0d1322]" : "border-slate-200 bg-slate-50"}`}>
            <span className={`font-bold text-[10px] uppercase tracking-wider block ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              Uji Coba Kredensial
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSelectDemo("198507182020031001", "admin123")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 cursor-pointer transition-all ${
                  nip === "198507182020031001"
                    ? "bg-red-600 text-white border-red-600"
                    : isDark
                    ? "border-[#1e293b] bg-[#111827] text-gray-300 hover:border-red-500/50"
                    : "border-slate-300 bg-white text-slate-700 hover:border-red-500/50"
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Role Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectDemo("199208052021011002", "123456")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 cursor-pointer transition-all ${
                  nip === "199208052021011002"
                    ? "bg-red-600 text-white border-red-600"
                    : isDark
                    ? "border-[#1e293b] bg-[#111827] text-gray-300 hover:border-red-500/50"
                    : "border-slate-300 bg-white text-slate-700 hover:border-red-500/50"
                }`}
              >
                <UserCheck className="w-3 h-3" />
                <span>Role Operator</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold block ${isDark ? "text-gray-300" : "text-slate-700"}`}>
                Nomor Induk Pegawai (NIP)
              </label>
              <div className="relative">
                <IdCard className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-500" : "text-slate-400"}`} />
                <Input
                  type="text"
                  inputMode="numeric"
                  required
                  value={nip}
                  onChange={handleNipChange}
                  placeholder="198507182020031001"
                  maxLength={18}
                  className={`pl-9 h-10 text-sm font-mono tracking-wide focus:border-red-500 ${inputBase}`}
                />
              </div>
              <p className={`text-[10px] ${isDark ? "text-gray-500" : "text-slate-400"}`}>18 digit sesuai kartu identitas pegawai</p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-semibold block ${isDark ? "text-gray-300" : "text-slate-700"}`}>
                  Kata Sandi
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => e.preventDefault()}
                  className="text-[11px] text-red-600 hover:text-red-500 hover:underline font-medium"
                >
                  Lupa sandi?
                </a>
              </div>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-500" : "text-slate-400"}`} />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`pl-9 pr-9 h-10 text-sm focus:border-red-500 ${inputBase}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-500 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className={`flex items-center gap-2 cursor-pointer text-xs ${isDark ? "text-gray-400" : "text-slate-600"}`}>
              <input type="checkbox" defaultChecked className="rounded border-slate-400 bg-white text-red-600 focus:ring-red-500" />
              <span>Ingat saya di perangkat ini</span>
            </label>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full btn-kpu-red text-white font-semibold h-10 rounded-lg flex items-center justify-center gap-2 text-sm transition-all mt-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Memverifikasi kredensial...</span>
              ) : (
                <>
                  <span>Masuk Portal Operasional</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className={`mt-6 text-[11px] text-center ${isDark ? "text-gray-500" : "text-slate-400"}`}>
            Akses hanya untuk personel terdaftar di Sekretariat KPU Provinsi Sulawesi Utara.
          </p>
        </div>
      </div>
    </div>
  )
}
