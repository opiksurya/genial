import { Head, useForm, router } from '@inertiajs/react';
import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { 
    Kanban, 
    Plus, 
    CheckSquare, 
    MessageSquare, 
    Clock, 
    User, 
    X, 
    Briefcase,
    Calendar,
    ChevronDown,
    Layers,
    Send,
    Tag,
    AlertCircle,
    CheckCircle2,
    ShieldCheck,
    KeyRound
} from 'lucide-react';
import { ProjectCredentialsModal } from '@/components/projects/project-credentials-modal';


interface TaskItem {
    id: number;
    project_id: number;
    title: string;
    description?: string;
    status: 'BACKLOG' | 'PLANNING' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    label?: string;
    assignee_id?: number;
    assignee_role?: string;
    start_date?: string;
    due_date?: string;
    duration_days?: number;
    assignee?: { id: number; name: string; avatar?: string };
    comments?: { id: number; comment: string; user?: { name: string }; created_at: string }[];
    checklists?: { id: number; title: string; is_completed: boolean }[];
}

interface ProjectItem {
    id: number;
    name: string;
    client: string;
    category: string;
    status: string;
    priority: string;
    progress: number;
    start_date: string;
    end_date: string;
    manager?: { id: number; name: string };
    members?: { id: number; user: { name: string }; role: string }[];
    credentials?: any[];
}


interface UserItem {
    id: number;
    name: string;
    email: string;
}

interface Props {
    projects: ProjectItem[];
    activeProject?: ProjectItem;
    tasks: TaskItem[];
    users: UserItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'ProjectFlow', href: '/projects/dashboard' },
    { title: 'Project Board', href: '/projects/board' },
];

const COLUMNS: { id: TaskItem['status']; title: string; color: string }[] = [
    { id: 'BACKLOG', title: 'BACKLOG', color: 'border-slate-500/30 text-slate-500 bg-slate-500/10' },
    { id: 'PLANNING', title: 'PLANNING', color: 'border-blue-500/30 text-blue-500 bg-blue-500/10' },
    { id: 'IN_PROGRESS', title: 'IN PROGRESS', color: 'border-amber-500/30 text-amber-500 bg-amber-500/10' },
    { id: 'REVIEW', title: 'REVIEW', color: 'border-purple-500/30 text-purple-500 bg-purple-500/10' },
    { id: 'DONE', title: 'DONE', color: 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' },
];

const CATEGORIES = [
    'Website Development',
    'SEO Campaign',
    'Google Ads Campaign',
    'TikTok Ads Campaign',
    'Social Media Management',
    'Branding Project',
];

const ROLES = [
    'Project Manager',
    'Designer',
    'Developer',
    'Ads Specialist',
    'SEO Specialist',
    'Content Writer',
];

export default function ProjectBoard({ projects, activeProject, tasks, users }: Props) {
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);


    // Project Form
    const projectForm = useForm({
        name: '',
        client: '',
        description: '',
        category: CATEGORIES[0],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        priority: 'Medium',
        manager_id: users[0]?.id || '',
    });

    // Task Form
    const taskForm = useForm({
        project_id: activeProject?.id || '',
        title: '',
        description: '',
        status: 'PLANNING',
        priority: 'Medium',
        label: '',
        assignee_id: users[0]?.id || '',
        assignee_role: ROLES[0],
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    });

    // Comment Form
    const commentForm = useForm({
        comment: '',
    });

    // Handle Drag & Drop
    const handleDragStart = (e: React.DragEvent, taskId: number) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('text/plain', taskId.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetStatus: TaskItem['status']) => {
        e.preventDefault();
        const taskIdStr = e.dataTransfer.getData('text/plain');
        const taskId = parseInt(taskIdStr, 10);
        if (!taskId) return;

        router.put(`/projects/tasks/${taskId}/status`, {
            status: targetStatus,
        }, {
            preserveScroll: true,
        });

        setDraggedTaskId(null);
    };

    const handleProjectChange = (id: number) => {
        router.get('/projects/board', { project_id: id }, { preserveState: true });
    };

    const handleCreateProjectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        projectForm.post('/projects/store', {
            onSuccess: () => {
                setIsCreateProjectOpen(false);
                projectForm.reset();
            },
        });
    };

    const handleCreateTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        taskForm.setData('project_id', activeProject?.id || '');
        taskForm.post('/projects/tasks', {
            onSuccess: () => {
                setIsCreateTaskOpen(false);
                taskForm.reset();
            },
        });
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;
        commentForm.post(`/projects/tasks/${selectedTask.id}/comments`, {
            onSuccess: () => {
                commentForm.reset();
            },
        });
    };

    const handleToggleChecklist = (checklistId: number) => {
        router.put(`/projects/checklists/${checklistId}/toggle`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Project Board (Kanban)" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 overflow-hidden">
                
                {/* Board Header & Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Kanban className="w-7 h-7 text-primary" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-extrabold text-foreground">Kanban Board</h1>
                                
                                {/* Project Selector Dropdown */}
                                <select
                                    value={activeProject?.id || ''}
                                    onChange={(e) => handleProjectChange(Number(e.target.value))}
                                    className="px-3 py-1.5 rounded-lg border border-sidebar-border bg-card text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                                >
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.client})</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Client: <span className="font-semibold text-foreground">{activeProject?.client || '-'}</span> | Category: <span className="font-semibold text-primary">{activeProject?.category || '-'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={() => setIsCredentialsModalOpen(true)}
                            disabled={!activeProject}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all shadow-xs disabled:opacity-50"
                        >
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            <span>Vault Akses ({activeProject?.credentials?.length || 0})</span>
                        </button>

                        <button
                            onClick={() => setIsCreateProjectOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-sidebar-border bg-card hover:bg-muted text-foreground transition-all shadow-sm"
                        >
                            <Plus className="w-4 h-4 text-primary" />
                            <span>Project Baru</span>
                        </button>

                        <button
                            onClick={() => {
                                taskForm.setData('project_id', activeProject?.id || '');
                                setIsCreateTaskOpen(true);
                            }}
                            disabled={!activeProject}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Task</span>
                        </button>
                    </div>

                </div>

                {/* 5 Column Horizontal Kanban Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 flex-1 items-start overflow-x-auto pb-4">
                    {COLUMNS.map((col) => {
                        const colTasks = tasks.filter((t) => t.status === col.id);
                        return (
                            <div 
                                key={col.id}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, col.id)}
                                className="flex flex-col bg-muted/40 rounded-2xl border border-sidebar-border p-3.5 min-h-[500px] max-h-[calc(100vh-220px)] overflow-y-auto"
                            >
                                {/* Column Header */}
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${col.color}`}>
                                            {col.title}
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground">({colTasks.length})</span>
                                    </div>

                                    <button
                                        onClick={() => {
                                            taskForm.setData({
                                                ...taskForm.data,
                                                project_id: activeProject?.id || '',
                                                status: col.id,
                                            });
                                            setIsCreateTaskOpen(true);
                                        }}
                                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Task Cards */}
                                <div className="space-y-3 flex-1">
                                    {colTasks.map((t) => (
                                        <div
                                            key={t.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, t.id)}
                                            onClick={() => setSelectedTask(t)}
                                            className={`p-4 rounded-xl border border-sidebar-border bg-card shadow-sm hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing space-y-3 relative group ${
                                                draggedTaskId === t.id ? 'opacity-40' : ''
                                            }`}
                                        >
                                            {t.label && (
                                                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                                                    {t.label}
                                                </span>
                                            )}

                                            <h4 className="font-bold text-xs text-foreground leading-snug">{t.title}</h4>

                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                    t.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-500' :
                                                    t.priority === 'High' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'
                                                }`}>
                                                    {t.priority}
                                                </span>

                                                {t.due_date && (
                                                    <span className="flex items-center gap-1 text-[10px]">
                                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                                        <span>{t.due_date}</span>
                                                    </span>
                                                )}
                                            </div>

                                            <div className="pt-2 border-t border-sidebar-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3 h-3 text-primary" />
                                                    <span className="truncate max-w-[90px]">{t.assignee?.name || 'Unassigned'}</span>
                                                </div>

                                                <div className="flex items-center gap-2 text-[10px]">
                                                    {t.checklists && t.checklists.length > 0 && (
                                                        <span className="flex items-center gap-0.5 text-muted-foreground">
                                                            <CheckSquare className="w-3 h-3 text-emerald-500" />
                                                            <span>{t.checklists.filter(c => c.is_completed).length}/{t.checklists.length}</span>
                                                        </span>
                                                    )}
                                                    {t.comments && t.comments.length > 0 && (
                                                        <span className="flex items-center gap-0.5 text-muted-foreground">
                                                            <MessageSquare className="w-3 h-3 text-blue-500" />
                                                            <span>{t.comments.length}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        );
                    })}
                </div>

            </div>


            {/* CREATE PROJECT MODAL */}
            {isCreateProjectOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-sidebar-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-sidebar-border pb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-primary" />
                                <span>Buat Project Baru</span>
                            </h3>
                            <button onClick={() => setIsCreateProjectOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Nama Project</label>
                                    <input 
                                        type="text" required
                                        value={projectForm.data.name}
                                        onChange={(e) => projectForm.setData('name', e.target.value)}
                                        placeholder="Contoh: Shopee Ads Optimization"
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Nama Client</label>
                                    <input 
                                        type="text" required
                                        value={projectForm.data.client}
                                        onChange={(e) => projectForm.setData('client', e.target.value)}
                                        placeholder="Contoh: PT Fashion Utama"
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Kategori Project</label>
                                    <select 
                                        value={projectForm.data.category}
                                        onChange={(e) => projectForm.setData('category', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Prioritas</label>
                                    <select 
                                        value={projectForm.data.priority}
                                        onChange={(e) => projectForm.setData('priority', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Tanggal Mulai</label>
                                    <input 
                                        type="date" required
                                        value={projectForm.data.start_date}
                                        onChange={(e) => projectForm.setData('start_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Tanggal Selesai (Due)</label>
                                    <input 
                                        type="date" required
                                        value={projectForm.data.end_date}
                                        onChange={(e) => projectForm.setData('end_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Deskripsi Project</label>
                                <textarea 
                                    rows={3}
                                    value={projectForm.data.description}
                                    onChange={(e) => projectForm.setData('description', e.target.value)}
                                    placeholder="Rincian scope of work project..."
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-sidebar-border">
                                <button type="button" onClick={() => setIsCreateProjectOpen(false)} className="px-4 py-2 rounded-lg border border-sidebar-border text-xs font-medium text-muted-foreground hover:bg-muted">Batal</button>
                                <button type="submit" disabled={projectForm.processing} className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50">Simpan Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* CREATE TASK MODAL */}
            {isCreateTaskOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-sidebar-border rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between border-b border-sidebar-border pb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" />
                                <span>Tambah Task Pekerjaan</span>
                            </h3>
                            <button onClick={() => setIsCreateTaskOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Judul Task</label>
                                <input 
                                    type="text" required
                                    value={taskForm.data.title}
                                    onChange={(e) => taskForm.setData('title', e.target.value)}
                                    placeholder="Contoh: Audit Core Web Vitals Website"
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Status Column</label>
                                    <select 
                                        value={taskForm.data.status}
                                        onChange={(e) => taskForm.setData('status', e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Prioritas</label>
                                    <select 
                                        value={taskForm.data.priority}
                                        onChange={(e) => taskForm.setData('priority', e.target.value as any)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Assignee (Penanggung Jawab)</label>
                                    <select 
                                        value={taskForm.data.assignee_id}
                                        onChange={(e) => taskForm.setData('assignee_id', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Role Spesialisasi</label>
                                    <select 
                                        value={taskForm.data.assignee_role}
                                        onChange={(e) => taskForm.setData('assignee_role', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Start Date</label>
                                    <input 
                                        type="date"
                                        value={taskForm.data.start_date}
                                        onChange={(e) => taskForm.setData('start_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Due Date</label>
                                    <input 
                                        type="date"
                                        value={taskForm.data.due_date}
                                        onChange={(e) => taskForm.setData('due_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Label (Tag)</label>
                                <input 
                                    type="text"
                                    value={taskForm.data.label}
                                    onChange={(e) => taskForm.setData('label', e.target.value)}
                                    placeholder="Contoh: Backend / Design / Ads"
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-sidebar-border">
                                <button type="button" onClick={() => setIsCreateTaskOpen(false)} className="px-4 py-2 rounded-lg border border-sidebar-border text-xs font-medium text-muted-foreground hover:bg-muted">Batal</button>
                                <button type="submit" disabled={taskForm.processing} className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50">Simpan Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* TASK DETAIL & COMMENT MODAL */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-sidebar-border rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start justify-between border-b border-sidebar-border pb-3">
                            <div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                                    {selectedTask.status}
                                </span>
                                <h3 className="text-lg font-bold text-foreground mt-1">{selectedTask.title}</h3>
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs bg-muted/30 p-3 rounded-xl border border-sidebar-border">
                            <div>
                                <span className="text-muted-foreground">Assignee:</span> <strong className="text-foreground">{selectedTask.assignee?.name || 'Unassigned'}</strong> ({selectedTask.assignee_role || 'Member'})
                            </div>
                            <div>
                                <span className="text-muted-foreground">Prioritas:</span> <strong className="text-foreground">{selectedTask.priority}</strong>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Start:</span> <strong className="text-foreground">{selectedTask.start_date || '-'}</strong>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Due:</span> <strong className="text-foreground">{selectedTask.due_date || '-'}</strong> ({selectedTask.duration_days} Hari)
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                <span>Komentar & Diskusi Tim</span>
                            </h4>

                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                {selectedTask.comments && selectedTask.comments.length > 0 ? (
                                    selectedTask.comments.map((c) => (
                                        <div key={c.id} className="p-3 rounded-xl bg-muted/40 border border-sidebar-border text-xs space-y-1">
                                            <div className="flex items-center justify-between font-bold text-foreground">
                                                <span>{c.user?.name || 'User'}</span>
                                                <span className="text-[10px] font-normal text-muted-foreground">{c.created_at}</span>
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed">{c.comment}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">Belum ada komentar di task ini.</p>
                                )}
                            </div>

                            <form onSubmit={handleCommentSubmit} className="flex gap-2">
                                <input 
                                    type="text" required
                                    value={commentForm.data.comment}
                                    onChange={(e) => commentForm.setData('comment', e.target.value)}
                                    placeholder="Tulis komentar..."
                                    className="flex-1 px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <button type="submit" disabled={commentForm.processing} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90">
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ProjectCredentialsModal
                project={activeProject || null}
                isOpen={isCredentialsModalOpen}
                onClose={() => setIsCredentialsModalOpen(false)}
            />
        </AppLayout>
    );
}

