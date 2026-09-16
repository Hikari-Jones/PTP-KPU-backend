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
          <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-black"}`}>
            Arsip Admin & Cadangan Sistem
          </h1>
          <p className={`text-xs mt-1 font-medium ${isDark ? "text-gray-300" : "text-slate-700"}`}>
            Manajemen backup database berkala dan arsip terenkripsi tingkat administrator
          </p>
        </div>
        <button className="btn-kpu-red px-4 py-2 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shrink-0 transition-all active:scale-95">
          <RefreshCw className="w-4 h-4" />
          <span>Jalankan Backup Sekarang</span>
        </button>
      </div>

      <div className="space-y-3">
        {backups.map((item) => (
          <Card key={item.id} className={isDark ? "bg-[#0d1322] border-white/10" : "bg-white border-slate-200 shadow-sm"}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>{item.id}</h3>
                  <p className={`text-[10px] font-semibold mt-0.5 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                    {item.type} • {item.size}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
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
                  className="btn-kpu-red p-2.5 rounded-xl text-white text-xs cursor-pointer transition-all active:scale-95"
                  title="Unduh Backup SQL"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
