import LegalPage, { LEGAL_COMPANY, type LegalSection } from '@/components/legal-page';

interface PrivacyPolicyProps {
    whatsappNumber?: string;
    whatsappDefaultMessage?: string;
}

const mailto = <a href={`mailto:${LEGAL_COMPANY.email}`}>{LEGAL_COMPANY.email}</a>;

const sections: LegalSection[] = [
    {
        id: 'data-yang-dikumpulkan',
        title: 'Data yang Kami Kumpulkan',
        content: (
            <>
                <p>Kami hanya mengumpulkan data yang diperlukan untuk menjalankan layanan kami:</p>
                <ul>
                    <li>
                        <strong>Formulir Audit Digital:</strong> nama, nomor WhatsApp, alamat website atau marketplace,
                        jenis usaha, dan target penjualan yang Anda isi sendiri.
                    </li>
                    <li>
                        <strong>Data teknis:</strong> alamat IP, jenis browser (user agent), serta halaman yang Anda kunjungi.
                    </li>
                    <li>
                        <strong>Cookie dan alat analitik:</strong> Google Tag Manager, Google Analytics, serta Meta Pixel dan
                        Meta Conversions API (termasuk cookie <code>_fbp</code> dan <code>_fbc</code>) untuk mengukur kunjungan
                        dan efektivitas iklan kami.
                    </li>
                    <li>
                        <strong>Akun tim dan klien:</strong> nama, alamat email, dan kata sandi (disimpan dalam bentuk terenkripsi)
                        untuk pengguna yang masuk ke dasbor kami, termasuk data profil dasar dan akses Google Calendar bila pengguna
                        memilih masuk atau menghubungkan akun Google.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'penggunaan-data',
        title: 'Cara Kami Menggunakan Data',
        content: (
            <ul>
                <li>Menghubungi Anda untuk menindaklanjuti permintaan audit atau konsultasi.</li>
                <li>Menyediakan, mengelola, dan meningkatkan layanan serta website kami.</li>
                <li>Mengukur kinerja kampanye pemasaran kami sendiri.</li>
                <li>Menjaga keamanan website dan mencegah penyalahgunaan.</li>
                <li>Memenuhi kewajiban hukum yang berlaku.</li>
            </ul>
        ),
    },
    {
        id: 'integrasi-platform-iklan',
        title: 'Integrasi Platform Iklan',
        content: (
            <>
                <p>
                    Website dan sistem internal kami menggunakan <strong>Meta Marketing API</strong>, <strong>Google Ads API</strong>,{' '}
                    <strong>TikTok Marketing API</strong>, dan <strong>LinkedIn Marketing API</strong> untuk mengelola dan melaporkan
                    iklan milik perusahaan kami sendiri.
                </p>
                <ul>
                    <li>
                        Data yang kami akses melalui API tersebut terbatas pada data akun iklan milik kami, seperti struktur kampanye,
                        anggaran, materi iklan, dan metrik performa (misalnya tayangan, klik, biaya, dan konversi).
                    </li>
                    <li>Data tersebut hanya dipakai untuk mengelola iklan dan menyusun laporan internal.</li>
                    <li>Kami tidak menjual data ini dan tidak menggunakannya untuk tujuan lain.</li>
                    <li>
                        Token akses disimpan secara aman di server kami dan hanya dapat digunakan oleh sistem serta tim yang berwenang.
                    </li>
                    <li>
                        Akses aplikasi kami dapat dicabut kapan saja melalui pengaturan keamanan atau aplikasi terhubung di masing-masing
                        platform.
                    </li>
                </ul>
                <p>
                    Penggunaan data dari platform tersebut juga tunduk pada kebijakan masing-masing platform (Meta, Google, TikTok,
                    dan LinkedIn).
                </p>
            </>
        ),
    },
    {
        id: 'integrasi-shopee',
        title: 'Integrasi Toko Shopee (Shopee Open Platform)',
        content: (
            <>
                <p>
                    Sebagai agensi, kami membantu klien mengelola toko Shopee mereka melalui <strong>Shopee Open Platform</strong>.
                    Integrasi ini hanya aktif untuk toko yang pemiliknya memberikan izin secara langsung kepada kami.
                </p>
                <ul>
                    <li>
                        <strong>Otorisasi:</strong> pemilik toko masuk ke akun Shopee-nya sendiri dan menyetujui akses melalui halaman
                        resmi Shopee. Kami tidak pernah meminta atau menyimpan kata sandi akun Shopee Anda.
                    </li>
                    <li>
                        <strong>Data yang kami akses:</strong> informasi toko (ID dan nama toko), ringkasan pesanan (jumlah, status,
                        nilai, dan waktu), data produk (nama, harga, stok, dan status), serta informasi saluran logistik, sebatas yang
                        diperlukan untuk membuat laporan performa dan membantu pengelolaan toko.
                    </li>
                    <li>
                        <strong>Data pembeli:</strong> kami tidak menggunakan data pribadi pembeli (nama, alamat, atau nomor telepon)
                        untuk analitik, pemasaran, atau tujuan lain di luar pengelolaan pesanan yang diminta pemilik toko.
                    </li>
                    <li>
                        <strong>Penyimpanan token:</strong> token akses dan token penyegaran disimpan dalam bentuk terenkripsi di server
                        kami dan hanya dipakai oleh sistem serta tim yang berwenang untuk toko yang bersangkutan.
                    </li>
                    <li>
                        <strong>Tujuan:</strong> data hanya dipakai untuk melayani pemilik toko yang bersangkutan. Kami tidak menjual,
                        menyewakan, atau membagikannya kepada pihak lain, dan tidak mencampurnya dengan data toko klien lain.
                    </li>
                </ul>
                <p>
                    <strong>Mencabut akses:</strong> pemilik toko dapat memutus koneksi kapan saja, baik melalui menu Shopee Seller
                    Centre (pengaturan aplikasi terotorisasi) maupun dengan meminta kami memutusnya. Setelah koneksi diputus, token
                    langsung dihapus dari sistem kami dan kami berhenti mengakses toko tersebut. Data toko yang masih tersimpan akan
                    dihapus atas permintaan, paling lambat 30 hari setelah permintaan diverifikasi.
                </p>
                <p>Penggunaan data Shopee juga tunduk pada kebijakan Shopee Open Platform.</p>
            </>
        ),
    },
    {
        id: 'berbagi-data',
        title: 'Berbagi Data dengan Pihak Lain',
        content: (
            <>
                <p>Kami tidak menjual data pribadi Anda. Data hanya dibagikan kepada:</p>
                <ul>
                    <li>
                        Penyedia layanan yang membantu operasional kami, seperti penyedia server, Google, dan Meta, sebatas yang
                        diperlukan.
                    </li>
                    <li>Pihak berwenang apabila diwajibkan oleh hukum.</li>
                </ul>
            </>
        ),
    },
    {
        id: 'penyimpanan-keamanan',
        title: 'Penyimpanan dan Keamanan Data',
        content: (
            <p>
                Data disimpan di server kami dan dikirim melalui koneksi terenkripsi (HTTPS). Akses dibatasi hanya untuk tim yang
                berwenang. Kami menyimpan data selama diperlukan untuk tujuan di atas atau selama diwajibkan hukum, lalu
                menghapusnya.
            </p>
        ),
    },
    {
        id: 'hak-anda',
        title: 'Hak Anda',
        content: (
            <>
                <p>
                    Sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi, Anda berhak untuk:
                </p>
                <ul>
                    <li>meminta akses atau salinan data pribadi Anda;</li>
                    <li>memperbaiki data yang tidak akurat;</li>
                    <li>meminta penghapusan data;</li>
                    <li>menarik persetujuan pemrosesan data.</li>
                </ul>
                <p>Ajukan permintaan melalui email {mailto}.</p>
            </>
        ),
    },
    {
        id: 'penghapusan-data',
        title: 'Permintaan Penghapusan Data',
        content: (
            <>
                <p>Untuk meminta penghapusan data Anda:</p>
                <ul>
                    <li>Kirim email ke {mailto} dengan subjek "Hapus Data".</li>
                    <li>Sebutkan nama serta nomor WhatsApp atau email yang pernah Anda berikan kepada kami.</li>
                    <li>Kami akan memverifikasi permintaan, menghapus data Anda, lalu mengirim konfirmasi melalui email.</li>
                </ul>
            </>
        ),
    },
    {
        id: 'cookie',
        title: 'Cookie',
        content: (
            <p>
                Anda dapat menolak atau menghapus cookie melalui pengaturan browser. Beberapa fitur website mungkin tidak berjalan
                optimal tanpa cookie.
            </p>
        ),
    },
    {
        id: 'perubahan-kebijakan',
        title: 'Perubahan Kebijakan',
        content: (
            <p>
                Kami dapat memperbarui kebijakan ini sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini beserta tanggal
                berlakunya.
            </p>
        ),
    },
    {
        id: 'kontak',
        title: 'Hubungi Kami',
        content: (
            <p>
                {LEGAL_COMPANY.name}
                <br />
                {LEGAL_COMPANY.address}
                <br />
                Email: {mailto}
            </p>
        ),
    },
];

export default function PrivacyPolicyPage({ whatsappNumber, whatsappDefaultMessage }: PrivacyPolicyProps) {
    return (
        <LegalPage
            title="Kebijakan Privasi"
            description={`Kebijakan Privasi ${LEGAL_COMPANY.brand}: data apa yang kami kumpulkan, cara kami menggunakannya, dan hak Anda.`}
            effectiveDate="15 November 2026"
            intro={
                <p>
                    Kebijakan Privasi ini menjelaskan bagaimana {LEGAL_COMPANY.name} ("{LEGAL_COMPANY.brand}", "kami") mengumpulkan,
                    menggunakan, dan melindungi data pribadi Anda saat menggunakan website {LEGAL_COMPANY.website} beserta layanan
                    terkait.
                </p>
            }
            sections={sections}
            whatsappNumber={whatsappNumber}
            whatsappDefaultMessage={whatsappDefaultMessage}
        />
    );
}
