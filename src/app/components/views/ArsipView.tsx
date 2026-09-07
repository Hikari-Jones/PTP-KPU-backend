import { Search, FileText, Download, ShieldCheck } from "lucide-react"
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
        <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-black"}`}>
          Pusat Arsip Dokumen Digital
        </h1>
        <p className={`text-xs mt-1 font-medium ${isDark ? "text-gray-300" : "text-slate-700"}`}>
          Penyimpanan dan verifikasi berkas otentik KPU Sulawesi Utara
        </p>
      </div>

      <Card className={isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}>
        <CardContent className="p-4">
          <div className="relative w-full md:w-96">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-400" : "text-slate-600"}`} />
            <Input
              placeholder="Cari berdasarkan kode atau nama dokumen..."
              className={`pl-9 text-xs font-medium ${isDark ? "bg-[#111827] border-[#1e293b] text-white" : "bg-slate-50 border-slate-300 text-black placeholder-slate-500"}`}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {archives.map((item) => (
          <Card
            key={item.id}
            className={`transition-all hover:scale-[1.01] ${isDark ? "bg-[#0d1322] border-[#1e293b] hover:border-red-500/40" : "bg-white border-slate-200 shadow-sm hover:border-red-400"
              }`}
          >
            <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-3 rounded-xl bg-red-600 text-white shrink-0 shadow-sm flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-extrabold text-red-600 dark:text-red-400">{item.id}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${isDark ? "bg-slate-800 text-gray-200 border border-slate-700" : "bg-slate-100 text-slate-800 border border-slate-300"}`}>
                      {item.category}
                    </span>
                  </div>
                  <h3 className={`text-xs font-bold mt-1 leading-snug truncate ${isDark ? "text-white" : "text-black"}`}>
                    {item.name}
                  </h3>
                  <div className={`text-[10px] font-semibold mt-1 flex items-center gap-1.5 ${isDark ? "text-gray-300" : "text-slate-700"}`}>
                    <span>{item.size}</span>
                    <span>•</span>
                    <span>Diarsip {item.date}</span>
                    <span>•</span>
                    <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3" /> Terverifikasi
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDownload(item.name)}
                className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shrink-0 shadow-md shadow-red-600/20 active:scale-95 flex items-center justify-center"
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
