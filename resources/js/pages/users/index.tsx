import { Head, useForm, usePage, router } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    Users, 
    UserPlus, 
    Shield, 
    Edit2, 
    Trash2, 
    X, 
    CheckCircle2, 
    AlertCircle,
    Search,
    Filter,
    Calendar,
    Crown,
    UserCheck
} from 'lucide-react';

interface UserItem {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    roles: string[];
    created_at: string;
}

interface Props {
    users: UserItem[];
    roles: string[];
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
        title: 'User Management',
        href: '/users',
    },
];

export default function UsersIndex({ users, roles }: Props) {
    const { flash } = usePage<any>().props;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

    // Filter users dynamically
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch = 
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = 
                selectedRoleFilter === 'ALL' || u.roles.includes(selectedRoleFilter);
            return matchesSearch && matchesRole;
        });
    }, [users, searchQuery, selectedRoleFilter]);

    // Stats count
    const superAdminCount = users.filter((u) => u.roles.includes('Super Admin')).length;
    const adminCount = users.filter((u) => u.roles.includes('Admin')).length;
    const staffCount = users.filter((u) => u.roles.includes('Staff')).length;

    // Form for creating new user
    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        role: roles[0] || 'Staff',
    });

    // Form for editing existing user
    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        role: 'Staff',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/users', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditOpen = (user: UserItem) => {
        setEditingUser(user);
        editForm.setData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.roles[0] || roles[0] || 'Staff',
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        editForm.put(`/users/${editingUser.id}`, {
            onSuccess: () => {
                setEditingUser(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = (user: UserItem) => {
        if (confirm(`Apakah Anda yakin ingin menghapus user "${user.name}"?`)) {
            router.delete(`/users/${user.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Management" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                
                {/* Header Title & Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                            <Users className="w-7 h-7 text-primary" />
                            <span>User Management</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Kelola pengguna terdaftar, tingkat peran akses (Super Admin, Admin, Staff), dan profil tim.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-md shrink-0"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Tambah User Baru</span>
                    </button>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {flash?.error && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Summary Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-sidebar-border bg-card shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-medium">Total User</div>
                            <div className="text-xl font-extrabold text-foreground">{users.length}</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-sidebar-border bg-card shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Crown className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-medium">Super Admin</div>
                            <div className="text-xl font-extrabold text-foreground">{superAdminCount}</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-sidebar-border bg-card shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-medium">Admin</div>
                            <div className="text-xl font-extrabold text-foreground">{adminCount}</div>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl border border-sidebar-border bg-card shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-500/10 text-slate-500 flex items-center justify-center">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-medium">Staff Operasional</div>
                            <div className="text-xl font-extrabold text-foreground">{staffCount}</div>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-sidebar-border bg-card shadow-sm">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama atau email user..."
                            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-sidebar-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                        <select
                            value={selectedRoleFilter}
                            onChange={(e) => setSelectedRoleFilter(e.target.value)}
                            className="px-3 py-2 text-xs rounded-lg border border-sidebar-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                            <option value="ALL">Semua Role</option>
                            {roles.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Users Table Card */}
                <div className="rounded-2xl border border-sidebar-border bg-card overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-sidebar-border">
                                <tr>
                                    <th className="px-6 py-4 font-bold">User / Pengguna</th>
                                    <th className="px-6 py-4 font-bold">Role / Peran Akses</th>
                                    <th className="px-6 py-4 font-bold">Tanggal Dibuat</th>
                                    <th className="px-6 py-4 font-bold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                            
                                            {/* User Info */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {u.avatar ? (
                                                        <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-sidebar-border" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 text-primary font-bold text-sm flex items-center justify-center border border-primary/20">
                                                            {u.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-semibold text-foreground">{u.name}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Roles */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {u.roles.length > 0 ? (
                                                        u.roles.map((r, i) => (
                                                            <span 
                                                                key={i} 
                                                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                                    r === 'Super Admin' 
                                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                                                                        : r === 'Admin'
                                                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                                                        : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                                                                }`}
                                                            >
                                                                <Shield className="w-3.5 h-3.5" />
                                                                <span>{r}</span>
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">Tanpa Role</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Created Date */}
                                            <td className="px-6 py-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span>{u.created_at}</span>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {u.roles.includes('Agent') && (
                                                        <a
                                                            href="/finance/agents"
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold transition-all shadow-sm"
                                                            title="Buka Agent Portal & Fee Komisi"
                                                        >
                                                            <span>Portal Agent ↗</span>
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => handleEditOpen(u)}
                                                        className="p-2 rounded-xl border border-sidebar-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all shadow-sm"
                                                        title="Edit Role & Detail User"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(u)}
                                                        className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/20 text-rose-500 transition-all shadow-sm"
                                                        title="Hapus User"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-sm">
                                            Tidak ada user yang ditemukan.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>


            {/* CREATE USER MODAL */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-sidebar-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-sidebar-border pb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-primary" />
                                <span>Tambah User Baru</span>
                            </h3>
                            <button onClick={() => setIsCreateOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    required
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="Contoh: Admin Operasional"
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {createForm.errors.name && <p className="text-xs text-rose-500 mt-1">{createForm.errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    required
                                    value={createForm.data.email}
                                    onChange={(e) => createForm.setData('email', e.target.value)}
                                    placeholder="admin@example.com"
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {createForm.errors.email && <p className="text-xs text-rose-500 mt-1">{createForm.errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Password</label>
                                <input 
                                    type="password" 
                                    required
                                    value={createForm.data.password}
                                    onChange={(e) => createForm.setData('password', e.target.value)}
                                    placeholder="Minimal 8 Karakter"
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                {createForm.errors.password && <p className="text-xs text-rose-500 mt-1">{createForm.errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Role / Peran Akses</label>
                                <select 
                                    value={createForm.data.role}
                                    onChange={(e) => createForm.setData('role', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    {roles.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
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
                                    Simpan User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* EDIT USER MODAL */}
            {editingUser && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-sidebar-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-sidebar-border pb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-primary" />
                                <span>Edit User & Role</span>
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    required
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    required
                                    value={editForm.data.email}
                                    onChange={(e) => editForm.setData('email', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Password Baru (Opsional)</label>
                                <input 
                                    type="password" 
                                    value={editForm.data.password}
                                    onChange={(e) => editForm.setData('password', e.target.value)}
                                    placeholder="Biarkan kosong jika tidak diubah"
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Role / Peran Akses</label>
                                <select 
                                    value={editForm.data.role}
                                    onChange={(e) => editForm.setData('role', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    {roles.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-sidebar-border">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingUser(null)}
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
