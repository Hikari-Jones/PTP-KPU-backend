import { Download, ShieldCheck, HardDrive, RefreshCw } from "lucide-react"
import { Card, CardContent } from "../ui/card"

export function ArsipAdminView({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark"

  const backups = [
    { id: "BACKUP-2026-08-05", size: "1.42 GB", type: "Full Database Dump", status: "Terverifikasi" },
    { id: "BACKUP-2026-08-01", size: "1.38 GB", type: "Full Database Dump", status: "Terverifikasi" },
    { id: "BACKUP-2026-07-25", size: "1.25 GB", type: "Full Database Dump", status: "Terverifikasi" },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
            Arsip Admin & Cadangan Sistem
          </h1>
          <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
            Manajemen backup database berkala dan arsip terenkripsi tingkat administrator
          </p>
        </div>
        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer shrink-0">
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
          <span>Jalankan Backup Sekarang</span>
        </button>
      </div>

      <div className="space-y-3">
        {backups.map((item) => (
          <Card key={item.id} className={isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{item.id}</h3>
                  <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                    {item.type} • {item.size}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {item.status}
                </span>
                <button
                  onClick={() => {
                    const blob = new Blob([`ADMIN DUMP BACKUP FILE: ${item.id}`], { type: "text/plain" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `${item.id}.sql`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }}
                  className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs cursor-pointer"
                  title="Unduh Backup SQL"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
