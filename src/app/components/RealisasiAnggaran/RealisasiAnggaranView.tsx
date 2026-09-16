import { useState } from "react"
import {
  ChevronDown,
  TrendingUp,
  FileText,
  Filter,
  Search,
  Plus,
  FileSpreadsheet,
  PieChart,
  Layers,
  Wallet
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

const SERAPAN_SUBBAGIAN_DATA = [
  { nama: "Keuangan", pct: 70, realisasi: "10.36", pagu: "14.80", color: "bg-red-600" },
  { nama: "Teknis Penyelenggaraan Pemilu", pct: 78, realisasi: "9.67", pagu: "12.40", color: "bg-red-600" },
  { nama: "SDM (Partisipasi Hubungan Masyarakat dan Sumber Daya Manusia)", pct: 64, realisasi: "5.89", pagu: "9.20", color: "bg-red-600" },
  { nama: "PERDATIN (Perencanaan, Data dan Informasi)", pct: 68, realisasi: "5.17", pagu: "7.60", color: "bg-red-600" },
  { nama: "Hukum", pct: 65, realisasi: "3.76", pagu: "5.78", color: "bg-red-600" },
  { nama: "UMLOG (Umum dan Logistik)", pct: 55, realisasi: "4.10", pagu: "6.20", color: "bg-red-600" },
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

  // Filtered transactions for "transaksi" tab
  const filteredTransactions = transaksiList.filter((item) => {
    const matchesSub = filterSubbagian === "Semua" || item.subbagian.toLowerCase().includes(filterSubbagian.toLowerCase())
    const matchesSearch =
      item.noDokumen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.namaAkun.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.usulanKegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kodeAkun.includes(searchQuery)
    return matchesSub && matchesSearch
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-black"}`}>
            Realisasi Anggaran {subTab === "ringkasan" && "— Overview"}
            {subTab === "transaksi" && "— Daftar Transaksi"}
            {subTab === "laporan" && "— Laporan Bulanan"}
            {subTab === "verifikasi" && "— Verifikasi Dokumen"}
          </h1>
          <p className={`text-xs mt-1 font-medium ${isDark ? "text-gray-300" : "text-slate-700"}`}>
            Portal Pemantauan & Transaksi Realisasi Anggaran PTP KPU Provinsi Sulawesi Utara
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFormOpen(true)}
            className="btn-kpu-red px-4 py-2 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Realisasi</span>
          </button>

          <button
            onClick={() => setIsLaporanOpen(true)}
            className={`px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm ${isDark
              ? "border-slate-700 bg-slate-900 text-white hover:bg-slate-800"
              : "border-slate-300 bg-white text-black hover:bg-slate-50"
              }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-red-600" />
            <span>Laporan Bulanan</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. RINGKASAN SUBTAB */}
      {/* ========================================================================= */}
      {(subTab === "ringkasan" || !subTab) && (
        <div className="space-y-6">
          {/* Top Filter Area */}
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg`}
          >
            <div className="flex flex-wrap items-center gap-3">
              {/* TA Dropdown */}
              <div className="relative">
                <select
                  value={selectedTA}
                  onChange={(e) => setSelectedTA(e.target.value)}
                  className={`appearance-none font-bold text-xs px-3.5 py-2 pr-8 rounded-xl border cursor-pointer ${isDark
                    ? "bg-[#131b2e] border-[#1e293b] text-white hover:border-red-500"
                    : "bg-slate-50 border-slate-300 text-black hover:border-red-500"
                    }`}
                >
                  <option value="TA 2025">TA 2025</option>
                  <option value="TA 2026">TA 2026</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>

              {/* Subbagian Dropdown */}
              <div className="relative">
                <select
                  value={selectedSubbagianFilter}
                  onChange={(e) => setSelectedSubbagianFilter(e.target.value)}
                  className={`appearance-none font-bold text-xs px-3.5 py-2 pr-8 rounded-xl border cursor-pointer ${isDark
                    ? "bg-[#131b2e] border-[#1e293b] text-white hover:border-red-500"
                    : "bg-slate-50 border-slate-300 text-black hover:border-red-500"
                    }`}
                >
                  <option value="Semua Subbagian">Semua Subbagian</option>
                  <option value="Keuangan">Keuangan</option>
                  <option value="Teknis Penyelenggaraan Pemilu">Teknis Penyelenggaraan Pemilu</option>
                  <option value="SDM (Partisipasi Hubungsn Masyarakat dan Sumber Daya Manusia)">SDM</option>
                  <option value="PERDATIN (Perencanaan, Data dan Informasi)">PERDATIN</option>
                  <option value="Hukum">Hukum</option>
                  <option value="UMLOG (Umum dan Logistik)">UMLOG</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>

              {/* Program Dropdown */}
              <div className="relative">
                <select
                  value={selectedProgramFilter}
                  onChange={(e) => setSelectedProgramFilter(e.target.value)}
                  className={`appearance-none font-bold text-xs px-3.5 py-2 pr-8 rounded-xl border cursor-pointer ${isDark
                    ? "bg-[#131b2e] border-[#1e293b] text-white hover:border-red-500"
                    : "bg-slate-50 border-slate-300 text-black hover:border-red-500"
                    }`}
                >
                  <option value="Semua Program">Semua Program</option>
                  <option value="Program Dukungan Manajemen">Program Dukungan Manajemen</option>
                  <option value="Program Penyelenggaraan Pemilu">Program Penyelenggaraan Pemilu</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Date Range Picker Controls */}
            <div className="flex items-center gap-2 text-xs font-bold">
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs outline-none font-semibold ${isDark ? "bg-[#131b2e] border-[#1e293b] text-white" : "bg-slate-50 border-slate-300 text-black"
                    }`}
                />
              </div>
              <span className={isDark ? "text-gray-300" : "text-black"}>s/d</span>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs outline-none font-semibold ${isDark ? "bg-[#131b2e] border-[#1e293b] text-white" : "bg-slate-50 border-slate-300 text-black"
                    }`}
                />
              </div>
            </div>
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: TOTAL PAGU ANGGARAN */}
            <Card className={`relative overflow-hidden transition-all ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
              <CardContent className="p-5 pl-6 flex flex-col justify-center min-h-[135px] space-y-2">
                <div>
                  <p className={`text-[11px] font-extrabold tracking-wider uppercase ${isDark ? "text-gray-300" : "text-slate-900"}`}>
                    Total Pagu Anggaran
                  </p>
                  <h2 className="text-2xl font-black mt-1 tracking-tight text-[#dc2626] dark:text-[#ef4444]">
                    Rp 45.78 M
                  </h2>
                </div>
                <div className={`pt-2.5 border-t flex items-center justify-between text-xs ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <span className={`font-bold ${isDark ? "text-gray-300" : "text-black"}`}>TA 2025</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-bold">
                    Alokasi PTP
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: TOTAL REALISASI */}
            <Card className={`relative overflow-hidden transition-all ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
              <CardContent className="p-5 pl-6 flex flex-col justify-center min-h-[135px] space-y-2">
                <div>
                  <p className={`text-[11px] font-extrabold tracking-wider uppercase ${isDark ? "text-gray-300" : "text-slate-900"}`}>
                    Total Realisasi
                  </p>
                  <h2 className="text-2xl font-black mt-1 tracking-tight text-[#dc2626] dark:text-[#ef4444]">
                    Rp 31.25 M
                  </h2>
                </div>
                <div className={`pt-2.5 border-t flex items-center justify-between text-xs ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <span className={`font-bold ${isDark ? "text-gray-300" : "text-black"}`}>s.d. September 2025</span>
                  <span className="text-[#dc2626] dark:text-[#ef4444] font-black text-xs flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    68.3% terserap
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: SISA ANGGARAN */}
            <Card className={`relative overflow-hidden transition-all ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
              <CardContent className="p-5 pl-6 flex flex-col justify-center min-h-[135px] space-y-2">
                <div>
                  <p className={`text-[11px] font-extrabold tracking-wider uppercase ${isDark ? "text-gray-300" : "text-slate-900"}`}>
                    Sisa Anggaran
                  </p>
                  <h2 className="text-2xl font-black mt-1 tracking-tight text-[#dc2626] dark:text-[#ef4444]">
                    Rp 14.53 M
                  </h2>
                </div>
                <div className={`pt-2.5 border-t flex items-center justify-between text-xs ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                  <span className={`font-bold ${isDark ? "text-gray-300" : "text-black"}`}>Belum terserap</span>
                  <span className="px-2 py-0.5 rounded bg-red-600/10 text-[#dc2626] dark:text-[#ef4444] text-[11px] font-extrabold border border-red-500/20">31.7% Sisa</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: PERSENTASE REALISASI */}
            <Card className={`relative overflow-hidden transition-all ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
              <CardContent className="p-5 pl-6 flex flex-col justify-center min-h-[135px] space-y-2">
                <div>
                  <p className={`text-[11px] font-extrabold tracking-wider uppercase ${isDark ? "text-gray-300" : "text-slate-900"}`}>
                    Persentase Realisasi
                  </p>
                  <div className="flex items-baseline justify-between mt-1">
                    <h2 className="text-2xl font-black tracking-tight text-[#dc2626] dark:text-[#ef4444]">
                      68.3%
                    </h2>
                    <span className={`text-[11px] font-bold ${isDark ? "text-gray-300" : "text-black"}`}>Target: 75%</span>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-red-600 h-full rounded-full" style={{ width: "68.3%" }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section: Serapan per Subbagian & Top Akun Realisasi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Serapan per Subbagian */}
            <Card className={`${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-red-600" />
                  <CardTitle className={`text-base font-bold my-0 ${isDark ? "text-white" : "text-black"}`}>
                    Serapan per Subbagian
                  </CardTitle>
                </div>
                <span className="text-xs font-black text-white bg-red-600 px-2.5 py-1 rounded-md shadow-xs">
                  Rata-rata: 69%
                </span>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {SERAPAN_SUBBAGIAN_DATA.map((row, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${isDark ? "text-white" : "text-black"}`}>{row.nama}</span>
                      <span className="font-black text-red-600 dark:text-red-400">{row.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.pct}%` }}></div>
                    </div>
                    <div className={`flex justify-end text-[11px] font-mono font-bold ${isDark ? "text-gray-300" : "text-slate-800"}`}>
                      <span>Rp {row.realisasi} M / Rp {row.pagu} M</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Akun Realisasi */}
            <Card className={`${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-red-600" />
                  <CardTitle className={`text-base font-bold my-0 ${isDark ? "text-white" : "text-black"}`}>
                    Top Akun Realisasi
                  </CardTitle>
                </div>
                <span className={`text-xs font-bold ${isDark ? "text-gray-300" : "text-black"}`}>
                  TA 2025
                </span>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                {TOP_AKUN_DATA.map((akun) => (
                  <div key={akun.rank} className={`flex items-start gap-3 p-3 rounded-xl border ${isDark ? "bg-[#111827]/60 border-[#1e293b]" : "bg-slate-50 border-slate-200"
                    }`}>
                    <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      #{akun.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold truncate ${isDark ? "text-white" : "text-black"}`}>{akun.nama}</span>
                        <span className="font-mono font-black text-red-600 dark:text-red-400 shrink-0 ml-2">{akun.amount}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-red-600 h-full rounded-full" style={{ width: `${akun.pct}%` }}></div>
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${isDark ? "text-gray-300" : "text-black"}`}>{akun.pct}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Realisasi Terbaru Table */}
          <Card className={`${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-red-600" />
                <CardTitle className={`text-base font-bold my-0 ${isDark ? "text-white" : "text-black"}`}>
                  Daftar Transaksi Realisasi Terbaru
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-b border-white/30 bg-[#0a0e1a]" : "border-b border-slate-200 bg-slate-100"}>
                    <TableHead className={`text-[11px] font-extrabold uppercase ${isDark ? "text-white" : "text-black"}`}>NO. SK / DOKUMEN</TableHead>
                    <TableHead className={`text-[11px] font-extrabold uppercase ${isDark ? "text-white" : "text-black"}`}>AKUN ANGGARAN</TableHead>
                    <TableHead className={`text-[11px] font-extrabold uppercase ${isDark ? "text-white" : "text-black"}`}>SUBBAGIAN</TableHead>
                    <TableHead className={`text-[11px] font-extrabold uppercase text-right ${isDark ? "text-white" : "text-black"}`}>JUMLAH REALISASI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaksiList.map((t) => (
                    <TableRow key={t.id} className={isDark ? "border-b border-white/20 hover:bg-white/[0.05]" : "border-b border-slate-100 hover:bg-slate-50"}>
                      <TableCell className="font-mono text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap">{t.noDokumen}</TableCell>
                      <TableCell className="text-xs">
                        <span className={`font-mono font-bold block ${isDark ? "text-white" : "text-black"}`}>{t.kodeAkun}</span>
                        <span className={`text-[11px] font-semibold ${isDark ? "text-gray-300" : "text-slate-800"}`}>{t.namaAkun}</span>
                      </TableCell>
                      <TableCell className={`text-xs font-bold ${isDark ? "text-gray-200" : "text-black"}`}>{t.subbagian}</TableCell>
                      <TableCell className="text-xs font-black text-red-600 dark:text-red-500 text-right whitespace-nowrap">
                        {formatRupiah(t.jumlah)}
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
      {/* 2. TRANSAKSI SUBTAB */}
      {/* ========================================================================= */}
      {subTab === "transaksi" && (
        <div className="space-y-6">
          <Card className={`${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 font-bold text-red-600">
                  <Filter className="w-4 h-4" /> Filter Realisasi:
                </div>

                <div>
                  <select
                    value={filterSubbagian}
                    onChange={(e) => setFilterSubbagian(e.target.value)}
                    className={`rounded-lg px-3 py-1.5 border font-bold ${isDark ? "bg-[#131b2e] border-[#1e293b] text-white" : "bg-slate-50 border-slate-300 text-black"
                      }`}
                  >
                    <option value="Semua">Semua Subbagian</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="Teknis Penyelenggaraan Pemilu">Teknis Penyelenggaraan Pemilu</option>
                    <option value="SDM">SDM</option>
                    <option value="PERDATIN">PERDATIN</option>
                    <option value="Hukum">Hukum</option>
                    <option value="UMLOG">UMLOG</option>
                  </select>
                </div>

                <div className="relative">
                  <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-400" : "text-slate-600"}`} />
                  <input
                    type="text"
                    placeholder="Cari Dokumen atau Akun..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-8 pr-3 py-1.5 text-xs font-semibold rounded-lg border outline-none ${isDark ? "bg-[#131b2e] border-[#1e293b] text-white" : "bg-slate-50 border-slate-300 text-black placeholder-slate-500"
                      }`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-b border-white/30 bg-[#0a0e1a]" : "border-b border-slate-200 bg-slate-100"}>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>No. Dokumen</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>Tanggal</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>Akun Anggaran</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>Subbagian</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>Usulan Kegiatan</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>Jumlah (Rp)</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((item) => (
                    <TableRow key={item.id} className={isDark ? "border-b border-white/20 hover:bg-white/[0.05]" : "border-b border-slate-100 hover:bg-slate-50"}>
                      <TableCell className="font-mono text-xs font-bold text-red-600 dark:text-red-400">{item.noDokumen}</TableCell>
                      <TableCell className={`text-xs font-semibold whitespace-nowrap ${isDark ? "text-gray-300" : "text-black"}`}>{item.tanggal}</TableCell>
                      <TableCell className="text-xs">
                        <span className={`font-mono font-bold block ${isDark ? "text-white" : "text-black"}`}>{item.kodeAkun}</span>
                        <span className={`text-[11px] font-semibold ${isDark ? "text-gray-300" : "text-slate-800"}`}>{item.namaAkun}</span>
                      </TableCell>
                      <TableCell className={`text-xs font-bold ${isDark ? "text-gray-200" : "text-black"}`}>{item.subbagian}</TableCell>
                      <TableCell className={`font-bold text-xs truncate max-w-xs ${isDark ? "text-white" : "text-black"}`}>{item.usulanKegiatan}</TableCell>
                      <TableCell className="text-xs font-black text-red-600 dark:text-red-500 whitespace-nowrap">{formatRupiah(item.jumlah)}</TableCell>
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
          <Card className={`${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <CardTitle className={`text-base font-bold my-0 ${isDark ? "text-white" : "text-black"}`}>
                  Laporan Rekapitulasi Realisasi Anggaran
                </CardTitle>
                <p className={`text-xs mt-1 font-medium ${isDark ? "text-gray-300" : "text-slate-700"}`}>
                  Laporan resmi penyerapan anggaran per subbagian dan program kerja TA 2025
                </p>
              </div>
              <button
                onClick={() => setIsLaporanOpen(true)}
                className="btn-kpu-red px-4 py-2 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unduh Laporan (.csv / .xlsx)</span>
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-b border-white/30 bg-[#0a0e1a]" : "border-b border-slate-200 bg-slate-100"}>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>KODE AKUN</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>NAMA AKUN</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>PAGU (RP)</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>REALISASI (RP)</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>SISA (RP)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {akunList.map((a) => (
                    <TableRow key={a.kode} className={isDark ? "border-b border-white/20 hover:bg-white/[0.05]" : "border-b border-slate-100 hover:bg-slate-50"}>
                      <TableCell className="font-mono text-xs font-bold text-red-600 dark:text-red-400">{a.kode}</TableCell>
                      <TableCell className={`text-xs font-bold ${isDark ? "text-white" : "text-black"}`}>{a.nama}</TableCell>
                      <TableCell className={`text-xs font-bold ${isDark ? "text-gray-200" : "text-black"}`}>{formatRupiah(a.pagu)}</TableCell>
                      <TableCell className="text-xs font-black text-red-600 dark:text-red-500">{formatRupiah(a.realisasi)}</TableCell>
                      <TableCell className={`text-xs font-bold ${isDark ? "text-gray-300" : "text-slate-800"}`}>{formatRupiah(a.sisa)}</TableCell>
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
          <Card className={`${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
            <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className={`text-base font-bold my-0 ${isDark ? "text-white" : "text-black"}`}>
                Verifikasi Dokumen Realisasi Keuangan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className={isDark ? "border-b border-white/30 bg-[#0a0e1a]" : "border-b border-slate-200 bg-slate-100"}>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>NO. DOKUMEN</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>USULAN & SUBBAGIAN</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>JUMLAH REALISASI</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>BUKTI</TableHead>
                    <TableHead className={`text-[11px] font-extrabold ${isDark ? "text-white" : "text-black"}`}>STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaksiList.map((t) => (
                    <TableRow key={t.id} className={isDark ? "border-b border-white/20 hover:bg-white/[0.05]" : "border-b border-slate-100 hover:bg-slate-50"}>
                      <TableCell className="font-mono text-xs font-bold text-red-600 dark:text-red-400">{t.noDokumen}</TableCell>
                      <TableCell className="text-xs">
                        <p className={`font-bold ${isDark ? "text-white" : "text-black"}`}>{t.usulanKegiatan}</p>
                        <p className={`text-[11px] font-semibold ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t.subbagian}</p>
                      </TableCell>
                      <TableCell className="text-xs font-black text-red-600 dark:text-red-500">{formatRupiah(t.jumlah)}</TableCell>
                      <TableCell className={`text-xs font-mono font-bold flex items-center gap-1 ${isDark ? "text-white" : "text-black"}`}>
                        <FileText className="w-3.5 h-3.5 text-red-600" /> {t.buktiFile}
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
