import { Bug } from "lucide-react"
import { Card, CardContent } from "../ui/card"

export function BugReportView({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark"

  const reports = [
    { id: "BUG-101", title: "Format tanggal pada export CSV rekap surat perlu penyesuaian ISO", priority: "Sedang", status: "Selesai", reportedBy: "Ahmad K.", date: "05 Aug 2026" },
    { id: "BUG-102", title: "Gagal memuat preview PDF pada browser layar kecil", priority: "Tinggi", status: "Diproses", reportedBy: "Siti R.", date: "04 Aug 2026" },
    { id: "BUG-103", title: "Respons bot KIRANA sedikit terlambat pada perintah jadwal", priority: "Rendah", status: "Terbuka", reportedBy: "Budi S.", date: "02 Aug 2026" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
          Laporan Kendala System & Bug
        </h1>
        <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          Monitoring isu teknis dan feedback pengguna terhadap aplikasi PTP-KPU
        </p>
      </div>

      <div className="space-y-3">
        {reports.map((bug) => (
          <Card key={bug.id} className={isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <Bug className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-red-500">{bug.id}</span>
                    <span className="text-[10px] font-semibold text-amber-500">Prioritas: {bug.priority}</span>
                  </div>
                  <h3 className={`text-xs font-bold mt-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>{bug.title}</h3>
                  <p className={`text-[10px] mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                    Dilaporkan oleh {bug.reportedBy} • {bug.date}
                  </p>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${bug.status === "Selesai" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                {bug.status}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
