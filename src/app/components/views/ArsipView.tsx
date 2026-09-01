import { Search, FileText, Download } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { Input } from "../ui/input"

export function ArsipView({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark"

  const archives = [
    { id: "ARS-2026-001", name: "Dokumen Penetapan DPT Provinsi Sulut 2026", size: "4.2 MB", category: "DPT & Pemilih", date: "01 Aug 2026" },
    { id: "ARS-2026-002", name: "SK Pembentukan Kelompok PPK & PPS Minahasa", size: "1.8 MB", category: "SK & Regulatori", date: "28 Jul 2026" },
    { id: "ARS-2026-003", name: "Laporan Pertanggungjawaban Anggaran Q2", size: "12.5 MB", category: "Keuangan", date: "15 Jul 2026" },
    { id: "ARS-2026-004", name: "Berita Acara Rapat Koordinasi Bawaslu-KPU", size: "2.1 MB", category: "Berita Acara", date: "10 Jul 2026" },
    { id: "ARS-2026-005", name: "Desain Maskot & Alat Peraga Sosialisasi", size: "28.4 MB", category: "Sosialisasi", date: "02 Jul 2026" },
  ]

  const handleDownload = (name: string) => {
    const blob = new Blob([`ARSIP DIGITAL PTP-KPU SULUT\nNama Dokumen: ${name}\nTanggal Verifikasi: 6 Agustus 2026\nStatus: Otentik & Terverifikasi Security Token`], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${name.replace(/\s+/g, "_")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
          Pusat Arsip Dokumen Digital
        </h1>
        <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          Penyimpanan dan verifikasi berkas otentik KPU Sulawesi Utara
        </p>
      </div>

      <Card className={isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}>
        <CardContent className="p-4">
          <div className="relative w-full md:w-96">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-400" : "text-slate-400"}`} />
            <Input
              placeholder="Cari berdasarkan kode atau nama dokumen..."
              className={`pl-9 text-xs ${isDark ? "bg-[#111827] border-[#1e293b]" : "bg-slate-50 border-slate-300"}`}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {archives.map((item) => (
          <Card
            key={item.id}
            className={`transition-all hover:scale-[1.01] ${
              isDark ? "bg-[#0d1322] border-[#1e293b] hover:border-red-500/40" : "bg-white border-slate-200 shadow-sm hover:border-red-300"
            }`}
          >
            <CardContent className="p-5 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-red-500">{item.id}</span>
                    <span className="text-[9px] px-2 py-0.2 rounded bg-slate-500/10 text-slate-400 font-medium">{item.category}</span>
                  </div>
                  <h3 className={`text-xs font-bold mt-1 leading-snug truncate ${isDark ? "text-white" : "text-slate-900"}`}>{item.name}</h3>
                  <p className={`text-[10px] mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                    {item.size} • Diarsip {item.date}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownload(item.name)}
                className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer shrink-0"
                title="Unduh Arsip"
              >
                <Download className="w-4 h-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
