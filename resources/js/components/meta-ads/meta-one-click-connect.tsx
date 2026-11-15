import { router } from '@inertiajs/react';
import { Check, Copy, Facebook } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface MetaAppInfo {
    configured: boolean;
    app_id: string | null;
    redirect_uri: string;
    can_setup: boolean;
}

export function MetaOneClickConnect({ metaApp }: { metaApp: MetaAppInfo }) {
    const [setupOpen, setSetupOpen] = useState(false);
    const [appId, setAppId] = useState(metaApp.app_id ?? '');
    const [appSecret, setAppSecret] = useState('');
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(false);

    const startLogin = () => {
        if (metaApp.configured) {
            window.location.href = `/meta-ads/connect?return_url=${encodeURIComponent(window.location.href)}`;
        } else {
            setSetupOpen(true);
        }
    };

    const copyUri = async () => {
        try {
            await navigator.clipboard.writeText(metaApp.redirect_uri);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* ignore */
        }
    };

    const save = () => {
        setSaving(true);
        router.post(
            '/meta-ads/app',
            { app_id: appId, app_secret: appSecret },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAppSecret('');
                    setSetupOpen(false);
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <>
            <Button
                type="button"
                size="sm"
                onClick={startLogin}
                className="h-8 gap-1.5 rounded-lg bg-[#1877F2] px-3 text-xs font-bold text-white shadow-sm hover:bg-[#1469d6] cursor-pointer"
                title="Satu klik: hubungkan semua brand yang bisa diakses akun Facebook Anda"
            >
                <Facebook className="size-3.5" aria-hidden />
                <span>Hubungkan dengan Facebook</span>
            </Button>

            <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Setup sekali saja</DialogTitle>
                        <DialogDescription>
                            {metaApp.can_setup
                                ? 'Setelah ini, siapa pun cukup klik satu tombol untuk menghubungkan semua brand.'
                                : 'Aplikasi Meta belum disiapkan. Minta Super Admin menyelesaikan setup ini satu kali.'}
                        </DialogDescription>
                    </DialogHeader>

                    {metaApp.can_setup && (
                        <div className="space-y-4 text-sm">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">1. Daftarkan alamat ini di Facebook</Label>
                                <p className="text-[11px] text-muted-foreground">
                                    developers.facebook.com, Genial App, Facebook Login, Settings, lalu tempel di <strong>Valid OAuth Redirect URIs</strong> dan simpan.
                                </p>
                                <div className="flex items-center gap-2">
                                    <Input readOnly value={metaApp.redirect_uri} className="h-8 font-mono text-[11px]" />
                                    <Button type="button" size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={copyUri}>
                                        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                                        {copied ? 'Tersalin' : 'Salin'}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="mc-app-id" className="text-xs font-semibold">2. App ID</Label>
                                <Input id="mc-app-id" value={appId} onChange={(e) => setAppId(e.target.value)} className="h-8 font-mono text-xs" />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="mc-app-secret" className="text-xs font-semibold">3. App Secret</Label>
                                <p className="text-[11px] text-muted-foreground">
                                    developers.facebook.com, Genial App, Settings, Basic, klik Show di App Secret.
                                </p>
                                <Input id="mc-app-secret" type="password" autoComplete="off" value={appSecret} onChange={(e) => setAppSecret(e.target.value)} className="h-8 font-mono text-xs" />
                            </div>

                            <Button type="button" className="w-full" disabled={saving || !appId.trim() || appSecret.trim().length < 16} onClick={save}>
                                {saving ? 'Memeriksa...' : 'Simpan & lanjutkan'}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
