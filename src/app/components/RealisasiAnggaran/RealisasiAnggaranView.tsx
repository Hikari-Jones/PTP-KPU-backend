import { useState } from "react"
import {
  ChevronDown,
  TrendingUp,
  ArrowUpRight,
  FileText,
  Filter,
  Search,
  Plus,
  FileSpreadsheet
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Badge } from "../ui/badge"
import type { AkunAnggaran, TransaksiRealisasi } from "./types"
import { TambahRealisasiModal } from "./TambahRealisasiModal"
import { LaporanBulananModal } from "./LaporanBulananModal"

export type RealisasiSubTab = "ringkasan" | "transaksi" | "laporan" | "verifikasi"

interface Props {
  theme: "light" | "dark"
  subTab?: RealisasiSubTab
}

// Visual reference datasets matching Figma specs
const MONTHLY_TREND_DATA = [
  { month: "Jan", realisasi: 2.1, target: 3.8 },
  { month: "Feb", realisasi: 2.8, target: 3.8 },
  { month: "Mar", realisasi: 3.4, target: 3.8 },
  { month: "Apr", realisasi: 3.1, target: 3.8 },
  { month: "Mei", realisasi: 3.9, target: 3.8 },
  { month: "Jun", realisasi: 4.2, target: 3.8 },
  { month: "Jul", realisasi: 3.7, target: 3.8 },
  { month: "Agu", realisasi: 4.1, target: 3.8 },
  { month: "Sep", realisasi: 3.95, target: 3.8 },
  { month: "Okt", realisasi: 0.0, target: 3.8 },
  { month: "Nov", realisasi: 0.0, target: 3.8 },
  { month: "Des", realisasi: 0.0, target: 3.8 },
]

const SERAPAN_SUBBAGIAN_DATA = [
  { nama: "Keuangan", pct: 70, realisasi: "10.36", pagu: "14.80", color: "bg-red-500" },
  { nama: "Teknis Penyelenggaraan Pemilu", pct: 78, realisasi: "9.67", pagu: "12.40", color: "bg-red-600" },
  { nama: "SDM (Partisipasi Hubungan Masyarakat dan Sumber Daya Manusia)", pct: 64, realisasi: "5.89", pagu: "9.20", color: "bg-amber-500" },
  { nama: "PERDATIN (Perencanaan, Data dan Informasi)", pct: 68, realisasi: "5.17", pagu: "7.60", color: "bg-blue-500" },
  { nama: "Hukum", pct: 65, realisasi: "3.76", pagu: "5.78", color: "bg-emerald-500" },
  { nama: "UMLOG (Umum dan Logistik)", pct: 55, realisasi: "4.10", pagu: "6.20", color: "bg-sky-500" },
]

const TOP_AKUN_DATA = [
  { rank: 1, kode: "521111", nama: "Belanja Gaji dan Tunjangan", pct: 75, amount: "Rp 6.38 M" },
  { rank: 2, kode: "521211", nama: "Pengadaan Logistik & Kotak Suara", pct: 82, amount: "Rp 9.80 M" },
  { rank: 3, kode: "522112", nama: "Honorarium PPK & PPS Pilkada", pct: 69, amount: "Rp 5.20 M" },
  { rank: 4, kode: "524111", nama: "Sosialisasi Pemilih & Kampanye", pct: 64, amount: "Rp 3.10 M" },
]

const INITIAL_TRANSAKSI_FIGMA: TransaksiRealisasi[] = [
  {
    id: "TRX-001",
    tanggal: "2025-09-28",
    noDokumen: "001/SPM-KPU/2025",
    kodeAkun: "521111",
    namaAkun: "Belanja Operasional Kantor",
    subbagian: "Keuangan",
    usulanKegiatan: "Pengadaan Alat Tulis & Konsumsi Rapat Operasional",
    jumlah: 150000000,
    buktiFile: "SPM_001_Operasional.pdf",
    status: "Disetujui",
    periode: "September 2025",
  },
  {
    id: "TRX-002",
    tanggal: "2025-09-25",
    noDokumen: "002/SPM-KPU/2025",
    kodeAkun: "521211",
    namaAkun: "Pengadaan Logistik Pilkada",
    subbagian: "Teknis Penyelenggaraan Pemilu",
    usulanKegiatan: "Honorarium Panitia PPK & PPS Kabupaten Minahasa",
    jumlah: 85000000,
    buktiFile: "Honor_PPK_Minahasa.pdf",
    status: "Disetujui",
    periode: "September 2025",
  },
  {
    id: "TRX-003",
    tanggal: "2025-09-20",
    noDokumen: "003/SPM-KPU/2025",
    kodeAkun: "524111",
    namaAkun: "Sosialisasi Pemilih",
    subbagian: "SDM (Partisipasi Hubungan Masyarakat dan Sumber Daya Manusia)",
    usulanKegiatan: "Sewa Gedung Rapat Koordinasi Tahapan Pilkada",
    jumlah: 45000000,
    buktiFile: "Kwitansi_Sewa_Gedung.pdf",
    status: "Menunggu Verifikasi",
    periode: "September 2025",
  },
  {
    id: "TRX-004",
    tanggal: "2025-09-15",
    noDokumen: "004/SPM-KPU/2025",
    kodeAkun: "522112",
    namaAkun: "Perjalanan Dinas Pimpinan",
    subbagian: "Hukum",
    usulanKegiatan: "Perjalanan Dinas Pengawasan Logistik ke Kepulauan",
    jumlah: 27500000,
    buktiFile: "SPD_Pengawasan_Logistik.pdf",
    status: "Disetujui",
    periode: "September 2025",
  },
]

const INITIAL_AKUN: AkunAnggaran[] = [
  { kode: "521111", nama: "Belanja Operasional Kantor & Perjalanan Dinas", pagu: 14800000000, realisasi: 10360000000, sisa: 4440000000 },
  { kode: "521211", nama: "Pengadaan Logistik & Kotak Suara Pilkada", pagu: 12400000000, realisasi: 9670000000, sisa: 2730000000 },
  { kode: "522112", nama: "Honorarium Panitia Pemilihan (PPK & PPS)", pagu: 9200000000, realisasi: 5890000000, sisa: 3310000000 },
  { kode: "524111", nama: "Sosialisasi & Edukasi Pemilih Pemula", pagu: 7600000000, realisasi: 5170000000, sisa: 2430000000 },
]

export function RealisasiAnggaranView({ theme, subTab = "ringkasan" }: Props) {
  const isDark = theme === "dark"

  const [akunList] = useState<AkunAnggaran[]>(INITIAL_AKUN)
  const [transaksiList, setTransaksiList] = useState<TransaksiRealisasi[]>(INITIAL_TRANSAKSI_FIGMA)

  // Filter UI States
  const [selectedTA, setSelectedTA] = useState("TA 2025")
  const [selectedSubbagianFilter, setSelectedSubbagianFilter] = useState("Semua Subbagian")
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("Semua Program")
  const [startDate, setStartDate] = useState("2025-01-01")
  const [endDate, setEndDate] = useState("2025-09-30")

  // Subtab Transaksi filters
  const [filterSubbagian, setFilterSubbagian] = useState("Semua")
  const [searchQuery, setSearchQuery] = useState("")

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLaporanOpen, setIsLaporanOpen] = useState(false)

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val)
  }

  const handleSaveRealisasi = (
    newTrxData: Omit<TransaksiRealisasi, "id">,
    _saveType: "Draft" | "Menunggu Verifikasi"
  ) => {
    const newTrx: TransaksiRealisasi = {
      ...newTrxData,
      id: `TRX-${Math.floor(100 + Math.random() * 900)}`,
    }

    setTransaksiList((prev) => [newTrx, ...prev])
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
            Realisasi Anggaran {subTab === "ringkasan" && "— Ringkasan Overview"}
            {subTab === "transaksi" && "— Daftar Transaksi"}
            {subTab === "laporan" && "— Laporan Bulanan"}
            {subTab === "verifikasi" && "— Verifikasi Dokumen"}
          </h1>
          <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
            Portal Pemantauan & Transaksi Realisasi Anggaran PTP KPU Provinsi Sulawesi Utara
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Realisasi</span>
          </button>

          <button
            onClick={() => setIsLaporanOpen(true)}
            className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm ${
              isDark
                ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40"
                : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>Laporan Bulanan</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. RINGKASAN SUBTAB (FIGMA MATCHING DESIGN) */}
      {/* ========================================================================= */}
      {(subTab === "ringkasan" || !subTab) && (
        <div className="space-y-6">
          {/* Top Filter Area */}
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
              isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <div className="flex flex-wrap items-center gap-3">
              {/* TA Dropdown */}
              <div className="relative">
                <select
                  value={selectedTA}
                  onChange={(e) => setSelectedTA(e.target.value)}
                  className={`appearance-none font-semibold text-xs px-3.5 py-2 pr-8 rounded-xl border cursor-pointer ${
                    isDark
                      ? "bg-[#131b2e] border-[#1e293b] text-gray-100 hover:border-red-500"
                      : "bg-slate-50 border-slate-300 text-slate-800 hover:border-red-500"
                  }`}
                >
                  <option value="TA 2025">TA 2025</option>
                  <option value="TA 2026">TA 2026</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Subbagian Dropdown */}
              <div className="relative">
                <select
                  value={selectedSubbagianFilter}
                    onChange={(e) => setSelectedSubbagianFilter(e.target.value)}
                  className={`appearance-none font-medium text-xs px-3.5 py-2 pr-8 rounded-xl border cursor-pointer ${
                    isDark
                      ? "bg-[#131b2e] border-[#1e293b] text-gray-100 hover:border-red-500"
                      : "bg-slate-50 border-slate-300 text-slate-800 hover:border-red-500"
                  }`}
                >
                    <option value="Semua Subbagian">Semua Subbagian</option>
                  <option value="Keuangan">Keuangan</option>
                  <option value="Teknis Penyelenggaraan Pemilu">Teknis Penyelenggaraan Pemilu</option>
                  <option value="SDM (Partisipasi Hubungan Masyarakat dan Sumber Daya Manusia)">SDM (Partisipasi Hubungan Masyarakat dan Sumber Daya Manusia)</option>
                  <option value="PERDATIN (Perencanaan, Data dan Informasi)">PERDATIN (Perencanaan, Data dan Informasi)</option>
                  <option value="Hukum">Hukum</option>
                  <option value="UMLOG (Umum dan Logistik)">UMLOG (Umum dan Logistik)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Program Dropdown */}
              <div className="relative">
                <select
                  value={selectedProgramFilter}
                  onChange={(e) => setSelectedProgramFilter(e.target.value)}
                  className={`appearance-none font-medium text-xs px-3.5 py-2 pr-8 rounded-xl border cursor-pointer ${
                    isDark
                      ? "bg-[#131b2e] border-[#1e293b] text-gray-100 hover:border-red-500"
                      : "bg-slate-50 border-slate-300 text-slate-800 hover:border-red-500"
                  }`}
                >
                  <option value="Semua Program">Semua Program</option>
                  <option value="Program Dukungan Manajemen">Program Dukungan Manajemen</option>
                  <option value="Program Penyelenggaraan Pemilu">Program Penyelenggaraan Pemilu</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Date Range Picker Controls */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs outline-none ${
                    isDark ? "bg-[#131b2e] border-[#1e293b] text-gray-200" : "bg-slate-50 border-slate-300 text-slate-800"
                  }`}
                />
              </div>
              <span className={isDark ? "text-gray-400" : "text-slate-500"}>s/d</span>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs outline-none ${
                    isDark ? "bg-[#131b2e] border-[#1e293b] text-gray-200" : "bg-slate-50 border-slate-300 text-slate-800"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 4 KPI Summary Cards (Matching Figma layout & colors) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: TOTAL PAGU ANGGARAN */}
            <Card className={`relative overflow-hidden transition-all ${
              isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
              <CardContent className="p-5 pl-6 flex flex-col justify-between h-full">
                <div>
                  <p className="text-[11px] font-bold tracking-wider uppercase text-blue-400">
                    Total Pagu Anggaran
                  </p>
                  <h2 className={`text-2xl font-black mt-2 tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    Rp 45.78 M
                  </h2>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">TA 2025</span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                    Alokasi PTP
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: TOTAL REALISASI */}
            <Card className={`relative overflow-hidden transition-all ${
              isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
              <CardContent className="p-5 pl-6 flex flex-col justify-between h-full">
                <div>
                  <p className="text-[11px] font-bold tracking-wider uppercase text-red-400">
                    Total Realisasi
                  </p>
                  <h2 className="text-2xl font-black mt-2 tracking-tight text-red-500">
                    Rp 31.25 M
                  </h2>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">s.d. September 2025</span>
                  <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    68.3% terserap
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: SISA ANGGARAN */}
            <Card className={`relative overflow-hidden transition-all ${
              isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
              <CardContent className="p-5 pl-6 flex flex-col justify-between h-full">
                <div>
                  <p className="text-[11px] font-bold tracking-wider uppercase text-amber-400">
                    Sisa Anggaran
                  </p>
                  <h2 className="text-2xl font-black mt-2 tracking-tight text-amber-500">
                    Rp 14.53 M
                  </h2>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/40 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Belum terserap</span>
                  <span className="text-amber-400 text-[11px] font-semibold">31.7% Sisa</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: PERSENTASE REALISASI */}
            <Card className={`relative overflow-hidden transition-all ${
              isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"
            }`}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
              <CardContent className="p-5 pl-6 flex flex-col justify-between h-full">
                <div>
                  <p className="text-[11px] font-bold tracking-wider uppercase text-emerald-400">
                    Persentase Realisasi
                  </p>
                  <div className="flex items-baseline justify-between mt-2">
                    <h2 className="text-2xl font-black tracking-tight text-emerald-400">
                      68.3%
                    </h2>
                    <span className="text-[11px] text-gray-400 font-medium">Target: 75%</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: "68.3%" }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid: Chart + Serapan Subbagian */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tren Realisasi Bulanan (2 Cols) */}
            <Card className={`lg:col-span-2 ${isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-800/40">
                <div>
                  <CardTitle className={`text-base font-bold my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
                    Tren Realisasi Bulanan
                  </CardTitle>
                  <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                    Bar = Realisasi • Line = Target Pagu / Bulan
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select className={`appearance-none text-xs font-semibold px-3 py-1.5 pr-7 rounded-lg border ${
                      isDark ? "bg-[#131b2e] border-[#1e293b] text-gray-200" : "bg-slate-50 border-slate-300 text-slate-800"
                    }`}>
                      <option>TA 2025</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Custom Dual Bar/Line Visual Canvas */}
                <div className="h-64 w-full flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-800/60 relative">
                  {/* Line Overlay for Target (3.8M target line) */}
                  <div className="absolute left-0 right-0 top-[38%] border-b-2 border-dashed border-amber-400/80 z-10 flex items-center justify-end pr-2">
                    <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/40">
                      Target Target Pagu / Bulan (Rp 3.8M)
                    </span>
                  </div>

                  {MONTHLY_TREND_DATA.map((item, idx) => {
                    const maxScale = 5.0
                    const heightPct = (item.realisasi / maxScale) * 100

                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group z-20">
                        <div className="w-full flex justify-center items-end h-full">
                          <div
                            style={{ height: `${heightPct}%` }}
                            className={`w-full max-w-[28px] rounded-t transition-all duration-300 relative ${
                              item.realisasi > 0
                                ? "bg-gradient-to-t from-red-700 to-red-500 group-hover:brightness-125"
                                : "bg-slate-800/40"
                            }`}
                          >
                            {item.realisasi > 0 && (
                              <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-0.5 px-1.5 rounded border border-gray-700 font-mono font-bold whitespace-nowrap z-30 pointer-events-none">
                                Rp {item.realisasi}M
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-[11px] font-medium ${isDark ? "text-gray-400" : "text-slate-500"}`}>{item.month}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-red-600 inline-block"></span>
                    <span className={isDark ? "text-gray-300" : "text-slate-600"}>Realisasi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 border-b-2 border-dashed border-amber-400 inline-block"></span>
                    <span className={isDark ? "text-gray-300" : "text-slate-600"}>Target Pagu/Bulan</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Serapan per Subbagian (1 Col) */}
            <Card className={isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}>
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-800/40">
                  <CardTitle className={`text-base font-bold my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
                    Serapan per Subbagian
                </CardTitle>
                <span className="text-xs font-extrabold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  Rata-rata: 69%
                </span>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {SERAPAN_SUBBAGIAN_DATA.map((row, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${isDark ? "text-gray-200" : "text-slate-800"}`}>{row.nama}</span>
                      <span className="font-extrabold text-red-400">{row.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }}></div>
                    </div>
                    <div className="flex justify-end text-[10px] text-gray-400 font-mono">
                      <span>Rp {row.realisasi} M / Rp {row.pagu} M</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Grid: Realisasi Terbaru + Top Akun Realisasi */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Realisasi Terbaru Table (2 Cols) */}
            <Card className={`lg:col-span-2 ${isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-800/40">
                <CardTitle className={`text-base font-bold my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Realisasi Terbaru
                </CardTitle>
                <button
                  onClick={() => {}}
                  className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Lihat Semua</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className={isDark ? "border-b border-[#1e293b] bg-[#0a0e1a]" : "border-b border-slate-200 bg-slate-50"}>
                      <TableHead className="text-[11px] font-bold">NO. SK / DOKUMEN</TableHead>
                      <TableHead className="text-[11px] font-bold">AKUN ANGGARAN</TableHead>
                      <TableHead className="text-[11px] font-bold">SUBBAGIAN</TableHead>
                      <TableHead className="text-[11px] font-bold text-right">JUMLAH REALISASI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transaksiList.map((t) => (
                      <TableRow key={t.id} className={isDark ? "border-b border-[#1e293b]/40 hover:bg-[#131d30]" : "border-b border-slate-100 hover:bg-slate-50"}>
                        <TableCell className="font-mono text-xs font-bold text-red-500 whitespace-nowrap">{t.noDokumen}</TableCell>
                        <TableCell className="text-xs">
                          <span className="font-mono font-bold block">{t.kodeAkun}</span>
                          <span className="text-[10px] text-gray-400">{t.namaAkun}</span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-300 font-medium">{t.subbagian}</TableCell>
                        <TableCell className="text-xs font-black text-red-500 text-right whitespace-nowrap">
                          {formatRupiah(t.jumlah)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Top Akun Realisasi (1 Col) */}
            <Card className={isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}>
              <CardHeader className="pb-4 border-b border-slate-800/40">
                <CardTitle className={`text-base font-bold my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Top Akun Realisasi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {TOP_AKUN_DATA.map((akun) => (
                  <div key={akun.rank} className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-800/40 bg-[#111827]/40">
                    <div className="w-7 h-7 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                      {akun.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-100 truncate">{akun.nama}</span>
                        <span className="font-mono font-bold text-emerald-400 shrink-0 ml-2">{akun.amount}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-red-500 h-full rounded-full" style={{ width: `${akun.pct}%` }}></div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">{akun.pct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TRANSAKSI SUBTAB */}
      {/* ========================================================================= */}
      {subTab === "transaksi" && (
        <div className="space-y-6">
          <Card className={isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}>
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 font-bold text-red-500">
                  <Filter className="w-4 h-4" /> Filter Realisasi:
                </div>

                <div>
                    <select
                    value={filterSubbagian}
                    onChange={(e) => setFilterSubbagian(e.target.value)}
                    className={`rounded-lg px-3 py-1.5 border ${
                      isDark ? "bg-[#131b2e] border-[#1e293b] text-gray-200" : "bg-slate-50 border-slate-300 text-slate-800"
                    }`}
                  >
                    <option value="Semua">Semua Subbagian</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="Teknis Penyelenggaraan Pemilu">Teknis Penyelenggaraan Pemilu</option>
                    <option value="SDM (Partisipasi Hubungan Masyarakat dan Sumber Daya Manusia)">SDM (Partisipasi Hubungan Masyarakat dan Sumber Daya Manusia)</option>
                    <option value="PERDATIN (Perencanaan, Data dan Informasi)">PERDATIN (Perencanaan, Data dan Informasi)</option>
                    <option value="Hukum">Hukum</option>
                    <option value="UMLOG (Umum dan Logistik)">UMLOG (Umum dan Logistik)</option>
                  </select>
                </div>

                <div className="relative">
                  <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-400" : "text-slate-400"}`} />
                  <input
                    type="text"
                    placeholder="Cari Dokumen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none ${
                      isDark ? "bg-[#131b2e] border-[#1e293b] text-gray-200" : "bg-slate-50 border-slate-300 text-slate-800"
                    }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-b border-[#1e293b] bg-[#0a0e1a]" : "border-b border-slate-200 bg-slate-50"}>
                    <TableHead className="text-[11px]">No. Dokumen</TableHead>
                    <TableHead className="text-[11px]">Tanggal</TableHead>
                    <TableHead className="text-[11px]">Akun Anggaran</TableHead>
                    <TableHead className="text-[11px]">Subbagian</TableHead>
                    <TableHead className="text-[11px]">Usulan Kegiatan</TableHead>
                    <TableHead className="text-[11px]">Jumlah (Rp)</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaksiList.map((item) => (
                    <TableRow key={item.id} className={isDark ? "border-b border-[#1e293b]/40 hover:bg-[#131d30]" : "border-b border-slate-100"}>
                      <TableCell className="font-mono text-xs font-bold text-red-500">{item.noDokumen}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{item.tanggal}</TableCell>
                      <TableCell className="text-xs">
                        <span className="font-mono font-bold block">{item.kodeAkun}</span>
                        <span className="text-[10px] text-gray-400">{item.namaAkun}</span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">{item.subbagian}</TableCell>
                      <TableCell className="font-medium text-xs truncate max-w-xs">{item.usulanKegiatan}</TableCell>
                      <TableCell className="text-xs font-extrabold text-red-500">{formatRupiah(item.jumlah)}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "Disetujui" ? "terkirim" : "diproses"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LAPORAN SUBTAB */}
      {/* ========================================================================= */}
      {subTab === "laporan" && (
        <div className="space-y-6">
          <Card className={isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}>
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-800/40">
              <div>
                <CardTitle className={`text-base font-bold my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
                  Laporan Rekapitulasi Realisasi Anggaran
                </CardTitle>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                  Laporan resmi penyerapan anggaran per subbagian dan program kerja TA 2025
                </p>
              </div>
              <button
                onClick={() => setIsLaporanOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unduh Laporan (.csv / .xlsx)</span>
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-b border-[#1e293b] bg-[#0a0e1a]" : "border-b border-slate-200 bg-slate-50"}>
                    <TableHead className="text-[11px]">KODE AKUN</TableHead>
                    <TableHead className="text-[11px]">NAMA AKUN</TableHead>
                    <TableHead className="text-[11px]">PAGU (RP)</TableHead>
                    <TableHead className="text-[11px]">REALISASI (RP)</TableHead>
                    <TableHead className="text-[11px]">SISA (RP)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {akunList.map((a) => (
                    <TableRow key={a.kode} className={isDark ? "border-b border-[#1e293b]" : "border-b border-slate-100"}>
                      <TableCell className="font-mono text-xs font-bold text-red-500">{a.kode}</TableCell>
                      <TableCell className="text-xs font-medium">{a.nama}</TableCell>
                      <TableCell className="text-xs font-bold">{formatRupiah(a.pagu)}</TableCell>
                      <TableCell className="text-xs font-bold text-red-500">{formatRupiah(a.realisasi)}</TableCell>
                      <TableCell className="text-xs font-bold text-amber-500">{formatRupiah(a.sisa)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. VERIFIKASI SUBTAB */}
      {/* ========================================================================= */}
      {subTab === "verifikasi" && (
        <div className="space-y-6">
          <Card className={isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}>
            <CardHeader className="pb-4 border-b border-slate-800/40">
              <CardTitle className={`text-base font-bold my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
                Verifikasi Dokumen Realisasi Keuangan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-b border-[#1e293b] bg-[#0a0e1a]" : "border-b border-slate-200 bg-slate-50"}>
                    <TableHead className="text-[11px]">NO. DOKUMEN</TableHead>
                    <TableHead className="text-[11px]">USULAN & SUBBAGIAN</TableHead>
                    <TableHead className="text-[11px]">JUMLAH REALISASI</TableHead>
                    <TableHead className="text-[11px]">BUKTI</TableHead>
                    <TableHead className="text-[11px]">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaksiList.map((t) => (
                    <TableRow key={t.id} className={isDark ? "border-b border-[#1e293b]" : "border-b border-slate-100"}>
                      <TableCell className="font-mono text-xs font-bold text-red-500">{t.noDokumen}</TableCell>
                      <TableCell className="text-xs">
                        <p className="font-bold">{t.usulanKegiatan}</p>
                        <p className="text-[10px] text-gray-400">{t.subbagian}</p>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-red-500">{formatRupiah(t.jumlah)}</TableCell>
                      <TableCell className="text-xs text-blue-400 font-mono flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> {t.buktiFile}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.status === "Disetujui" ? "terkirim" : "warning"}>{t.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <TambahRealisasiModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        akunList={akunList}
        onSave={handleSaveRealisasi}
        theme={theme}
      />

      <LaporanBulananModal
        isOpen={isLaporanOpen}
        onClose={() => setIsLaporanOpen(false)}
        transaksiList={transaksiList}
        theme={theme}
      />
    </div>
  )
}
