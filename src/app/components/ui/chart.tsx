import { Card, CardHeader, CardTitle, CardContent } from "./card"

export function DashboardChart({ theme = "light" }: { theme?: "light" | "dark" }) {
  const chartData = [
    { month: "Jan", surat: 45, arsip: 120 },
    { month: "Feb", surat: 62, arsip: 140 },
    { month: "Mar", surat: 78, arsip: 180 },
    { month: "Apr", surat: 95, arsip: 210 },
    { month: "Mei", surat: 110, arsip: 230 },
    { month: "Jun", surat: 128, arsip: 248 },
  ]

  const maxVal = 260
  const isDark = theme === "dark"

  return (
    <Card className={`mb-6 transition-colors duration-200 ${
      isDark ? "bg-[#0d1322]/80 border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"
    }`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>
            Statistik Dokumen & Surat (2026)
          </CardTitle>
          <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
            Tren pertumbuhan surat masuk dan arsip dokumen per bulan
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
            <span className={isDark ? "text-gray-300" : "text-slate-600"}>Surat Masuk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span className={isDark ? "text-gray-300" : "text-slate-600"}>Arsip Dokumen</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`h-44 w-full flex items-end justify-between gap-4 pt-6 pb-2 px-2 border-b ${
          isDark ? "border-[#1e293b]/60" : "border-slate-200"
        }`}>
          {chartData.map((item, index) => {
            const suratHeight = (item.surat / maxVal) * 100
            const arsipHeight = (item.arsip / maxVal) * 100

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full flex justify-center items-end gap-1.5 h-full">
                  <div
                    style={{ height: `${suratHeight}%` }}
                    className="w-1/3 bg-gradient-to-t from-red-600 to-red-400 rounded-t transition-all duration-300 group-hover:brightness-125 relative"
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-0.5 px-1.5 rounded border border-gray-700 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {item.surat}
                    </span>
                  </div>
                  <div
                    style={{ height: `${arsipHeight}%` }}
                    className="w-1/3 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all duration-300 group-hover:brightness-125 relative"
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-0.5 px-1.5 rounded border border-gray-700 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {item.arsip}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-slate-500"}`}>{item.month}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

