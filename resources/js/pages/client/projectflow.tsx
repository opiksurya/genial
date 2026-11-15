import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/layouts/app-layout";
import type { BreadcrumbItem } from "@/types";

type PortalProject = { id: number; name: string };

type ProjectDetail = {
    id: number;
    name: string;
    status: string | null;
    progress: number | null;
    start_date: string | null;
    end_date: string | null;
    manager: string | null;
};

type FlowTask = {
    id: number;
    project_id: number;
    title: string;
    status: string;
    priority: string | null;
    label: string | null;
    assignee: string | null;
    start_date: string | null;
    due_date: string | null;
    is_overdue: boolean;
};

type Milestone = {
    id: number;
    project_id: number;
    title: string;
    due_date: string | null;
    is_completed: boolean;
};

type TeamMember = {
    id: number;
    project_id: number;
    name: string;
    role: string | null;
};

type Props = {
    projects: PortalProject[];
    selectedProjectId: number | null;
    projectDetails: ProjectDetail[];
    tasks: FlowTask[];
    milestones: Milestone[];
    team: TeamMember[];
    stats: { total: number; done: number; in_progress: number; overdue: number };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: "ProjectFlow", href: "/client/projectflow" },
];

const COLUMNS: { id: string; title: string }[] = [
    { id: "BACKLOG", title: "Backlog" },
    { id: "PLANNING", title: "Perencanaan" },
    { id: "IN_PROGRESS", title: "Dikerjakan" },
    { id: "REVIEW", title: "Review" },
    { id: "DONE", title: "Selesai" },
];

const VIEWS = [
    { id: "overview", label: "Ringkasan" },
    { id: "board", label: "Board" },
    { id: "timeline", label: "Timeline" },
    { id: "team", label: "Tim" },
] as const;

type View = (typeof VIEWS)[number]["id"];

const formatDate = (value: string | null) =>
    value
        ? new Date(value).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : "-";

export default function ClientProjectFlow({
    projects,
    selectedProjectId,
    projectDetails,
    tasks,
    milestones,
    team,
    stats,
}: Props) {
    const [view, setView] = useState<View>("overview");
    const projectName = (id: number) =>
        projectDetails.find((project) => project.id === id)?.name ?? "";
    const showProject = projectDetails.length > 1;

    const changeProject = (value: string) => {
        router.get(
            "/client/projectflow",
            value === "all" ? {} : { project_id: value },
            { preserveScroll: true },
        );
    };

    const timelineTasks = [...tasks]
        .filter((task) => task.due_date !== null)
        .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="ProjectFlow" />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold">ProjectFlow</h1>
                        <p className="text-sm text-muted-foreground">
                            Pantau progres pekerjaan proyek Anda. Tampilan ini
                            hanya untuk dilihat.
                        </p>
                    </div>
                    {projects.length > 1 && (
                        <Select
                            value={
                                selectedProjectId
                                    ? String(selectedProjectId)
                                    : "all"
                            }
                            onValueChange={changeProject}
                        >
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="Pilih proyek" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Semua proyek
                                </SelectItem>
                                {projects.map((project) => (
                                    <SelectItem
                                        key={project.id}
                                        value={String(project.id)}
                                    >
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {VIEWS.map((item) => (
                        <Button
                            key={item.id}
                            size="sm"
                            variant={view === item.id ? "default" : "outline"}
                            onClick={() => setView(item.id)}
                        >
                            {item.label}
                        </Button>
                    ))}
                </div>

                {projectDetails.length === 0 && (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            Belum ada proyek yang terhubung dengan akun Anda.
                        </CardContent>
                    </Card>
                )}

                {projectDetails.length > 0 && view === "overview" && (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {[
                                ["Total tugas", stats.total],
                                ["Dikerjakan", stats.in_progress],
                                ["Selesai", stats.done],
                                ["Terlambat", stats.overdue],
                            ].map(([label, value]) => (
                                <Card key={label}>
                                    <CardContent className="py-4">
                                        <p className="text-xs text-muted-foreground">
                                            {label}
                                        </p>
                                        <p className="text-2xl font-semibold">
                                            {value}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        {projectDetails.map((project) => (
                            <Card key={project.id}>
                                <CardContent className="flex flex-col gap-2 py-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">
                                            {project.name}
                                        </p>
                                        {project.status && (
                                            <Badge variant="secondary">
                                                {project.status}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(project.start_date)} -{" "}
                                        {formatDate(project.end_date)}
                                        {project.manager &&
                                            ` · PM: ${project.manager}`}
                                    </p>
                                    <div className="h-2 w-full overflow-hidden rounded bg-muted">
                                        <div
                                            className="h-full bg-primary"
                                            style={{
                                                width: `${Math.min(100, Math.max(0, project.progress ?? 0))}%`,
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Progres {project.progress ?? 0}%
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {projectDetails.length > 0 && view === "board" && (
                    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
                        {COLUMNS.map((column) => {
                            const items = tasks.filter(
                                (task) => task.status === column.id,
                            );

                            return (
                                <div
                                    key={column.id}
                                    className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3"
                                >
                                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                                        {column.title} ({items.length})
                                    </p>
                                    {items.map((task) => (
                                        <Card key={task.id}>
                                            <CardContent className="flex flex-col gap-1 py-3">
                                                <p className="text-sm font-medium">
                                                    {task.title}
                                                </p>
                                                {showProject && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {projectName(
                                                            task.project_id,
                                                        )}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-1">
                                                    {task.priority && (
                                                        <Badge variant="outline">
                                                            {task.priority}
                                                        </Badge>
                                                    )}
                                                    {task.is_overdue && (
                                                        <Badge variant="destructive">
                                                            Terlambat
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {task.assignee ?? "-"} ·{" "}
                                                    {formatDate(task.due_date)}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}

                {projectDetails.length > 0 && view === "timeline" && (
                    <div className="flex flex-col gap-4">
                        {milestones.length > 0 && (
                            <Card>
                                <CardContent className="flex flex-col gap-2 py-4">
                                    <p className="font-medium">Milestone</p>
                                    {milestones.map((milestone) => (
                                        <div
                                            key={milestone.id}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span>
                                                {milestone.title}
                                                {showProject &&
                                                    ` · ${projectName(milestone.project_id)}`}
                                            </span>
                                            <span className="flex items-center gap-2 text-muted-foreground">
                                                {formatDate(milestone.due_date)}
                                                <Badge
                                                    variant={
                                                        milestone.is_completed
                                                            ? "secondary"
                                                            : "outline"
                                                    }
                                                >
                                                    {milestone.is_completed
                                                        ? "Selesai"
                                                        : "Berjalan"}
                                                </Badge>
                                            </span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                        <Card>
                            <CardContent className="flex flex-col gap-2 py-4">
                                <p className="font-medium">Jadwal tugas</p>
                                {timelineTasks.length === 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada tugas berjadwal.
                                    </p>
                                )}
                                {timelineTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-sm last:border-0"
                                    >
                                        <span>
                                            {task.title}
                                            {showProject &&
                                                ` · ${projectName(task.project_id)}`}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {formatDate(task.start_date)} -{" "}
                                            {formatDate(task.due_date)}
                                        </span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {projectDetails.length > 0 && view === "team" && (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {team.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                Belum ada anggota tim.
                            </p>
                        )}
                        {team.map((member) => (
                            <Card key={member.id}>
                                <CardContent className="py-4">
                                    <p className="font-medium">{member.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {member.role ?? "-"}
                                        {showProject &&
                                            ` · ${projectName(member.project_id)}`}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
