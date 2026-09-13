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
    KeyRound,
    Eye,
    EyeOff,
    Edit3,
    UserCheck
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

interface AgentItem {
    id: number;
    name: string;
    commission_rate: number;
}

interface ProjectItem {
    id: number;
    name: string;
    client: string;
    client_logo?: string;
    category: string;
    status: string;
    priority: string;
    progress: number;
    start_date: string;
    end_date: string;
    is_show_on_home?: boolean;
    manager?: { id: number; name: string };
    agent?: AgentItem;
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
    agents?: AgentItem[];
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

const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return '';
    const cleanDate = dateStr.split('T')[0];
    try {
        const [y, m, d] = cleanDate.split('-');
        if (y && m && d) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            const mIdx = parseInt(m, 10) - 1;
            return `${parseInt(d, 10)} ${months[mIdx] || m} ${y}`;
        }
    } catch (e) {}
    return cleanDate;
};

export default function ProjectBoard({ projects, activeProject, tasks, users, agents = [] }: Props) {
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);


    // Project Form
    const projectForm = useForm({
        name: '',
        client: '',
        client_logo: '',
        description: '',
        category: CATEGORIES[0],

        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        priority: 'Medium',
        manager_id: users[0]?.id || '',
        agent_id: '',
        is_show_on_home: true,
    });

    const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
    const editProjectForm = useForm({
        name: '',
        client: '',
        client_logo: '',
        description: '',
        category: CATEGORIES[0],
        start_date: '',
        end_date: '',
        priority: 'Medium',
        manager_id: '',
        agent_id: '',
        is_show_on_home: true,
    });

    const handleOpenEditProject = (p: ProjectItem) => {
        setEditingProject(p);
        editProjectForm.setData({
            name: p.name,
            client: p.client,
            client_logo: p.client_logo || '',
            description: p.description || '',
            category: p.category || CATEGORIES[0],
            start_date: p.start_date ? p.start_date.split('T')[0] : '',
            end_date: p.end_date ? p.end_date.split('T')[0] : '',
            priority: p.priority || 'Medium',
            manager_id: p.manager?.id ? String(p.manager.id) : '',
            agent_id: p.agent?.id ? String(p.agent.id) : '',
            is_show_on_home: p.is_show_on_home ?? true,
        });
    };

    const handleEditProjectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject) return;
        editProjectForm.put(`/projects/${editingProject.id}`, {
            onSuccess: () => {
                setEditingProject(null);
            },
        });
    };

    const handleToggleHomeVisibility = (projectId: number) => {
        router.put(`/projects/${projectId}/toggle-home-visibility`, {}, { preserveScroll: true });
    };

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
                <div className="flex flex-col gap-4 bg-card p-4 rounded-2xl border border-sidebar-border shadow-xs">
                    {/* Top Row: Title, Project Selector & Main Action Buttons */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Kanban className="w-7 h-7 text-primary shrink-0" />
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-extrabold text-foreground tracking-tight">Kanban Board</h1>
                                <select
                                    value={activeProject?.id || ''}
                                    onChange={(e) => handleProjectChange(Number(e.target.value))}
                                    className="px-3 py-1.5 rounded-xl border border-sidebar-border bg-background text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                                >
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.client})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Primary Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setIsCreateProjectOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-sidebar-border bg-background hover:bg-muted text-foreground transition-all shadow-xs"
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
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Tambah Task</span>
                            </button>
                        </div>
                    </div>

                    {/* Bottom Row: Active Project Meta Info & Tools */}
                    {activeProject && (
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-3 border-t border-sidebar-border/60">
                            {/* Meta Info */}
                            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                                {activeProject.client_logo ? (
                                    <img src={activeProject.client_logo} alt={activeProject.client} className="w-5 h-5 rounded-full object-cover border border-sidebar-border" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-extrabold flex items-center justify-center border border-primary/30">
                                        {activeProject.client?.charAt(0) || 'C'}
                                    </div>
                                )}
                                <span>Client: <strong className="text-foreground">{activeProject.client}</strong></span>
                                <span className="text-muted-foreground/40">•</span>
                                <span>Category: <strong className="text-primary">{activeProject.category}</strong></span>
                                {activeProject.agent && (
                                    <>
                                        <span className="text-muted-foreground/40">•</span>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold text-[11px]">
                                            <UserCheck className="w-3.5 h-3.5" />
                                            Agent: {activeProject.agent.name}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Tools */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => handleOpenEditProject(activeProject)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 transition-all shadow-xs"
                                    title="Edit Detail Project & Agent"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit Project</span>
                                </button>
                                <button
                                    onClick={() => setIsCredentialsModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all shadow-xs"
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>Vault Akses ({activeProject.credentials?.length || 0})</span>
                                </button>
                                <button
                                    onClick={() => handleToggleHomeVisibility(activeProject.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-xs ${
                                        activeProject.is_show_on_home
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                            : 'border-slate-500/30 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
                                    }`}
                                >
                                    {activeProject.is_show_on_home ? (
                                        <>
                                            <Eye className="w-3.5 h-3.5 text-emerald-500" />
                                            <span>Tampil di Home: Ya</span>
                                        </>
                                    ) : (
                                        <>
                                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Tampil di Home: Tidak</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
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
                                                        <span className="whitespace-nowrap font-mono">{formatDateDisplay(t.due_date)}</span>
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
                                <label className="block text-xs font-semibold text-foreground mb-1">Agent / Referrer (Optional)</label>
                                <select 
                                    value={projectForm.data.agent_id}
                                    onChange={(e) => projectForm.setData('agent_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-purple-500/30 bg-purple-500/5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500"
                                >
                                    <option value="">-- Tanpa Agent (No Agent) --</option>
                                    {agents.map((ag) => (
                                        <option key={ag.id} value={ag.id}>
                                            {ag.name} (Komisi {ag.commission_rate}%)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">URL Logo Client (Opsional)</label>
                                <input 
                                    type="text" 
                                    value={projectForm.data.client_logo}
                                    onChange={(e) => projectForm.setData('client_logo', e.target.value)}
                                    placeholder="https://example.com/logo-client.png"
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
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

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-sidebar-border">
                                <input 
                                    type="checkbox" 
                                    id="is_show_on_home"
                                    checked={projectForm.data.is_show_on_home}
                                    onChange={(e) => projectForm.setData('is_show_on_home', e.target.checked)}
                                    className="w-4 h-4 rounded text-primary focus:ring-primary border-sidebar-border cursor-pointer"
                                />
                                <label htmlFor="is_show_on_home" className="text-xs font-semibold text-foreground cursor-pointer select-none">
                                    Tampilkan di Halaman Utama (Home Page)
                                    <span className="block text-[11px] font-normal text-muted-foreground">Klien ini akan muncul di banner showcase halaman depan.</span>
                                </label>
                            </div>


                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-sidebar-border">
                                <button type="button" onClick={() => setIsCreateProjectOpen(false)} className="px-4 py-2 rounded-lg border border-sidebar-border text-xs font-medium text-muted-foreground hover:bg-muted">Batal</button>
                                <button type="submit" disabled={projectForm.processing} className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 disabled:opacity-50">Simpan Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT PROJECT MODAL */}
            {editingProject && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-sidebar-border rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-sidebar-border pb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Edit3 className="w-5 h-5 text-purple-400" />
                                <span>Edit Detail Project & Agent</span>
                            </h3>
                            <button onClick={() => setEditingProject(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditProjectSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Nama Project *</label>
                                <input 
                                    type="text" required
                                    value={editProjectForm.data.name}
                                    onChange={(e) => editProjectForm.setData('name', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Nama Client *</label>
                                <input 
                                    type="text" required
                                    value={editProjectForm.data.client}
                                    onChange={(e) => editProjectForm.setData('client', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Kategori Project</label>
                                    <select 
                                        value={editProjectForm.data.category}
                                        onChange={(e) => editProjectForm.setData('category', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Prioritas</label>
                                    <select 
                                        value={editProjectForm.data.priority}
                                        onChange={(e) => editProjectForm.setData('priority', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            {/* Agent Selection */}
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Agent / Referrer (Optional)</label>
                                <select 
                                    value={editProjectForm.data.agent_id}
                                    onChange={(e) => editProjectForm.setData('agent_id', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-purple-500/30 bg-purple-500/5 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                                >
                                    <option value="">-- Tanpa Agent (No Agent) --</option>
                                    {agents.map((ag) => (
                                        <option key={ag.id} value={ag.id}>
                                            {ag.name} (Komisi {ag.commission_rate}%)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Tanggal Mulai</label>
                                    <input 
                                        type="date" required
                                        value={editProjectForm.data.start_date}
                                        onChange={(e) => editProjectForm.setData('start_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Tanggal Selesai (Due)</label>
                                    <input 
                                        type="date" required
                                        value={editProjectForm.data.end_date}
                                        onChange={(e) => editProjectForm.setData('end_date', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">URL Logo Client (Opsional)</label>
                                <input 
                                    type="text" 
                                    value={editProjectForm.data.client_logo}
                                    onChange={(e) => editProjectForm.setData('client_logo', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Deskripsi Project</label>
                                <textarea 
                                    rows={3}
                                    value={editProjectForm.data.description}
                                    onChange={(e) => editProjectForm.setData('description', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-sidebar-border">
                                <button type="button" onClick={() => setEditingProject(null)} className="px-4 py-2 rounded-lg border border-sidebar-border text-xs font-medium text-muted-foreground hover:bg-muted">Batal</button>
                                <button type="submit" disabled={editProjectForm.processing} className="px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 disabled:opacity-50">Simpan Perubahan</button>
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
                                <span className="text-muted-foreground">Start:</span> <strong className="text-foreground">{formatDateDisplay(selectedTask.start_date) || '-'}</strong>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Due:</span> <strong className="text-foreground">{formatDateDisplay(selectedTask.due_date) || '-'}</strong> ({selectedTask.duration_days} Hari)
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

