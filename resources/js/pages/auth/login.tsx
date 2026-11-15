import { Form, Head, Link } from '@inertiajs/react';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import { router } from '@inertiajs/react';
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import LoginWave from '@/components/login-wave';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

const FIELD =
    'group flex items-center gap-3 border-b border-[#0E1A33]/20 pb-2 transition-colors focus-within:border-[#1B4F8F]';
const INPUT =
    'w-full bg-transparent py-1 text-[15px] text-[#0E1A33] outline-none placeholder:text-[#0E1A33]/45';
const ICON =
    'size-[18px] shrink-0 text-[#0E1A33]/55 transition-colors group-focus-within:text-[#1B4F8F]';
const FOCUS =
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F8F]';

function PasskeyButton() {
    const { verify, isLoading, error, isSupported } = usePasskeyVerify({
        onSuccess: (response) => {
            router.visit(response.redirect ?? '/dashboard');
        },
    });

    if (!isSupported) {
        return null;
    }

    return (
        <div className="grid flex-1 gap-1">
            <button
                type="button"
                onClick={verify}
                disabled={isLoading}
                className={`flex w-full items-center justify-center gap-2 rounded-full border border-[#0E1A33]/15 bg-white py-2.5 text-sm font-medium text-[#0E1A33] transition-colors hover:bg-[#F5F7FB] disabled:opacity-60 ${FOCUS}`}
            >
                {isLoading ? <Spinner /> : <KeyRound className="size-4" />}
                {isLoading ? 'Memverifikasi...' : 'Passkey'}
            </button>
            {error && (
                <InputError
                    message={error}
                    className="text-center text-[#C4234A]"
                />
            )}
        </div>
    );
}

export default function Login({ status, canResetPassword }: Props) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <Head title="Masuk">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap"
                />
            </Head>

            <div className="h-svh min-h-[560px] bg-[#E8ECF3] p-2 font-['Sora',ui-sans-serif,system-ui,sans-serif] text-[#0E1A33] sm:p-4 lg:p-5">
                <div className="mx-auto h-full max-w-[1400px] rounded-[28px] bg-white p-2 shadow-[0_30px_80px_-30px_rgba(14,26,51,0.35)] sm:rounded-[40px] sm:p-3">
                    <div className="relative flex h-full flex-col overflow-hidden rounded-[22px] bg-[#F5F7FB] p-3 sm:rounded-[30px] sm:p-4">
                        <header className="relative z-20 flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 shadow-[0_6px_24px_-12px_rgba(14,26,51,0.25)] sm:px-6">
                            <Link
                                href="/"
                                className={`rounded-md ${FOCUS}`}
                                aria-label="Genial Digital Solution, ke beranda"
                            >
                                <img
                                    src="/logo.png"
                                    alt="Genial Digital Solution"
                                    className="h-9 w-auto sm:h-11"
                                />
                            </Link>
                            <nav className="flex items-center gap-2 sm:gap-6">
                                <Link
                                    href="/our-story"
                                    className={`hidden rounded-md text-sm text-[#0E1A33]/70 transition-colors hover:text-[#1B4F8F] md:inline ${FOCUS}`}
                                >
                                    Tentang kami
                                </Link>
                                <Link
                                    href="/how-we-work"
                                    className={`hidden rounded-md text-sm text-[#0E1A33]/70 transition-colors hover:text-[#1B4F8F] md:inline ${FOCUS}`}
                                >
                                    Cara kerja
                                </Link>
                                <Link
                                    href="/support"
                                    className={`rounded-xl bg-gradient-to-b from-[#3DB9F2] to-[#1B4F8F] px-5 py-2 text-sm font-medium text-white shadow-[0_8px_18px_-8px_rgba(27,79,143,0.8)] transition-transform hover:-translate-y-px ${FOCUS}`}
                                >
                                    Hubungi kami
                                </Link>
                            </nav>
                        </header>

                        <LoginWave className="pointer-events-none absolute inset-x-0 top-[11%] z-0 h-[42%] w-full [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]" />

                        <div className="relative z-10 grid min-h-0 flex-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)] lg:px-6">
                            <div className="hidden h-full flex-col justify-end gap-[3vh] pb-[1vh] lg:flex">
                                <div className="max-w-[780px]">
                                    <p className="text-[clamp(1.3rem,min(2.6vw,4.2vh),2.2rem)] leading-tight font-light text-[#0E1A33]/85">
                                        Bangun brand Anda
                                    </p>
                                    <h1 className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[clamp(1.5rem,min(3vw,5.2vh),2.7rem)] leading-[1.1] font-semibold tracking-tight">
                                        <span>tumbuh lewat iklan</span>
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="size-[0.7em] text-[#0E1A33]/55"
                                            aria-hidden="true"
                                        >
                                            <path
                                                d="M12 1v22M1 12h22M4.2 4.2l15.6 15.6M19.8 4.2L4.2 19.8"
                                                stroke="currentColor"
                                                strokeWidth="1.4"
                                                strokeLinecap="round"
                                                fill="none"
                                            />
                                        </svg>
                                        <span>dan data</span>
                                        <span
                                            className="ml-1 flex items-center"
                                            aria-hidden="true"
                                        >
                                            <span className="size-[0.55em] rounded-full bg-[#1B4F8F]" />
                                            <span className="-ml-[0.2em] size-[0.55em] rounded-full bg-[#19A7EC]" />
                                            <span className="-ml-[0.2em] size-[0.55em] rounded-full bg-[#FAD03D]" />
                                        </span>
                                    </h1>
                                    <p className="mt-[2vh] max-w-[560px] text-[15px] leading-relaxed text-[#0E1A33]/65 [@media(max-height:680px)]:hidden">
                                        Strategi Meta Ads, Shopee Ads, SEO, dan
                                        website yang terukur. Masuk untuk
                                        memantau progres proyek dan performa
                                        iklan Anda.
                                    </p>
                                </div>
                                <div className="[@media(max-height:760px)]:hidden">
                                    <p className="text-sm text-[#0E1A33]/50">
                                        Butuh bantuan?
                                    </p>
                                    <Link
                                        href="/support"
                                        className={`mt-1 inline-flex items-center gap-2 border-b border-[#0E1A33] pb-0.5 text-sm font-medium ${FOCUS}`}
                                    >
                                        Hubungi kami
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </div>
                            </div>

                            <div className="order-1 w-full lg:order-2">
                                <div className="mx-auto w-full max-w-[460px] rounded-[28px] bg-white p-[clamp(1.25rem,3.6vh,2.25rem)] shadow-[0_30px_70px_-30px_rgba(14,26,51,0.4)]">
                                    <h2 className="text-[clamp(1.2rem,3vh,1.45rem)] font-medium tracking-tight">
                                        Masuk untuk melanjutkan
                                        <span
                                            className="ml-1 inline-block size-1.5 rounded-full bg-[#19A7EC] align-baseline"
                                            aria-hidden="true"
                                        />
                                    </h2>

                                    {status && (
                                        <p
                                            className="mt-4 text-sm font-medium text-emerald-700"
                                            role="status"
                                        >
                                            {status}
                                        </p>
                                    )}

                                    <Form
                                        {...store.form()}
                                        resetOnSuccess={['password']}
                                        className="mt-[3vh] flex flex-col gap-[clamp(0.9rem,2.6vh,1.75rem)]"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div>
                                                    <label className={FIELD}>
                                                        <Mail
                                                            className={ICON}
                                                            aria-hidden="true"
                                                        />
                                                        <span className="sr-only">
                                                            Alamat email
                                                        </span>
                                                        <input
                                                            id="email"
                                                            type="email"
                                                            name="email"
                                                            required
                                                            autoFocus
                                                            tabIndex={1}
                                                            autoComplete="email"
                                                            placeholder="Alamat email"
                                                            className={INPUT}
                                                        />
                                                    </label>
                                                    <InputError
                                                        message={errors.email}
                                                        className="mt-2 text-[#C4234A]"
                                                    />
                                                </div>

                                                <div>
                                                    <div className={FIELD}>
                                                        <Lock
                                                            className={ICON}
                                                            aria-hidden="true"
                                                        />
                                                        <label
                                                            htmlFor="password"
                                                            className="sr-only"
                                                        >
                                                            Kata sandi
                                                        </label>
                                                        <input
                                                            id="password"
                                                            type={
                                                                showPassword
                                                                    ? 'text'
                                                                    : 'password'
                                                            }
                                                            name="password"
                                                            required
                                                            tabIndex={2}
                                                            autoComplete="current-password"
                                                            placeholder="Kata sandi"
                                                            className={INPUT}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setShowPassword(
                                                                    (value) =>
                                                                        !value,
                                                                )
                                                            }
                                                            aria-label={
                                                                showPassword
                                                                    ? 'Sembunyikan kata sandi'
                                                                    : 'Tampilkan kata sandi'
                                                            }
                                                            className={`rounded text-[#0E1A33]/55 transition-colors hover:text-[#1B4F8F] ${FOCUS}`}
                                                        >
                                                            {showPassword ? (
                                                                <EyeOff className="size-[18px]" />
                                                            ) : (
                                                                <Eye className="size-[18px]" />
                                                            )}
                                                        </button>
                                                    </div>
                                                    <InputError
                                                        message={
                                                            errors.password
                                                        }
                                                        className="mt-2 text-[#C4234A]"
                                                    />
                                                    {canResetPassword && (
                                                        <div className="mt-2 text-right">
                                                            <Link
                                                                href={request()}
                                                                tabIndex={5}
                                                                className={`rounded text-xs text-[#0E1A33]/55 transition-colors hover:text-[#1B4F8F] ${FOCUS}`}
                                                            >
                                                                Lupa kata sandi?
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>

                                                <label className="flex cursor-pointer items-center gap-3 text-sm text-[#0E1A33]/70">
                                                    <input
                                                        type="checkbox"
                                                        name="remember"
                                                        defaultChecked
                                                        tabIndex={3}
                                                        className="size-4 rounded border-[#0E1A33]/30 accent-[#1B4F8F]"
                                                    />
                                                    Tetap masuk di perangkat ini
                                                </label>

                                                <button
                                                    type="submit"
                                                    tabIndex={4}
                                                    disabled={processing}
                                                    data-test="login-button"
                                                    className={`flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[#3DB9F2] to-[#1B4F8F] py-3 text-[15px] font-medium text-white shadow-[0_14px_26px_-12px_rgba(27,79,143,0.85)] transition-transform hover:-translate-y-px disabled:opacity-70 ${FOCUS}`}
                                                >
                                                    {processing && <Spinner />}
                                                    Masuk
                                                </button>
                                            </>
                                        )}
                                    </Form>

                                    <div className="mt-[2.4vh] grid gap-[1.2vh]">
                                        <p className="text-center text-xs text-[#0E1A33]/45 [@media(max-height:700px)]:hidden">
                                            atau masuk dengan
                                        </p>
                                        <div className="flex items-start gap-3">
                                            <a
                                                href="/auth/google"
                                                className={`flex flex-1 items-center justify-center gap-3 rounded-full border border-[#0E1A33]/15 bg-white py-2.5 text-sm font-medium transition-colors hover:bg-[#F5F7FB] ${FOCUS}`}
                                            >
                                                <svg
                                                    className="size-[18px]"
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        fill="#4285F4"
                                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    />
                                                    <path
                                                        fill="#34A853"
                                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    />
                                                    <path
                                                        fill="#FBBC05"
                                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                                    />
                                                    <path
                                                        fill="#EA4335"
                                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                                    />
                                                </svg>
                                                Google
                                            </a>
                                            <PasskeyButton />
                                        </div>
                                    </div>

                                    <p className="mt-[2.4vh] text-center text-[11px] leading-relaxed text-[#0E1A33]/50 [@media(max-height:780px)]:hidden">
                                        Dengan masuk, Anda menyetujui{' '}
                                        <Link
                                            href="/terms"
                                            className="underline underline-offset-2 hover:text-[#1B4F8F]"
                                        >
                                            Syarat Layanan
                                        </Link>{' '}
                                        dan{' '}
                                        <Link
                                            href="/privacy-policy"
                                            className="underline underline-offset-2 hover:text-[#1B4F8F]"
                                        >
                                            Kebijakan Privasi
                                        </Link>
                                        .
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
