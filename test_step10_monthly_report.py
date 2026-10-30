import asyncio
from datetime import date
from decimal import Decimal
import httpx
from sqlalchemy import select, delete

from app.main import app
from app.core.database import AsyncSessionLocal
from app.models.schema import (
    Bagian,
    Pegawai,
    TahunAnggaran,
    AkunAnggaran,
    PaguAnggaran,
    RevisiAnggaran,
    RealisasiAnggaran,
)

async def cleanup_test_data(session):
    """Clean up all records related to Step 10 tests."""
    await session.execute(delete(RevisiAnggaran))
    await session.execute(delete(RealisasiAnggaran))
    await session.execute(delete(PaguAnggaran))
    await session.execute(delete(AkunAnggaran).where(AkunAnggaran.kode_akun.like("529%")))
    await session.execute(delete(TahunAnggaran).where(TahunAnggaran.tahun.in_([2026, 2027])))
    await session.execute(delete(Pegawai).where(Pegawai.nip.in_(["99991001", "99991002"])))
    await session.execute(delete(Bagian).where(Bagian.kode_bagian.in_(["BAG-P10A", "BAG-P10B"])))
    await session.commit()

async def run_step10_tests():
    print("==================================================")
    print("STARTING STEP 10 DASHBOARD SUMMARY & MONTHLY REPORT TEST SUITE")
    print("==================================================")

    async with AsyncSessionLocal() as session:
        await cleanup_test_data(session)

        # 1. Base Setup: Bagian A (Keuangan), Bagian B (Teknis), Pegawai
        bagian_a = Bagian(kode_bagian="BAG-P10A", nama_bagian="Bagian Keuangan P10")
        bagian_b = Bagian(kode_bagian="BAG-P10B", nama_bagian="Bagian Teknis P10")
        session.add_all([bagian_a, bagian_b])
        await session.flush()

        operator = Pegawai(
            id_bagian=bagian_a.id_bagian,
            nama="Operator P10",
            nip="99991001",
            jabatan="Staff Perencanaan",
            password="pwd",
            role="operator",
        )
        admin = Pegawai(
            id_bagian=bagian_a.id_bagian,
            nama="Admin P10",
            nip="99991002",
            jabatan="Kepala Bagian",
            password="pwd",
            role="admin",
        )
        session.add_all([operator, admin])
        await session.flush()

        # 2. Master Akun Anggaran
        # Akun A: Bagian Keuangan (P10A)
        akun_a = AkunAnggaran(
            id_bagian=bagian_a.id_bagian,
            kode_akun="5291",
            nama_akun="Akun A Belanja Barang",
            total_pagu=Decimal("100000000.00"),
            jenis_belanja="Operasional",
            status="active",
        )
        # Akun B: Bagian Keuangan (P10A)
        akun_b = AkunAnggaran(
            id_bagian=bagian_a.id_bagian,
            kode_akun="5292",
            nama_akun="Akun B Belanja Jasa",
            total_pagu=Decimal("50000000.00"),
            jenis_belanja="Operasional",
            status="active",
        )
        # Akun C: Bagian Teknis (P10B)
        akun_c = AkunAnggaran(
            id_bagian=bagian_b.id_bagian,
            kode_akun="5293",
            nama_akun="Akun C Belanja Modal",
            total_pagu=Decimal("200000000.00"),
            jenis_belanja="Modal",
            status="active",
        )
        # Akun D: Akun dengan Pagu = 0
        akun_d = AkunAnggaran(
            id_bagian=bagian_b.id_bagian,
            kode_akun="5294",
            nama_akun="Akun D Pagu Nol",
            total_pagu=Decimal("0.00"),
            jenis_belanja="Operasional",
            status="active",
        )
        session.add_all([akun_a, akun_b, akun_c, akun_d])
        await session.flush()

        # 3. Setup Tahun 2026 (Active) and Tahun 2027 (Draft / Upcoming)
        ta_2026 = TahunAnggaran(
            tahun=2026,
            status="active",
            tanggal_mulai=date(2026, 1, 1),
            tanggal_selesai=date(2026, 12, 31),
            deskripsi="Tahun Anggaran 2026 Active",
            id_pegawai_pembuat=admin.id_pegawai,
        )
        ta_2027 = TahunAnggaran(
            tahun=2027,
            status="draft",
            tanggal_mulai=date(2027, 1, 1),
            tanggal_selesai=date(2027, 12, 31),
            deskripsi="Tahun Anggaran 2027 Draft",
            id_pegawai_pembuat=admin.id_pegawai,
        )
        session.add_all([ta_2026, ta_2027])
        await session.flush()

        # 4. Setup Pagu 2026:
        # Akun A: Pagu = 100M (100,000,000)
        pagu_2026_a = PaguAnggaran(
            id_tahun_anggaran=ta_2026.id_tahun_anggaran,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            pagu_awal=Decimal("100000000.00"),
            pagu_aktif=Decimal("100000000.00"),
            nomor_sk="SK-2026-A",
        )
        # Akun B: Pagu = 50M (50,000,000)
        pagu_2026_b = PaguAnggaran(
            id_tahun_anggaran=ta_2026.id_tahun_anggaran,
            id_akun_anggaran=akun_b.id_akun_anggaran,
            pagu_awal=Decimal("50000000.00"),
            pagu_aktif=Decimal("50000000.00"),
            nomor_sk="SK-2026-B",
        )
        # Akun C: Pagu = 200M (200,000,000)
        pagu_2026_c = PaguAnggaran(
            id_tahun_anggaran=ta_2026.id_tahun_anggaran,
            id_akun_anggaran=akun_c.id_akun_anggaran,
            pagu_awal=Decimal("200000000.00"),
            pagu_aktif=Decimal("200000000.00"),
            nomor_sk="SK-2026-C",
        )
        # Akun D: Pagu = 0
        pagu_2026_d = PaguAnggaran(
            id_tahun_anggaran=ta_2026.id_tahun_anggaran,
            id_akun_anggaran=akun_d.id_akun_anggaran,
            pagu_awal=Decimal("0.00"),
            pagu_aktif=Decimal("0.00"),
            nomor_sk="SK-2026-D",
        )

        # Setup Pagu 2027:
        # Akun A: Pagu = 80M
        pagu_2027_a = PaguAnggaran(
            id_tahun_anggaran=ta_2027.id_tahun_anggaran,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            pagu_awal=Decimal("80000000.00"),
            pagu_aktif=Decimal("80000000.00"),
            nomor_sk="SK-2027-A",
        )
        session.add_all([pagu_2026_a, pagu_2026_b, pagu_2026_c, pagu_2026_d, pagu_2027_a])
        await session.flush()

        # 5. Populate Realisasi 2026 Transaksi
        # TEST CONTOH WAJIB (Dataset Pengujian):
        # Akun A (Pagu = 100M):
        # - Verified: 10 Jan 2026 = 10,000,000
        # - Verified: 15 Feb 2026 = 15,000,000
        # - Verified: 20 Mar 2026 = 5,000,000
        # - Draft: 10 Apr 2026 = 10,000,000 (tidak boleh dihitung)
        # - Submitted: 10 Mei 2026 = 5,000,000 (tidak boleh dihitung)
        # - Rejected: 10 Jun 2026 = 5,000,000 (tidak boleh dihitung)
        # Total Realisasi Verified Akun A = 30M, Sisa = 70M, Persentase = 30%
        real_a1 = RealisasiAnggaran(
            id_pagu=pagu_2026_a.id_pagu,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            id_verifier=admin.id_pegawai,
            tanggal_transaksi=date(2026, 1, 10),
            nomor_dokumen="DOC-2026-A1",
            uraian_kegiatan="Operasional Kantor Jan",
            jumlah_realisasi=Decimal("10000000.00"),
            status="verified",
        )
        real_a2 = RealisasiAnggaran(
            id_pagu=pagu_2026_a.id_pagu,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            id_verifier=admin.id_pegawai,
            tanggal_transaksi=date(2026, 2, 15),
            nomor_dokumen="DOC-2026-A2",
            uraian_kegiatan="Operasional Kantor Feb",
            jumlah_realisasi=Decimal("15000000.00"),
            status="verified",
        )
        real_a3 = RealisasiAnggaran(
            id_pagu=pagu_2026_a.id_pagu,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            id_verifier=admin.id_pegawai,
            tanggal_transaksi=date(2026, 3, 20),
            nomor_dokumen="DOC-2026-A3",
            uraian_kegiatan="Operasional Kantor Mar",
            jumlah_realisasi=Decimal("5000000.00"),
            status="verified",
        )
        real_a4_draft = RealisasiAnggaran(
            id_pagu=pagu_2026_a.id_pagu,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            tanggal_transaksi=date(2026, 4, 10),
            nomor_dokumen="DOC-2026-A4-DRAFT",
            uraian_kegiatan="Draft Belanja Apr",
            jumlah_realisasi=Decimal("10000000.00"),
            status="draft",
        )
        real_a5_sub = RealisasiAnggaran(
            id_pagu=pagu_2026_a.id_pagu,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            tanggal_transaksi=date(2026, 5, 10),
            nomor_dokumen="DOC-2026-A5-SUBMIT",
            uraian_kegiatan="Submitted Belanja Mei",
            jumlah_realisasi=Decimal("5000000.00"),
            status="submitted",
        )
        real_a6_rej = RealisasiAnggaran(
            id_pagu=pagu_2026_a.id_pagu,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            id_verifier=admin.id_pegawai,
            tanggal_transaksi=date(2026, 6, 10),
            nomor_dokumen="DOC-2026-A6-REJECT",
            uraian_kegiatan="Rejected Belanja Jun",
            jumlah_realisasi=Decimal("5000000.00"),
            status="rejected",
        )

        # Akun B (Pagu = 50M):
        # - Jan: 5,000,000 (verified)
        # - Feb: 2,000,000 (verified)
        # - Mar: 3,000,000 (verified)
        # Total Realisasi Verified = 10M, Sisa = 40M, Persentase = 20%
        real_b1 = RealisasiAnggaran(
            id_pagu=pagu_2026_b.id_pagu,
            id_akun_anggaran=akun_b.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            id_verifier=admin.id_pegawai,
            tanggal_transaksi=date(2026, 1, 15),
            nomor_dokumen="DOC-2026-B1",
            uraian_kegiatan="Belanja Jasa Jan",
            jumlah_realisasi=Decimal("5000000.00"),
            status="verified",
        )
        real_b2 = RealisasiAnggaran(
            id_pagu=pagu_2026_b.id_pagu,
            id_akun_anggaran=akun_b.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            id_verifier=admin.id_pegawai,
            tanggal_transaksi=date(2026, 2, 20),
            nomor_dokumen="DOC-2026-B2",
            uraian_kegiatan="Belanja Jasa Feb",
            jumlah_realisasi=Decimal("2000000.00"),
            status="verified",
        )
        real_b3 = RealisasiAnggaran(
            id_pagu=pagu_2026_b.id_pagu,
            id_akun_anggaran=akun_b.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            id_verifier=admin.id_pegawai,
            tanggal_transaksi=date(2026, 3, 25),
            nomor_dokumen="DOC-2026-B3",
            uraian_kegiatan="Belanja Jasa Mar",
            jumlah_realisasi=Decimal("3000000.00"),
            status="verified",
        )

        # Akun C (Pagu = 200M):
        # - Jan: 20,000,000 (verified)
        # - Feb: 10,000,000 (verified)
        # - Mar: 15,000,000 (verified)
        # Total Realisasi Verified = 45M, Sisa = 155M, Persentase = 22.5%
        real_c1 = RealisasiAnggaran(
            id_pagu=pagu_2026_c.id_pagu,
            id_akun_anggaran=akun_c.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            id_verifier=admin.id_pegawai,
            tanggal_transaksi=date(2026, 1, 5),
            nomor_dokumen="DOC-2026-C1",
            uraian_kegiatan="Belanja Modal Jan",
            jumlah_realisasi=Decimal("20000000.00"),
            status="verified",
        )
        real_c2 = RealisasiAnggaran(
            id_pagu=pagu_2026_c.id_pagu,
            id_akun_anggaran=akun_c.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            id_verifier=admin.id_pegawai,
            tanggal_transaksi=date(2026, 2, 8),
            nomor_dokumen="DOC-2026-C2",
            uraian_kegiatan="Belanja Modal Feb",
            jumlah_realisasi=Decimal("10000000.00"),
            status="verified",
        )
        real_c3 = RealisasiAnggaran(
            id_pagu=pagu_2026_c.id_pagu,
            id_akun_anggaran=akun_c.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            id_verifier=admin.id_pegawai,
            tanggal_transaksi=date(2026, 3, 12),
            nomor_dokumen="DOC-2026-C3",
            uraian_kegiatan="Belanja Modal Mar",
            jumlah_realisasi=Decimal("15000000.00"),
            status="verified",
        )

        # 6. Realisasi Tahun 2027 (Terisolasi):
        # Akun A pada 2027:
        # - Des 2027: 12,000,000 (verified)
        real_2027_a = RealisasiAnggaran(
            id_pagu=pagu_2027_a.id_pagu,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            id_pegawai=operator.id_pegawai,
            id_verifier=admin.id_pegawai,
            tanggal_transaksi=date(2027, 12, 1),
            nomor_dokumen="DOC-2027-A1",
            uraian_kegiatan="Belanja Des 2027",
            jumlah_realisasi=Decimal("12000000.00"),
            status="verified",
        )

        session.add_all([
            real_a1, real_a2, real_a3, real_a4_draft, real_a5_sub, real_a6_rej,
            real_b1, real_b2, real_b3,
            real_c1, real_c2, real_c3,
            real_2027_a,
        ])
        await session.commit()

        id_ta_2026 = ta_2026.id_tahun_anggaran
        id_ta_2027 = ta_2027.id_tahun_anggaran
        id_akun_a = akun_a.id_akun_anggaran
        id_akun_b = akun_b.id_akun_anggaran
        id_akun_c = akun_c.id_akun_anggaran
        id_akun_d = akun_d.id_akun_anggaran
        id_bg_a = bagian_a.id_bagian
        id_bg_b = bagian_b.id_bagian

    # HTTP API Testing
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # ----------------------------------------------------
        # TEST 1: Summary Tahun 2026 (Active)
        # Total Pagu = 100M + 50M + 200M + 0M = 350,000,000
        # Total Realisasi Verified = 30M (A) + 10M (B) + 45M (C) = 85,000,000
        # Sisa = 350M - 85M = 265,000,000
        # Persentase = (85M / 350M) * 100 = 24.29%
        # Transaksi Verified = 9, Draft = 1, Submitted = 1, Rejected = 1
        # ----------------------------------------------------
        res_sum_2026 = await client.get(f"/api/v1/anggaran/summary?id_tahun_anggaran={id_ta_2026}")
        assert res_sum_2026.status_code == 200, res_sum_2026.text
        sum_2026 = res_sum_2026.json()
        assert Decimal(str(sum_2026["total_pagu_aktif"])) == Decimal("350000000.00")
        assert Decimal(str(sum_2026["total_realisasi_verified"])) == Decimal("85000000.00")
        assert Decimal(str(sum_2026["total_sisa_anggaran"])) == Decimal("265000000.00")
        assert sum_2026["persentase_serapan"] == 24.29
        assert sum_2026["total_transaksi_verified"] == 9
        assert sum_2026["total_transaksi_draft"] == 1
        assert sum_2026["total_transaksi_submitted"] == 1
        assert sum_2026["total_transaksi_rejected"] == 1
        print("[TEST 1 PASSED] Summary Tahun 2026: Pagu=350M, Verified=85M, Sisa=265M, Serapan=24.29%")

        # ----------------------------------------------------
        # TEST 2: Summary Tahun 2027 (Terisolasi dari 2026)
        # Total Pagu = 80M
        # Verified Realisasi = 12M (Bulan Desember)
        # Sisa = 68M
        # Serapan = 15.0%
        # Transaksi Verified = 1, Draft = 0, Submitted = 0, Rejected = 0
        # ----------------------------------------------------
        res_sum_2027 = await client.get(f"/api/v1/anggaran/summary?id_tahun_anggaran={id_ta_2027}")
        assert res_sum_2027.status_code == 200, res_sum_2027.text
        sum_2027 = res_sum_2027.json()
        assert Decimal(str(sum_2027["total_pagu_aktif"])) == Decimal("80000000.00")
        assert Decimal(str(sum_2027["total_realisasi_verified"])) == Decimal("12000000.00")
        assert Decimal(str(sum_2027["total_sisa_anggaran"])) == Decimal("68000000.00")
        assert sum_2027["persentase_serapan"] == 15.0
        assert sum_2027["total_transaksi_verified"] == 1
        assert sum_2027["total_transaksi_draft"] == 0
        print("[TEST 2 PASSED] Summary Tahun 2027: Pagu=80M, Verified=12M, Sisa=68M, Serapan=15.0% (Isolasi Tahun Terbukti)")

        # ----------------------------------------------------
        # TEST 3: Monthly Report Tahun 2026 Matriks Keseluruhan
        # ----------------------------------------------------
        res_mr_2026 = await client.get(f"/api/v1/anggaran/monthly-report?id_tahun_anggaran={id_ta_2026}")
        assert res_mr_2026.status_code == 200, res_mr_2026.text
        mr_2026 = res_mr_2026.json()
        assert mr_2026["id_tahun_anggaran"] == id_ta_2026
        assert mr_2026["tahun"] == 2026
        assert len(mr_2026["rows"]) == 4

        # Map rows by id_akun_anggaran
        rows_by_id = {r["id_akun_anggaran"]: r for r in mr_2026["rows"]}

        # ----------------------------------------------------
        # TEST 4: Verifikasi DATASET PENGUJIAN CONTOH WAJIB (Akun A)
        # Pagu = 100M
        # Jan = 10M, Feb = 15M, Mar = 5M
        # Apr = 0, Mei = 0, Jun = 0, Jul-Des = 0
        # Total Realisasi = 30M, Sisa = 70M, Persentase = 30%
        # ----------------------------------------------------
        row_a = rows_by_id[id_akun_a]
        assert Decimal(str(row_a["pagu"])) == Decimal("100000000.00")
        assert Decimal(str(row_a["januari"])) == Decimal("10000000.00")
        assert Decimal(str(row_a["februari"])) == Decimal("15000000.00")
        assert Decimal(str(row_a["maret"])) == Decimal("5000000.00")
        assert Decimal(str(row_a["april"])) == Decimal("0.00"), "Draft April tidak boleh dihitung"
        assert Decimal(str(row_a["mei"])) == Decimal("0.00"), "Submitted Mei tidak boleh dihitung"
        assert Decimal(str(row_a["juni"])) == Decimal("0.00"), "Rejected Juni tidak boleh dihitung"
        assert Decimal(str(row_a["juli"])) == Decimal("0.00")
        assert Decimal(str(row_a["agustus"])) == Decimal("0.00")
        assert Decimal(str(row_a["september"])) == Decimal("0.00")
        assert Decimal(str(row_a["oktober"])) == Decimal("0.00")
        assert Decimal(str(row_a["november"])) == Decimal("0.00")
        assert Decimal(str(row_a["desember"])) == Decimal("0.00")
        assert Decimal(str(row_a["total_realisasi"])) == Decimal("30000000.00")
        assert Decimal(str(row_a["sisa_anggaran"])) == Decimal("70000000.00")
        assert row_a["persentase_realisasi"] == 30.0
        print("[TEST 3 & 4 PASSED] Dataset Contoh Wajib (Akun A): Pagu=100M, Jan=10M, Feb=15M, Mar=5M, Total=30M, Sisa=70M, Serapan=30%")

        # ----------------------------------------------------
        # TEST 5: Verifikasi Akun B
        # Pagu = 50M, Jan = 5M, Feb = 2M, Mar = 3M, Total = 10M, Sisa = 40M, % = 20%
        # ----------------------------------------------------
        row_b = rows_by_id[id_akun_b]
        assert Decimal(str(row_b["pagu"])) == Decimal("50000000.00")
        assert Decimal(str(row_b["januari"])) == Decimal("5000000.00")
        assert Decimal(str(row_b["februari"])) == Decimal("2000000.00")
        assert Decimal(str(row_b["maret"])) == Decimal("3000000.00")
        assert Decimal(str(row_b["total_realisasi"])) == Decimal("10000000.00")
        assert Decimal(str(row_b["sisa_anggaran"])) == Decimal("40000000.00")
        assert row_b["persentase_realisasi"] == 20.0
        print("[TEST 5 PASSED] Akun B: Pagu=50M, Jan=5M, Feb=2M, Mar=3M, Total=10M, Sisa=40M, Serapan=20%")

        # ----------------------------------------------------
        # TEST 6: Verifikasi Akun C
        # Pagu = 200M, Jan = 20M, Feb = 10M, Mar = 15M, Total = 45M, Sisa = 155M, % = 22.5%
        # ----------------------------------------------------
        row_c = rows_by_id[id_akun_c]
        assert Decimal(str(row_c["pagu"])) == Decimal("200000000.00")
        assert Decimal(str(row_c["januari"])) == Decimal("20000000.00")
        assert Decimal(str(row_c["februari"])) == Decimal("10000000.00")
        assert Decimal(str(row_c["maret"])) == Decimal("15000000.00")
        assert Decimal(str(row_c["total_realisasi"])) == Decimal("45000000.00")
        assert Decimal(str(row_c["sisa_anggaran"])) == Decimal("155000000.00")
        assert row_c["persentase_realisasi"] == 22.5
        print("[TEST 6 PASSED] Akun C: Pagu=200M, Jan=20M, Feb=10M, Mar=15M, Total=45M, Sisa=155M, Serapan=22.5%")

        # ----------------------------------------------------
        # TEST 7: Akun D dengan Pagu = 0 (Division by zero safety)
        # ----------------------------------------------------
        row_d = rows_by_id[id_akun_d]
        assert Decimal(str(row_d["pagu"])) == Decimal("0.00")
        assert Decimal(str(row_d["total_realisasi"])) == Decimal("0.00")
        assert Decimal(str(row_d["sisa_anggaran"])) == Decimal("0.00")
        assert row_d["persentase_realisasi"] == 0.0
        print("[TEST 7 PASSED] Akun D dengan Pagu = 0 aman, persentase_realisasi = 0.0%")

        # ----------------------------------------------------
        # TEST 8: TOTAL ROW MONTHLY REPORT 2026
        # Total Pagu = 350M
        # Total Jan = 10M + 5M + 20M = 35M
        # Total Feb = 15M + 2M + 10M = 27M
        # Total Mar = 5M + 3M + 15M = 23M
        # Total Apr - Des = 0
        # Total Realisasi = 85M
        # Total Sisa = 265M
        # Total Persentase = 24.29%
        # ----------------------------------------------------
        tot = mr_2026["total"]
        assert Decimal(str(tot["pagu"])) == Decimal("350000000.00")
        assert Decimal(str(tot["januari"])) == Decimal("35000000.00")
        assert Decimal(str(tot["februari"])) == Decimal("27000000.00")
        assert Decimal(str(tot["maret"])) == Decimal("23000000.00")
        assert Decimal(str(tot["april"])) == Decimal("0.00")
        assert Decimal(str(tot["total_realisasi"])) == Decimal("85000000.00")
        assert Decimal(str(tot["sisa_anggaran"])) == Decimal("265000000.00")
        assert tot["persentase_realisasi"] == 24.29
        print("[TEST 8 PASSED] Total Row Monthly Report 2026: Pagu=350M, Jan=35M, Feb=27M, Mar=23M, Total=85M, Sisa=265M, Serapan=24.29%")

        # ----------------------------------------------------
        # TEST 9: CONSISTENCY CHECK — Dashboard Summary vs Monthly Report Total
        # ----------------------------------------------------
        assert Decimal(str(sum_2026["total_pagu_aktif"])) == Decimal(str(tot["pagu"]))
        assert Decimal(str(sum_2026["total_realisasi_verified"])) == Decimal(str(tot["total_realisasi"]))
        assert Decimal(str(sum_2026["total_sisa_anggaran"])) == Decimal(str(tot["sisa_anggaran"]))
        assert sum_2026["persentase_serapan"] == tot["persentase_realisasi"]
        print("[TEST 9 PASSED] KONSISTENSI DATA 100% MATCH: Dashboard Summary == Monthly Report Total")

        # ----------------------------------------------------
        # TEST 10: Monthly Report Tahun 2027 (Terisolasi)
        # Hanya Akun A dengan Pagu = 80M, Des = 12M, Total Realisasi = 12M
        # ----------------------------------------------------
        res_mr_2027 = await client.get(f"/api/v1/anggaran/monthly-report?id_tahun_anggaran={id_ta_2027}")
        assert res_mr_2027.status_code == 200, res_mr_2027.text
        mr_2027 = res_mr_2027.json()
        assert len(mr_2027["rows"]) == 1
        r_2027_a = mr_2027["rows"][0]
        assert Decimal(str(r_2027_a["pagu"])) == Decimal("80000000.00")
        assert Decimal(str(r_2027_a["januari"])) == Decimal("0.00")
        assert Decimal(str(r_2027_a["desember"])) == Decimal("12000000.00")
        assert Decimal(str(r_2027_a["total_realisasi"])) == Decimal("12000000.00")
        assert Decimal(str(r_2027_a["sisa_anggaran"])) == Decimal("68000000.00")
        assert r_2027_a["persentase_realisasi"] == 15.0
        assert Decimal(str(mr_2027["total"]["pagu"])) == Decimal(str(sum_2027["total_pagu_aktif"]))
        assert Decimal(str(mr_2027["total"]["total_realisasi"])) == Decimal(str(sum_2027["total_realisasi_verified"]))
        print("[TEST 10 PASSED] Monthly Report Tahun 2027: Terisolasi, Desember=12M, Total=12M, Sisa=68M, Dashboard & Report MATCH")

        # ----------------------------------------------------
        # TEST 11: Filter Akun Anggaran pada Monthly Report & Summary
        # Filter: id_akun_anggaran = Akun A
        # ----------------------------------------------------
        res_filter_acc = await client.get(
            f"/api/v1/anggaran/monthly-report?id_tahun_anggaran={id_ta_2026}&id_akun_anggaran={id_akun_a}"
        )
        assert res_filter_acc.status_code == 200, res_filter_acc.text
        mr_filtered_acc = res_filter_acc.json()
        assert len(mr_filtered_acc["rows"]) == 1
        assert mr_filtered_acc["rows"][0]["id_akun_anggaran"] == id_akun_a
        assert Decimal(str(mr_filtered_acc["total"]["pagu"])) == Decimal("100000000.00")
        assert Decimal(str(mr_filtered_acc["total"]["total_realisasi"])) == Decimal("30000000.00")

        res_sum_acc = await client.get(
            f"/api/v1/anggaran/summary?id_tahun_anggaran={id_ta_2026}&id_akun_anggaran={id_akun_a}"
        )
        assert res_sum_acc.status_code == 200
        sum_acc = res_sum_acc.json()
        assert Decimal(str(sum_acc["total_pagu_aktif"])) == Decimal("100000000.00")
        assert Decimal(str(sum_acc["total_realisasi_verified"])) == Decimal("30000000.00")
        print("[TEST 11 PASSED] Filter Akun Anggaran (Akun A): Hanya Akun A yang tampil, Summary & Monthly Report MATCH")

        # ----------------------------------------------------
        # TEST 12: Filter Bagian pada Monthly Report & Summary
        # Bagian A (Keuangan) memiliki Akun A & B (Pagu: 100M + 50M = 150M, Realisasi: 30M + 10M = 40M)
        # ----------------------------------------------------
        res_filter_bg = await client.get(
            f"/api/v1/anggaran/monthly-report?id_tahun_anggaran={id_ta_2026}&id_bagian={id_bg_a}"
        )
        assert res_filter_bg.status_code == 200, res_filter_bg.text
        mr_filtered_bg = res_filter_bg.json()
        assert len(mr_filtered_bg["rows"]) == 2
        assert Decimal(str(mr_filtered_bg["total"]["pagu"])) == Decimal("150000000.00")
        assert Decimal(str(mr_filtered_bg["total"]["total_realisasi"])) == Decimal("40000000.00")
        assert Decimal(str(mr_filtered_bg["total"]["sisa_anggaran"])) == Decimal("110000000.00")

        res_sum_bg = await client.get(
            f"/api/v1/anggaran/summary?id_tahun_anggaran={id_ta_2026}&id_bagian={id_bg_a}"
        )
        assert res_sum_bg.status_code == 200
        sum_bg = res_sum_bg.json()
        assert Decimal(str(sum_bg["total_pagu_aktif"])) == Decimal("150000000.00")
        assert Decimal(str(sum_bg["total_realisasi_verified"])) == Decimal("40000000.00")
        print("[TEST 12 PASSED] Filter Bagian (Bagian Keuangan): Pagu=150M, Realisasi=40M, Sisa=110M, Summary & Monthly Report MATCH")

        # ----------------------------------------------------
        # TEST 13: Tahun Closed Tetap Dapat Dibaca (Read-Only)
        # Ubah tahun 2026 menjadi closed
        # ----------------------------------------------------
        async with AsyncSessionLocal() as session:
            t2026 = await session.get(TahunAnggaran, id_ta_2026)
            t2026.status = "closed"
            await session.commit()

        res_closed_sum = await client.get(f"/api/v1/anggaran/summary?id_tahun_anggaran={id_ta_2026}")
        assert res_closed_sum.status_code == 200
        assert res_closed_sum.json()["status_tahun"] == "closed"
        assert Decimal(str(res_closed_sum.json()["total_pagu_aktif"])) == Decimal("350000000.00")

        res_closed_mr = await client.get(f"/api/v1/anggaran/monthly-report?id_tahun_anggaran={id_ta_2026}")
        assert res_closed_mr.status_code == 200
        assert res_closed_mr.json()["status_tahun"] == "closed"
        assert Decimal(str(res_closed_mr.json()["total"]["total_realisasi"])) == Decimal("85000000.00")
        print("[TEST 13 PASSED] Tahun closed tetap dapat dibaca secara aman pada Summary dan Monthly Report")

    # Cleanup at end
    async with AsyncSessionLocal() as session:
        await cleanup_test_data(session)

    print("==================================================")
    print("ALL 13 STEP 10 TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_step10_tests())
