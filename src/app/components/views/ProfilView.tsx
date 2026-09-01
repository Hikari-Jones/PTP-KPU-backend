import { Building, Award, IdCard } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { Card, CardContent } from "../ui/card"
import { Avatar, AvatarFallback } from "../ui/avatar"

export function ProfilView({ theme }: { theme: "light" | "dark" }) {
  const { currentUser, userRole } = useAuth()
  const isDark = theme === "dark"

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AK"

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-1 border-b border-red-600/20">
        <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
          Profil Pengguna
        </h1>
        <p className={`text-xs mt-1 pb-3 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          Informasi identitas dan wewenang pengguna terdaftar di KPU Sulut
        </p>
      </div>

      <Card className={`border-l-4 border-l-red-600 ${isDark ? "bg-[#0d1322] border-y-[#1e293b] border-r-[#1e293b]" : "bg-white border-y-slate-200 border-r-slate-200 shadow-sm"}`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 border-2 border-red-600 shadow-xl">
              <AvatarFallback className="bg-red-700 text-white font-extrabold text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h2 className={`text-xl font-extrabold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {currentUser?.name || "Ahmad Kurniawan"}
                </h2>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-red-600 text-white shadow-xs">
                  {userRole}
                </span>
              </div>
              <p className={`text-xs font-mono tracking-wide ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                NIP {currentUser?.nip || "199208052021011002"}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs">
                <div className={`flex items-center gap-1.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                  <IdCard className="w-4 h-4 text-red-500" />
                  <span>{currentUser?.jabatan || "Staf Bidang Teknis Penyelenggaraan"}</span>
                </div>
                <div className={`flex items-center gap-1.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                  <Building className="w-4 h-4 text-red-500" />
                  <span>KPU Provinsi Sulawesi Utara</span>
                </div>
                <div className={`flex items-center gap-1.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>{currentUser?.subbagian || "Teknis Penyelenggaraan Pemilu"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
