import { Users, Server, Activity, Database, Shield } from "lucide-react"
import { Card, CardContent } from "../ui/card"

export function AdminDashboardView({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark"

  const systemStats = [
    { title: "Pengguna Aktif", val: "28 Operator", icon: Users, color: "text-blue-500 bg-blue-500/10" },
    { title: "Status Server", val: "99.9% Online", icon: Server, color: "text-emerald-500 bg-emerald-500/10" },
    { title: "Kirim KIRANA Bot", val: "142 Query/Hari", icon: Activity, color: "text-amber-500 bg-amber-500/10" },
    { title: "Total Database", val: "1.4 GB", icon: Database, color: "text-purple-500 bg-purple-500/10" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
            Dashboard Administrator
          </h1>
        </div>
        <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          Panel kontrol pusat pengawasan infrastruktur dan akun pengguna Sistem Informasi KPU Sulut
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats.map((item, idx) => {
          const Icon = item.icon
          return (
            <Card key={idx} className={isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className={`text-[10px] uppercase font-bold ${isDark ? "text-gray-400" : "text-slate-500"}`}>{item.title}</p>
                  <h3 className={`text-lg font-extrabold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{item.val}</h3>
                </div>
                <div className={`p-3 rounded-xl ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Admin Audit Log */}
      <Card className={isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}>
        <div className={`p-4 border-b ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
          <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Audit Log Sistem Terkini</h3>
        </div>
        <CardContent className="p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-red-500/20 bg-red-500/5">
            <span className="font-medium text-red-500">[ADMIN] Sesi login baru dideteksi dari IP 180.252.12.9</span>
            <span className="text-[10px] text-gray-400">10:55 WITA</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-500/20 bg-slate-500/5">
            <span className="font-medium">[SYSTEM] Backup database otomatis selesai disimpan</span>
            <span className="text-[10px] text-gray-400">06:00 WITA</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-500/20 bg-slate-500/5">
            <span className="font-medium">[BOT] KIRANA Agent memproses 45 draf dokumen otomatis</span>
            <span className="text-[10px] text-gray-400">Kemarin</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
