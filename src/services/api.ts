import type { KodeKlasifikasiArsip, JenisSurat, SuratKeluar } from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const INITIAL_KLASIFIKASI: KodeKlasifikasiArsip[] = [
  { id_klasifikasi: 1, kode_klasifikasi: 'PL.01.1', nama_klasifikasi: 'Perencanaan Pemilu & Pilkada', kategori_utama: 'Penyelenggaraan Pemilu', retensi_aktif_tahun: 2, retensi_inaktif_tahun: 5, hak_akses: 'Internal' },
  { id_klasifikasi: 2, kode_klasifikasi: 'PL.02.1', nama_klasifikasi: 'Pemutakhiran Data Pemilih', kategori_utama: 'Penyelenggaraan Pemilu', retensi_aktif_tahun: 3, retensi_inaktif_tahun: 5, hak_akses: 'Internal' },
  { id_klasifikasi: 3, kode_klasifikasi: 'HR.01.2', nama_klasifikasi: 'Surat Tugas & Kepegawaian', kategori_utama: 'SDM & Kepegawaian', retensi_aktif_tahun: 2, retensi_inaktif_tahun: 5, hak_akses: 'Internal' },
  { id_klasifikasi: 4, kode_klasifikasi: 'HK.01.1', nama_klasifikasi: 'Peraturan & Keputusan KPU', kategori_utama: 'Hukum', retensi_aktif_tahun: 5, retensi_inaktif_tahun: 10, hak_akses: 'Publik' },
  { id_klasifikasi: 5, kode_klasifikasi: 'KU.01.3', nama_klasifikasi: 'DIPA & Pertanggungjawaban Keuangan', kategori_utama: 'Keuangan', retensi_aktif_tahun: 5, retensi_inaktif_tahun: 7, hak_akses: 'Internal' },
  { id_klasifikasi: 6, kode_klasifikasi: 'IT.01.1', nama_klasifikasi: 'Data & Infrastruktur IT', kategori_utama: 'Data & Informasi', retensi_aktif_tahun: 2, retensi_inaktif_tahun: 5, hak_akses: 'Internal' },
];

export const INITIAL_JENIS_SURAT: JenisSurat[] = [
  { id_jenis_surat: 1, kode_jenis: 'SD', nama_jenis: 'Surat Dinas', format_nomor: '{nomor_urut}/{kode_klasifikasi}-SD/71/{bulan_romawi}/{tahun}' },
  { id_jenis_surat: 2, kode_jenis: 'ST', nama_jenis: 'Surat Tugas', format_nomor: '{nomor_urut}/{kode_klasifikasi}-ST/71/{bulan_romawi}/{tahun}' },
  { id_jenis_surat: 3, kode_jenis: 'ND', nama_jenis: 'Nota Dinas', format_nomor: '{nomor_urut}/ND-{kode_bagian}/71/{bulan_romawi}/{tahun}' },
  { id_jenis_surat: 4, kode_jenis: 'Kpt', nama_jenis: 'Keputusan KPU', format_nomor: '{nomor_urut}/{kode_klasifikasi}-Kpt/71/{tahun}' },
  { id_jenis_surat: 5, kode_jenis: 'Und', nama_jenis: 'Surat Undangan', format_nomor: '{nomor_urut}/{kode_klasifikasi}-Und/71/{bulan_romawi}/{tahun}' },
];

export const fetchKlasifikasi = async (): Promise<KodeKlasifikasiArsip[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/klasifikasi`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API backend offline, using local initial klasifikasi data', e);
  }
  return INITIAL_KLASIFIKASI;
};

export const fetchJenisSurat = async (): Promise<JenisSurat[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/jenis-surat`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API backend offline, using local initial jenis_surat data', e);
  }
  return INITIAL_JENIS_SURAT;
};

export const fetchSuratKeluar = async (): Promise<SuratKeluar[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/surat-keluar`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('API backend offline, using fallback list', e);
  }
  return [];
};

export const createDraftSuratKeluar = async (data: any): Promise<SuratKeluar> => {
  try {
    const res = await fetch(`${API_BASE_URL}/surat-keluar/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Backend API call failed, generating simulated draft', e);
  }
  return {
    id_surat_keluar: Math.floor(Math.random() * 1000) + 1,
    id_pegawai: data.id_pegawai || 1,
    id_bagian: data.id_bagian || 1,
    id_klasifikasi: data.id_klasifikasi || 1,
    id_jenis_surat: data.id_jenis_surat || 1,
    tahun: 2026,
    bulan_romawi: 'IX',
    sifat_surat: data.sifat_surat || 'Biasa',
    perihal: data.perihal,
    tujuan_surat: data.tujuan_surat,
    isi_surat: data.isi_surat,
    status: 'draft',
    tanggal_surat: data.tanggal_surat || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  };
};

export const finalisasiSuratAtomic = async (id_surat_keluar: number, id_pegawai: number = 1): Promise<SuratKeluar> => {
  try {
    const res = await fetch(`${API_BASE_URL}/surat-keluar/${id_surat_keluar}/finalisasi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_pegawai, catatan: 'Finalisasi penerbitan nomor resmi' }),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Backend API call failed, generating simulated atomic number', e);
  }
  const nextNum = Math.floor(Math.random() * 50) + 10;
  return {
    id_surat_keluar,
    id_pegawai,
    id_bagian: 1,
    id_klasifikasi: 2,
    id_jenis_surat: 1,
    nomor_urut: nextNum,
    nomor_surat: `${nextNum}/PL.02.1-SD/71/IX/2026`,
    tahun: 2026,
    bulan_romawi: 'IX',
    sifat_surat: 'Biasa',
    perihal: 'Surat Terbit Resmi',
    tujuan_surat: 'KPU Kabupaten/Kota Se-Sulut',
    status: 'terbit',
    tanggal_surat: new Date().toISOString().split('T')[0],
    tanggal_terbit: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
};
