import { Mail, Archive, TrendingUp, Wallet, Settings, FileCheck, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { DashboardChart } from "../ui/chart"

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

export function DashboardView({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark"

  const recentSurat = [
    {
      no: "001/KPU-SU/VI/2026",
      perihal: "Undangan Rapat Pleno Rekapitulasi DPT",
      dari: "Ketua KPU Provinsi",
      tanggal: "20 Jun 2026",
      status: "terkirim",
      statusLabel: "Terkirim",
    },
    {
      no: "002/KPU-SU/VI/2026",
      perihal: "Laporan Rekap DPT Kab. Minahasa 2026",
      dari: "KPU Kab. Minahasa",
      tanggal: "19 Jun 2026",
      status: "diterima",
      statusLabel: "Diterima",
    },
    {
      no: "003/KPU-SU/VI/2026",
      perihal: "Permohonan Klarifikasi Data Pemilih",
      dari: "Bawaslu Sulut",
      tanggal: "18 Jun 2026",
      status: "diproses",
      statusLabel: "Diproses",
    },
    {
      no: "004/KPU-SU/VI/2026",
      perihal: "Nota Dinas Pengadaan Logistik Pilkada",
      dari: "Subbagian Logistik",
      tanggal: "17 Jun 2026",
      status: "draft",
      statusLabel: "Draft",
    },
  ]

  const recentActivities = [
    {
      id: 1,
      icon: Mail,
      text: "Surat Undangan Pleno KPU No. 042 diterima",
      time: "09:24 WITA",
      iconColor: "text-white bg-red-600",
    },
    {
      id: 2,
      icon: Archive,
      text: "Dokumen Arsip Pilkada 2026 telah diverifikasi",
      time: "08:50 WITA",
      iconColor: "text-white bg-red-600",
    },
    {
      id: 3,
      icon: Wallet,
      text: "Laporan Pengeluaran Operasional disetujui",
      time: "08:15 WITA",
      iconColor: "text-white bg-red-600",
    },
    {
      id: 4,
      icon: Settings,
      text: "Konfigurasi keamanan sistem diperbarui",
      time: "Kemarin",
      iconColor: "text-white bg-red-600",
    },
    {
      id: 5,
      icon: CheckCircle2,
      text: "Verifikasi anggaran Subbagian Keuangan selesai",
      time: "2 hari lalu",
      iconColor: "text-white bg-red-600",
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title */}
      <div>
        <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-black"}`}>
          Dashboard Operasional Terpadu
        </h1>
        <p className={`text-xs mt-1 font-medium ${isDark ? "text-gray-300" : "text-slate-700"}`}>
          Pusat pemantauan eksekutif realisasi anggaran, persuratan digital, dan arsip dokumen KPU Sulawesi Utara
        </p>
      </div>

      {/* 4 Metric Cards - Merah, Hitam, Putih */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pagu Anggaran */}
        <Card className={`relative overflow-hidden transition-all ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
          <CardContent className="p-5 pl-6 flex items-center justify-between min-h-[110px]">
            <div className="flex-1 flex flex-col justify-center">
              <p className={`text-[11px] font-extrabold tracking-wider uppercase ${isDark ? "text-gray-300" : "text-slate-800"}`}>
                Total Pagu TA 2025
              </p>
              <h2 className={`text-2xl font-black mt-1 ${isDark ? "text-white" : "text-black"}`}>Rp 45.78 M</h2>
              <p className={`text-[10px] font-bold mt-1 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                Alokasi PTP KPU Sulut
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Realisasi Anggaran */}
        <Card className={`relative overflow-hidden transition-all ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
          <CardContent className="p-5 pl-6 flex items-center justify-between min-h-[110px]">
            <div className="flex-1 flex flex-col justify-center">
              <p className={`text-[11px] font-extrabold tracking-wider uppercase ${isDark ? "text-gray-300" : "text-slate-800"}`}>
                Total Realisasi
              </p>
              <h2 className={`text-2xl font-black mt-1 ${isDark ? "text-white" : "text-black"}`}>Rp 31.25 M</h2>
              <p className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                <TrendingUp className="w-3.5 h-3.5" /> 68.3% terserap
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FileCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Surat Masuk Aktif */}
        <Card className={`relative overflow-hidden transition-all ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
          <CardContent className="p-5 pl-6 flex items-center justify-between min-h-[110px]">
            <div className="flex-1 flex flex-col justify-center">
              <p className={`text-[11px] font-extrabold tracking-wider uppercase ${isDark ? "text-gray-300" : "text-slate-800"}`}>
                Surat Masuk Aktif
              </p>
              <h2 className={`text-2xl font-black mt-1 ${isDark ? "text-white" : "text-black"}`}>12 Berkas</h2>
              <p className={`text-[10px] font-bold mt-1 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                3 butuh tanggapan
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Mail className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Arsip Dokumen Digital */}
        <Card className={`relative overflow-hidden transition-all ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
          <CardContent className="p-5 pl-6 flex items-center justify-between min-h-[110px]">
            <div className="flex-1 flex flex-col justify-center">
              <p className={`text-[11px] font-extrabold tracking-wider uppercase ${isDark ? "text-gray-300" : "text-slate-800"}`}>
                Arsip Terverifikasi
              </p>
              <h2 className={`text-2xl font-black mt-1 ${isDark ? "text-white" : "text-black"}`}>248 Dokumen</h2>
              <p className={`text-[10px] font-bold flex items-center gap-1 mt-1 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                <TrendingUp className="w-3.5 h-3.5" /> +6 berkas bulan ini
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Archive className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dual Visual Charts: Tren Realisasi Anggaran Bulanan + Statistik Dokumen & Surat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Tren Realisasi Bulanan (Dipindahkan ke Dashboard) */}
        <Card className={`${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <CardTitle className={`text-base font-bold ${isDark ? "text-white" : "text-black"}`}>
                Tren Realisasi Anggaran Bulanan
              </CardTitle>
              <p className={`text-xs mt-1 font-medium ${isDark ? "text-gray-300" : "text-slate-700"}`}>
                Bar = Realisasi Keuangan • Garis Putus = Target Pagu / Bulan (Rp 3.8M)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-600 inline-block shadow-xs"></span>
                <span className={isDark ? "text-white" : "text-black"}>Realisasi</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-44 w-full flex items-end justify-between gap-1.5 pt-6 pb-2 px-1 border-b border-slate-200 dark:border-slate-800 relative">
              {/* Target Line */}
              <div className="absolute left-0 right-0 top-[38%] border-b-2 border-dashed border-red-500/60 z-10 flex items-center justify-end pr-2 pointer-events-none">
                <span className="bg-black text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-gray-700">
                  Target (3.8M)
                </span>
              </div>

              {MONTHLY_TREND_DATA.map((item, idx) => {
                const maxScale = 5.0
                const heightPct = (item.realisasi / maxScale) * 100

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group z-20">
                    <div className="w-full flex justify-center items-end h-full">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[20px] rounded-t transition-all duration-300 relative ${item.realisasi > 0
                          ? "bg-gradient-to-t from-red-700 to-red-500 group-hover:brightness-125"
                          : "bg-slate-200 dark:bg-slate-800"
                          }`}
                      >
                        {item.realisasi > 0 && (
                          <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-0.5 px-1.5 rounded border border-gray-700 font-mono font-bold whitespace-nowrap z-30 pointer-events-none">
                            Rp {item.realisasi}M
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold ${isDark ? "text-gray-300" : "text-black"}`}>{item.month}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Statistik Dokumen & Surat */}
        <DashboardChart theme={theme} />
      </div>

      {/* Table & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className={`h-full ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
              <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>Surat Menyurat Terbaru</h3>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow
                    className={
                      isDark ? "border-b border-white/30 bg-[#0a0e1a]" : "border-b border-slate-200 bg-slate-100"
                    }
                  >
                    <TableHead className={`text-[11px] font-extrabold uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}>
                      No. Surat
                    </TableHead>
                    <TableHead className={`text-[11px] font-extrabold uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}>
                      Perihal
                    </TableHead>
                    <TableHead className={`text-[11px] font-extrabold uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}>
                      Dari
                    </TableHead>
                    <TableHead className={`text-[11px] font-extrabold uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}>
                      Tanggal
                    </TableHead>
                    <TableHead className={`text-[11px] font-extrabold uppercase tracking-wider ${isDark ? "text-white" : "text-black"}`}>
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSurat.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={
                        isDark ? "hover:bg-white/[0.05] border-b border-white/20" : "hover:bg-slate-50 border-b border-slate-100"
                      }
                    >
                      <TableCell className="font-mono text-xs font-bold text-red-600 dark:text-red-400">{row.no}</TableCell>
                      <TableCell className={`font-semibold text-xs ${isDark ? "text-white" : "text-black !text-black"}`}>
                        {row.perihal}
                      </TableCell>
                      <TableCell className={`text-xs font-medium ${isDark ? "text-gray-200" : "text-slate-800"}`}>{row.dari}</TableCell>
                      <TableCell className={`text-xs font-medium whitespace-nowrap ${isDark ? "text-gray-300" : "text-slate-800"}`}>
                        {row.tanggal}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status as any}>{row.statusLabel}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className={`h-full ${isDark ? "bg-[#1e293b]/70 border-white/10" : "bg-white/85 border-slate-200"} backdrop-blur-md shadow-lg rounded-2xl`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
              <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-black"}`}>Aktivitas Terkini</h3>
            </div>
            <CardContent className="p-4 space-y-3.5">
              {recentActivities.map((act) => {
                const Icon = act.icon
                return (
                  <div key={act.id} className="flex items-center gap-3 text-xs">
                    <div className={`p-2.5 rounded-xl shrink-0 shadow-xs ${act.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold leading-snug truncate ${isDark ? "text-white" : "text-black"}`}>
                        {act.text}
                      </p>
                      <span className={`text-[10px] font-semibold mt-0.5 block ${isDark ? "text-gray-400" : "text-slate-600"}`}>{act.time}</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
