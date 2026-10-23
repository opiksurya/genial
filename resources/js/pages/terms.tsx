import LegalPage, { LEGAL_COMPANY, type LegalSection } from '@/components/legal-page';

interface TermsProps {
    whatsappNumber?: string;
    whatsappDefaultMessage?: string;
}

const mailto = <a href={`mailto:${LEGAL_COMPANY.email}`}>{LEGAL_COMPANY.email}</a>;

const sections: LegalSection[] = [
    {
        id: 'penerimaan',
        title: 'Penerimaan Syarat',
        content: (
            <p>
                Dengan mengakses atau menggunakan website {LEGAL_COMPANY.website}, Anda menyetujui Syarat dan Ketentuan ini. Jika
                Anda tidak setuju, mohon untuk tidak menggunakan website ini.
            </p>
        ),
    },
    {
        id: 'layanan',
        title: 'Tentang Layanan',
        content: (
            <p>
                {LEGAL_COMPANY.name} menyediakan layanan pemasaran digital, periklanan, materi kreatif, dan sistem penunjang bisnis.
                Informasi di website ini bersifat umum. Ruang lingkup, biaya, dan jadwal layanan berbayar diatur dalam penawaran atau
                perjanjian tertulis yang terpisah.
            </p>
        ),
    },
    {
        id: 'penggunaan-website',
        title: 'Penggunaan Website',
        content: (
            <>
                <p>Saat menggunakan website ini, Anda setuju untuk tidak:</p>
                <ul>
                    <li>memberikan informasi palsu melalui formulir kami;</li>
                    <li>mencoba mengakses area, akun, atau data yang bukan milik Anda;</li>
                    <li>mengganggu, merusak, atau membebani sistem kami;</li>
                    <li>menggunakan website untuk tujuan yang melanggar hukum.</li>
                </ul>
            </>
        ),
    },
    {
        id: 'akun',
        title: 'Akun Pengguna',
        content: (
            <p>
                Pengguna yang diberi akses ke dasbor atau portal kami bertanggung jawab menjaga kerahasiaan kata sandi dan tautan
                akses masing-masing. Kami dapat menonaktifkan akses yang disalahgunakan.
            </p>
        ),
    },
    {
        id: 'kekayaan-intelektual',
        title: 'Hak Kekayaan Intelektual',
        content: (
            <p>
                Seluruh konten di website ini, termasuk teks, logo, desain, dan studi kasus, adalah milik {LEGAL_COMPANY.name} atau
                pemberi lisensinya. Konten tidak boleh disalin atau digunakan untuk tujuan komersial tanpa izin tertulis.
            </p>
        ),
    },
    {
        id: 'hasil-tidak-dijamin',
        title: 'Hasil Tidak Dijamin',
        content: (
            <p>
                Studi kasus dan angka pertumbuhan yang ditampilkan adalah hasil kerja sama sebelumnya dan bukan jaminan hasil yang
                sama untuk setiap bisnis. Hasil pemasaran dipengaruhi banyak faktor di luar kendali kami.
            </p>
        ),
    },
    {
        id: 'pihak-ketiga',
        title: 'Layanan dan Tautan Pihak Ketiga',
        content: (
            <p>
                Website ini dapat terhubung dengan layanan pihak ketiga seperti WhatsApp, Google, Meta, TikTok, dan LinkedIn.
                Penggunaan layanan tersebut tunduk pada syarat dan kebijakan masing-masing penyedia.
            </p>
        ),
    },
    {
        id: 'batasan-tanggung-jawab',
        title: 'Batasan Tanggung Jawab',
        content: (
            <p>
                Website ini disediakan "sebagaimana adanya". Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak
                langsung yang timbul dari penggunaan website ini, termasuk gangguan akses atau kesalahan informasi.
            </p>
        ),
    },
    {
        id: 'privasi',
        title: 'Privasi',
        content: (
            <p>
                Pengelolaan data pribadi Anda diatur dalam <a href="/privacy-policy">Kebijakan Privasi</a> kami.
            </p>
        ),
    },
    {
        id: 'hukum',
        title: 'Hukum yang Berlaku',
        content: <p>Syarat dan Ketentuan ini diatur oleh dan ditafsirkan berdasarkan hukum Republik Indonesia.</p>,
    },
    {
        id: 'perubahan',
        title: 'Perubahan Syarat',
        content: (
            <p>
                Kami dapat memperbarui Syarat dan Ketentuan ini sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini beserta
                tanggal berlakunya.
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

export default function TermsPage({ whatsappNumber, whatsappDefaultMessage }: TermsProps) {
    return (
        <LegalPage
            title="Syarat dan Ketentuan"
            description={`Syarat dan Ketentuan penggunaan website dan layanan ${LEGAL_COMPANY.brand}.`}
            effectiveDate="23 Oktober 2026"
            intro={
                <p>
                    Syarat dan Ketentuan ini mengatur penggunaan website dan layanan {LEGAL_COMPANY.name} ("{LEGAL_COMPANY.brand}",
                    "kami").
                </p>
            }
            sections={sections}
            whatsappNumber={whatsappNumber}
            whatsappDefaultMessage={whatsappDefaultMessage}
        />
    );
}
