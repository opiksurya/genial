import { Head, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Activity, BarChart3, CheckCircle2 } from 'lucide-react';

type Props = {
    settings: {
        meta_pixel_id: string;
        meta_access_token: string;
        meta_test_event_code: string;
        meta_enabled: boolean;
        gtm_id: string;
        gtm_enabled: boolean;
        ga4_id: string;
        ga4_enabled: boolean;
    };
    status?: string;
};

export default function TrackingSettings({ settings, status }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        meta_pixel_id: settings.meta_pixel_id || '',
        meta_access_token: settings.meta_access_token || '',
        meta_test_event_code: settings.meta_test_event_code || '',
        meta_enabled: settings.meta_enabled || false,
        gtm_id: settings.gtm_id || '',
        gtm_enabled: settings.gtm_enabled || false,
        ga4_id: settings.ga4_id || 'G-YRNS0SP4P7',
        ga4_enabled: settings.ga4_enabled ?? true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/settings/pixel', {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Tracking & Analytics Settings" />

            <div className="space-y-8">
                <Heading
                    variant="small"
                    title="Tracking & Analytics Settings"
                    description="Kelola integrasi Google Analytics 4 (GA4), Google Tag Manager (GTM), Meta Pixel ID, dan Conversions API (CAPI) dengan auto-behavior tracking"
                />

                {status && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>{status}</span>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-8">
                    
                    {/* SECTION 1: GOOGLE ANALYTICS 4 (GA4) */}
                    <div className="p-6 rounded-2xl border border-sidebar-border bg-card shadow-sm space-y-5">
                        <div className="flex items-center gap-3 border-b border-sidebar-border pb-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground">Google Analytics 4 (GA4 - gtag.js)</h3>
                                <p className="text-xs text-muted-foreground">
                                    Tracking analisis pengunjung website langsung dengan Tag Measurement ID (cth: G-YRNS0SP4P7)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-muted/40 rounded-xl border border-sidebar-border">
                            <Checkbox
                                id="ga4_enabled"
                                checked={data.ga4_enabled}
                                onCheckedChange={(checked) => setData('ga4_enabled', Boolean(checked))}
                            />
                            <div>
                                <Label htmlFor="ga4_enabled" className="font-semibold cursor-pointer text-sm">
                                    Aktifkan Google Analytics 4 (GA4)
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Otomatis menyuntikkan script gtag.js dan mengirim event PageView & Lead ke Google Analytics.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="ga4_id" className="font-semibold text-xs">
                                GA4 Measurement ID (Google Tag) *
                            </Label>
                            <Input
                                id="ga4_id"
                                value={data.ga4_id}
                                onChange={(e) => setData('ga4_id', e.target.value)}
                                placeholder="Contoh: G-YRNS0SP4P7"
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Dapatkan Measurement ID dari Google Analytics (Admin -&gt; Data Streams -&gt; Measurement ID).
                            </p>
                            <InputError message={errors.ga4_id} />
                        </div>
                    </div>

                    {/* SECTION 2: GOOGLE TAG MANAGER (GTM) */}
                    <div className="p-6 rounded-2xl border border-sidebar-border bg-card shadow-sm space-y-5">
                        <div className="flex items-center gap-3 border-b border-sidebar-border pb-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground">Google Tag Manager (GTM)</h3>
                                <p className="text-xs text-muted-foreground">
                                    Integrasi otomatis Google Analytics 4 (GA4) & DataLayer lead behavior tracking
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-muted/40 rounded-xl border border-sidebar-border">
                            <Checkbox
                                id="gtm_enabled"
                                checked={data.gtm_enabled}
                                onCheckedChange={(checked) => setData('gtm_enabled', Boolean(checked))}
                            />
                            <div>
                                <Label htmlFor="gtm_enabled" className="font-semibold cursor-pointer text-sm">
                                    Aktifkan Google Tag Manager (GTM)
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Otomatis mengaktifkan script GTM & DataLayer auto-tracking di seluruh halaman web.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="gtm_id" className="font-semibold text-xs">
                                GTM Container ID
                            </Label>
                            <Input
                                id="gtm_id"
                                value={data.gtm_id}
                                onChange={(e) => setData('gtm_id', e.target.value)}
                                placeholder="Contoh: GTM-N8X7XYZ"
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Dapatkan Container ID dari akun Google Tag Manager Anda.
                            </p>
                            <InputError message={errors.gtm_id} />
                        </div>
                    </div>

                    {/* SECTION 3: META PIXEL & CONVERSIONS API (CAPI) */}
                    <div className="p-6 rounded-2xl border border-sidebar-border bg-card shadow-sm space-y-5">
                        <div className="flex items-center gap-3 border-b border-sidebar-border pb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground">Meta Pixel & Conversions API (CAPI)</h3>
                                <p className="text-xs text-muted-foreground">
                                    Tracking iklan Facebook/Instagram Ads hybrid browser & server-side
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-4 bg-muted/40 rounded-xl border border-sidebar-border">
                            <Checkbox
                                id="meta_enabled"
                                checked={data.meta_enabled}
                                onCheckedChange={(checked) => setData('meta_enabled', Boolean(checked))}
                            />
                            <div>
                                <Label htmlFor="meta_enabled" className="font-semibold cursor-pointer text-sm">
                                    Aktifkan Meta Pixel & Conversions API
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Mengirimkan event PageView dan Lead ke Meta Event Manager secara real-time.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="meta_pixel_id" className="font-semibold text-xs">
                                Meta Pixel ID *
                            </Label>
                            <Input
                                id="meta_pixel_id"
                                value={data.meta_pixel_id}
                                onChange={(e) => setData('meta_pixel_id', e.target.value)}
                                placeholder="Contoh: 123456789012345"
                                className="font-mono text-sm"
                            />
                            <InputError message={errors.meta_pixel_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="meta_access_token" className="font-semibold text-xs">Conversions API Token (CAPI)</Label>
                            <textarea
                                id="meta_access_token"
                                rows={3}
                                value={data.meta_access_token}
                                onChange={(e) => setData('meta_access_token', e.target.value)}
                                placeholder="EAAG..."
                                className="w-full rounded-md border border-input bg-background p-2.5 font-mono text-xs shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            <p className="text-xs text-muted-foreground">
                                System User Access Token untuk server-side event tracking (CAPI) dengan keakuratan tinggi.
                            </p>
                            <InputError message={errors.meta_access_token} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="meta_test_event_code" className="font-semibold text-xs">Test Event Code (Opsional)</Label>
                            <Input
                                id="meta_test_event_code"
                                value={data.meta_test_event_code}
                                onChange={(e) => setData('meta_test_event_code', e.target.value)}
                                placeholder="Contoh: TEST12345"
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Kode pengujian live di tab 'Test Events' Meta Event Manager.
                            </p>
                            <InputError message={errors.meta_test_event_code} />
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <Button type="submit" disabled={processing} className="px-6 py-2.5 font-bold shadow-md">
                            Simpan Pengaturan Tracking
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
