import { Mail, Archive, TrendingUp, Wallet, Settings, Trash2 } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { DashboardChart } from "../ui/chart"

export function DashboardView({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark"

  const recentSurat = [
    {
      no: "001/KPU-SU/VI/2026",
      perihal: "Undangan Rapat Pleno Rekapitulasi DPT",
      dari: "Ketua KPU Provinsi",
      tanggal: "20 Jun 2026",
      status: "terkirim",
      statusLabel: "terkirim",
    },
    {
      no: "002/KPU-SU/VI/2026",
      perihal: "Laporan Rekap DPT Kab. Minahasa 2026",
      dari: "KPU Kab. Minahasa",
      tanggal: "19 Jun 2026",
      status: "diterima",
      statusLabel: "diterima",
    },
    {
      no: "003/KPU-SU/VI/2026",
      perihal: "Permohonan Klarifikasi Data Pemilih",
      dari: "Bawaslu Sulut",
      tanggal: "18 Jun 2026",
      status: "diproses",
      statusLabel: "diproses",
    },
    {
      no: "004/KPU-SU/VI/2026",
      perihal: "Nota Dinas Pengadaan Logistik Pilkada",
      dari: "Subbagian Logistik",
      tanggal: "17 Jun 2026",
      status: "draft",
      statusLabel: "draft",
    },
  ]

  const recentActivities = [
    {
      id: 1,
      icon: Mail,
      text: "Surat Undangan Pleno KPU No. 042 diterima",
      time: "09:24",
      iconColor: "text-red-600 bg-red-500/10 border border-red-500/20",
    },
    {
      id: 2,
      icon: Archive,
      text: "Dokumen Arsip Pilkada 2026 telah diverifikasi",
      time: "08:50",
      iconColor: "text-emerald-600 bg-emerald-500/10 border border-emerald-500/20",
    },
    {
      id: 3,
      icon: Wallet,
      text: "Laporan Pengeluaran Operasional disetujui",
      time: "08:15",
      iconColor: "text-amber-600 bg-amber-500/10 border border-amber-500/20",
    },
    {
      id: 4,
      icon: Settings,
      text: "Konfigurasi keamanan sistem diperbarui",
      time: "Kemarin",
      iconColor: "text-purple-600 bg-purple-500/10 border border-purple-500/20",
    },
    {
      id: 5,
      icon: Trash2,
      text: "5 draf dokumen kadaluarsa dibersihkan",
      time: "2 hari lalu",
      iconColor: "text-slate-500 bg-slate-500/10 border border-slate-500/20",
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title */}
      <div>
        <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
          Dashboard Operasional
        </h1>
        <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          Ringkasan data operasional Platform Terpadu Penunjang KPU Sulawesi Utara
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card
          className={
            isDark
              ? "bg-gradient-to-br from-[#0e1628] to-[#0a101d] border-[#1e293b]"
              : "bg-white border-slate-200 shadow-sm"
          }
        >
          <CardContent className="p-6 pt-6 flex items-start justify-between">
            <div>
              <div className="mt-3 mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 inline-block shadow-xs">
                <Mail className="w-5 h-5" />
              </div>
              <p className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                Surat Masuk Aktif
              </p>
              <h2 className={`text-3xl font-extrabold mt-1 mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>12</h2>
              <p className={`text-xs flex items-center gap-1 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>3 memerlukan respons mendesak</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={
            isDark
              ? "bg-gradient-to-br from-[#0e1628] to-[#0a101d] border-[#1e293b]"
              : "bg-white border-slate-200 shadow-sm"
          }
        >
          <CardContent className="p-6 pt-6 flex items-start justify-between">
            <div>
              <div className="mt-3 mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 inline-block shadow-xs">
                <Archive className="w-5 h-5" />
              </div>
              <p className={`text-[11px] font-bold tracking-wider uppercase ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                Arsip Dokumen
              </p>
              <h2 className={`text-3xl font-extrabold mt-1 mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>248</h2>
              <p className={`text-xs flex items-center gap-1 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span>6 diunggah bulan ini</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <DashboardChart theme={theme} />

      {/* Table & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card className={`h-full ${isDark ? "bg-[#0d1322]/80 border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
              <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Surat Menyurat Terbaru</h3>
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow
                    className={
                      isDark ? "border-b border-[#1e293b]/60 hover:bg-transparent" : "border-b border-slate-200 bg-slate-50"
                    }
                  >
                    <TableHead className={`text-[11px] uppercase tracking-wider ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                      No. Surat
                    </TableHead>
                    <TableHead className={`text-[11px] uppercase tracking-wider ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                      Perihal
                    </TableHead>
                    <TableHead className={`text-[11px] uppercase tracking-wider ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                      Dari
                    </TableHead>
                    <TableHead className={`text-[11px] uppercase tracking-wider ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                      Tanggal
                    </TableHead>
                    <TableHead className={`text-[11px] uppercase tracking-wider ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSurat.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={
                        isDark ? "hover:bg-[#1e293b]/40 border-b border-[#1e293b]/40" : "hover:bg-slate-50 border-b border-slate-100"
                      }
                    >
                      <TableCell className={`font-mono text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{row.no}</TableCell>
                      <TableCell className={`font-medium text-xs ${isDark ? "text-gray-200" : "text-slate-800"}`}>
                        {row.perihal}
                      </TableCell>
                      <TableCell className={`text-xs ${isDark ? "text-gray-400" : "text-slate-600"}`}>{row.dari}</TableCell>
                      <TableCell className={`text-xs whitespace-nowrap ${isDark ? "text-gray-400" : "text-slate-500"}`}>
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
          <Card className={`h-full ${isDark ? "bg-[#0d1322]/80 border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}`}>
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
              <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Aktivitas Terkini</h3>
            </div>
            <CardContent className="p-4 space-y-3.5">
              {recentActivities.map((act) => {
                const Icon = act.icon
                return (
                  <div key={act.id} className="flex items-center gap-3 text-xs">
                    <div className={`p-2.5 rounded-xl shrink-0 ${act.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium leading-snug truncate ${isDark ? "text-gray-200" : "text-slate-800"}`}>
                        {act.text}
                      </p>
                      <span className={`text-[10px] mt-0.5 block ${isDark ? "text-gray-400" : "text-slate-500"}`}>{act.time}</span>
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
