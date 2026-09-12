import { Head, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type Props = {
    settings: {
        meta_pixel_id: string;
        meta_access_token: string;
        meta_test_event_code: string;
        meta_enabled: boolean;
    };
    status?: string;
};

export default function MetaPixelSettings({ settings, status }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        meta_pixel_id: settings.meta_pixel_id || '',
        meta_access_token: settings.meta_access_token || '',
        meta_test_event_code: settings.meta_test_event_code || '',
        meta_enabled: settings.meta_enabled || false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/settings/pixel', {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Meta Pixel & CAPI Settings" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Meta Pixel & Conversions API (CAPI)"
                    description="Konfigurasi pelacakan otomatis Meta Ads Manager, Lead WhatsApp, dan Audit Form"
                />

                {status && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    <div className="flex items-center space-x-3 p-4 bg-muted/40 rounded-lg border border-border">
                        <Checkbox
                            id="meta_enabled"
                            checked={data.meta_enabled}
                            onCheckedChange={(checked) => setData('meta_enabled', Boolean(checked))}
                        />
                        <div>
                            <Label htmlFor="meta_enabled" className="font-semibold cursor-pointer">
                                Aktifkan Meta Pixel & Conversions API (CAPI)
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Lacak otomatis pengunjung, klik WhatsApp Lead, dan submit Form Audit ke Meta Ads Manager.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="meta_pixel_id">Meta Pixel ID</Label>
                        <Input
                            id="meta_pixel_id"
                            value={data.meta_pixel_id}
                            onChange={(e) => setData('meta_pixel_id', e.target.value)}
                            placeholder="Contoh: 123456789012345"
                        />
                        <p className="text-xs text-muted-foreground">
                            Dapatkan Pixel ID dari Meta Events Manager &gt; Data Sources.
                        </p>
                        <InputError message={errors.meta_pixel_id} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="meta_access_token">Conversions API (CAPI) Access Token</Label>
                        <Input
                            id="meta_access_token"
                            type="password"
                            value={data.meta_access_token}
                            onChange={(e) => setData('meta_access_token', e.target.value)}
                            placeholder="EAAG..."
                        />
                        <p className="text-xs text-muted-foreground">
                            System User Access Token untuk server-side event tracking (CAPI) dengan keakuratan tinggi.
                        </p>
                        <InputError message={errors.meta_access_token} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="meta_test_event_code">Test Event Code (Opsional)</Label>
                        <Input
                            id="meta_test_event_code"
                            value={data.meta_test_event_code}
                            onChange={(e) => setData('meta_test_event_code', e.target.value)}
                            placeholder="Contoh: TEST12345"
                        />
                        <p className="text-xs text-muted-foreground">
                            Masukkan kode ini jika sedang melakukan pengujian live di tab 'Test Events' Meta Event Manager.
                        </p>
                        <InputError message={errors.meta_test_event_code} />
                    </div>

                    <Button type="submit" disabled={processing}>
                        Simpan Pengaturan
                    </Button>
                </form>
            </div>
        </>
    );
}

MetaPixelSettings.layout = {
    breadcrumbs: [
        {
            title: 'Meta Pixel & CAPI Settings',
            href: '/settings/pixel',
        },
    ],
};
