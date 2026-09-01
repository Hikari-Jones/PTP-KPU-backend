export interface AkunAnggaran {
  kode: string
  nama: string
  pagu: number
  realisasi: number
  sisa: number
}

export interface TransaksiRealisasi {
  id: string
  tanggal: string
  noDokumen: string
  kodeAkun: string
  namaAkun: string
  subbagian: string
  usulanKegiatan: string
  jumlah: number
  buktiFile: string | null
  status: "Draft" | "Menunggu Verifikasi" | "Disetujui" | "Ditolak"
  periode: string
}
