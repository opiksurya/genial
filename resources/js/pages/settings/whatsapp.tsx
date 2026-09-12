import { Head, useForm } from '@inertiajs/react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SettingsLayout from '@/layouts/settings/layout';
import { CheckCircle2, MessageSquare, ExternalLink, PhoneCall } from 'lucide-react';

type Props = {
    settings: {
        whatsapp_number: string;
        whatsapp_default_message: string;
    };
    status?: string;
};

export default function WhatsAppSettings({ settings, status }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        whatsapp_number: settings.whatsapp_number || '6281234567890',
        whatsapp_default_message: settings.whatsapp_default_message || 'Halo Genial Digital Solution, saya ingin konsultasi strategi digital marketing',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/settings/whatsapp', {
            preserveScroll: true,
        });
    };

    return (
        <SettingsLayout>
            <Head title="Pengaturan Kontak WhatsApp" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Kontak WhatsApp & Konsultasi Website"
                    description="Atur nomor WhatsApp resmi agency dan pesan otomatis default untuk tombol CTA di seluruh website publik."
                />

                {status && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>{status}</span>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    <div className="p-6 rounded-2xl border border-sidebar-border bg-card shadow-sm space-y-5">
                        <div className="flex items-center justify-between border-b border-sidebar-border pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground">Integrasi WhatsApp CTA</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Nomor ini akan aktif di Header, Hero CTA, Footer, dan Form Audit
                                    </p>
                                </div>
                            </div>

                            {data.whatsapp_number && (
                                <a
                                    href={`https://wa.me/${data.whatsapp_number}?text=${encodeURIComponent(data.whatsapp_default_message)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all shadow-xs"
                                >
                                    <span>Tes Link WhatsApp</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="whatsapp_number" className="font-semibold text-xs flex items-center gap-1.5">
                                <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Nomor WhatsApp Resmi Agency *</span>
                            </Label>
                            <Input
                                id="whatsapp_number"
                                value={data.whatsapp_number}
                                onChange={(e) => setData('whatsapp_number', e.target.value)}
                                placeholder="Contoh: 081234567890 atau 6281234567890"
                                className="font-mono text-sm h-10"
                            />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Format input fleksibel (bisa diawali <code className="text-primary font-bold">08...</code> atau <code className="text-primary font-bold">628...</code>). Sistem akan otomatis mengkonversinya ke standar internasional <code className="text-primary font-bold">628...</code> untuk tautan chat WhatsApp yang valid.
                            </p>
                            <InputError message={errors.whatsapp_number} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="whatsapp_default_message" className="font-semibold text-xs flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Pesan Konsultasi Otomatis (Default Greeting)</span>
                            </Label>
                            <textarea
                                id="whatsapp_default_message"
                                rows={3}
                                value={data.whatsapp_default_message}
                                onChange={(e) => setData('whatsapp_default_message', e.target.value)}
                                placeholder="Halo Genial Digital Solution, saya ingin konsultasi strategi digital marketing..."
                                className="w-full rounded-md border border-input bg-background p-3 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring font-sans leading-relaxed"
                            />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Kalimat salam awal yang otomatis terisi saat calon klien mengklik tombol WhatsApp di halaman website.
                            </p>
                            <InputError message={errors.whatsapp_default_message} />
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <Button type="submit" disabled={processing} className="px-6 py-2.5 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white">
                            Simpan Kontak WhatsApp
                        </Button>
                    </div>
                </form>
            </div>
        </SettingsLayout>
    );
}
