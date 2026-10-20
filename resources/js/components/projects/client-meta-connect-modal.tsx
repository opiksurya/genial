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
import {
    Share2,
    CheckCircle2,
    XCircle,
    RefreshCw,
    ShieldCheck,
    KeyRound,
    Layers,
    Activity,
    Info,
    ExternalLink,
    Eye,
    EyeOff,
    HelpCircle,
    Unlink,
} from 'lucide-react';

interface MetaConfig {
    id?: number;
    project_id?: number;
    ad_account_id?: string | null;
    pixel_id?: string | null;
    account_name?: string | null;
    currency?: string | null;
    timezone_name?: string | null;
    account_status?: number | null;
    status: 'connected' | 'error' | 'disconnected';
    last_synced_at?: string | null;
    error_message?: string | null;
}

interface Project {
    id: number;
    name: string;
    client: string;
    meta_config?: MetaConfig | null;
}

interface Props {
    project: Project | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ClientMetaConnectModal({ project, isOpen, onClose }: Props) {
    if (!project) return null;

    const existingConfig = project.meta_config;

    const [showToken, setShowToken] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
        data?: any;
    } | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        ad_account_id: existingConfig?.ad_account_id || '',
        pixel_id: existingConfig?.pixel_id || '',
        access_token: '',
    });

    useEffect(() => {
        if (existingConfig) {
            setData({
                ad_account_id: existingConfig.ad_account_id || '',
                pixel_id: existingConfig.pixel_id || '',
                access_token: '',
            });
        }
        setTestResult(null);
    }, [existingConfig, isOpen]);

    const handleTestConnection = async () => {
        if (!data.ad_account_id) {
            setTestResult({
                success: false,
                message: 'Silakan isi Ad Account ID terlebih dahulu.',
            });
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch(`/projects/${project.id}/meta-config/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    ad_account_id: data.ad_account_id,
                    access_token: data.access_token || undefined,
                }),
            });

            const json = await res.json();
            setTestResult(json);
        } catch (err: any) {
            setTestResult({
                success: false,
                message: 'Gagal terhubung ke server backend untuk testing: ' + (err.message || 'Network error'),
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/projects/${project.id}/meta-config`, {
            preserveScroll: true,
            onSuccess: () => {
                setTestResult(null);
                onClose();
            },
        });
    };

    const handleSyncNow = () => {
        router.post(`/projects/${project.id}/meta-config/sync`, {}, {
            preserveScroll: true,
        });
    };

    const handleDisconnect = () => {
        if (confirm(`Apakah Anda yakin ingin memutus koneksi Meta Ads untuk client ${project.client}?`)) {
            router.delete(`/projects/${project.id}/meta-config`, {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    setTestResult(null);
                },
            });
        }
    };

    const isConnected = existingConfig?.status === 'connected';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 border border-border/80 shadow-xl rounded-xl">
                {/* Header with Meta gradient banner */}
                <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-4 sm:p-5 text-white overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-white/15 backdrop-blur-md rounded-lg border border-white/20 shadow-inner">
                                <Share2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                                    <span>Meta Ads & Pixel</span>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                                        {project.client}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription className="text-blue-100 text-[11px] mt-0.5">
                                    Koneksi akun iklan Meta & Pixel client untuk integrasi ROAS dan otomatisasi agen AI.
                                </DialogDescription>
                            </div>
                        </div>

                        {isConnected && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-100 text-[11px] font-medium shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Terhubung
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                    {/* Active Status Card if already connected */}
                    {isConnected && existingConfig && (
                        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span className="font-semibold text-foreground">
                                        {existingConfig.account_name || 'Akun Meta Terhubung'}
                                    </span>
                                    <Badge variant="outline" className="text-[10px] h-4 px-1 font-mono bg-background">
                                        {existingConfig.currency || 'IDR'}
                                    </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                    <span>Ad Account: <strong className="font-mono">{existingConfig.ad_account_id}</strong></span>
                                    <span>•</span>
                                    <span>{existingConfig.timezone_name || 'Asia/Jakarta'}</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSyncNow}
                                    className="gap-1 text-[11px] h-7 px-2 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                >
                                    <RefreshCw className="w-3 h-3 text-emerald-600" />
                                    Sync
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDisconnect}
                                    className="text-[11px] h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                >
                                    <Unlink className="w-3 h-3" />
                                    Putus
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Error Banner if connection failed */}
                    {existingConfig?.status === 'error' && (
                        <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 flex items-start gap-2.5 text-xs">
                            <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                                <p className="font-semibold text-rose-800 dark:text-rose-200">
                                    Koneksi Meta Bermasalah
                                </p>
                                <p className="text-[11px] text-rose-600 dark:text-rose-300">
                                    {existingConfig.error_message || 'Token Meta kadaluarsa atau Ad Account ID tidak valid.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Configuration Form */}
                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        <div className="space-y-1">
                            <Label htmlFor="ad_account_id" className="text-xs font-semibold flex items-center justify-between">
                                <span>Ad Account ID <span className="text-rose-500">*</span></span>
                                <span className="text-[10px] text-muted-foreground font-normal">
                                    Contoh: act_123456789
                                </span>
                            </Label>
                            <Input
                                id="ad_account_id"
                                placeholder="act_10827364528192"
                                value={data.ad_account_id}
                                onChange={(e) => setData('ad_account_id', e.target.value)}
                                className="font-mono text-xs h-8"
                                required
                            />
                            {errors.ad_account_id && (
                                <p className="text-[11px] text-rose-600">{errors.ad_account_id}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="pixel_id" className="text-xs font-semibold flex items-center justify-between">
                                <span>Meta Pixel ID <span className="text-muted-foreground font-normal text-[11px]">(Opsional)</span></span>
                                <span className="text-[10px] text-muted-foreground font-normal">
                                    Tracking CAPI client
                                </span>
                            </Label>
                            <Input
                                id="pixel_id"
                                placeholder="misal: 928374615283921"
                                value={data.pixel_id}
                                onChange={(e) => setData('pixel_id', e.target.value)}
                                className="font-mono text-xs h-8"
                            />
                            {errors.pixel_id && (
                                <p className="text-[11px] text-rose-600">{errors.pixel_id}</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="access_token" className="text-xs font-semibold flex items-center gap-1.5">
                                    <span>System User Access Token</span>
                                    {existingConfig?.access_token && (
                                        <Badge variant="secondary" className="text-[9px] h-3.5 px-1">
                                            Tersimpan
                                        </Badge>
                                    )}
                                </Label>
                                <span className="text-[10px] text-muted-foreground font-normal">
                                    {existingConfig?.access_token ? 'Kosongkan jika tak diubah' : 'Wajib diisi'}
                                </span>
                            </div>
                            
                            <div className="relative">
                                <Input
                                    id="access_token"
                                    type={showToken ? 'text' : 'password'}
                                    placeholder={existingConfig?.access_token ? '••••••••••••••••••••••••••••••••••••••••' : 'EAABw... (Token System User Meta)'}
                                    value={data.access_token}
                                    onChange={(e) => setData('access_token', e.target.value)}
                                    className="font-mono text-xs h-8 pr-8"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowToken(!showToken)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                            {errors.access_token && (
                                <p className="text-[11px] text-rose-600">{errors.access_token}</p>
                            )}
                        </div>

                        {/* Test Connection Live Result Box */}
                        {testResult && (
                            <div className={`p-2.5 rounded-lg text-xs border ${
                                testResult.success 
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200' 
                                    : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
                            }`}>
                                <div className="flex items-start gap-2">
                                    {testResult.success ? (
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    ) : (
                                        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                    )}
                                    <div className="space-y-0.5 flex-1">
                                        <p className="font-semibold text-xs">{testResult.message}</p>
                                        {testResult.data && (
                                            <div className="text-[10px] opacity-90 font-mono space-y-0.5 pt-0.5">
                                                <div>Akun: <strong>{testResult.data.account_name}</strong></div>
                                                <div>Currency: <strong>{testResult.data.currency}</strong> ({testResult.data.timezone_name})</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Notice */}
                        <div className="flex items-center gap-1.5 p-2 rounded-md bg-muted/50 text-muted-foreground text-[10px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>
                                Token dienkripsi (AES-256) & hanya dipakai untuk membaca performa iklan client ini.
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleTestConnection}
                                disabled={isTesting || !data.ad_account_id}
                                className="gap-1.5 text-xs h-8 px-2.5"
                            >
                                <Activity className={`w-3 h-3 text-blue-600 ${isTesting ? 'animate-spin' : ''}`} />
                                {isTesting ? 'Testing...' : 'Test Koneksi'}
                            </Button>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={onClose}
                                    className="text-xs h-8 px-2.5"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="gap-1.5 text-xs h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Share2 className="w-3 h-3" />
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/* Helpful Guide Accordion / Box */}
                    <div className="pt-2 border-t border-border/60">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground mb-1">
                            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                            <span>Panduan Cepat Meta Ads:</span>
                        </div>
                        <ul className="text-[10px] text-muted-foreground space-y-0.5 list-disc list-inside leading-relaxed">
                            <li>Buka <strong>Meta Business Settings</strong> ➡️ <strong>System Users</strong>.</li>
                            <li>Generate token dengan izin: <code className="px-1 py-0.2 rounded bg-muted font-mono">ads_read</code>, <code className="px-1 py-0.2 rounded bg-muted font-mono">read_insights</code>.</li>
                            <li>Masukkan <strong>Ad Account ID</strong> (contoh: <code className="px-1 py-0.2 rounded bg-muted font-mono">act_1234567890</code>).</li>
                        </ul>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
