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
    TrendingUp,
    Search,
    ShoppingBag,
    DollarSign,
    Target,
    Settings,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
} from 'lucide-react';

interface MetaConfig {
    id?: number;
    project_id?: number;
    ad_account_id?: string | null;
    pixel_id?: string | null;
    app_id?: string | null;
    fb_user_id?: string | null;
    fb_user_name?: string | null;
    token_expires_at?: string | null;
    has_access_token?: boolean;
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

interface CampaignItem {
    id: string;
    name: string;
    status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED' | string;
    objective: string;
    budget: number | null;
    budget_type: string;
    updated_time: string | null;
    spend: number;
    impressions: number;
    clicks: number;
    cpc: number;
    ctr: number;
    roas: number;
    purchases: number;
    leads: number;
    atc: number;
}

interface Props {
    project: Project | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ClientMetaConnectModal({ project, isOpen, onClose }: Props) {
    if (!project) return null;

    const existingConfig = project.meta_config;
    const isConnected = existingConfig?.status === 'connected';

    const [activeTab, setActiveTab] = useState<'campaigns' | 'settings'>(
        isConnected ? 'campaigns' : 'settings'
    );
    const [showToken, setShowToken] = useState(false);
    const [showAppSecret, setShowAppSecret] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isRedirectingFb, setIsRedirectingFb] = useState(false);
    const [useManualToken, setUseManualToken] = useState(false);
    const [copiedRedirectUri, setCopiedRedirectUri] = useState(false);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
        data?: any;
    } | null>(null);

    // Campaigns state
    const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
    const [campaignSearch, setCampaignSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');

    const { data, setData, post, processing, errors, reset } = useForm({
        ad_account_id: existingConfig?.ad_account_id || '',
        pixel_id: existingConfig?.pixel_id || '',
        app_id: existingConfig?.app_id || '',
        app_secret: '',
        access_token: '',
    });

    useEffect(() => {
        if (existingConfig) {
            setData({
                ad_account_id: existingConfig.ad_account_id || '',
                pixel_id: existingConfig.pixel_id || '',
                app_id: existingConfig.app_id || '',
                app_secret: '',
                access_token: '',
            });
            setActiveTab(existingConfig.status === 'connected' ? 'campaigns' : 'settings');
        }
        setTestResult(null);
    }, [existingConfig, isOpen]);

    const handleFacebookLogin = () => {
        const appId = data.app_id || existingConfig?.app_id;
        if (!appId) {
            setTestResult({
                success: false,
                message: 'Silakan isi Meta App ID terlebih dahulu untuk menggunakan Koneksi 1-Klik Facebook.',
            });
            return;
        }

        setIsRedirectingFb(true);

        const params = new URLSearchParams();
        if (data.app_id) params.set('app_id', data.app_id);
        if (data.app_secret) params.set('app_secret', data.app_secret);
        if (data.ad_account_id) params.set('ad_account_id', data.ad_account_id);
        if (data.pixel_id) params.set('pixel_id', data.pixel_id);
        params.set('return_url', window.location.href);

        window.location.href = `/projects/${project.id}/meta-config/oauth/redirect?${params.toString()}`;
    };

    // Fetch campaigns whenever modal opens or tab changes to campaigns
    useEffect(() => {
        if (isOpen && isConnected && activeTab === 'campaigns') {
            fetchCampaigns();
        }
    }, [isOpen, isConnected, activeTab]);

    const fetchCampaigns = async () => {
        setIsLoadingCampaigns(true);
        try {
            const res = await fetch(`/projects/${project.id}/meta-campaigns`);
            const json = await res.json();
            if (json.success && Array.isArray(json.campaigns)) {
                setCampaigns(json.campaigns);
            } else {
                setCampaigns([]);
            }
        } catch (e) {
            console.error('Failed fetching Meta campaigns:', e);
            setCampaigns([]);
        } finally {
            setIsLoadingCampaigns(false);
        }
    };

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
                setActiveTab('campaigns');
                fetchCampaigns();
            },
        });
    };

    const handleSyncNow = () => {
        router.post(`/projects/${project.id}/meta-config/sync`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                fetchCampaigns();
            },
        });
    };

    const handleDisconnect = () => {
        if (confirm(`Apakah Anda yakin ingin memutus koneksi Meta Ads untuk client ${project.client}?`)) {
            router.delete(`/projects/${project.id}/meta-config`, {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                    setTestResult(null);
                    setCampaigns([]);
                    setActiveTab('settings');
                },
            });
        }
    };

    const filteredCampaigns = campaigns.filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
            c.objective.toLowerCase().includes(campaignSearch.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Summary calculations
    const totalSpend = campaigns.reduce((acc, c) => acc + (c.spend || 0), 0);
    const totalPurchases = campaigns.reduce((acc, c) => acc + (c.purchases || 0), 0);
    const activeCampaignsCount = campaigns.filter((c) => c.status === 'ACTIVE').length;

    const formatCurrency = (val: number, currency: string = 'IDR') => {
        if (currency === 'IDR') {
            return 'Rp ' + Math.round(val).toLocaleString('id-ID');
        }
        return `${currency} ` + val.toLocaleString('en-US', { minimumFractionDigits: 2 });
    };

    const formatBudget = (budget: number | null, budgetType: string, currency: string = 'IDR') => {
        if (!budget) return 'AdSet Budget';
        // Meta API for IDR usually returns amounts in whole or in cents depending on API version
        const val = currency === 'IDR' && budget > 10000000 ? budget / 100 : budget;
        return `${formatCurrency(val, currency)} / ${budgetType === 'daily' ? 'hari' : 'total'}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className={`${activeTab === 'campaigns' && isConnected ? 'max-w-4xl' : 'max-w-2xl'} max-h-[92vh] overflow-y-auto p-0 border border-border/80 shadow-2xl rounded-2xl transition-all duration-200`}>
                {/* Header with Meta gradient banner */}
                <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-4 sm:p-5 text-white overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                            <div className="p-2 bg-white/15 backdrop-blur-md rounded-xl border border-white/20 shadow-inner shrink-0 mt-0.5">
                                <Share2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                                    <span>Integrasi Meta Ads (Facebook & Instagram)</span>
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                                        Client: {project.client}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription className="text-blue-100 text-[11px] mt-0.5">
                                    Hubungkan akun Facebook secara otomatis dengan 1 klik atau gunakan token manual.
                                </DialogDescription>
                            </div>
                        </div>

                        {isConnected ? (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-100 text-xs font-semibold shrink-0 shadow-sm self-start">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Terhubung: {existingConfig?.fb_user_name || existingConfig?.account_name || 'Akun Meta'}</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/25 border border-amber-400/40 text-amber-100 text-xs font-semibold shrink-0 self-start">
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                <span>Belum Terhubung</span>
                            </div>
                        )}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15">
                        <button
                            type="button"
                            onClick={() => setActiveTab('campaigns')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'campaigns'
                                    ? 'bg-white text-blue-700 shadow-md'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Semua Campaign ({campaigns.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('settings')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === 'settings'
                                    ? 'bg-white text-blue-700 shadow-md'
                                    : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                        >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Pengaturan API & Akun</span>
                        </button>
                    </div>
                </div>

                {/* Tab 1: Live Campaigns View */}
                {activeTab === 'campaigns' && (
                    <div className="p-4 sm:p-5 space-y-4">
                        {!isConnected ? (
                            /* State when not connected yet */
                            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-sidebar-border bg-muted/20 space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
                                    <Share2 className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-foreground text-sm">Akun Iklan Meta Belum Terhubung</h3>
                                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                    Masukkan <strong>Ad Account ID</strong> dan <strong>Access Token</strong> brand ini di tab Pengaturan agar semua campaign (Awareness, Sales, hingga CPAS Shopee) muncul otomatis di Genial ERP.
                                </p>
                                <Button
                                    type="button"
                                    onClick={() => setActiveTab('settings')}
                                    className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white h-8"
                                >
                                    <KeyRound className="w-3.5 h-3.5" />
                                    Buka Pengaturan API
                                </Button>
                            </div>
                        ) : (
                            /* Connected: Show Live Campaign Table */
                            <div className="space-y-4">
                                {/* Top KPI Summary Pills */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl border border-sidebar-border bg-card shadow-xs">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Campaign</span>
                                        <div className="mt-1 flex items-baseline justify-between">
                                            <span className="text-lg font-extrabold text-foreground">{campaigns.length}</span>
                                            <span className="text-[11px] font-semibold text-emerald-600">{activeCampaignsCount} Active</span>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl border border-sidebar-border bg-card shadow-xs">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Spend (30 Hari)</span>
                                        <div className="mt-1 flex items-baseline justify-between">
                                            <span className="text-lg font-extrabold text-blue-600">
                                                {formatCurrency(totalSpend, existingConfig?.currency || 'IDR')}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">Meta Insights</span>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-xl border border-sidebar-border bg-card shadow-xs">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Purchases / Order</span>
                                        <div className="mt-1 flex items-baseline justify-between">
                                            <span className="text-lg font-extrabold text-emerald-600">{totalPurchases.toLocaleString('id-ID')}</span>
                                            <span className="text-[11px] font-medium text-muted-foreground">Shopee & Web</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Controls: Search, Filters, Refresh */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                                    <div className="relative flex-1">
                                        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                        <Input
                                            placeholder="Cari nama campaign atau objective..."
                                            value={campaignSearch}
                                            onChange={(e) => setCampaignSearch(e.target.value)}
                                            className="h-8 pl-8 text-xs rounded-lg"
                                        />
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <div className="flex items-center rounded-lg border border-sidebar-border p-0.5 bg-muted/40">
                                            {(['ALL', 'ACTIVE', 'PAUSED'] as const).map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setStatusFilter(s)}
                                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                                                        statusFilter === s
                                                            ? 'bg-background text-foreground shadow-xs'
                                                            : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                                >
                                                    {s === 'ALL' ? 'Semua' : s === 'ACTIVE' ? 'Active' : 'Paused'}
                                                </button>
                                            ))}
                                        </div>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={fetchCampaigns}
                                            disabled={isLoadingCampaigns}
                                            className="h-8 px-2.5 text-xs gap-1 border-sidebar-border"
                                            title="Tarik data campaign terbaru dari Meta"
                                        >
                                            <RefreshCw className={`w-3 h-3 text-blue-600 ${isLoadingCampaigns ? 'animate-spin' : ''}`} />
                                            <span>{isLoadingCampaigns ? 'Loading...' : 'Refresh'}</span>
                                        </Button>
                                    </div>
                                </div>

                                {/* Campaigns Table */}
                                <div className="border border-sidebar-border rounded-xl overflow-hidden bg-card shadow-xs">
                                    <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-muted/60 text-[11px] font-bold text-muted-foreground uppercase border-b border-sidebar-border sticky top-0 z-10 backdrop-blur-sm">
                                                <tr>
                                                    <th className="py-2.5 px-3">Status</th>
                                                    <th className="py-2.5 px-3 min-w-[200px]">Nama Campaign</th>
                                                    <th className="py-2.5 px-3">Budget</th>
                                                    <th className="py-2.5 px-3">Spend (30d)</th>
                                                    <th className="py-2.5 px-3">Hasil / ROAS</th>
                                                    <th className="py-2.5 px-3">CTR / CPC</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-sidebar-border/60">
                                                {isLoadingCampaigns ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                                                                <span className="text-xs">Mengambil live data campaign dari Meta API...</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : filteredCampaigns.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-10 text-center text-muted-foreground">
                                                            {campaignSearch ? 'Tidak ada campaign yang cocok dengan pencarian.' : 'Belum ada campaign aktif pada akun iklan ini.'}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredCampaigns.map((camp) => (
                                                        <tr key={camp.id} className="hover:bg-muted/30 transition-colors">
                                                            {/* Status */}
                                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                    camp.status === 'ACTIVE'
                                                                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                                                        : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                                                }`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${camp.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                                    {camp.status}
                                                                </span>
                                                            </td>

                                                            {/* Name & Objective */}
                                                            <td className="py-2.5 px-3">
                                                                <div className="font-semibold text-foreground line-clamp-1" title={camp.name}>
                                                                    {camp.name}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono mt-0.5">
                                                                    <span>{camp.objective}</span>
                                                                    <span>•</span>
                                                                    <span>ID: {camp.id}</span>
                                                                </div>
                                                            </td>

                                                            {/* Budget */}
                                                            <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground font-medium text-[11px]">
                                                                {formatBudget(camp.budget, camp.budget_type, existingConfig?.currency || 'IDR')}
                                                            </td>

                                                            {/* Spend */}
                                                            <td className="py-2.5 px-3 whitespace-nowrap font-bold text-foreground">
                                                                {camp.spend > 0 ? formatCurrency(camp.spend, existingConfig?.currency || 'IDR') : '-'}
                                                            </td>

                                                            {/* Hasil / ROAS */}
                                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    {camp.roas > 0 ? (
                                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-500/30">
                                                                            <TrendingUp className="w-3 h-3" />
                                                                            {camp.roas}x ROAS
                                                                        </span>
                                                                    ) : null}

                                                                    {camp.purchases > 0 ? (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-semibold bg-blue-500/10 px-1.5 py-0.5 rounded">
                                                                            <ShoppingBag className="w-2.5 h-2.5" />
                                                                            {camp.purchases} Orders
                                                                        </span>
                                                                    ) : null}

                                                                    {camp.leads > 0 ? (
                                                                        <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 font-semibold bg-purple-500/10 px-1.5 py-0.5 rounded">
                                                                            <Target className="w-2.5 h-2.5" />
                                                                            {camp.leads} Leads
                                                                        </span>
                                                                    ) : null}

                                                                    {camp.roas === 0 && camp.purchases === 0 && camp.leads === 0 && (
                                                                        <span className="text-[10px] text-muted-foreground">-</span>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* CTR / CPC */}
                                                            <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-muted-foreground">
                                                                {camp.clicks > 0 ? (
                                                                    <div>
                                                                        <span className="font-semibold text-foreground">{camp.ctr.toFixed(2)}%</span> CTR
                                                                        <span className="text-muted-foreground/50 mx-1">•</span>
                                                                        <span>{formatCurrency(camp.cpc, existingConfig?.currency || 'IDR')}</span>
                                                                    </div>
                                                                ) : '-'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 2: Settings / API Configuration */}
                {activeTab === 'settings' && (
                    <div className="p-4 sm:p-5 space-y-4">
                        {/* Active Status Card if already connected */}
                        {isConnected && existingConfig && (
                            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        <span className="font-bold text-foreground">
                                            {existingConfig.fb_user_name ? `Akun Facebook: ${existingConfig.fb_user_name}` : (existingConfig.account_name || 'Akun Meta Terhubung')}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] h-4 px-1 font-mono bg-background">
                                            {existingConfig.currency || 'IDR'}
                                        </Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                                        <span>Ad Account: <strong className="font-mono">{existingConfig.ad_account_id}</strong></span>
                                        {existingConfig.account_name && (
                                            <>
                                                <span>•</span>
                                                <span>{existingConfig.account_name}</span>
                                            </>
                                        )}
                                        {existingConfig.token_expires_at && (
                                            <>
                                                <span>•</span>
                                                <span>Exp: {new Date(existingConfig.token_expires_at).toLocaleDateString('id-ID')}</span>
                                            </>
                                        )}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSyncNow}
                                        className="gap-1 text-[11px] h-7 px-2.5 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                                    >
                                        <RefreshCw className="w-3 h-3 text-emerald-600" />
                                        Sync
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDisconnect}
                                        className="text-[11px] h-7 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                    >
                                        <Unlink className="w-3 h-3" />
                                        Putus
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Error Banner if connection failed */}
                        {existingConfig?.status === 'error' && (
                            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 flex items-start gap-2.5 text-xs">
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

                        {/* Koneksi 1-Klik Facebook (Login with Facebook) Box */}
                        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/25 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white font-black text-xs shadow-xs">
                                        f
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground">
                                        Koneksi 1-Klik Facebook (Login with Facebook)
                                    </h4>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                                    Cukup klik tombol untuk login akun Facebook dan mendapatkan Access Token Long-Lived secara otomatis tanpa input manual.
                                </p>
                            </div>

                            <Button
                                type="button"
                                onClick={handleFacebookLogin}
                                disabled={isRedirectingFb}
                                className="bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs gap-2 shrink-0 cursor-pointer self-start sm:self-center"
                            >
                                <div className="flex size-4 items-center justify-center rounded-full bg-white text-[#1877F2] font-black text-[10px]">
                                    f
                                </div>
                                <span>
                                    {isRedirectingFb
                                        ? 'Membuka Facebook...'
                                        : isConnected
                                        ? 'Hubungkan Ulang / Ganti Akun'
                                        : 'Hubungkan dengan Facebook'}
                                </span>
                            </Button>
                        </div>

                        {/* Configuration Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Row 1: Meta App ID & Meta App Secret */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="app_id" className="text-xs font-semibold text-foreground">
                                        Meta App ID
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        App ID dari Meta for Developers (diperlukan untuk tombol Login FB).
                                    </p>
                                    <Input
                                        id="app_id"
                                        placeholder="Contoh: 1808794403668949"
                                        value={data.app_id}
                                        onChange={(e) => setData('app_id', e.target.value)}
                                        className="font-mono text-xs h-9"
                                    />
                                    {errors.app_id && (
                                        <p className="text-[11px] text-rose-600">{errors.app_id}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="app_secret" className="text-xs font-semibold text-foreground">
                                        Meta App Secret
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        App Secret dari Meta for Developers.
                                    </p>
                                    <div className="relative">
                                        <Input
                                            id="app_secret"
                                            type={showAppSecret ? 'text' : 'password'}
                                            placeholder={existingConfig?.app_id ? '••••••••••••••••••••••••••••' : 'App Secret'}
                                            value={data.app_secret}
                                            onChange={(e) => setData('app_secret', e.target.value)}
                                            className="font-mono text-xs h-9 pr-9"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowAppSecret(!showAppSecret)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                        >
                                            {showAppSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.app_secret && (
                                        <p className="text-[11px] text-rose-600">{errors.app_secret}</p>
                                    )}
                                </div>
                            </div>

                            {/* Row 2: Meta Ad Account ID & Meta Pixel ID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label htmlFor="ad_account_id" className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>Meta Ad Account ID <span className="text-rose-500">*</span></span>
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        ID Akun Iklan Meta (dimulai dengan act_).
                                    </p>
                                    <Input
                                        id="ad_account_id"
                                        placeholder="act_4489107658080015"
                                        value={data.ad_account_id}
                                        onChange={(e) => setData('ad_account_id', e.target.value)}
                                        className="font-mono text-xs h-9"
                                        required
                                    />
                                    {errors.ad_account_id && (
                                        <p className="text-[11px] text-rose-600">{errors.ad_account_id}</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="pixel_id" className="text-xs font-semibold text-foreground flex items-center justify-between">
                                        <span>Meta Pixel ID <span className="text-muted-foreground font-normal text-[11px]">(Opsional)</span></span>
                                    </Label>
                                    <p className="text-[11px] text-muted-foreground">
                                        Tracking CAPI website (Kosongkan jika CPAS Shopee).
                                    </p>
                                    <Input
                                        id="pixel_id"
                                        placeholder="misal: 928374615283921"
                                        value={data.pixel_id}
                                        onChange={(e) => setData('pixel_id', e.target.value)}
                                        className="font-mono text-xs h-9"
                                    />
                                    {errors.pixel_id && (
                                        <p className="text-[11px] text-rose-600">{errors.pixel_id}</p>
                                    )}
                                </div>
                            </div>

                            {/* Row 3: Collapsible Manual System User Token Accordion */}
                            <div className="rounded-xl border border-border/80 bg-muted/20 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setUseManualToken(!useManualToken)}
                                    className="w-full flex items-center justify-between p-3 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <KeyRound className="w-4 h-4 text-muted-foreground" />
                                        <span>Opsi Alternatif: Gunakan Token Manual (System User / Tanpa Expiry)</span>
                                        {existingConfig?.has_access_token && (
                                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-normal">
                                                Token Tersimpan
                                            </Badge>
                                        )}
                                    </div>
                                    {useManualToken ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                </button>

                                {useManualToken && (
                                    <div className="p-3 pt-0 border-t border-border/60 space-y-2 mt-2">
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                                            Gunakan token permanen dari Meta Business Settings jika Anda tidak ingin menggunakan login Facebook atau memerlukan token yang tidak pernah kadaluarsa.
                                        </p>
                                        <div className="relative">
                                            <Input
                                                id="access_token"
                                                type={showToken ? 'text' : 'password'}
                                                placeholder={existingConfig?.has_access_token ? '••••••••••••••••••••••••••••••••••••••••' : 'EAABw... (Token System User Meta)'}
                                                value={data.access_token}
                                                onChange={(e) => setData('access_token', e.target.value)}
                                                className="font-mono text-xs h-9 pr-9"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowToken(!showToken)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                            >
                                                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.access_token && (
                                            <p className="text-[11px] text-rose-600">{errors.access_token}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Row 4: Valid OAuth Redirect URI Helper for Developer Portal */}
                            <div className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                                        <ExternalLink className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        Valid OAuth Redirect URI untuk Meta for Developers:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const url = `${window.location.origin}/projects/${project.id}/meta-config/oauth/callback`;
                                            navigator.clipboard.writeText(url);
                                            setCopiedRedirectUri(true);
                                            setTimeout(() => setCopiedRedirectUri(false), 2000);
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                                    >
                                        {copiedRedirectUri ? (
                                            <>
                                                <Check className="w-3 h-3 text-emerald-600" />
                                                <span className="text-emerald-600 font-bold">Tersalin!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-3 h-3" />
                                                <span>Salin URL</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="bg-background/90 rounded-md p-2 font-mono text-[11px] text-foreground border border-border/60 break-all select-all">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/projects/${project.id}/meta-config/oauth/callback` : `/projects/${project.id}/meta-config/oauth/callback`}
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Masukkan URL ini di Meta for Developers ➡️ <strong>Facebook Login for Business</strong> ➡️ <strong>Settings</strong> ➡️ <strong>Valid OAuth Redirect URIs</strong>.
                                </p>
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
                                                    <div>Akun Iklan: <strong>{testResult.data.account_name}</strong></div>
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
                                    Kredensial disimpan dengan enkripsi AES-256 dan hanya digunakan untuk membaca performa iklan akun ini.
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleTestConnection}
                                    disabled={isTesting || !data.ad_account_id}
                                    className="gap-1.5 text-xs h-9 px-3 cursor-pointer"
                                >
                                    <Activity className={`w-3.5 h-3.5 text-blue-600 ${isTesting ? 'animate-spin' : ''}`} />
                                    {isTesting ? 'Testing...' : 'Test Koneksi'}
                                </Button>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={onClose}
                                        className="text-xs h-9 px-3 cursor-pointer"
                                    >
                                        Tutup
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="gap-1.5 text-xs h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-semibold shadow-xs"
                                    >
                                        <Share2 className="w-3.5 h-3.5" />
                                        {processing ? 'Menyimpan...' : 'Simpan Konfigurasi'}
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
                            <ul className="text-[10px] text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
                                <li><strong>Meta App ID & Secret:</strong> Dibuat di <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">developers.facebook.com</a> dengan produk <strong>Facebook Login for Business</strong>.</li>
                                <li><strong>Ad Account ID:</strong> Buka Ads Manager, salin nomor ID akun yang berawalan <code className="px-1 py-0.2 rounded bg-muted font-mono">act_</code> di URL atau dropdown akun.</li>
                                <li><strong>System User Token (Manual):</strong> Buka <strong>Meta Business Settings</strong> ➡️ <strong>System Users</strong> ➡️ Generate Token dengan izin <code className="px-1 py-0.2 rounded bg-muted font-mono">ads_read</code> & <code className="px-1 py-0.2 rounded bg-muted font-mono">read_insights</code>.</li>
                            </ul>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
