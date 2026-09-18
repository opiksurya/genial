import React, { useState } from 'react';
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
    KeyRound,
    Plus,
    Eye,
    EyeOff,
    Copy,
    Check,
    ExternalLink,
    ShieldCheck,
    Trash2,
    Edit3,
    ShoppingBag,
    Video,
    Share2,
    Search,
    Globe,
    Mail,
    Lock,
    Sparkles,
} from 'lucide-react';

interface Credential {
    id: number;
    project_id: number;
    platform: string;
    title: string;
    username_email: string | null;
    password?: string | null;
    decrypted_password?: string | null;
    url_link: string | null;
    notes: string | null;
    created_at: string;
}

interface Project {
    id: number;
    name: string;
    client: string;
    credentials?: Credential[];
}

interface Props {
    project: Project | null;
    isOpen: boolean;
    onClose: () => void;
}

const PLATFORMS = [
    { name: 'Shopee', icon: ShoppingBag, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
    { name: 'TikTok Ads', icon: Video, color: 'bg-neutral-900 text-white border-neutral-700 dark:bg-neutral-800' },
    { name: 'Meta Ads', icon: Share2, color: 'bg-blue-600/10 text-blue-600 border-blue-600/20' },
    { name: 'Google Ads', icon: Search, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
    { name: 'Email', icon: Mail, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    { name: 'Website / cPanel', icon: Globe, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
    { name: 'Lainnya', icon: KeyRound, color: 'bg-primary/10 text-primary border-primary/20' },
];

export function ProjectCredentialsModal({ project, isOpen, onClose }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editingCred, setEditingCred] = useState<Credential | null>(null);
    const [visiblePasswords, setVisiblePasswords] = useState<{ [key: number]: boolean }>({});
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const credentials = project?.credentials || [];

    const { data, setData, post, put, processing, errors, reset } = useForm({
        platform: 'Meta Ads',
        title: '',
        username_email: '',
        password: '',
        url_link: '',
        notes: '',
    });

    if (!project) return null;

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const togglePasswordVisibility = (id: number) => {
        setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleOpenCreateForm = () => {
        setEditingCred(null);
        reset();
        setShowForm(true);
    };

    const handleEdit = (cred: Credential) => {
        setEditingCred(cred);
        setData({
            platform: cred.platform,
            title: cred.title,
            username_email: cred.username_email || '',
            password: cred.decrypted_password || cred.password || '',
            url_link: cred.url_link || '',
            notes: cred.notes || '',
        });
        setShowForm(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCred) {
            put(`/projects/credentials/${editingCred.id}`, {
                onSuccess: () => {
                    setShowForm(false);
                    reset();
                },
            });
        } else {
            post(`/projects/${project.id}/credentials`, {
                onSuccess: () => {
                    setShowForm(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Apakah Anda yakin ingin menghapus akses kredensial ini?')) {
            router.delete(`/projects/credentials/${id}`);
        }
    };

    const getPlatformStyle = (name: string) => {
        return (
            PLATFORMS.find((p) => p.name.toLowerCase() === name.toLowerCase()) || {
                name,
                icon: KeyRound,
                color: 'bg-primary/10 text-primary border-primary/20',
            }
        );
    };

    const filteredCredentials = credentials.filter(
        (c) =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.username_email && c.username_email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
                <DialogHeader className="border-b pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    Vault Akses & Kredensial
                                    <Badge variant="outline" className="font-normal text-xs">
                                        AES-256 Encrypted
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                    Project: <span className="font-semibold text-foreground">{project.name}</span> ({project.client})
                                </DialogDescription>
                            </div>
                        </div>

                        {!showForm && (
                            <Button size="sm" onClick={handleOpenCreateForm} className="gap-1.5 shadow-sm">
                                <Plus className="w-4 h-4" />
                                Tambah Akses
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {showForm ? (
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                {editingCred ? 'Edit Akses Kredensial' : 'Tambah Akses Kredensial Baru'}
                            </h3>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                                Batal
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="platform">Platform / Layanan *</Label>
                                <select
                                    id="platform"
                                    className="w-full mt-1.5 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                                    value={data.platform}
                                    onChange={(e) => setData('platform', e.target.value)}
                                >
                                    {PLATFORMS.map((p) => (
                                        <option key={p.name} value={p.name}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="title">Nama Akun / Asset *</Label>
                                <Input
                                    id="title"
                                    placeholder="Contoh: Main BM Meta Ads BatikKu"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    required
                                    className="mt-1.5"
                                />
                                {errors.title && <span className="text-xs text-destructive">{errors.title}</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="username_email">Username / Email / ID</Label>
                                <Input
                                    id="username_email"
                                    placeholder="email@domain.com atau username"
                                    value={data.username_email}
                                    onChange={(e) => setData('username_email', e.target.value)}
                                    className="mt-1.5"
                                />
                            </div>

                            <div>
                                <Label htmlFor="password">Password / Token / Secret Key</Label>
                                <Input
                                    id="password"
                                    type="text"
                                    placeholder="Masukkan password..."
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="mt-1.5"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="url_link">URL Link Login / Dashboard</Label>
                            <Input
                                id="url_link"
                                placeholder="https://business.facebook.com"
                                value={data.url_link}
                                onChange={(e) => setData('url_link', e.target.value)}
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <Label htmlFor="notes">Catatan Tambahan / Instruksi OTP / 2FA</Label>
                            <textarea
                                id="notes"
                                rows={2}
                                placeholder="Catatan OTP dikirim ke No HP Client 0812..., PIN 2FA: 123456, dsb."
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="w-full mt-1.5 rounded-md border border-input bg-background p-2.5 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editingCred ? 'Simpan Perubahan' : 'Simpan Kredensial'}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4 py-2">
                        {/* Search & Filter */}
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Cari platform, username, atau nama akun..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>

                        {/* List Credentials */}
                        {filteredCredentials.length === 0 ? (
                            <div className="text-center py-10 border border-dashed rounded-2xl bg-muted/20 space-y-3">
                                <div className="p-3 rounded-full bg-muted w-fit mx-auto text-muted-foreground">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">Belum Ada Akses Tersimpan</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Simpan data login Shopee, TikTok, Meta Ads, Email, atau website client di sini.
                                    </p>
                                </div>
                                <Button size="sm" onClick={handleOpenCreateForm} variant="outline" className="gap-1">
                                    <Plus className="w-4 h-4" />
                                    Tambah Akses Pertama
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {filteredCredentials.map((cred) => {
                                    const style = getPlatformStyle(cred.platform);
                                    const IconComp = style.icon;
                                    const isPasswordVisible = !!visiblePasswords[cred.id];
                                    const actualPassword = cred.decrypted_password || cred.password || '';

                                    return (
                                        <div
                                            key={cred.id}
                                            className="p-4 rounded-xl border bg-card hover:border-primary/30 transition-all space-y-3 shadow-2xs"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`p-2 rounded-lg border ${style.color}`}>
                                                        <IconComp className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-semibold text-sm text-foreground">
                                                                {cred.title}
                                                            </h4>
                                                            <Badge variant="outline" className={`text-[10px] ${style.color}`}>
                                                                {cred.platform}
                                                            </Badge>
                                                        </div>
                                                        {cred.url_link && (
                                                            <a
                                                                href={cred.url_link}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-0.5"
                                                            >
                                                                <span>Buka Portal Login</span>
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                        onClick={() => handleEdit(cred)}
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDelete(cred.id)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Credentials Row */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-lg border text-xs">
                                                {/* Username / Email */}
                                                <div className="flex items-center justify-between gap-2 border-r pr-2 last:border-r-0">
                                                    <div className="overflow-hidden">
                                                        <span className="text-[10px] text-muted-foreground block font-medium">
                                                            USERNAME / EMAIL
                                                        </span>
                                                        <span className="font-mono text-foreground truncate block">
                                                            {cred.username_email || '-'}
                                                        </span>
                                                    </div>
                                                    {cred.username_email && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 shrink-0"
                                                            onClick={() =>
                                                                handleCopy(cred.username_email!, `user-${cred.id}`)
                                                            }
                                                        >
                                                            {copiedKey === `user-${cred.id}` ? (
                                                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                            ) : (
                                                                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Password */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="overflow-hidden">
                                                        <span className="text-[10px] text-muted-foreground block font-medium">
                                                            PASSWORD
                                                        </span>
                                                        <span className="font-mono text-foreground truncate block">
                                                            {isPasswordVisible ? actualPassword || '-' : '••••••••••••'}
                                                        </span>
                                                    </div>
                                                    {actualPassword && (
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => togglePasswordVisibility(cred.id)}
                                                            >
                                                                {isPasswordVisible ? (
                                                                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                                                                ) : (
                                                                    <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() =>
                                                                    handleCopy(actualPassword, `pass-${cred.id}`)
                                                                }
                                                            >
                                                                {copiedKey === `pass-${cred.id}` ? (
                                                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                                ) : (
                                                                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Notes / 2FA */}
                                            {cred.notes && (
                                                <div className="text-[11px] bg-amber-500/5 text-amber-700 dark:text-amber-400 p-2 rounded-md border border-amber-500/20">
                                                    <span className="font-semibold">Catatan / OTP: </span>
                                                    {cred.notes}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
