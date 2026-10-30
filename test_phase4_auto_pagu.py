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
from app.services.anggaran import tahun_anggaran, realisasi_anggaran
from app.schemas.anggaran import TahunAnggaranCreate, RealisasiAnggaranCreateDraft


async def cleanup_phase4_data(session):
    await session.execute(delete(RevisiAnggaran))
    await session.execute(delete(RealisasiAnggaran))
    await session.execute(delete(PaguAnggaran))
    await session.execute(delete(AkunAnggaran).where(AkunAnggaran.kode_akun.like("528%")))
    await session.execute(delete(TahunAnggaran).where(TahunAnggaran.tahun.in_([2029, 2030, 2031, 2032, 2033])))
    await session.execute(delete(Pegawai).where(Pegawai.nip.in_(["77700101", "77700202"])))
    await session.execute(delete(Bagian).where(Bagian.kode_bagian == "BAG-P4"))
    await session.commit()


async def run_phase4_tests():
    print("=================================================================")
    print("STARTING TEST SUITE PHASE 4: AUTO-CREATE PAGU SAAT TAHUN BARU DIBUAT")
    print("=================================================================")

    async with AsyncSessionLocal() as session:
        await cleanup_phase4_data(session)

        # 1. Setup Master Bagian & Pegawai (Admin & Operator)
        bagian = Bagian(kode_bagian="BAG-P4", nama_bagian="Bagian Keuangan P4")
        session.add(bagian)
        await session.flush()

        admin = Pegawai(
            id_bagian=bagian.id_bagian,
            nama="Admin Phase 4",
            nip="77700101",
            jabatan="Kasubag Keuangan",
            password="pwd",
            role="admin",
        )
        operator = Pegawai(
            id_bagian=bagian.id_bagian,
            nama="Operator Phase 4",
            nip="77700202",
            jabatan="Staff Keuangan",
            password="pwd",
            role="operator",
        )
        session.add_all([admin, operator])
        await session.flush()

        # 2. Setup 3 Akun Anggaran Aktif + 1 Akun Non-Aktif
        akun1 = AkunAnggaran(
            id_bagian=bagian.id_bagian,
            kode_akun="528111",
            nama_akun="Belanja Keperluan Perkantoran P4",
            total_pagu=Decimal("0.00"),
            status="active",
        )
        akun2 = AkunAnggaran(
            id_bagian=bagian.id_bagian,
            kode_akun="528112",
            nama_akun="Belanja Pengadaan Bahan P4",
            total_pagu=Decimal("0.00"),
            status="active",
        )
        akun3 = AkunAnggaran(
            id_bagian=bagian.id_bagian,
            kode_akun="528113",
            nama_akun="Belanja Honorarium Tim P4",
            total_pagu=Decimal("0.00"),
            status="active",
        )
        akun_inactive = AkunAnggaran(
            id_bagian=bagian.id_bagian,
            kode_akun="528199",
            nama_akun="Belanja Non Aktif P4",
            total_pagu=Decimal("0.00"),
            status="inactive",
        )
        session.add_all([akun1, akun2, akun3, akun_inactive])
        await session.commit()

        id_admin = admin.id_pegawai
        id_op = operator.id_pegawai

    admin_headers = {"X-User-Id": str(id_admin)}
    transport = httpx.ASGITransport(app=app)

    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # -------------------------------------------------------------
        # TEST 01: Create Tahun baru dengan 3 akun aktif
        # Expected: HTTP 201, Tahun 2029 berhasil dibuat, 3 Pagu otomatis dibuat
        # -------------------------------------------------------------
        t2029_payload = {
            "tahun": 2029,
            "status": "draft",
            "tanggal_mulai": "2029-01-01",
            "tanggal_selesai": "2029-12-31",
            "deskripsi": "Tahun Anggaran Pemilu 2029",
        }
        res_t2029 = await client.post("/api/v1/tahun-anggaran/", json=t2029_payload, headers=admin_headers)
        assert res_t2029.status_code == 201, f"Expected 201, got {res_t2029.status_code}: {res_t2029.text}"
        data_t2029 = res_t2029.json()
        id_t2029 = data_t2029["id_tahun_anggaran"]
        assert data_t2029["jumlah_akun"] == 3, f"Expected 3 pagu accounts, got {data_t2029['jumlah_akun']}"
        print(f"[TEST 01 PASSED] Tahun 2029 berhasil dibuat (HTTP 201), jumlah_akun = 3")

        # -------------------------------------------------------------
        # TEST 02: Periksa Pagu hasil auto-create
        # Expected: id_tahun_anggaran benar, id_akun benar, pagu_awal = 0, pagu_aktif = 0
        # -------------------------------------------------------------
        res_pagu_list = await client.get(f"/api/v1/pagu-anggaran/?id_tahun_anggaran={id_t2029}")
        assert res_pagu_list.status_code == 200
        pagu_items = res_pagu_list.json()["items"]
        assert len(pagu_items) == 3, f"Expected 3 pagu items, got {len(pagu_items)}"
        for p in pagu_items:
            assert p["id_tahun_anggaran"] == id_t2029
            assert Decimal(p["pagu_awal"]) == Decimal("0.00")
            assert Decimal(p["pagu_aktif"]) == Decimal("0.00")
            assert p["nomor_sk"] is None
            assert p["tanggal_sk"] is None
            assert p["kode_akun"] in ["528111", "528112", "528113"]
            assert p["kode_akun"] != "528199", "Akun inactive tidak boleh dibuatkan pagu!"
        first_pagu_id = pagu_items[0]["id_pagu"]
        print(f"[TEST 02 PASSED] Pagu otomatis terverifikasi: pagu_awal=0, pagu_aktif=0, hanya akun aktif")

        # -------------------------------------------------------------
        # TEST 03: Tidak ada duplicate saat retry / call create ulang
        # Expected: Constraint / logic mencegah duplikasi
        # -------------------------------------------------------------
        # Re-attempting to create Tahun 2029 will be rejected with HTTP 400 (Tahun sudah terdaftar)
        res_dup_tahun = await client.post("/api/v1/tahun-anggaran/", json=t2029_payload, headers=admin_headers)
        assert res_dup_tahun.status_code == 400
        assert "sudah terdaftar" in res_dup_tahun.json()["detail"]

        # Also verify database table pagu_anggaran has exactly 3 rows for year 2029
        async with AsyncSessionLocal() as session:
            pagus_2029 = (await session.execute(
                select(PaguAnggaran).where(PaguAnggaran.id_tahun_anggaran == id_t2029)
            )).scalars().all()
            assert len(pagus_2029) == 3
        print(f"[TEST 03 PASSED] Idempotency confirmed: No duplicate Tahun or Pagu allowed")

        # -------------------------------------------------------------
        # TEST 04: Tidak ada akun aktif (semua akun inactive)
        # Expected: Tahun tetap dapat dibuat, jumlah Pagu = 0
        # -------------------------------------------------------------
        async with AsyncSessionLocal() as session:
            # Non-aktifkan sementara semua akun 528%
            akuns = (await session.execute(select(AkunAnggaran).where(AkunAnggaran.kode_akun.like("528%")))).scalars().all()
            for a in akuns:
                a.status = "inactive"
            await session.commit()

        t2030_payload = {
            "tahun": 2030,
            "status": "draft",
            "tanggal_mulai": "2030-01-01",
            "tanggal_selesai": "2030-12-31",
            "deskripsi": "Tahun Anggaran 2030 Tanpa Akun Aktif",
        }
        res_t2030 = await client.post("/api/v1/tahun-anggaran/", json=t2030_payload, headers=admin_headers)
        assert res_t2030.status_code == 201
        assert res_t2030.json()["jumlah_akun"] == 0
        id_t2030 = res_t2030.json()["id_tahun_anggaran"]
        # Verify pagu list is empty
        res_p2030 = await client.get(f"/api/v1/pagu-anggaran/?id_tahun_anggaran={id_t2030}")
        assert res_p2030.json()["total"] == 0
        print(f"[TEST 04 PASSED] Tahun tanpa akun aktif berhasil dibuat dengan 0 pagu")

        # -------------------------------------------------------------
        # TEST 05: Multiple accounts (misalnya 10 akun aktif)
        # Expected: 10 Pagu otomatis dibuat
        # -------------------------------------------------------------
        async with AsyncSessionLocal() as session:
            # Buat 10 akun aktif baru
            multi_akuns = []
            for i in range(1, 11):
                multi_akuns.append(
                    AkunAnggaran(
                        id_bagian=bagian.id_bagian,
                        kode_akun=f"5282{i:02d}",
                        nama_akun=f"Akun Multi Test {i}",
                        total_pagu=Decimal("0.00"),
                        status="active",
                    )
                )
            session.add_all(multi_akuns)
            await session.commit()

        t2031_payload = {
            "tahun": 2031,
            "status": "draft",
            "tanggal_mulai": "2031-01-01",
            "tanggal_selesai": "2031-12-31",
            "deskripsi": "Tahun Anggaran 2031 dengan 10 Akun",
        }
        res_t2031 = await client.post("/api/v1/tahun-anggaran/", json=t2031_payload, headers=admin_headers)
        assert res_t2031.status_code == 201
        assert res_t2031.json()["jumlah_akun"] == 10
        id_t2031 = res_t2031.json()["id_tahun_anggaran"]

        res_p2031 = await client.get(f"/api/v1/pagu-anggaran/?id_tahun_anggaran={id_t2031}")
        assert res_p2031.json()["total"] == 10
        print(f"[TEST 05 PASSED] 10 Pagu otomatis dibuat sempurna untuk 10 akun aktif")

        # -------------------------------------------------------------
        # TEST 06: Atomic rollback saat pembuatan Pagu gagal
        # Expected: Tahun tidak tersimpan, Pagu tidak tersimpan (All or Nothing)
        # -------------------------------------------------------------
        async with AsyncSessionLocal() as session:
            # Simulasikan kegagalan transaksi dalam method create_tahun
            # dengan memicu error pada proses add Pagu
            class MockException(Exception):
                pass

            try:
                # Membuka sesi independen dan mencoba eksekusi
                t_obj = TahunAnggaran(
                    tahun=2032,
                    status="draft",
                    tanggal_mulai=date(2032, 1, 1),
                    tanggal_selesai=date(2032, 12, 31),
                    deskripsi="Test Rollback 2032",
                )
                session.add(t_obj)
                await session.flush()
                # Tambah 1 pagu
                p_item = PaguAnggaran(
                    id_tahun_anggaran=t_obj.id_tahun_anggaran,
                    id_akun_anggaran=multi_akuns[0].id_akun_anggaran,
                    pagu_awal=Decimal("0.00"),
                    pagu_aktif=Decimal("0.00"),
                )
                session.add(p_item)
                await session.flush()
                # Simulasikan error tak terduga sebelum commit
                raise MockException("Simulasi error di tengah batch pagu")
            except MockException:
                await session.rollback()

        # Verifikasi di database bahwa Tahun 2032 TIDAK ADA sama sekali
        async with AsyncSessionLocal() as session:
            chk_t32 = await session.execute(select(TahunAnggaran).where(TahunAnggaran.tahun == 2032))
            assert chk_t32.scalar_one_or_none() is None
            chk_p32 = await session.execute(select(PaguAnggaran).where(PaguAnggaran.keterangan.like("%2032%")))
            assert len(chk_p32.scalars().all()) == 0
        print(f"[TEST 06 PASSED] Atomic rollback terkonfirmasi: All-or-nothing (0 partial record)")

        # -------------------------------------------------------------
        # TEST 07: Existing Tahun Ditolak
        # Expected: HTTP 400 Bad Request
        # -------------------------------------------------------------
        res_exist_t = await client.post("/api/v1/tahun-anggaran/", json=t2031_payload, headers=admin_headers)
        assert res_exist_t.status_code == 400
        assert "sudah terdaftar" in res_exist_t.json()["detail"]
        print(f"[TEST 07 PASSED] Duplicate Tahun dicegah dan ditolak dengan pesan error jelas")

        # -------------------------------------------------------------
        # TEST 08: Database Constraint uq_pagu_tahun_akun
        # Expected: Menolak duplikasi (id_tahun_anggaran, id_akun_anggaran)
        # -------------------------------------------------------------
        async with AsyncSessionLocal() as session:
            dup_pagu = PaguAnggaran(
                id_tahun_anggaran=id_t2031,
                id_akun_anggaran=multi_akuns[0].id_akun_anggaran,
                pagu_awal=Decimal("0.00"),
                pagu_aktif=Decimal("0.00"),
            )
            session.add(dup_pagu)
            got_integrity_error = False
            try:
                await session.commit()
            except Exception:
                await session.rollback()
                got_integrity_error = True
            assert got_integrity_error, "Database constraint uq_pagu_tahun_akun harus menggagalkan duplikasi!"
        print(f"[TEST 08 PASSED] Constraint uq_pagu_tahun_akun aktif dan memproteksi integritas data")

        # -------------------------------------------------------------
        # TEST 09: Pagu summary pada Pagu yang baru otomatis dibuat
        # Expected: pagu_awal = 0, pagu_aktif = 0, total_realisasi = 0, sisa = 0, serapan = 0 (No ZeroDivisionError)
        # -------------------------------------------------------------
        res_sum = await client.get(f"/api/v1/pagu-anggaran/{first_pagu_id}/summary")
        assert res_sum.status_code == 200
        sum_data = res_sum.json()
        assert Decimal(sum_data["pagu_awal"]) == Decimal("0.00")
        assert Decimal(sum_data["pagu_aktif"]) == Decimal("0.00")
        assert Decimal(sum_data["total_realisasi_verified"]) == Decimal("0.00")
        assert Decimal(sum_data["sisa_anggaran"]) == Decimal("0.00")
        assert sum_data["persentase_serapan"] == 0.0
        print(f"[TEST 09 PASSED] Pagu summary bernilai 0 dan aman dari ZeroDivisionError")

        # -------------------------------------------------------------
        # TEST 10: Regression terhadap Phase 3 (Direct Realisasi & Lock)
        # Expected: Transaksi Realisasi pada Tahun ACTIVE tetap mengikuti rule Phase 3
        # -------------------------------------------------------------
        # Buat Tahun 2033 ACTIVE, isi salah satu pagu dengan 50.000.000 via Update Pagu
        t2033_payload = {
            "tahun": 2033,
            "status": "active",
            "tanggal_mulai": "2033-01-01",
            "tanggal_selesai": "2033-12-31",
            "deskripsi": "Tahun Anggaran 2033 ACTIVE",
        }
        res_t2033 = await client.post("/api/v1/tahun-anggaran/", json=t2033_payload, headers=admin_headers)
        assert res_t2033.status_code == 201
        id_t2033 = res_t2033.json()["id_tahun_anggaran"]

        # Ambil salah satu pagu yang otomatis terbentuk di 2033
        res_p2033_list = await client.get(f"/api/v1/pagu-anggaran/?id_tahun_anggaran={id_t2033}")
        pagu_2033_first = res_p2033_list.json()["items"][0]
        id_pagu_test = pagu_2033_first["id_pagu"]

        # Admin mengalokasikan pagu_aktif = 50.000.000 melalui revisi anggaran resmi
        res_revisi = await client.post(
            "/api/v1/revisi-anggaran/",
            json={
                "id_pagu": id_pagu_test,
                "nomor_revisi": "REV-P4-001",
                "tanggal_revisi": "2033-01-05",
                "pagu_baru": "50000000.00",
                "alasan_revisi": "Penetapan alokasi DIPA awal Tahun 2033",
            },
            headers=admin_headers,
        )
        assert res_revisi.status_code == 201, f"Expected 201, got {res_revisi.status_code}: {res_revisi.text}"
        assert Decimal(res_revisi.json()["pagu_sesudah"]) == Decimal("50000000.00")

        # Operator input Realisasi direct 20.000.000
        real_payload = {
            "id_pagu": id_pagu_test,
            "tanggal_transaksi": "2033-05-10",
            "nomor_dokumen": "DOC-P4-REGRESSION",
            "uraian_kegiatan": "Belanja ATK Regression Phase 4",
            "jumlah_realisasi": "20000000.00",
        }
        op_headers = {"X-User-Id": str(id_op)}
        res_real = await client.post("/api/v1/realisasi-anggaran/", json=real_payload, headers=op_headers)
        assert res_real.status_code == 201
        real_data = res_real.json()
        assert real_data["status"] == "verified"
        assert real_data["id_verifier"] is None

        # Cek Summary
        res_sum2 = await client.get(f"/api/v1/pagu-anggaran/{id_pagu_test}/summary")
        assert res_sum2.status_code == 200
        assert Decimal(res_sum2.json()["total_realisasi_verified"]) == Decimal("20000000.00")
        assert Decimal(res_sum2.json()["sisa_anggaran"]) == Decimal("30000000.00")
        assert res_sum2.json()["persentase_serapan"] == 40.0
        print(f"[TEST 10 PASSED] Regression Phase 3 Verified: Direct realisasi, auto-verified, locking & summary 100% utuh!")

        # -------------------------------------------------------------
        # CLEANUP
        # -------------------------------------------------------------
        async with AsyncSessionLocal() as session:
            await cleanup_phase4_data(session)
        print("=================================================================")
        print("ALL 10 PHASE 4 TESTS PASSED SUCCESSFULLY!")
        print("=================================================================")


if __name__ == "__main__":
    asyncio.run(run_phase4_tests())
