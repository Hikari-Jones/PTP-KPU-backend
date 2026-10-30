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
    """Clean up records related to Step 11 tests."""
    await session.execute(delete(RevisiAnggaran))
    await session.execute(delete(RealisasiAnggaran))
    await session.execute(delete(PaguAnggaran))
    await session.execute(delete(AkunAnggaran).where(AkunAnggaran.kode_akun.like("528%")))
    await session.execute(delete(TahunAnggaran).where(TahunAnggaran.tahun.in_([2026, 2027, 2028])))
    await session.execute(delete(Pegawai).where(Pegawai.nip.in_(["99991101", "99991102"])))
    await session.execute(delete(Bagian).where(Bagian.kode_bagian.in_(["BAG-P11A", "BAG-P11B"])))
    await session.commit()

async def run_step11_tests():
    print("==================================================")
    print("STARTING STEP 11 DYNAMIC DASHBOARD BY TAHUN ANGGARAN TEST SUITE")
    print("==================================================")

    async with AsyncSessionLocal() as session:
        await cleanup_test_data(session)

        # 1. Base Setup: Bagian, Pegawai
        bagian_a = Bagian(kode_bagian="BAG-P11A", nama_bagian="Bagian Keuangan P11")
        bagian_b = Bagian(kode_bagian="BAG-P11B", nama_bagian="Bagian Teknis P11")
        session.add_all([bagian_a, bagian_b])
        await session.commit()
        await session.refresh(bagian_a)
        await session.refresh(bagian_b)

        pegawai_adm = Pegawai(
            nip="99991101",
            nama="Admin Step11",
            password="pwd",
            jabatan="Administrator Keuangan",
            role="admin",
            id_bagian=bagian_a.id_bagian,
        )
        session.add(pegawai_adm)
        await session.commit()
        await session.refresh(pegawai_adm)

        # 2. Setup 3 Distinct Fiscal Years:
        # - Year 2026: ACTIVE
        # - Year 2027: CLOSED (Arsip / Read-Only)
        # - Year 2028: DRAFT (Planning, pagu = 0, realisasi = 0)
        ta_2026 = TahunAnggaran(
            tahun=2026,
            status="active",
            tanggal_mulai=date(2026, 1, 1),
            tanggal_selesai=date(2026, 12, 31),
            deskripsi="Tahun Anggaran 2026 Aktif",
            id_pegawai_pembuat=pegawai_adm.id_pegawai,
        )
        ta_2027 = TahunAnggaran(
            tahun=2027,
            status="closed",
            tanggal_mulai=date(2027, 1, 1),
            tanggal_selesai=date(2027, 12, 31),
            deskripsi="Tahun Anggaran 2027 Ditutup",
            id_pegawai_pembuat=pegawai_adm.id_pegawai,
        )
        ta_2028 = TahunAnggaran(
            tahun=2028,
            status="draft",
            tanggal_mulai=date(2028, 1, 1),
            tanggal_selesai=date(2028, 12, 31),
            deskripsi="Tahun Anggaran 2028 Draft",
            id_pegawai_pembuat=pegawai_adm.id_pegawai,
        )
        session.add_all([ta_2026, ta_2027, ta_2028])
        await session.commit()
        await session.refresh(ta_2026)
        await session.refresh(ta_2027)
        await session.refresh(ta_2028)

        # 3. Setup Accounts:
        # Akun A: Bagian A
        # Akun B: Bagian B
        akun_a = AkunAnggaran(
            kode_akun="528111",
            nama_akun="Belanja Operasional Step11",
            jenis_belanja="barang",
            id_bagian=bagian_a.id_bagian,
            status="active",
        )
        akun_b = AkunAnggaran(
            kode_akun="528112",
            nama_akun="Belanja Modal Step11",
            jenis_belanja="modal",
            id_bagian=bagian_b.id_bagian,
            status="active",
        )
        session.add_all([akun_a, akun_b])
        await session.commit()
        await session.refresh(akun_a)
        await session.refresh(akun_b)

        # 4. Setup Pagu:
        # For TA 2026:
        # - Akun A: Pagu 100.000.000
        # - Akun B: Pagu 50.000.000
        # Total Pagu 2026 = 150.000.000
        pagu_2026_a = PaguAnggaran(
            id_tahun_anggaran=ta_2026.id_tahun_anggaran,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            pagu_awal=Decimal("100000000.00"),
            pagu_aktif=Decimal("100000000.00"),
            nomor_sk="SK-2026-A",
            tanggal_sk=date(2026, 1, 2),
        )
        pagu_2026_b = PaguAnggaran(
            id_tahun_anggaran=ta_2026.id_tahun_anggaran,
            id_akun_anggaran=akun_b.id_akun_anggaran,
            pagu_awal=Decimal("50000000.00"),
            pagu_aktif=Decimal("50000000.00"),
            nomor_sk="SK-2026-B",
            tanggal_sk=date(2026, 1, 2),
        )

        # For TA 2027:
        # - Akun A: Pagu 80.000.000
        # Total Pagu 2027 = 80.000.000
        pagu_2027_a = PaguAnggaran(
            id_tahun_anggaran=ta_2027.id_tahun_anggaran,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            pagu_awal=Decimal("80000000.00"),
            pagu_aktif=Decimal("80000000.00"),
            nomor_sk="SK-2027-A",
            tanggal_sk=date(2027, 1, 2),
        )
        session.add_all([pagu_2026_a, pagu_2026_b, pagu_2027_a])
        await session.commit()
        await session.refresh(pagu_2026_a)
        await session.refresh(pagu_2026_b)
        await session.refresh(pagu_2027_a)

        # 5. Setup Realisasi:
        # For TA 2026:
        # - Realisasi Maret 2026 (Verified): 30.000.000 (Akun A)
        # - Realisasi April 2026 (Verified): 10.000.000 (Akun B)
        # - Realisasi Mei 2026 (Draft - should NOT count): 5.000.000
        real_2026_1 = RealisasiAnggaran(
            id_pagu=pagu_2026_a.id_pagu,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            id_pegawai=pegawai_adm.id_pegawai,
            id_verifier=pegawai_adm.id_pegawai,
            nomor_dokumen="TRX-2026-03",
            tanggal_transaksi=date(2026, 3, 15),
            jumlah_realisasi=Decimal("30000000.00"),
            uraian_kegiatan="Kegiatan Maret 2026",
            status="verified",
        )
        real_2026_2 = RealisasiAnggaran(
            id_pagu=pagu_2026_b.id_pagu,
            id_akun_anggaran=akun_b.id_akun_anggaran,
            id_pegawai=pegawai_adm.id_pegawai,
            id_verifier=pegawai_adm.id_pegawai,
            nomor_dokumen="TRX-2026-04",
            tanggal_transaksi=date(2026, 4, 10),
            jumlah_realisasi=Decimal("10000000.00"),
            uraian_kegiatan="Kegiatan April 2026",
            status="verified",
        )
        real_2026_draft = RealisasiAnggaran(
            id_pagu=pagu_2026_a.id_pagu,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            id_pegawai=pegawai_adm.id_pegawai,
            nomor_dokumen="TRX-2026-DFT",
            tanggal_transaksi=date(2026, 5, 1),
            jumlah_realisasi=Decimal("5000000.00"),
            uraian_kegiatan="Draft Tidak Boleh Dihitung",
            status="draft",
        )

        # For TA 2027:
        # - Realisasi Februari 2027 (Verified): 20.000.000 (Akun A)
        real_2027_1 = RealisasiAnggaran(
            id_pagu=pagu_2027_a.id_pagu,
            id_akun_anggaran=akun_a.id_akun_anggaran,
            id_pegawai=pegawai_adm.id_pegawai,
            id_verifier=pegawai_adm.id_pegawai,
            nomor_dokumen="TRX-2027-02",
            tanggal_transaksi=date(2027, 2, 20),
            jumlah_realisasi=Decimal("20000000.00"),
            uraian_kegiatan="Kegiatan Februari 2027",
            status="verified",
        )
        session.add_all([real_2026_1, real_2026_2, real_2026_draft, real_2027_1])
        await session.commit()

        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

            # ==============================================================
            # TEST 1: Default Summary (Tanpa parameter id_tahun_anggaran)
            # Sistem harus otomatis mengambil tahun berstatus active (2026)
            # ==============================================================
            res1 = await client.get("/api/v1/anggaran/summary")
            assert res1.status_code == 200, f"Expected 200, got {res1.status_code}: {res1.text}"
            data1 = res1.json()
            assert data1["tahun"] == 2026, f"Expected active year 2026, got {data1.get('tahun')}"
            assert Decimal(str(data1["total_pagu_aktif"])) == Decimal("150000000.00"), f"Wrong pagu active year: {data1['total_pagu_aktif']}"
            assert Decimal(str(data1["total_realisasi_verified"])) == Decimal("40000000.00"), f"Wrong realisasi: {data1['total_realisasi_verified']}"
            assert Decimal(str(data1["total_sisa_anggaran"])) == Decimal("110000000.00")
            print("[TEST 1 PASSED] Default Summary resolves automatically to active fiscal year (2026)")

            # ==============================================================
            # TEST 2: Filter Summary explicitly by id_tahun_anggaran (2026)
            # ==============================================================
            res2 = await client.get(f"/api/v1/anggaran/summary?id_tahun_anggaran={ta_2026.id_tahun_anggaran}")
            assert res2.status_code == 200
            data2 = res2.json()
            assert data2["tahun"] == 2026
            assert Decimal(str(data2["total_pagu_aktif"])) == Decimal("150000000.00")
            assert Decimal(str(data2["total_realisasi_verified"])) == Decimal("40000000.00")
            # Verify monthly trend contains 12 months with March=30M and April=10M
            recap_2026 = {m["bulan"]: Decimal(str(m["total_realisasi_verified"])) for m in data2["monthly_recap"]}
            assert recap_2026[3] == Decimal("30000000.00")
            assert recap_2026[4] == Decimal("10000000.00")
            assert recap_2026[5] == Decimal("0.00") # draft ignored
            print("[TEST 2 PASSED] Explicit id_tahun_anggaran (2026) returns correct isolated data & monthly recap")

            # ==============================================================
            # TEST 3: Switch Year to 2027 (Closed Fiscal Year)
            # ==============================================================
            res3 = await client.get(f"/api/v1/anggaran/summary?id_tahun_anggaran={ta_2027.id_tahun_anggaran}")
            assert res3.status_code == 200
            data3 = res3.json()
            assert data3["tahun"] == 2027
            assert Decimal(str(data3["total_pagu_aktif"])) == Decimal("80000000.00")
            assert Decimal(str(data3["total_realisasi_verified"])) == Decimal("20000000.00")
            assert Decimal(str(data3["total_sisa_anggaran"])) == Decimal("60000000.00")
            recap_2027 = {m["bulan"]: Decimal(str(m["total_realisasi_verified"])) for m in data3["monthly_recap"]}
            assert recap_2027[2] == Decimal("20000000.00")
            assert recap_2027[3] == Decimal("0.00") # No 2026 data leaked into 2027!
            print("[TEST 3 PASSED] Switching to 2027 isolates data completely from 2026 without data leakage")

            # ==============================================================
            # TEST 4: Switch Year to 2028 (Draft Year with No Pagu)
            # ==============================================================
            res4 = await client.get(f"/api/v1/anggaran/summary?id_tahun_anggaran={ta_2028.id_tahun_anggaran}")
            assert res4.status_code == 200
            data4 = res4.json()
            assert data4["tahun"] == 2028
            assert Decimal(str(data4["total_pagu_aktif"])) == Decimal("0.00")
            assert Decimal(str(data4["total_realisasi_verified"])) == Decimal("0.00")
            assert Decimal(str(data4["total_sisa_anggaran"])) == Decimal("0.00")
            assert Decimal(str(data4["persentase_serapan"])) == Decimal("0.00")
            print("[TEST 4 PASSED] Draft year with no pagu safely handles zero values without division by zero")

            # ==============================================================
            # TEST 5: Combined Filter: Year 2026 + Bagian A
            # ==============================================================
            res5 = await client.get(f"/api/v1/anggaran/summary?id_tahun_anggaran={ta_2026.id_tahun_anggaran}&id_bagian={bagian_a.id_bagian}")
            assert res5.status_code == 200
            data5 = res5.json()
            assert Decimal(str(data5["total_pagu_aktif"])) == Decimal("100000000.00")
            assert Decimal(str(data5["total_realisasi_verified"])) == Decimal("30000000.00")
            assert Decimal(str(data5["total_sisa_anggaran"])) == Decimal("70000000.00")
            print("[TEST 5 PASSED] Combined Year + Bagian filter correctly limits financial aggregates")

            # ==============================================================
            # TEST 6: Consistency Verification: Summary vs Monthly Report
            # Pagu, Realisasi, Sisa, Persentase MUST MATCH between Summary and Monthly Report
            # ==============================================================
            res_rep = await client.get(f"/api/v1/anggaran/monthly-report?id_tahun_anggaran={ta_2026.id_tahun_anggaran}")
            assert res_rep.status_code == 200
            data_rep = res_rep.json()
            tot = data_rep["total"]
            assert Decimal(str(tot["pagu"])) == Decimal(str(data2["total_pagu_aktif"]))
            assert Decimal(str(tot["total_realisasi"])) == Decimal(str(data2["total_realisasi_verified"]))
            assert Decimal(str(tot["sisa_anggaran"])) == Decimal(str(data2["total_sisa_anggaran"]))
            assert Decimal(str(tot["persentase_realisasi"])) == Decimal(str(data2["persentase_serapan"]))
            print("[TEST 6 PASSED] Absolute 100% consistency verified between Dashboard Summary and Monthly Report")

            # Cleanup
            await cleanup_test_data(session)

    print("==================================================")
    print("ALL STEP 11 DYNAMIC DASHBOARD TESTS PASSED!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_step11_tests())
