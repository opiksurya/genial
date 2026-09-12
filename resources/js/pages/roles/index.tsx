import { Head, useForm, usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    ShieldCheck, 
    Plus, 
    Shield, 
    Edit2, 
    Trash2, 
    X, 
    CheckCircle2, 
    AlertCircle,
    Lock,
    Users
} from 'lucide-react';

interface RoleItem {
    id: number;
    name: string;
    permissions: string[];
    users_count: number;
    created_at: string;
}

interface Props {
    roles: RoleItem[];
    permissions: string[];
    flash?: {
        success?: string;
        error?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Roles & Permissions',
        href: '/roles',
    },
];

export default function RolesIndex({ roles, permissions }: Props) {
    const { flash } = usePage<any>().props;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleItem | null>(null);

    // Form for creating new role
    const createForm = useForm<{
        name: string;
        permissions: string[];
    }>({
        name: '',
        permissions: [],
    });

    // Form for editing existing role
    const editForm = useForm<{
        name: string;
        permissions: string[];
    }>({
        name: '',
        permissions: [],
    });

    const togglePermission = (perm: string, isEdit = false) => {
        const form = isEdit ? editForm : createForm;
        const current = form.data.permissions;
        if (current.includes(perm)) {
            form.setData('permissions', current.filter((p) => p !== perm));
        } else {
            form.setData('permissions', [...current, perm]);
        }
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/roles', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditOpen = (role: RoleItem) => {
        setEditingRole(role);
        editForm.setData({
            name: role.name,
            permissions: role.permissions,
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRole) return;

        editForm.put(`/roles/${editingRole.id}`, {
            onSuccess: () => {
                setEditingRole(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = (role: RoleItem) => {
        if (confirm(`Apakah Anda yakin ingin menghapus Role "${role.name}"?`)) {
            useForm().delete(`/roles/${role.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role & Permission Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                
                {/* Header Title & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                            <span>Role & Permission Management</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola peran tingkat akses (Roles) dan daftar hak akses (Permissions) aplikasi.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-all shadow-sm shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Role Baru</span>
                    </button>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {flash?.error && (
                    <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Roles Cards Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                    {roles.map((r) => (
                        <div 
                            key={r.id}
                            className="p-6 rounded-2xl border border-sidebar-border/80 bg-card hover:border-primary/40 transition-all flex flex-col justify-between shadow-sm relative group"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground">{r.name}</h3>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                <span>{r.users_count} Users Terdaftar</span>
                                            </span>
                                        </div>
                                    </div>

                                    {r.name === 'Super Admin' && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                            SYSTEM CORE
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2 mb-6">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                        Hak Akses (Permissions):
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {r.permissions.length > 0 ? (
                                            r.permissions.map((p, i) => (
                                                <span 
                                                    key={i}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-foreground border border-sidebar-border"
                                                >
                                                    <Lock className="w-3 h-3 text-primary" />
                                                    <span>{p}</span>
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Tidak ada permission khusus</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-sidebar-border/70 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Dibuat: {r.created_at}</span>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleEditOpen(r)}
                                        className="p-1.5 rounded-lg border border-sidebar-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                                        title="Edit Permission Role"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    {r.name !== 'Super Admin' && (
                                        <button
                                            onClick={() => handleDelete(r)}
                                            className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/20 text-rose-500 transition-all"
                                            title="Hapus Role"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>

            </div>


            {/* CREATE ROLE MODAL */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-sidebar-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-sidebar-border pb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" />
                                <span>Tambah Role Akses Baru</span>
                            </h3>
                            <button onClick={() => setIsCreateOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Nama Role</label>
                                <input 
                                    type="text" 
                                    required
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="Contoh: Digital Marketer / Finance Manager"
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {createForm.errors.name && <p className="text-xs text-rose-500 mt-1">{createForm.errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-2">Pilih Hak Akses (Permissions):</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-lg border border-sidebar-border bg-muted/30">
                                    {permissions.map((p) => (
                                        <label key={p} className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
                                            <input 
                                                type="checkbox"
                                                checked={createForm.data.permissions.includes(p)}
                                                onChange={() => togglePermission(p, false)}
                                                className="rounded border-sidebar-border text-primary focus:ring-primary w-4 h-4"
                                            />
                                            <span className="capitalize">{p}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-sidebar-border">
                                <button 
                                    type="button" 
                                    onClick={() => setIsCreateOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-sidebar-border text-sm font-medium text-muted-foreground hover:bg-muted"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={createForm.processing}
                                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Simpan Role
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* EDIT ROLE MODAL */}
            {editingRole && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-sidebar-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-sidebar-border pb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-primary" />
                                <span>Edit Role & Permissions</span>
                            </h3>
                            <button onClick={() => setEditingRole(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Nama Role</label>
                                <input 
                                    type="text" 
                                    required
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {editForm.errors.name && <p className="text-xs text-rose-500 mt-1">{editForm.errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-2">Pilih Hak Akses (Permissions):</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto p-3 rounded-lg border border-sidebar-border bg-muted/30">
                                    {permissions.map((p) => (
                                        <label key={p} className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
                                            <input 
                                                type="checkbox"
                                                checked={editForm.data.permissions.includes(p)}
                                                onChange={() => togglePermission(p, true)}
                                                className="rounded border-sidebar-border text-primary focus:ring-primary w-4 h-4"
                                            />
                                            <span className="capitalize">{p}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-sidebar-border">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingRole(null)}
                                    className="px-4 py-2 rounded-lg border border-sidebar-border text-sm font-medium text-muted-foreground hover:bg-muted"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={editForm.processing}
                                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AppLayout>
    );
}
