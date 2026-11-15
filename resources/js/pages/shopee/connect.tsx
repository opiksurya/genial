import { Head } from '@inertiajs/react';
import { CheckCircle2, Clock, ShieldCheck, ShoppingBag, XCircle } from 'lucide-react';

type Status = 'ready' | 'done' | 'error' | 'invalid';

interface Props {
    status: Status;
    clientName?: string | null;
    expiresAt?: string | null;
    startUrl?: string | null;
    shopName?: string | null;
    message?: string | null;
}

function formatExpiry(iso?: string | null): string {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(date);
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#000000] text-slate-100 px-4 py-10 font-sans">
            <Head>
                <title>{title}</title>
                <meta name="robots" content="noindex, nofollow" />
                <meta name="referrer" content="no-referrer" />
            </Head>
            <div className="max-w-md w-full rounded-2xl border border-slate-800 p-8">
                <img src="/logo.png" alt="Genial Digital Solution" className="h-8 w-auto mx-auto mb-6 object-contain" />
                {children}
            </div>
        </div>
    );
}

export default function ShopeeConnectPage({ status, clientName, expiresAt, startUrl, shopName, message }: Props) {
    if (status === 'done') {
        return (
            <Shell title="Toko Shopee terhubung">
                <div className="text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" aria-hidden />
                    <h1 className="text-xl font-semibold mb-2">Toko berhasil terhubung</h1>
                    <p className="text-sm text-slate-400">
                        {shopName ? <>Toko <strong className="text-slate-200">{shopName}</strong> sudah terhubung dengan Genial Digital Solution.</> : 'Toko Shopee Anda sudah terhubung dengan Genial Digital Solution.'}
                    </p>
                    <p className="text-sm text-slate-400 mt-3">Anda bisa menutup halaman ini. Untuk mencabut akses kapan saja, gunakan pengaturan aplikasi terotorisasi di Shopee Seller Centre atau hubungi tim kami.</p>
                </div>
            </Shell>
        );
    }

    if (status === 'error') {
        return (
            <Shell title="Toko belum terhubung">
                <div className="text-center">
                    <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" aria-hidden />
                    <h1 className="text-xl font-semibold mb-2">Toko belum terhubung</h1>
                    <p className="text-sm text-slate-400">{message || 'Terjadi kendala saat menghubungkan toko.'}</p>
                    <p className="text-sm text-slate-400 mt-3">Jika tautan Anda masih berlaku, buka kembali tautan dari tim kami untuk mencoba lagi.</p>
                </div>
            </Shell>
        );
    }

    if (status === 'invalid') {
        return (
            <Shell title="Tautan tidak berlaku">
                <div className="text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-amber-500" aria-hidden />
                    <h1 className="text-xl font-semibold mb-2">Tautan tidak berlaku</h1>
                    <p className="text-sm text-slate-400">Tautan ini sudah dipakai, kedaluwarsa, atau dibatalkan. Minta tautan baru dari tim Genial Digital Solution.</p>
                </div>
            </Shell>
        );
    }

    return (
        <Shell title="Hubungkan toko Shopee">
            <div className="text-center mb-6">
                <ShoppingBag className="h-10 w-10 mx-auto mb-3 text-[#EE4D2D]" aria-hidden />
                <h1 className="text-xl font-semibold mb-1">Hubungkan toko Shopee Anda</h1>
                {clientName && <p className="text-sm text-slate-400">Untuk {clientName}</p>}
            </div>

            <p className="text-sm text-slate-300 mb-4">
                Anda akan diarahkan ke halaman resmi Shopee untuk masuk dan memberi izin. Kami tidak pernah melihat atau menyimpan kata sandi Shopee Anda.
            </p>

            <div className="rounded-xl border border-slate-800 p-4 mb-4">
                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden />
                    Data yang kami akses
                </div>
                <ul className="text-sm text-slate-400 list-disc pl-5 space-y-1">
                    <li>Informasi toko (ID dan nama toko)</li>
                    <li>Ringkasan pesanan: jumlah, status, nilai, dan waktu</li>
                    <li>Data produk: nama, harga, stok, dan status</li>
                    <li>Informasi saluran logistik</li>
                </ul>
                <p className="text-xs text-slate-500 mt-3">Kami tidak menggunakan data pribadi pembeli (nama, alamat, nomor telepon). Anda dapat mencabut akses kapan saja.</p>
            </div>

            {startUrl && (
                <a
                    href={startUrl}
                    className="block w-full text-center rounded-xl bg-[#EE4D2D] hover:bg-[#d73211] text-white font-semibold py-3 transition-colors"
                >
                    Lanjut ke Shopee
                </a>
            )}

            <div className="mt-4 text-center text-xs text-slate-500 space-y-1">
                {expiresAt && <p>Tautan ini berlaku sampai {formatExpiry(expiresAt)} WIB dan hanya bisa dipakai sekali.</p>}
                <p>
                    <a href="/privacy-policy" className="text-[#00A9E7] hover:underline" target="_blank" rel="noopener noreferrer">Kebijakan Privasi</a>
                    {' · '}
                    <a href="/terms" className="text-[#00A9E7] hover:underline" target="_blank" rel="noopener noreferrer">Syarat & Ketentuan</a>
                </p>
            </div>
        </Shell>
    );
}
