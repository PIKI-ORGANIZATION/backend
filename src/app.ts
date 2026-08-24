import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middlewares/error.middleware';
import { env } from './config/env';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(morgan('dev'));

// NEWS
import newsRoutes from './routes/newsUtama.routes';
import newsTags from './routes/newsTag.routes';
import newsKategori from './routes/newsKategori.routes';

// THE GRIT INSTITUTE
import kelas from './routes/kelas.routes';
import mentor from './routes/mentor.routes';
import topikEdukasi from './routes/topikEdukasi.routes';
import kelasPendaftaran from './routes/kelasPendaftar.routes';

// PROFIL CABANG
import cabangRoutes from './routes/cabang.routes';
import sejarahCabangRoutes from './routes/sejarahCabang.routes';

// STRUKTUR ORGANISASI
import strukturOrganisasiRoutes from './routes/strukturOrganisasi.routes';
import periodeKepengurusan from './routes/periodeKepengurusan.routes';
import jabatan from './routes/jabatan.routes';
import bidang from './routes/bidang.routes';

// GALERI
import albumGaleriRoutes from './routes/albumGaleri.routes';
import mediaGaleriRoutes from './routes/mediaGaleri.routes';

import pageRoutes from './routes/page.routes';
import pageSettingRoutes from './routes/pageSetting.routes';
import settingRoutes from './routes/setting.routes';
import faqRoutes from './routes/faq.routes';
import formPengaduanRoutes from './routes/formPengaduan.routes';

// E-COMMERCE
import produk from './routes/produk.routes';
import produkKategori from './routes/produkKategori.routes'
import keranjangSpesifikasi from './routes/keranjangSpesifikasi.routes';
import spesifikasiProduk from './routes/spesifikasiProduk.routes';
import KeranjangBelanja from './routes/keranjangBelanja.routes';
import ulasanProdukController from './routes/ulasanProduk.routes';
import pesanan from './routes/pesanan.routes';
import pajakPesanan from './routes/pajakPesanan.routes';
import pajakProdukPesanan from './routes/pajakProdukPesanan.routes';
import pengaturanPesanan from './routes/pengaturanPesanan.routes';
import produkPesanan from './routes/produkPesanan.routes';
import produkPesananSpesifikasi from './routes/produkPesananSpesifikasi.routes';
import spesifikasiProdukValue from './routes/spesifikasiProdukValue.routes';
import pembayaran from './routes/pembayaran.routes';

// RBAC
import authRoutes from './routes/auth.routes';
import roleRoutes from './routes/role.routes';
import akunRoutes from './routes/akun.routes';
import seniorRoutes from './routes/senior.routes';

import permissionRoutes from './routes/permission.routes';
import uploadRoutes from './routes/upload.routes';
import dashboardRoutes from './routes/dashboard.routes';
import masterRoutes from './routes/master.routes';
import youtubeRoutes from './routes/youtube.routes';
import registrasiRoutes from './routes/registrasi.routes';
import registrasiPengurusRoutes from './routes/registrasiPengurus.routes';
import masterWilayahRoutes from './routes/masterWilayah.routes';

// Routes
app.get('/', (req, res) => {
  res.send('PNPS Backend API Running');
});

app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/akuns', akunRoutes);
app.use('/api/v1/seniors', seniorRoutes);
app.use('/api/v1/permissions', permissionRoutes);
app.use('/api/v1/registrasi', registrasiRoutes);
app.use('/api/v1/registrasi-pengurus', registrasiPengurusRoutes);
app.use('/api/v1/master-wilayah', masterWilayahRoutes);

app.use('/api/v1/news-utama', newsRoutes);
app.use('/api/v1/news-tags', newsTags);
app.use('/api/v1/news-kategori', newsKategori);

app.use('/api/v1/cabang', cabangRoutes);
app.use('/api/v1/sejarah-cabang', sejarahCabangRoutes);
app.use('/api/v1/struktur-organisasi', strukturOrganisasiRoutes);
app.use('/api/v1/periode-kepengurusan', periodeKepengurusan);
app.use('/api/v1/jabatan', jabatan);
app.use('/api/v1/bidang', bidang);

app.use('/api/v1/album-galeri', albumGaleriRoutes);
app.use('/api/v1/media-galeri', mediaGaleriRoutes);

app.use('/api/v1/kelas', kelas);
app.use('/api/v1/mentor', mentor);
app.use('/api/v1/topik-edukasi', topikEdukasi);
app.use('/api/v1/kelas-pendaftaran', kelasPendaftaran);

app.use('/api/v1/produk', produk);
app.use('/api/v1/produk-kategori', produkKategori);
app.use('/api/v1/keranjang-spesifikasi', keranjangSpesifikasi);
app.use('/api/v1/spesifikasi-produk', spesifikasiProduk);
app.use('/api/v1/keranjang-belanja', KeranjangBelanja);
app.use('/api/v1/ulasan-produk', ulasanProdukController);
app.use('/api/v1/pesanan', pesanan);
app.use('/api/v1/pajak-pesanan', pajakPesanan);
app.use('/api/v1/pajak-produk-pesanan', pajakProdukPesanan);
app.use('/api/v1/pengaturan-pesanan', pengaturanPesanan);
app.use('/api/v1/produk-pesanan', produkPesanan);
app.use('/api/v1/produk-pesanan-spesifikasi', produkPesananSpesifikasi);
app.use('/api/v1/spesifikasi-produk-value', spesifikasiProdukValue);
app.use('/api/v1/pembayaran', pembayaran);

app.use('/api/v1/page', pageRoutes);
app.use('/api/v1/page-setting', pageSettingRoutes);
app.use('/api/v1/settings', settingRoutes);
app.use('/api/v1/faq', faqRoutes);
app.use('/api/v1/form-pengaduan', formPengaduanRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/master', masterRoutes);
app.use('/api/v1/youtube', youtubeRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Error Handler
app.use(errorHandler);

export default app;
