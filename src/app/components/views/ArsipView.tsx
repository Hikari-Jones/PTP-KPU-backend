import { useState, useRef } from "react"
import {
  Search,
  FileText,
  Download,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  X,
  FolderOpen,
  Lock,
  Globe,
  FileArchive,
  Trash2,
  AlertTriangle,
  EyeOff,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────
interface ArsipItem {
  id: string
  name: string
  nomor: string
  size: string
  category: string
  kode: string
  tipe: string
  event: string
  subBagian: string
  tahun: number
  bulan: number
  date: string
  akses: "publik" | "internal" | "terbatas"
  uploadedBy: string
  uploadedAt: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_ARSIP: ArsipItem[] = [
  {
    id: "ARS-001",
    name: "DPT Final Pilgub Sulut 2024.pdf",
    nomor: "001/TK/KPU-SU/I/2025",
    size: "48.2 MB",
    category: "Laporan",
    kode: "TK",
    tipe: "Laporan",
    event: "Pilgub 2024",
    subBagian: "Data & Informasi",
    tahun: 2025,
    bulan: 1,
    date: "15 Jan 2025",
    akses: "terbatas",
    uploadedBy: "Ahmad Kurniawan",
    uploadedAt: "15 Jan 2025 · 08:14",
  },
  {
    id: "ARS-002",
    name: "APBD KPU Sulut 2025.xlsx",
    nomor: "001/KU/KPU-SU/II/2025",
    size: "2.1 MB",
    category: "Operasional 2025",
    kode: "KU",
    tipe: "Laporan",
    event: "Operasional 2025",
    subBagian: "Keuangan",
    tahun: 2025,
    bulan: 2,
    date: "03 Feb 2025",
    akses: "terbatas",
    uploadedBy: "Dr. Meity Tinangon, S.H.",
    uploadedAt: "03 Feb 2025 · 10:30",
  },
  {
    id: "ARS-003",
    name: "Rekap Hasil Pilbup Minahasa Utara.pdf",
    nomor: "002/TK/KPU-SU/XI/2024",
    size: "12.8 MB",
    category: "Laporan",
    kode: "TK",
    tipe: "Laporan",
    event: "Pilkada 2024",
    subBagian: "Data & Informasi",
    tahun: 2024,
    bulan: 11,
    date: "20 Nov 2024",
    akses: "publik",
    uploadedBy: "Ahmad Kurniawan",
    uploadedAt: "20 Nov 2024 · 15:05",
  },
  {
    id: "ARS-004",
    name: "SK Pembentukan PPK Se-Sulut 2024.pdf",
    nomor: "001/HK/KPU-SU/III/2024",
    size: "896 KB",
    category: "SK",
    kode: "HK",
    tipe: "SK",
    event: "Pileg 2024",
    subBagian: "Hukum",
    tahun: 2024,
    bulan: 3,
    date: "10 Mar 2024",
    akses: "publik",
    uploadedBy: "Rendra Saputra",
    uploadedAt: "10 Mar 2024 · 08:47",
  },
  {
    id: "ARS-005",
    name: "Laporan Pertanggungjawaban Anggaran Q2.pdf",
    nomor: "002/KU/KPU-SU/VII/2025",
    size: "12.5 MB",
    category: "Keuangan",
    kode: "KU",
    tipe: "Laporan",
    event: "Operasional 2025",
    subBagian: "Keuangan",
    tahun: 2025,
    bulan: 7,
    date: "15 Jul 2025",
    akses: "internal",
    uploadedBy: "Dr. Meity Tinangon, S.H.",
    uploadedAt: "15 Jul 2025 · 14:22",
  },
  {
    id: "ARS-006",
    name: "Berita Acara Rapat Koordinasi Bawaslu-KPU.pdf",
    nomor: "003/TK/KPU-SU/VII/2025",
    size: "2.1 MB",
    category: "Berita Acara",
    kode: "TK",
    tipe: "Berita Acara",
    event: "Operasional 2025",
    subBagian: "Teknis",
    tahun: 2025,
    bulan: 7,
    date: "10 Jul 2025",
    akses: "publik",
    uploadedBy: "Ahmad Kurniawan",
    uploadedAt: "10 Jul 2025 · 09:00",
  },
  {
    id: "ARS-007",
    name: "Desain Maskot Sosialisasi Pilkada 2026.pdf",
    nomor: "001/SO/KPU-SU/VIII/2025",
    size: "28.4 MB",
    category: "Sosialisasi",
    kode: "SO",
    tipe: "Dokumen",
    event: "Pilkada 2026",
    subBagian: "Sosialisasi",
    tahun: 2025,
    bulan: 8,
    date: "02 Agu 2025",
    akses: "internal",
    uploadedBy: "Rendra Saputra",
    uploadedAt: "02 Agu 2025 · 11:45",
  },
  {
    id: "ARS-008",
    name: "Regulasi Pemutakhiran DPT Pilkada 2026.pdf",
    nomor: "001/HK/KPU-SU/I/2026",
    size: "3.7 MB",
    category: "Regulasi",
    kode: "HK",
    tipe: "Regulasi",
    event: "Pilkada 2026",
    subBagian: "Hukum",
    tahun: 2026,
    bulan: 1,
    date: "05 Jan 2026",
    akses: "publik",
    uploadedBy: "Rendra Saputra",
    uploadedAt: "05 Jan 2026 · 10:00",
  },
]

const TAHUN_LIST = [2026, 2025, 2024]
const BULAN_LIST = [
  { label: "Jan", val: 1 }, { label: "Feb", val: 2 }, { label: "Mar", val: 3 },
  { label: "Apr", val: 4 }, { label: "Mei", val: 5 }, { label: "Jun", val: 6 },
  { label: "Jul", val: 7 }, { label: "Agt", val: 8 }, { label: "Sep", val: 9 },
  { label: "Okt", val: 10 }, { label: "Nov", val: 11 }, { label: "Des", val: 12 },
]
const EVENT_LIST = ["Operasional 2025", "Operasional 2026", "Pileg 2024", "Pilgub 2024", "Pilkada 2024", "Pilkada 2026"]
const SUBBAGIAN_LIST = ["Data & Informasi", "Hukum", "Keuangan", "Sosialisasi", "Teknis"]

type AksesType = "publik" | "internal" | "terbatas"

const AKSES_DARK: Record<AksesType, { bg: string; text: string; icon: typeof Globe }> = {
  publik: { bg: "bg-emerald-600/20 border-emerald-500/30", text: "text-emerald-400", icon: Globe },
  internal: { bg: "bg-amber-600/20 border-amber-500/30", text: "text-amber-400", icon: EyeOff },
  terbatas: { bg: "bg-red-600/20 border-red-500/30", text: "text-red-400", icon: Lock },
}
const AKSES_LIGHT: Record<AksesType, { bg: string; text: string }> = {
  publik: { bg: "bg-emerald-50 border-emerald-300", text: "text-emerald-700" },
  internal: { bg: "bg-amber-50 border-amber-300", text: "text-amber-700" },
  terbatas: { bg: "bg-red-50 border-red-300", text: "text-red-700" },
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UnggahDokumenModal({
  open,
  onClose,
  onSubmit,
  theme,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (item: ArsipItem) => void
  theme: "light" | "dark"
}) {
  const isDark = theme === "dark"
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState("")
  const [namaDokumen, setNamaDokumen] = useState("")
  const [nomorDokumen, setNomorDokumen] = useState("001/TK/KPU-SU/IX/2026")
  const [kode, setKode] = useState("TK")
  const [tipe, setTipe] = useState("Laporan")
  const [event, setEvent] = useState("Operasional 2026")
  const [kategori, setKategori] = useState("Regulasi")
  const [akses, setAkses] = useState<AksesType>("internal")

  const handleFile = (f: File) => setFileName(f.name)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = () => {
    if (!namaDokumen) return
    const now = new Date()
    const m = now.getMonth()
    const bulanNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]
    const newItem: ArsipItem = {
      id: `ARS-${Date.now()}`,
      name: fileName || namaDokumen,
      nomor: nomorDokumen,
      size: "—",
      category: kategori,
      kode,
      tipe,
      event,
      subBagian: "Teknis",
      tahun: now.getFullYear(),
      bulan: m + 1,
      date: `${now.getDate().toString().padStart(2, "0")} ${bulanNames[m]} ${now.getFullYear()}`,
      akses,
      uploadedBy: "Pengguna Aktif",
      uploadedAt: `${now.getDate().toString().padStart(2, "0")} ${bulanNames[m]} ${now.getFullYear()}`,
    }
    onSubmit(newItem)
    setNamaDokumen("")
    setFileName("")
    onClose()
  }

  if (!open) return null

  const inputCls = `w-full px-3 py-2 rounded-lg text-xs font-medium border outline-none transition-colors ${
    isDark
      ? "bg-[#111827] border-[#1e293b] text-white placeholder-gray-500 focus:border-red-500/50"
      : "bg-slate-50 border-slate-300 text-black placeholder-slate-400 focus:border-red-400"
  }`
  const labelCls = `block text-[11px] font-bold uppercase tracking-wide mb-1 ${isDark ? "text-gray-300" : "text-slate-600"}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full max-w-lg rounded-2xl border shadow-2xl z-10 overflow-hidden ${isDark ? "bg-[#1e293b]/95 border-white/10" : "bg-white border-slate-200"}`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-red-600 text-white"><Upload className="w-4 h-4" /></div>
            <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>Unggah Dokumen Baru</h2>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? "hover:bg-[#1e293b] text-gray-400 hover:text-white" : "hover:bg-slate-100 text-slate-500"}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Drop Zone */}
          <div>
            <label className={labelCls}>Pilih File <span className="text-red-500">*</span></label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 cursor-pointer transition-all ${
                dragOver ? "border-red-500 bg-red-500/10" : isDark ? "border-[#1e293b] hover:border-red-500/40 bg-[#111827]/50" : "border-slate-300 hover:border-red-400 bg-slate-50"
              }`}
            >
              <FolderOpen className={`w-8 h-8 ${isDark ? "text-gray-500" : "text-slate-400"}`} />
              <div className="text-center">
                <p className={`text-xs font-semibold ${isDark ? "text-gray-300" : "text-slate-600"}`}>{fileName || "Klik untuk memilih file"}</p>
                <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-500" : "text-slate-400"}`}>PDF, XLSX, DOCX, SQL — maks. 500 MB</p>
              </div>
              <input ref={fileRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          </div>

          {/* Nama Dokumen */}
          <div>
            <label className={labelCls}>Nama Dokumen <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="Contoh: Laporan Keuangan Q2 2026.pdf" value={namaDokumen} onChange={e => setNamaDokumen(e.target.value)} />
          </div>

          {/* Nomor */}
          <div>
            <label className={labelCls}>Nomor Surat / Dokumen <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="081/TK/KPU-SU/VI/2026" value={nomorDokumen} onChange={e => setNomorDokumen(e.target.value)} />
          </div>

          {/* Kode & Tipe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Kode Surat <span className="text-red-500">*</span></label>
              <select className={inputCls} value={kode} onChange={e => setKode(e.target.value)}>
                {["TK", "KU", "HK", "SO", "UM"].map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipe Surat <span className="text-red-500">*</span></label>
              <select className={inputCls} value={tipe} onChange={e => setTipe(e.target.value)}>
                {["Laporan", "SK", "Berita Acara", "Regulasi", "Dokumen"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Event & Kategori */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Event <span className="text-red-500">*</span></label>
              <select className={inputCls} value={event} onChange={e => setEvent(e.target.value)}>
                {EVENT_LIST.map(ev => <option key={ev}>{ev}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Kategori <span className="text-red-500">*</span></label>
              <select className={inputCls} value={kategori} onChange={e => setKategori(e.target.value)}>
                {["Regulasi", "Laporan", "SK", "Berita Acara", "Sosialisasi", "Keuangan"].map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
          </div>

          {/* Level Akses */}
          <div>
            <label className={labelCls}>Level Akses <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {(["publik", "internal", "terbatas"] as AksesType[]).map(a => (
                <button key={a} type="button" onClick={() => setAkses(a)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold border capitalize transition-all cursor-pointer ${
                    akses === a ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20"
                    : isDark ? "bg-[#111827] border-[#1e293b] text-gray-400 hover:border-red-500/30"
                    : "bg-slate-50 border-slate-300 text-slate-600 hover:border-red-400"
                  }`}>
                  {a.charAt(0).toUpperCase() + a.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {akses === "terbatas" && (
            <div className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${isDark ? "bg-amber-950/20 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-300 text-amber-800"}`}>
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Dokumen terbatas hanya dapat diakses oleh sub bagian pemilik atau Administrator.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
          <button onClick={onClose} className={`px-5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${isDark ? "border-[#1e293b] text-gray-300 hover:bg-[#1e293b]" : "border-slate-300 text-slate-600 hover:bg-slate-100"}`}>
            Batal
          </button>
          <button onClick={handleSubmit} disabled={!namaDokumen}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer active:scale-95">
            <Upload className="w-3.5 h-3.5" />
            + Unggah Dokumen
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ArsipView ───────────────────────────────────────────────────────────
export function ArsipView({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark"
  const [arsipList, setArsipList] = useState<ArsipItem[]>(MOCK_ARSIP)
  const [search, setSearch] = useState("")
  const [showFilter, setShowFilter] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [filterTahun, setFilterTahun] = useState<number[]>([])
  const [filterBulan, setFilterBulan] = useState<number[]>([])
  const [filterEvent, setFilterEvent] = useState<string[]>([])
  const [filterSubBagian, setFilterSubBagian] = useState<string[]>([])

  const toggleArr = <T,>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const filtered = arsipList.filter(d => {
    const q = search.toLowerCase()
    return (
      (!q || d.name.toLowerCase().includes(q) || d.nomor.toLowerCase().includes(q)) &&
      (!filterTahun.length || filterTahun.includes(d.tahun)) &&
      (!filterBulan.length || filterBulan.includes(d.bulan)) &&
      (!filterEvent.length || filterEvent.includes(d.event)) &&
      (!filterSubBagian.length || filterSubBagian.includes(d.subBagian))
    )
  })

  const handleDownload = (name: string) => {
    const blob = new Blob([`ARSIP DIGITAL PTP-KPU SULUT\nNama: ${name}\nStatus: Otentik & Terverifikasi`], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${name.replace(/\s+/g, "_")}.txt`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const hasActiveFilters = filterTahun.length || filterBulan.length || filterEvent.length || filterSubBagian.length

  const filterBtnCls = (active: boolean) =>
    `px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
      active ? "bg-red-600 text-white border-red-600 shadow-sm"
      : isDark ? "bg-[#111827] text-gray-400 border-[#1e293b] hover:border-red-500/30 hover:text-white"
      : "bg-white text-slate-600 border-slate-300 hover:border-red-400 hover:text-red-600"
    }`

  const sectionLbl = `text-[9px] font-extrabold uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-slate-400"}`

  return (
    <div className="space-y-0 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-black"}`}>Arsip Data</h1>
          <p className={`text-xs mt-1 font-medium ${isDark ? "text-gray-300" : "text-slate-700"}`}>
            Repositori dokumen resmi KPU Sulawesi Utara · {arsipList.length} dokumen
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/25 transition-all cursor-pointer active:scale-95"
        >
          <Upload className="w-3.5 h-3.5" />
          + Unggah Dokumen
        </button>
      </div>

      {/* Info Banner */}
      <div className={`flex items-start gap-3 p-3 rounded-xl border text-xs mb-5 ${isDark ? "bg-amber-950/20 border-amber-500/20 text-amber-200" : "bg-amber-50 border-amber-300 text-amber-800"}`}>
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          Arsip <strong>Publik</strong> dan <strong>Internal</strong> dapat diakses semua sub bagian.
          Arsip <strong>Terbatas</strong> hanya dapat diakses oleh sub bagian pemilik dokumen atau Administrator.
        </span>
      </div>

      {/* Layout */}
      <div className="flex gap-5 items-start">
        {/* Sidebar Filter */}
        {showFilter && (
          <aside className={`w-44 shrink-0 rounded-2xl border p-4 space-y-5 ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg`}>
            <div className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-slate-500"}`}>Filter</div>

            {/* Search */}
            <div className="relative">
              <Search className={`w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-500" : "text-slate-400"}`} />
              <input
                placeholder="Cari nama, nomor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-7 pr-2 py-1.5 rounded-lg text-[10px] font-medium border outline-none transition-colors ${isDark ? "bg-[#111827] border-[#1e293b] text-white placeholder-gray-600 focus:border-red-500/40" : "bg-slate-50 border-slate-300 text-black placeholder-slate-400 focus:border-red-400"}`}
              />
            </div>

            {/* Tahun */}
            <div>
              <div className={sectionLbl}>Tahun</div>
              <div className="flex flex-wrap gap-1.5">
                {TAHUN_LIST.map(t => (
                  <button key={t} onClick={() => setFilterTahun(p => toggleArr(p, t))} className={filterBtnCls(filterTahun.includes(t))}>{t}</button>
                ))}
              </div>
            </div>

            {/* Bulan */}
            <div>
              <div className={sectionLbl}>Bulan</div>
              <div className="grid grid-cols-3 gap-1">
                {BULAN_LIST.map(b => (
                  <button key={b.val} onClick={() => setFilterBulan(p => toggleArr(p, b.val))} className={filterBtnCls(filterBulan.includes(b.val))}>{b.label}</button>
                ))}
              </div>
            </div>

            {/* Event */}
            <div>
              <div className={sectionLbl}>Event</div>
              <div className="space-y-1">
                {EVENT_LIST.map(ev => (
                  <button key={ev} onClick={() => setFilterEvent(p => toggleArr(p, ev))}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                      filterEvent.includes(ev) ? "bg-red-600 text-white border-red-600"
                      : isDark ? "bg-[#111827] text-gray-400 border-[#1e293b] hover:border-red-500/30 hover:text-white"
                      : "bg-white text-slate-600 border-slate-200 hover:border-red-400 hover:text-red-600"
                    }`}>
                    {ev}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub Bagian */}
            <div>
              <div className={sectionLbl}>Sub Bagian</div>
              <div className="space-y-1">
                {SUBBAGIAN_LIST.map(sb => (
                  <button key={sb} onClick={() => setFilterSubBagian(p => toggleArr(p, sb))}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                      filterSubBagian.includes(sb) ? "bg-red-600 text-white border-red-600"
                      : isDark ? "bg-[#111827] text-gray-400 border-[#1e293b] hover:border-red-500/30 hover:text-white"
                      : "bg-white text-slate-600 border-slate-200 hover:border-red-400 hover:text-red-600"
                    }`}>
                    {sb}
                  </button>
                ))}
              </div>
            </div>

            {!!hasActiveFilters && (
              <button
                onClick={() => { setFilterTahun([]); setFilterBulan([]); setFilterEvent([]); setFilterSubBagian([]) }}
                className={`w-full py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${isDark ? "border-red-500/20 text-red-400 hover:bg-red-950/30" : "border-red-300 text-red-600 hover:bg-red-50"}`}>
                Reset Filter
              </button>
            )}
          </aside>
        )}

        {/* Document List */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border mb-4 ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg`}>
            <button
              onClick={() => setShowFilter(p => !p)}
              className={`flex items-center gap-1.5 text-[11px] font-bold transition-colors cursor-pointer ${isDark ? "text-gray-400 hover:text-white" : "text-slate-600 hover:text-black"}`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showFilter ? "Sembunyikan Filter" : "Tampilkan Filter"}
            </button>
            <span className={`text-[11px] font-semibold ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              {filtered.length} dari {arsipList.length} dokumen
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border ${isDark ? "bg-[#1e293b]/70 border-white/10 text-gray-500" : "bg-white/85 border-slate-200 text-slate-400"} backdrop-blur-md shadow-lg`}>
                <FileArchive className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-semibold">Tidak ada dokumen ditemukan</p>
                <p className="text-xs mt-1">Coba ubah filter atau kata pencarian</p>
              </div>
            ) : (
              filtered.map(doc => {
                const darkA = AKSES_DARK[doc.akses]
                const lightA = AKSES_LIGHT[doc.akses]
                const AksesIcon = darkA.icon
                return (
                  <div key={doc.id} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-md ${isDark ? "bg-[#1e293b]/70 border-white/10 hover:border-white/25" : "bg-white/85 border-slate-200 hover:border-red-300 shadow-sm"} backdrop-blur-md shadow-lg`}>
                    <div className="p-2.5 rounded-xl bg-red-600 text-white shrink-0 shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-mono text-[10px] font-extrabold ${isDark ? "text-gray-400" : "text-slate-500"}`}>{doc.nomor}</span>
                        {[doc.kode, doc.tipe, doc.event].map(tag => (
                          <span key={tag} className={`px-2 py-0.5 rounded text-[9px] font-bold border ${isDark ? "bg-slate-800 text-gray-200 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-300"}`}>{tag}</span>
                        ))}
                      </div>
                      <h3 className={`text-xs font-bold leading-snug truncate ${isDark ? "text-white" : "text-black"}`}>{doc.name}</h3>
                      <div className={`flex items-center gap-2 mt-1.5 text-[10px] font-semibold flex-wrap ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                        <span>{doc.date}</span><span>·</span><span>{doc.size}</span><span>·</span>
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-red-500" />
                          Diunggah oleh <span className={`font-bold ${isDark ? "text-red-400" : "text-red-600"}`}>{doc.uploadedBy}</span>
                        </span>
                        <span>·</span><span>{doc.uploadedAt}</span>
                      </div>
                      {doc.akses === "terbatas" && (
                        <div className={`flex items-center gap-1 mt-2 text-[10px] font-semibold ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                          <AlertTriangle className="w-3 h-3" />
                          Akses terbatas — hanya untuk sub bagian {doc.subBagian}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${isDark ? "bg-slate-800 text-gray-200" : "bg-slate-100 text-slate-700"}`}>
                        {doc.kode}
                      </div>
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border capitalize ${isDark ? `${darkA.bg} ${darkA.text}` : `${lightA.bg} ${lightA.text}`}`}>
                        <AksesIcon className="w-3 h-3" />{doc.akses}
                      </span>
                      <button onClick={() => handleDownload(doc.name)} title="Unduh" className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer active:scale-95">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setArsipList(p => p.filter(x => x.id !== doc.id))} title="Hapus"
                        className={`p-2 rounded-lg border transition-all cursor-pointer active:scale-95 ${isDark ? "border-[#1e293b] text-gray-500 hover:border-red-500/40 hover:text-red-400 hover:bg-red-950/20" : "border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600 hover:bg-red-50"}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <UnggahDokumenModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSubmit={item => setArsipList(p => [item, ...p])} theme={theme} />
    </div>
  )
}
