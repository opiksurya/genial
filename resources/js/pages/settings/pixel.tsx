import { Head, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Activity, BarChart3, CheckCircle2, Info } from 'lucide-react';

type Props = {
    settings: {
        meta_pixel_id: string;
        meta_access_token: string;
        meta_test_event_code: string;
        meta_enabled: boolean;
        gtm_id: string;
        gtm_enabled: boolean;
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
                    description="Kelola integrasi Google Tag Manager (GTM), Meta Pixel ID, dan Conversions API (CAPI) dengan auto-behavior tracking"
                />

                {status && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>{status}</span>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-8">
                    
                    {/* SECTION 1: GOOGLE TAG MANAGER (GTM) */}
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
                                Masukkan ID Container GTM Anda dari dashboard Google Tag Manager (misal: GTM-XXXXXXX).
                            </p>
                            <InputError message={errors.gtm_id} />
                        </div>

                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 space-y-2">
                            <div className="font-bold flex items-center gap-1.5">
                                <Info className="w-4 h-4 text-blue-500" />
                                <span>Otomatisasi DataLayer yang Aktif:</span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-[11px] text-muted-foreground pl-1">
                                <li><strong>`page_view`</strong>: Otomatis terdeteksi saat pengunjung masuk ke Home / Landing Page.</li>
                                <li><strong>`generate_lead` (WhatsApp)</strong>: Otomatis terdeteksi saat pengunjung klik tombol WA (`wa.me` / `whatsapp.com`).</li>
                                <li><strong>`generate_lead` (Audit Form)</strong>: Otomatis terdeteksi saat pengaju mengisi Form Audit Digital.</li>
                            </ul>
                        </div>
                    </div>

                    {/* SECTION 2: META PIXEL & CAPI */}
                    <div className="p-6 rounded-2xl border border-sidebar-border bg-card shadow-sm space-y-5">
                        <div className="flex items-center gap-3 border-b border-sidebar-border pb-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-foreground">Meta Pixel & Conversions API (CAPI)</h3>
                                <p className="text-xs text-muted-foreground">
                                    Pelacakan otomatis event 'Lead' Meta Ads Manager untuk WhatsApp & Form Audit
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
                                    Aktifkan Meta Pixel & Conversions API (CAPI)
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Lacak otomatis event 'Lead' browser pixel & server CAPI ke Meta Ads Manager.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="meta_pixel_id" className="font-semibold text-xs">Meta Pixel ID</Label>
                            <Input
                                id="meta_pixel_id"
                                value={data.meta_pixel_id}
                                onChange={(e) => setData('meta_pixel_id', e.target.value)}
                                placeholder="Contoh: 123456789012345"
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Dapatkan Pixel ID dari Meta Events Manager &gt; Data Sources.
                            </p>
                            <InputError message={errors.meta_pixel_id} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="meta_access_token" className="font-semibold text-xs">Conversions API (CAPI) Access Token</Label>
                            <Input
                                id="meta_access_token"
                                type="password"
                                value={data.meta_access_token}
                                onChange={(e) => setData('meta_access_token', e.target.value)}
                                placeholder="EAAG..."
                                className="font-mono text-sm"
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

                    <Button type="submit" disabled={processing} className="px-6 py-2.5 font-bold shadow-md">
                        Simpan Semua Pengaturan Tracking
                    </Button>
                </form>
            </div>
        </>
    );
}

TrackingSettings.layout = {
    breadcrumbs: [
        {
            title: 'Tracking & Analytics Settings',
            href: '/settings/pixel',
        },
    ],
};
