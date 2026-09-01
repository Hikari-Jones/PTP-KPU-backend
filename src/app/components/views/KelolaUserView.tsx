import { UserPlus } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { useState } from "react"

export function KelolaUserView({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark"
  const [users, setUsers] = useState([
    { id: 1, name: "Admin KPU Sulut", email: "admin@kpu.go.id", role: "Admin", status: "Aktif", subbagian: "PERDATIN (Perencanaan, Data dan Informasi)" },
    { id: 2, name: "Ahmad Kurniawan", email: "ahmad.kurniawan@kpu.go.id", role: "Operator", status: "Aktif", subbagian: "Teknis Penyelenggaraan Pemilu" },
    { id: 3, name: "Siti Rahmawati", email: "siti.rahma@kpu.go.id", role: "Operator", status: "Aktif", subbagian: "Hukum" },
    { id: 4, name: "Budi Santoso", email: "budi.santoso@kpu.go.id", role: "Operator", status: "Non-Aktif", subbagian: "UMLOG (Umum dan Logistik)" },
  ])

  const toggleStatus = (id: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "Aktif" ? "Non-Aktif" : "Aktif" } : u))
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight my-0 ${isDark ? "text-white" : "text-slate-900"}`}>
            Manajemen User & Hak Akses
          </h1>
          <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
            Kelola daftar operator instansi dan penetapan role Admin/Operator PTP-KPU
          </p>
        </div>
        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer shrink-0">
          <UserPlus className="w-4 h-4" />
          <span>Tambah User Baru</span>
        </button>
      </div>

      <Card className={isDark ? "bg-[#0d1322] border-[#1e293b]" : "bg-white border-slate-200 shadow-sm"}>
        <div className={`p-4 border-b ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
          <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-800"}`}>Daftar Akun Terdaftar</h3>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className={isDark ? "border-b border-[#1e293b]" : "border-b border-slate-200 bg-slate-50"}>
                <TableHead className="text-[11px]">Nama Pengguna</TableHead>
                <TableHead className="text-[11px]">Email</TableHead>
                <TableHead className="text-[11px]">Subbagian / Subbagian</TableHead>
                <TableHead className="text-[11px]">Role</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className={isDark ? "border-b border-[#1e293b]/40 hover:bg-[#131d30]" : "border-b border-slate-100 hover:bg-slate-50"}>
                  <TableCell className="font-bold text-xs">{u.name}</TableCell>
                  <TableCell className="text-xs font-mono">{u.email}</TableCell>
                  <TableCell className="text-xs text-slate-400">{u.subbagian}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${u.role === "Admin" ? "bg-red-600 text-white" : "bg-blue-600/20 text-blue-400 border border-blue-500/30"}`}>
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.status === "Aktif" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" : "bg-slate-500/10 text-slate-400"}`}>
                      {u.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleStatus(u.id)}
                      className="px-2 py-1 rounded bg-slate-500/10 hover:bg-slate-500/20 text-xs font-medium cursor-pointer"
                    >
                      {u.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
