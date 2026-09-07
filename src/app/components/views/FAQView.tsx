import { HelpCircle, ChevronDown } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { useState } from "react"

export function FAQView({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark"
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const faqs = [
    {
      q: "Apa fungsi utama Chatbot KIRANA Agent di PTP-KPU?",
      a: "KIRANA Agent adalah asisten AI cerdas yang dapat memproses draf Surat Dinas, Nota Dinas, Laporan Anggaran, Rekapitulasi Surat, dan Jadwal Kegiatan secara otomatis beserta file lampiran yang langsung bisa diunduh.",
    },
    {
      q: "Bagaimana cara mengunduh berkas draf dari KIRANA Agent?",
      a: "Klik tombol atau ketik nama dokumen di widget KIRANA (misal: [Surat Dinas]), KIRANA akan memberikan tanggapan beserta tombol 'Unduh' pada gelembung percakapan.",
    },
    {
      q: "Siapa saja yang dapat mengakses Menu Admin?",
      a: "Menu Admin secara dinamis hanya ditampilkan untuk pengguna dengan role 'Admin' (contoh: akun admin@kpu.go.id). Operator biasa hanya memiliki akses ke menu standar.",
    },
    {
      q: "Apakah data dokumen di PTP-KPU bersifat terenkripsi?",
      a: "Ya, seluruh arsip dan registrasi surat disimpan secara aman dengan otentikasi role-based access control.",
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-black"}`}>
          Pertanyaan Umum (FAQ)
        </h1>
        <p className={`text-xs mt-1 font-medium ${isDark ? "text-gray-300" : "text-slate-700"}`}>
          Panduan penggunaan sistem PTP-KPU Sulawesi Utara dan KIRANA Agent
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx
          return (
            <Card
              key={idx}
              className={`transition-colors cursor-pointer ${isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"
                }`}
              onClick={() => setOpenIdx(isOpen ? null : idx)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 w-full">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <h3 className={`text-sm font-bold my-0 leading-snug ${isDark ? "text-white" : "text-black"}`}>{faq.q}</h3>
                  </div>
                  <div className="shrink-0 flex items-center justify-center">
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-red-600" : "text-slate-500"}`} />
                  </div>
                </div>
                {isOpen && (
                  <p className={`mt-3 pt-3 border-t text-xs font-semibold leading-relaxed pl-12.5 ${isDark ? "border-[#1e293b] text-gray-200" : "border-slate-100 text-slate-800"}`}>
                    {faq.a}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
