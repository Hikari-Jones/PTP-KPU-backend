import { useState, useRef, useEffect } from "react"
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
  EyeOff,
  Minus,
  Loader2,
} from "lucide-react"
import { fetchArsip, fetchFilterOptions, uploadArsip } from "../../../services/api"

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
    name: "DPT Final Pemilihan Gubernur & Wakil Gubernur Sulut 2024.pdf",
    nomor: "001/PD/KPU-SU/I/2025",
    size: "48.2 MB",
    category: "Laporan",
    kode: "PD",
    tipe: "Laporan",
    event: "Pilgub 2024",
    subBagian: "PERDATIN",
    tahun: 2025,
    bulan: 1,
    date: "15 Jan 2025",
    akses: "terbatas",
    uploadedBy: "Ahmad Kurniawan",
    uploadedAt: "15 Jan 2025 · 08:14",
  },
  {
    id: "ARS-002",
    name: "RKA-K/L & DIPA APBD KPU Sulut 2025.xlsx",
    nomor: "001/KU/KPU-SU/II/2025",
    size: "2.1 MB",
    category: "Keuangan",
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
    name: "Rekapitulasi Hasil Penghitungan Suara Pilkada Sulut.pdf",
    nomor: "002/TK/KPU-SU/XI/2024",
    size: "12.8 MB",
    category: "Laporan",
    kode: "TK",
    tipe: "Laporan",
    event: "Pilkada 2024",
    subBagian: "Teknis",
    tahun: 2024,
    bulan: 11,
    date: "20 Nov 2024",
    akses: "publik",
    uploadedBy: "Ahmad Kurniawan",
    uploadedAt: "20 Nov 2024 · 15:05",
  },
  {
    id: "ARS-004",
    name: "SK Pembentukan Sekretariat PPK & PPS Se-Sulut 2024.pdf",
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
    name: "Laporan Pertanggungjawaban Realisasi Anggaran Q2.pdf",
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
    name: "Berita Acara Rapat Koordinasi & Pleno KPU-Bawaslu.pdf",
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
    name: "Daftar Inventaris BMN & Logistik Sarana Gedung.xlsx",
    nomor: "001/UM/KPU-SU/VIII/2025",
    size: "28.4 MB",
    category: "Logistik",
    kode: "UM",
    tipe: "Dokumen",
    event: "Operasional 2025",
    subBagian: "UMLOG",
    tahun: 2025,
    bulan: 8,
    date: "02 Agu 2025",
    akses: "internal",
    uploadedBy: "Rendra Saputra",
    uploadedAt: "02 Agu 2025 · 11:45",
  },
  {
    id: "ARS-008",
    name: "Regulasi & SOP Penanganan Pelanggaran Administrasi.pdf",
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
  {
    id: "ARS-009",
    name: "Rekapitulasi Penilaian Prestasi Kerja Pegawai 2025.pdf",
    nomor: "001/SDM/KPU-SU/XII/2025",
    size: "4.3 MB",
    category: "Kepegawaian",
    kode: "SDM",
    tipe: "Laporan",
    event: "Operasional 2025",
    subBagian: "SDM",
    tahun: 2025,
    bulan: 12,
    date: "28 Des 2025",
    akses: "internal",
    uploadedBy: "Ahmad Kurniawan",
    uploadedAt: "28 Des 2025 · 16:30",
  },
  {
    id: "ARS-010",
    name: "Master Database Pemilih Berkelanjutan (PDPB) 2026.xlsx",
    nomor: "002/PD/KPU-SU/II/2026",
    size: "35.8 MB",
    category: "Data Pemilih",
    kode: "PD",
    tipe: "Laporan",
    event: "Operasional 2026",
    subBagian: "PERDATIN",
    tahun: 2026,
    bulan: 2,
    date: "14 Feb 2026",
    akses: "terbatas",
    uploadedBy: "Ahmad Kurniawan",
    uploadedAt: "14 Feb 2026 · 11:15",
  },
  {
    id: "ARS-011",
    name: "Berita Acara Distribusi Logistik Kotak & Surat Suara.pdf",
    nomor: "002/UM/KPU-SU/XI/2024",
    size: "6.2 MB",
    category: "Logistik",
    kode: "UM",
    tipe: "Berita Acara",
    event: "Pilgub 2024",
    subBagian: "UMLOG",
    tahun: 2024,
    bulan: 11,
    date: "22 Nov 2024",
    akses: "publik",
    uploadedBy: "Rendra Saputra",
    uploadedAt: "22 Nov 2024 · 13:40",
  },
  {
    id: "ARS-012",
    name: "SK Penetapan Tim Seleksi & Badan Adhoc Pemilihan.pdf",
    nomor: "002/SDM/KPU-SU/IV/2024",
    size: "1.9 MB",
    category: "SK",
    kode: "SDM",
    tipe: "SK",
    event: "Pileg 2024",
    subBagian: "SDM",
    tahun: 2024,
    bulan: 4,
    date: "18 Apr 2024",
    akses: "publik",
    uploadedBy: "Dr. Meity Tinangon, S.H.",
    uploadedAt: "18 Apr 2024 · 09:20",
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
const SUBBAGIAN_LIST = ["SDM", "PERDATIN", "Teknis", "Hukum", "Keuangan", "UMLOG"]

type AksesType = "publik" | "internal" | "terbatas"

const AKSES_DARK: Record<AksesType, { bg: string; text: string; icon: typeof Globe }> = {
  publik: { bg: "bg-white/10 border-white/20", text: "text-white", icon: Globe },
  internal: { bg: "bg-neutral-800 border-neutral-700", text: "text-gray-200", icon: EyeOff },
  terbatas: { bg: "bg-red-600 text-white border-red-600 shadow-xs shadow-red-600/30", text: "text-white", icon: Lock },
}
const AKSES_LIGHT: Record<AksesType, { bg: string; text: string }> = {
  publik: { bg: "bg-white border-slate-300 shadow-xs", text: "text-slate-800" },
  internal: { bg: "bg-slate-900 border-slate-900", text: "text-white" },
  terbatas: { bg: "bg-red-600 border-red-600 text-white shadow-xs shadow-red-600/20", text: "text-white" },
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
  onSubmit: () => void
  theme: "light" | "dark"
}) {
  const isDark = theme === "dark"
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState("")
  const [namaDokumen, setNamaDokumen] = useState("")
  const [nomorDokumen, setNomorDokumen] = useState("001/TK/KPU-SU/IX/2026")
  const [subBagian, setSubBagian] = useState("PERDATIN")
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

  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async () => {
    if (!namaDokumen) return
    setIsUploading(true)
    const now = new Date()

    const payload = {
      nama_dokumen: namaDokumen,
      nomor_dokumen: nomorDokumen,
      id_pegawai: 1,
      id_klasifikasi: 1,
      kategori: kategori,
      event: event,
      tanggal_dokumen: now.toISOString().split("T")[0],
      ukuran_file: fileRef.current?.files?.[0]?.size || 0,
      hak_akses: akses
    }

    const created = await uploadArsip(payload)
    setIsUploading(false)

    if (created) {
      onSubmit()
      setNamaDokumen("")
      setFileName("")
      onClose()
    } else {
      alert("Gagal mengunggah dokumen.")
    }
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

          {/* Sub Bagian & Kode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Sub Bagian <span className="text-red-500">*</span></label>
              <select className={inputCls} value={subBagian} onChange={e => setSubBagian(e.target.value)}>
                {SUBBAGIAN_LIST.map(sb => <option key={sb} value={sb}>{sb}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Kode Surat <span className="text-red-500">*</span></label>
              <select className={inputCls} value={kode} onChange={e => setKode(e.target.value)}>
                {["TK", "KU", "HK", "SDM", "PD", "UM"].map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>

          {/* Tipe & Kategori */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tipe Surat <span className="text-red-500">*</span></label>
              <select className={inputCls} value={tipe} onChange={e => setTipe(e.target.value)}>
                {["Laporan", "SK", "Berita Acara", "Regulasi", "Dokumen"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Kategori <span className="text-red-500">*</span></label>
              <select className={inputCls} value={kategori} onChange={e => setKategori(e.target.value)}>
                {["Regulasi", "Laporan", "SK", "Berita Acara", "Keuangan", "Logistik", "Kepegawaian", "Data Pemilih"].map(k => <option key={k}>{k}</option>)}
              </select>
            </div>
          </div>

          {/* Event */}
          <div>
            <label className={labelCls}>Event <span className="text-red-500">*</span></label>
            <select className={inputCls} value={event} onChange={e => setEvent(e.target.value)}>
              {EVENT_LIST.map(ev => <option key={ev}>{ev}</option>)}
            </select>
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
            <div className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${isDark ? "bg-red-950/30 border-red-500/30 text-red-300" : "bg-red-50 border-red-200 text-red-700"}`}>
              <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />
              <span>Dokumen terbatas hanya dapat diakses oleh sub bagian {subBagian} atau Administrator.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
          <button onClick={onClose} className={`px-5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${isDark ? "border-[#1e293b] text-gray-300 hover:bg-[#1e293b]" : "border-slate-300 text-slate-600 hover:bg-slate-100"}`}>
            Batal
          </button>
          <button onClick={handleSubmit} disabled={!namaDokumen || isUploading}
            className="btn-kpu-red flex items-center gap-2 px-5 py-2.5 rounded-xl disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer active:scale-95">
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? "Mengunggah..." : "+ Unggah Dokumen"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ArsipView ───────────────────────────────────────────────────────────
export function ArsipView({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark"
  const [arsipList, setArsipList] = useState<ArsipItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showFilter, setShowFilter] = useState(true)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [filterTahun, setFilterTahun] = useState<string>("")
  const [filterBulan, setFilterBulan] = useState<string>("")
  const [filterEvent, setFilterEvent] = useState<string>("")
  const [filterSubBagian, setFilterSubBagian] = useState<string>("")

  const [dynamicTahun, setDynamicTahun] = useState<number[]>(TAHUN_LIST)
  const [dynamicEvent, setDynamicEvent] = useState<string[]>(EVENT_LIST)
  const [dynamicSubBagian, setDynamicSubBagian] = useState<string[]>(SUBBAGIAN_LIST)

  useEffect(() => {
    fetchFilterOptions().then(res => {
      if (res) {
        if (res.years && res.years.length > 0) setDynamicTahun(res.years)
        if (res.events && res.events.length > 0) setDynamicEvent(res.events)
        if (res.sub_bagian && res.sub_bagian.length > 0) setDynamicSubBagian(res.sub_bagian)
      }
    })
  }, [])

  useEffect(() => {
    let active = true
    const loadData = async () => {
      setIsLoading(true)
      try {
        const filters = {
          search: search || undefined,
          year: filterTahun || undefined,
          month: filterBulan || undefined,
          event: filterEvent || undefined,
          sub_bagian: filterSubBagian || undefined,
        }
        const data = await fetchArsip(filters)
        if (!active) return
        
        if (data && data.length > 0) {
          const mapped: ArsipItem[] = data.map((item: any) => {
            const dt = new Date(item.tanggal_dokumen)
            const cat = item.kategori || "Dokumen"
            return {
              id: String(item.id_dokumen),
              name: item.nama_dokumen,
              nomor: item.nomor_dokumen,
              size: item.ukuran_file ? `${(item.ukuran_file / 1024 / 1024).toFixed(1)} MB` : "—",
              category: cat,
              kode: cat.substring(0, 2).toUpperCase(),
              tipe: cat,
              event: item.event || "-",
              subBagian: item.nama_bagian || "-",
              tahun: dt.getFullYear(),
              bulan: dt.getMonth() + 1,
              date: dt.toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' }),
              akses: (item.hak_akses || "internal").toLowerCase() as any,
              uploadedBy: item.nama_pengunggah || "-",
              uploadedAt: new Date(item.created_at).toLocaleString("id-ID", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ' ·'),
            }
          })
          setArsipList(mapped)
        } else {
          setArsipList([])
        }
      } catch (error) {
        if (active) setArsipList(MOCK_ARSIP)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    
    const timer = setTimeout(() => {
      loadData()
    }, 300)
    
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [search, filterTahun, filterBulan, filterEvent, filterSubBagian, refreshKey])

  const filtered = arsipList.filter(d => {
    const q = search.toLowerCase()
    return (
      (!q || d.name.toLowerCase().includes(q) || d.nomor.toLowerCase().includes(q)) &&
      (!filterTahun || d.tahun.toString() === filterTahun) &&
      (!filterBulan || d.bulan.toString() === filterBulan) &&
      (!filterEvent || d.event === filterEvent) &&
      (!filterSubBagian || d.subBagian === filterSubBagian)
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

  const hasActiveFilters = filterTahun !== "" || filterBulan !== "" || filterEvent !== "" || filterSubBagian !== "" || search !== ""

  const sectionLbl = `text-[11px] font-extrabold uppercase tracking-wider mb-2.5 ${isDark ? "text-gray-400" : "text-slate-500"}`
  
  const selectCls = `w-full px-3 py-2 rounded-xl text-xs font-semibold border outline-none transition-colors cursor-pointer ${isDark ? "bg-[#111827] border-white/10 text-white focus:border-red-500/50" : "bg-white border-slate-300 text-slate-800 focus:border-red-400"}`

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
          className="btn-kpu-red flex items-center gap-2 px-5 py-2.5 text-white text-xs font-bold rounded-xl cursor-pointer active:scale-95"
        >
          <Upload className="w-4 h-4" />
          + Unggah Dokumen
        </button>
      </div>

      {/* Info Banner */}
      <div className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs mb-5 ${isDark ? "bg-red-950/20 border-red-500/30 text-gray-200" : "bg-red-50/70 border-red-200 text-slate-800"}`}>
        <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${isDark ? "text-red-400" : "text-red-600"}`} />
        <span className="leading-relaxed">
          Arsip <strong>Publik</strong> dan <strong>Internal</strong> dapat diakses seluruh sub bagian (SDM, PERDATIN, Teknis, Hukum, Keuangan, UMLOG).
          Arsip <strong>Terbatas</strong> hanya dapat diakses oleh sub bagian pemilik dokumen atau Administrator.
        </span>
      </div>

      {/* Layout */}
      <div className="flex gap-5 items-start">
        {/* Sidebar Filter */}
        <aside className={`shrink-0 rounded-2xl border transition-all duration-300 overflow-hidden ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg ${showFilter ? "w-52 p-4.5 space-y-5" : "w-14 p-3 flex flex-col items-center"}`}>
          <div className={`flex items-center ${showFilter ? "justify-between w-full" : "justify-center"}`}>
            {showFilter && <div className={`text-[11px] font-extrabold uppercase tracking-widest whitespace-nowrap ${isDark ? "text-gray-400" : "text-slate-500"}`}>Filter Dokumen</div>}
            <button 
              onClick={() => setShowFilter(p => !p)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer shrink-0 ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-slate-200 text-slate-500"}`}
              title={showFilter ? "Minimize Filter" : "Expand Filter"}
            >
              {showFilter ? <Minus className="w-4 h-4" /> : <SlidersHorizontal className="w-5 h-5" />}
            </button>
          </div>

          <div className={`space-y-5 transition-opacity duration-300 w-full ${showFilter ? "opacity-100" : "opacity-0 hidden"}`}>
            {/* Search */}
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-400" : "text-slate-400"}`} />
              <input
                placeholder="Cari nama, nomor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs font-medium border outline-none transition-colors ${isDark ? "bg-[#111827] border-white/10 text-white placeholder-gray-500 focus:border-red-500/50" : "bg-slate-50 border-slate-300 text-black placeholder-slate-400 focus:border-red-400"}`}
              />
            </div>

            {/* Tahun */}
            <div>
              <div className={sectionLbl}>Tahun</div>
              <select
                value={filterTahun}
                onChange={e => setFilterTahun(e.target.value)}
                className={selectCls}
              >
                <option value="">Semua Tahun</option>
                {dynamicTahun.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Bulan */}
            <div>
              <div className={sectionLbl}>Bulan</div>
              <select
                value={filterBulan}
                onChange={e => setFilterBulan(e.target.value)}
                className={selectCls}
              >
                <option value="">Semua Bulan</option>
                {BULAN_LIST.map(b => <option key={b.val} value={b.val}>{b.label}</option>)}
              </select>
            </div>

            {/* Event */}
            <div>
              <div className={sectionLbl}>Event</div>
              <select
                value={filterEvent}
                onChange={e => setFilterEvent(e.target.value)}
                className={selectCls}
              >
                <option value="">Semua Event</option>
                {dynamicEvent.map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </div>

            {/* Sub Bagian */}
            <div>
              <div className={sectionLbl}>Sub Bagian</div>
              <select
                value={filterSubBagian}
                onChange={e => setFilterSubBagian(e.target.value)}
                className={selectCls}
              >
                <option value="">Semua Sub Bagian</option>
                {dynamicSubBagian.map(sb => <option key={sb} value={sb}>{sb}</option>)}
              </select>
            </div>

            {!!hasActiveFilters && (
              <button
                onClick={() => { setFilterTahun(""); setFilterBulan(""); setFilterEvent(""); setFilterSubBagian(""); setSearch("") }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${isDark ? "bg-red-950/20 border-red-500/30 text-red-400 hover:bg-red-950/40" : "bg-red-50 border-red-300 text-red-600 hover:bg-red-100"}`}>
                <X className="w-4 h-4" />
                Clear Filter
              </button>
            )}
          </div>
        </aside>

        {/* Document List */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className={`flex items-center justify-between px-5 py-3 rounded-2xl border mb-4 ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg`}>
            <button
              onClick={() => setShowFilter(p => !p)}
              className={`flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer ${isDark ? "text-gray-300 hover:text-white" : "text-slate-700 hover:text-black"}`}>
              <SlidersHorizontal className="w-4 h-4" />
              {showFilter ? "Sembunyikan Filter" : "Tampilkan Filter"}
            </button>
            <span className={`text-xs font-semibold ${isDark ? "text-gray-300" : "text-slate-600"}`}>
              {filtered.length} dari {arsipList.length} dokumen
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-4">
            {isLoading ? (
              <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border ${isDark ? "bg-[#1e293b]/70 border-white/10 text-gray-500" : "bg-white/85 border-slate-200 text-slate-400"} backdrop-blur-md shadow-lg`}>
                <Loader2 className="w-8 h-8 mb-3 animate-spin text-red-500" />
                <p className="text-base font-semibold">Memuat dokumen...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className={`flex flex-col items-center justify-center py-16 rounded-2xl border ${isDark ? "bg-[#1e293b]/70 border-white/10 text-gray-500" : "bg-white/85 border-slate-200 text-slate-400"} backdrop-blur-md shadow-lg`}>
                <FileArchive className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-base font-semibold">Tidak ada dokumen ditemukan</p>
                <p className="text-xs mt-1">Coba ubah filter atau kata pencarian</p>
              </div>
            ) : (
              filtered.map(doc => {
                const darkA = AKSES_DARK[doc.akses]
                const lightA = AKSES_LIGHT[doc.akses]
                const AksesIcon = darkA.icon
                return (
                  <div key={doc.id} className={`flex items-center gap-4.5 p-4.5 sm:p-5 rounded-2xl border transition-all hover:shadow-lg ${isDark ? "bg-[#1e293b]/70 border-white/10 hover:border-white/30 hover:bg-[#1e293b]/90" : "bg-white/90 border-slate-200 hover:border-red-300 shadow-sm hover:shadow-md"} backdrop-blur-md`}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#a8171f] to-[#750e14] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-mono text-xs font-extrabold ${isDark ? "text-gray-300" : "text-slate-600"}`}>{doc.nomor}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                          isDark ? "bg-red-950/50 text-red-300 border-red-800/60" : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {doc.subBagian}
                        </span>
                        {[doc.kode, doc.tipe, doc.event].map(tag => (
                          <span key={tag} className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${isDark ? "bg-slate-800 text-gray-200 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-300"}`}>{tag}</span>
                        ))}
                      </div>
                      <h3 className={`text-base font-bold leading-snug ${isDark ? "text-white" : "text-black"}`}>{doc.name}</h3>
                      <div className={`flex items-center gap-2 mt-1.5 text-xs font-medium flex-wrap ${isDark ? "text-gray-300" : "text-slate-600"}`}>
                        <span>{doc.date}</span><span>·</span><span>{doc.size}</span><span>·</span>
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>Diunggah oleh <strong className={`font-bold ${isDark ? "text-red-400" : "text-red-600"}`}>{doc.uploadedBy}</strong></span>
                        </span>
                        <span>·</span><span>{doc.uploadedAt}</span>
                      </div>
                      {doc.akses === "terbatas" && (
                        <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md text-xs font-semibold ${isDark ? "bg-red-950/30 text-red-300 border border-red-800/40" : "bg-red-50 text-red-700 border border-red-200"}`}>
                          <Lock className="w-3 h-3 text-red-500 shrink-0" />
                          <span>Akses terbatas — hanya untuk sub bagian {doc.subBagian}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${isDark ? "bg-slate-800 text-gray-200 border border-slate-700" : "bg-slate-100 text-slate-700 border border-slate-300"}`}>
                        {doc.kode}
                      </div>
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border capitalize ${isDark ? `${darkA.bg} ${darkA.text}` : `${lightA.bg} ${lightA.text}`}`}>
                        <AksesIcon className="w-3.5 h-3.5" />
                        <span>{doc.akses}</span>
                      </span>
                      <button onClick={() => handleDownload(doc.name)} title="Unduh" className="btn-kpu-red p-2.5 rounded-xl text-white cursor-pointer active:scale-95">
                        <Download className="w-4 h-4" />
                      </button>
                      <button onClick={() => setArsipList(p => p.filter(x => x.id !== doc.id))} title="Hapus"
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${isDark ? "border-white/10 text-gray-400 hover:border-red-500/40 hover:text-red-400 hover:bg-red-950/20" : "border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-600 hover:bg-red-50"}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <UnggahDokumenModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSubmit={() => setRefreshKey(p => p + 1)} theme={theme} />
    </div>
  )
}
