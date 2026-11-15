import { Check, Copy, Link2, Loader2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface ActiveLink {
    id: number;
    created_at: string;
    expires_at: string;
}

interface Props {
    projectId: number;
    isOpen: boolean;
}

function csrfToken(): string {
    return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';
}

function formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(date);
}

async function call(url: string, method: string, body?: object) {
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
        body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) throw new Error(json.message || 'Permintaan gagal. Coba lagi.');

    return json;
}

export function ShopeeClientLinkSection({ projectId, isOpen }: Props) {
    const base = `/projects/${projectId}/shopee-connect-links`;
    const [links, setLinks] = useState<ActiveLink[]>([]);
    const [days, setDays] = useState(7);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [created, setCreated] = useState<{ url: string; expires_at: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const load = useCallback(async () => {
        try {
            const json = await call(base, 'GET');
            setLinks(json.links ?? []);
        } catch {
            setLinks([]);
        }
    }, [base]);

    useEffect(() => {
        if (!isOpen) return;
        setCreated(null);
        setError(null);
        void load();
    }, [isOpen, load]);

    const create = async () => {
        setBusy(true);
        setError(null);
        try {
            const json = await call(base, 'POST', { days });
            setCreated({ url: json.url, expires_at: json.expires_at });
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Gagal membuat tautan.');
        } finally {
            setBusy(false);
        }
    };

    const revoke = async (id: number) => {
        setError(null);
        try {
            await call(`${base}/${id}`, 'DELETE');
            await load();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Gagal mencabut tautan.');
        }
    };

    const copy = async () => {
        if (!created) return;
        try {
            await navigator.clipboard.writeText(created.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            setError('Salin otomatis tidak didukung di browser ini. Pilih dan salin tautan secara manual.');
        }
    };

    return (
        <section aria-labelledby="shopee-client-link-title" className="rounded-2xl border border-border/80 p-3.5 space-y-3">
            <div className="space-y-0.5">
                <h3 id="shopee-client-link-title" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Link2 className="size-3.5 text-[#EE4D2D]" aria-hidden />
                    Tautan untuk klien
                </h3>
                <p className="text-[11px] text-muted-foreground">
                    Kirim tautan ini ke pemilik toko. Mereka login di Shopee dan menyetujui akses, tanpa akun ERP. Tautan sekali pakai.
                </p>
            </div>

            <div className="flex items-center gap-2">
                <label htmlFor="shopee-link-days" className="text-[11px] text-muted-foreground">
                    Berlaku
                </label>
                <select
                    id="shopee-link-days"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
                >
                    <option value={1}>1 hari</option>
                    <option value={3}>3 hari</option>
                    <option value={7}>7 hari</option>
                    <option value={14}>14 hari</option>
                    <option value={30}>30 hari</option>
                </select>
                <Button type="button" size="sm" onClick={create} disabled={busy} className="h-8 text-xs rounded-lg cursor-pointer">
                    {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : 'Buat tautan'}
                </Button>
            </div>

            {created && (
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/30 p-2.5 space-y-1.5">
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Tautan baru (berlaku sampai {formatDate(created.expires_at)}). Salin sekarang, tautan ini tidak ditampilkan lagi.
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 min-w-0 overflow-x-auto whitespace-nowrap rounded-lg border border-border bg-muted/40 px-2 py-1.5 text-[11px]">{created.url}</code>
                        <Button type="button" variant="outline" size="sm" onClick={copy} className="h-8 text-xs rounded-lg gap-1 cursor-pointer shrink-0">
                            {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                            {copied ? 'Tersalin' : 'Salin'}
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <p role="alert" className="text-[11px] text-rose-600">
                    {error}
                </p>
            )}

            {links.length > 0 && (
                <ul className="space-y-1">
                    {links.map((link) => (
                        <li key={link.id} className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                            <span>
                                Dibuat {formatDate(link.created_at)} · berlaku sampai {formatDate(link.expires_at)}
                            </span>
                            <button
                                type="button"
                                onClick={() => revoke(link.id)}
                                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 cursor-pointer"
                                aria-label={`Cabut tautan yang dibuat ${formatDate(link.created_at)}`}
                            >
                                <Trash2 className="size-3" aria-hidden />
                                Cabut
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
