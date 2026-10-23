import { Head } from '@inertiajs/react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

interface OAuthCallbackProps {
    status: 'success' | 'error' | 'empty';
    errorMessage?: string | null;
}

const content = {
    success: {
        icon: CheckCircle2,
        iconClass: 'text-emerald-500',
        title: 'Otorisasi berhasil',
        message: 'Akun berhasil terhubung. Anda dapat menutup halaman ini.',
    },
    error: {
        icon: XCircle,
        iconClass: 'text-red-500',
        title: 'Otorisasi gagal',
        message: 'Akun tidak terhubung. Silakan coba lagi atau hubungi tim kami.',
    },
    empty: {
        icon: Info,
        iconClass: 'text-[#00A9E7]',
        title: 'Halaman callback OAuth',
        message: 'Halaman ini dipakai sebagai alamat kembali setelah otorisasi aplikasi. Tidak ada permintaan yang sedang diproses.',
    },
};

export default function OAuthCallbackPage({ status, errorMessage }: OAuthCallbackProps) {
    const { icon: Icon, iconClass, title, message } = content[status] ?? content.empty;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#000000] text-slate-100 px-4 font-sans">
            <Head>
                <title>{title}</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            <div className="max-w-md w-full rounded-2xl border border-slate-800 p-8 text-center">
                <img src="/logo.png" alt="Genial Digital Solution Logo" className="h-8 w-auto mx-auto mb-6 object-contain" />
                <Icon className={`h-12 w-12 mx-auto mb-4 ${iconClass}`} />
                <h1 className="text-xl font-semibold mb-2">{title}</h1>
                <p className="text-sm text-slate-400">{message}</p>
                {status === 'error' && errorMessage && (
                    <p className="mt-4 text-xs text-slate-500 break-words">Detail: {errorMessage}</p>
                )}
                <a href="/" className="inline-block mt-6 text-sm text-[#00A9E7] hover:underline">
                    Kembali ke beranda
                </a>
            </div>
        </div>
    );
}
