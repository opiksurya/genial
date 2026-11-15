import { router } from '@inertiajs/react';
import { Bell, Check, Plus, RefreshCw, Star, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LinkedAccount {
    id: number;
    ad_account_id: string;
    account_name: string | null;
    is_default: boolean;
    status: string;
}

interface AvailableAccount {
    ad_account_id: string;
    name: string;
    currency: string | null;
    business_name: string | null;
}

interface AccountsResponse {
    linked: LinkedAccount[];
    available: AvailableAccount[];
    has_token: boolean;
    message: string | null;
}

interface Props {
    projectId: number;
    isOpen: boolean;
}

const dismissKey = (projectId: number) => `meta-dismissed-accounts-${projectId}`;

function readDismissed(projectId: number): string[] {
    try {
        return JSON.parse(localStorage.getItem(dismissKey(projectId)) || '[]');
    } catch {
        return [];
    }
}

export function MetaAdAccountsPanel({ projectId, isOpen }: Props) {
    const [data, setData] = useState<AccountsResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState<string[]>([]);
    const [manualId, setManualId] = useState('');
    const [showManual, setShowManual] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/projects/${projectId}/meta-accounts`, {
                headers: { Accept: 'application/json' },
            });
            setData(await res.json());
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (isOpen) {
            setDismissed(readDismissed(projectId));
            load();
        }
    }, [isOpen, projectId, load]);

    const run = (key: string, action: () => void) => {
        setBusy(key);
        action();
    };

    const finish = () => {
        setBusy(null);
        load();
    };

    const addAccount = (adAccountId: string) =>
        run(adAccountId, () =>
            router.post(
                `/projects/${projectId}/meta-accounts`,
                { ad_account_id: adAccountId },
                { preserveScroll: true, preserveState: true, onFinish: finish, onSuccess: () => setManualId('') },
            ),
        );

    const makeDefault = (id: number) =>
        run(`d${id}`, () =>
            router.post(
                `/projects/${projectId}/meta-accounts/${id}/default`,
                {},
                { preserveScroll: true, preserveState: true, onFinish: finish },
            ),
        );

    const removeAccount = (acc: LinkedAccount) => {
        if (!window.confirm(`Lepas ad account ${acc.account_name || acc.ad_account_id} dari project ini?`)) return;
        run(`r${acc.id}`, () =>
            router.delete(`/projects/${projectId}/meta-accounts/${acc.id}`, {
                preserveScroll: true,
                preserveState: true,
                onFinish: finish,
            }),
        );
    };

    const dismiss = (adAccountId: string) => {
        const next = [...dismissed, adAccountId];
        setDismissed(next);
        try {
            localStorage.setItem(dismissKey(projectId), JSON.stringify(next));
        } catch {
            /* ignore */
        }
    };

    const pending = (data?.available ?? []).filter((a) => !dismissed.includes(a.ad_account_id));

    return (
        <div className="space-y-3 border-b border-border/60 bg-muted/20 p-4 sm:px-5">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-foreground">
                    Ad Account di project ini ({data?.linked.length ?? 0})
                </h3>
                <div className="flex items-center gap-1.5">
                    <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={load} title="Cek akun baru di Meta">
                        <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs font-semibold" onClick={() => setShowManual((v) => !v)}>
                        <Plus className="size-3.5" />
                        Tambah akun
                    </Button>
                </div>
            </div>

            {pending.length > 0 && (
                <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <Bell className="size-3.5" />
                        {pending.length} akun baru terdeteksi di Meta. Tambahkan ke project ini?
                    </p>
                    {pending.map((acc) => (
                        <div key={acc.ad_account_id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-card px-2.5 py-1.5 text-xs">
                            <div className="min-w-0">
                                <div className="truncate font-semibold text-foreground">{acc.name}</div>
                                <div className="font-mono text-[10px] text-muted-foreground">
                                    {acc.ad_account_id}
                                    {acc.business_name ? ` · ${acc.business_name}` : ''}
                                    {acc.currency ? ` · ${acc.currency}` : ''}
                                </div>
                            </div>
                            <div className="flex gap-1.5">
                                <Button type="button" size="sm" className="h-7 gap-1 px-2 text-xs" disabled={busy === acc.ad_account_id} onClick={() => addAccount(acc.ad_account_id)}>
                                    <Check className="size-3.5" />
                                    Setuju, tambahkan
                                </Button>
                                <Button type="button" size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => dismiss(acc.ad_account_id)}>
                                    <X className="size-3.5" />
                                    Abaikan
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {data && !data.has_token && (
                <p className="text-[11px] text-muted-foreground">
                    Hubungkan akun Facebook dulu supaya akun baru di Meta bisa terdeteksi otomatis.
                </p>
            )}
            {data?.message && <p className="text-[11px] text-red-600">{data.message}</p>}

            {showManual && (
                <div className="flex items-center gap-2">
                    <Input
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        placeholder="Ad Account ID, mis. 1234567890"
                        className="h-8 text-xs"
                    />
                    <Button type="button" size="sm" className="h-8 text-xs" disabled={!manualId.trim() || busy === manualId.trim()} onClick={() => addAccount(manualId.trim())}>
                        Tambahkan
                    </Button>
                </div>
            )}

            <ul className="space-y-1.5">
                {(data?.linked ?? []).map((acc) => (
                    <li key={acc.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1.5 text-xs">
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate font-semibold text-foreground">
                                {acc.account_name || acc.ad_account_id}
                                {acc.is_default && (
                                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                        <Star className="size-2.5" /> Default
                                    </span>
                                )}
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground">
                                {acc.ad_account_id} · {acc.status}
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {!acc.is_default && (
                                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={busy === `d${acc.id}`} onClick={() => makeDefault(acc.id)}>
                                    Jadikan default
                                </Button>
                            )}
                            <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" title="Lepas akun" disabled={busy === `r${acc.id}`} onClick={() => removeAccount(acc)}>
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
