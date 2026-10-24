import React, { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    ShoppingBag,
    Eye,
    EyeOff,
    Info,
    Copy,
    Check,
    CheckCircle2,
    XCircle,
    Activity,
    Unlink,
    ExternalLink,
    Store,
    Sparkles,
} from 'lucide-react';
import type { ShopeeConfig } from '@/types/shopee';

interface Project {
    id: number;
    name: string;
    client: string | null;
    shopee_config?: ShopeeConfig | null;
    shopeeConfig?: ShopeeConfig | null;
}

interface Props {
    project: Project | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ClientShopeeConnectModal({ project, isOpen, onClose }: Props) {
    if (!project) return null;

    const existingConfig = project.shopee_config || project.shopeeConfig;
    const isConnected = existingConfig?.status === 'connected';

    const [showKey, setShowKey] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
        data?: any;
    } | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        partner_id: existingConfig?.partner_id || '',
        partner_key: '',
        is_sandbox: existingConfig?.is_sandbox || false,
    });

    useEffect(() => {
        if (existingConfig) {
            setData({
                partner_id: existingConfig.partner_id || '',
                partner_key: '',
                is_sandbox: Boolean(existingConfig.is_sandbox),
            });
        }
        setTestResult(null);
    }, [existingConfig, isOpen]);

    // Construct the canonical redirect URI to register in Shopee Open Platform
    const callbackUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/shopee/callback`
        : `/auth/shopee/callback`;

    const handleCopyUrl = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(callbackUrl);
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        }
    };

    const handleShopeeAuth = () => {
        const partnerId = data.partner_id || existingConfig?.partner_id;
        if (!partnerId) {
            setTestResult({
                success: false,
                message: 'Silakan masukkan Partner ID terlebih dahulu.',
            });
            return;
        }

        setIsRedirecting(true);

        const params = new URLSearchParams();
        if (data.partner_id) params.set('partner_id', data.partner_id);
        if (data.partner_key) params.set('partner_key', data.partner_key);
        params.set('is_sandbox', data.is_sandbox ? '1' : '0');
        params.set('return_url', window.location.href);

        window.location.href = `/projects/${project.id}/shopee-config/oauth/redirect?${params.toString()}`;
    };

    const handleTestConnection = async () => {
        if (!data.partner_id) {
            setTestResult({
                success: false,
                message: 'Silakan isi Partner ID terlebih dahulu.',
            });
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(`/projects/${project.id}/shopee-config/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    partner_id: data.partner_id,
                    partner_key: data.partner_key || undefined,
                    is_sandbox: data.is_sandbox,
                }),
            });

            const json = await res.json();
            setTestResult(json);
        } catch (err: any) {
            setTestResult({
                success: false,
                message: 'Gagal menghubungi server untuk testing: ' + (err.message || 'Network error'),
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/projects/${project.id}/shopee-config`, {
            preserveScroll: true,
            onSuccess: () => {
                setTestResult({
                    success: true,
                    message: 'Kredensial Shopee API berhasil disimpan.',
                });
            },
        });
    };

    const handleDisconnect = () => {
        if (confirm('Apakah Anda yakin ingin memutus koneksi akun toko Shopee ini?')) {
            router.post(`/projects/${project.id}/shopee-config/disconnect`, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    setTestResult(null);
                },
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[480px] p-0 overflow-hidden border border-border/80 shadow-2xl rounded-3xl bg-card">
                {/* Header matching screenshot */}
                <div className="p-5 pb-4 flex items-start gap-3.5 border-b border-border/50">
                    <div className="size-11 shrink-0 rounded-2xl bg-[#FFF1ED] dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40 flex items-center justify-center text-[#EE4D2D] shadow-xs">
                        <ShoppingBag className="size-5.5 stroke-[2.3]" />
                    </div>

                    <div className="space-y-0.5 min-w-0 flex-1">
                        <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                            Pengaturan Kredensial Shopee API
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground leading-normal">
                            Diperoleh dari Shopee Open Platform Developer Console (open.shopee.com)
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
                    {/* Status Badge Pill if already connected */}
                    {isConnected && existingConfig && (
                        <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 flex items-center justify-between gap-3 text-xs">
                            <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="font-bold text-emerald-950 dark:text-emerald-100">
                                        Terhubung: {existingConfig.shop_name || `Shop #${existingConfig.shop_id}`}
                                    </span>
                                    {existingConfig.is_sandbox && (
                                        <Badge variant="outline" className="text-[9px] h-4 px-1 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                                            Sandbox
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Shop ID: <strong className="font-mono text-foreground">{existingConfig.shop_id}</strong>
                                    {existingConfig.last_synced_at && (
                                        <span> • Sync: {new Date(existingConfig.last_synced_at).toLocaleDateString('id-ID')}</span>
                                    )}
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleDisconnect}
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs h-7 px-2 shrink-0 cursor-pointer"
                            >
                                <Unlink className="size-3 mr-1" />
                                Putus
                            </Button>
                        </div>
                    )}

                    {/* Quick 1-Click Store Authorization Box if Partner ID is provided */}
                    {(data.partner_id || existingConfig?.partner_id) && (
                        <div className="rounded-2xl border border-orange-200/80 dark:border-orange-900/40 bg-gradient-to-r from-orange-50/80 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/10 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                            <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <Store className="size-4 text-[#EE4D2D]" />
                                    <span className="text-xs font-bold text-foreground">
                                        Otorisasi Toko Shopee
                                    </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    {isConnected
                                        ? 'Hubungkan ulang jika token kadaluarsa atau ingin ganti toko.'
                                        : 'Klik untuk login dan memberikan izin akses toko Shopee ke Genial.'}
                                </p>
                            </div>

                            <Button
                                type="button"
                                onClick={handleShopeeAuth}
                                disabled={isRedirecting}
                                className="bg-[#EE4D2D] hover:bg-[#d73211] text-white text-xs font-bold h-8 px-3 rounded-xl shadow-xs gap-1.5 shrink-0 cursor-pointer"
                            >
                                <ShoppingBag className="size-3.5" />
                                <span>
                                    {isRedirecting
                                        ? 'Membuka...'
                                        : isConnected
                                        ? 'Hubungkan Ulang'
                                        : 'Hubungkan Toko'}
                                </span>
                            </Button>
                        </div>
                    )}

                    {/* Configuration Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Field 1: Partner ID */}
                        <div className="space-y-1.5">
                            <Label htmlFor="shopee_partner_id" className="text-xs font-bold text-foreground">
                                Partner ID <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="shopee_partner_id"
                                placeholder="2046979"
                                value={data.partner_id}
                                onChange={(e) => setData('partner_id', e.target.value)}
                                className="font-mono text-xs h-10 rounded-xl bg-background"
                                required
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Ditemukan di menu App Info pada dashboard developer Shopee.
                            </p>
                            {errors.partner_id && (
                                <p className="text-[11px] text-rose-600">{errors.partner_id}</p>
                            )}
                        </div>

                        {/* Field 2: Partner Key / App Secret */}
                        <div className="space-y-1.5">
                            <Label htmlFor="shopee_partner_key" className="text-xs font-bold text-foreground">
                                Partner Key / App Secret <span className="text-rose-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="shopee_partner_key"
                                    type={showKey ? 'text' : 'password'}
                                    placeholder={existingConfig?.partner_id ? '••••••••••••••••••••••••••••••••••••••••' : 'Masukkan Partner Key'}
                                    value={data.partner_key}
                                    onChange={(e) => setData('partner_key', e.target.value)}
                                    className="font-mono text-xs h-10 pr-9 rounded-xl bg-background"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                    title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                                >
                                    {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Kunci rahasia untuk enkripsi keamanan signature HMAC-SHA256.
                            </p>
                            {errors.partner_key && (
                                <p className="text-[11px] text-rose-600">{errors.partner_key}</p>
                            )}
                        </div>

                        {/* Info Card: Redirect / Callback URL */}
                        <div className="rounded-2xl border border-blue-200/80 dark:border-blue-900/50 bg-[#F4F9FF] dark:bg-blue-950/20 p-3.5 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                    <div className="size-4 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <Info className="size-3 stroke-[2.5]" />
                                    </div>
                                    <span>Redirect / Callback URL untuk Shopee Open Platform:</span>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCopyUrl}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer shrink-0"
                                >
                                    {copiedUrl ? (
                                        <>
                                            <Check className="size-3 text-emerald-600" />
                                            <span className="text-emerald-600 font-bold">Tersalin!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-3" />
                                            <span>Salin</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-white dark:bg-card rounded-xl p-2.5 font-mono text-xs text-foreground border border-border/80 break-all select-all">
                                {callbackUrl}
                            </div>

                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Salin URL di atas ke kolom <strong>Redirect URL</strong> pada App di Shopee Open Platform.
                            </p>
                        </div>

                        {/* Checkbox: Sandbox Environment */}
                        <div className="flex items-center space-x-2 pt-1">
                            <Checkbox
                                id="is_sandbox"
                                checked={data.is_sandbox}
                                onCheckedChange={(checked) => setData('is_sandbox', Boolean(checked))}
                                className="cursor-pointer"
                            />
                            <Label
                                htmlFor="is_sandbox"
                                className="text-xs font-medium text-foreground cursor-pointer leading-tight select-none"
                            >
                                Gunakan <strong>Test / Sandbox Environment</strong> <span className="text-muted-foreground font-normal">(partner.test-stable.shopeemobile.com)</span>
                            </Label>
                        </div>

                        {/* Test Connection Live Result Box */}
                        {testResult && (
                            <div className={`p-3 rounded-xl text-xs border ${
                                testResult.success
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                            }`}>
                                <div className="flex items-start gap-2">
                                    {testResult.success ? (
                                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                                    )}
                                    <div className="space-y-0.5 flex-1 min-w-0">
                                        <p className="font-semibold text-xs">{testResult.message}</p>
                                        {testResult.data && (
                                            <div className="text-[10px] opacity-90 font-mono space-y-0.5 pt-0.5">
                                                <div>Toko: <strong>{testResult.data.shop_name}</strong></div>
                                                <div>Shop ID: <strong>{testResult.data.shop_id}</strong></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer Action Buttons matching screenshot */}
                        <div className="flex items-center justify-between pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTestConnection}
                                disabled={isTesting || !data.partner_id}
                                className="text-xs h-9 px-3 rounded-xl gap-1.5 cursor-pointer"
                            >
                                <Activity className={`size-3.5 text-orange-600 ${isTesting ? 'animate-spin' : ''}`} />
                                <span>{isTesting ? 'Menguji...' : 'Test'}</span>
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={onClose}
                                    className="text-xs h-9 px-3.5 rounded-xl cursor-pointer text-muted-foreground hover:text-foreground"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[#EE4D2D] hover:bg-[#d73211] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
