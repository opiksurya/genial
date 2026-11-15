import { Head, Link, router, usePage } from "@inertiajs/react";
import { CalendarClock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/layouts/app-layout";
import type { BreadcrumbItem } from "@/types";

type PortalProject = {
    id: number;
    name: string;
    client: string | null;
    status: string | null;
    progress: number;
};

type UpcomingMeeting = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    platform: string | null;
    meeting_link: string | null;
    project_name: string | null;
};

type Performance = {
    shopee: {
        isConnected: boolean;
        revenue: number | null;
        orders: number | null;
        roas: number | null;
    };
    meta: {
        isConnected: boolean;
        spend: number | null;
        revenue: number | null;
        roas: number | null;
        purchases: number | null;
    };
};

type Props = {
    projects: PortalProject[];
    selectedProjectId: number | null;
    upcomingMeetings: UpcomingMeeting[];
    performance: Performance | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/client/dashboard" },
];

const rupiah = (value: number | null) =>
    value === null ? "-" : `Rp ${Math.round(value).toLocaleString("id-ID")}`;

const count = (value: number | null) =>
    value === null ? "-" : value.toLocaleString("id-ID");

const roasText = (value: number | null) =>
    value === null ? "-" : `${value.toFixed(2)}x`;

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
    });

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
        </div>
    );
}

export default function ClientDashboard({
    projects,
    selectedProjectId,
    upcomingMeetings,
    performance,
}: Props) {
    const { portalNav } = usePage().props;

    const changeProject = (value: string) => {
        router.get(
            "/client/dashboard",
            value === "all" ? {} : { project_id: value },
            { preserveScroll: true },
        );
    };

    const visibleProjects =
        selectedProjectId === null
            ? projects
            : projects.filter((project) => project.id === selectedProjectId);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-semibold">Dashboard</h1>
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

                {projects.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            Belum ada proyek yang ditautkan ke akun Anda.
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {visibleProjects.map((project) => (
                                <Card key={project.id}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between gap-2">
                                            <span className="truncate">
                                                {project.name}
                                            </span>
                                            {project.status && (
                                                <Badge variant="secondary">
                                                    {project.status}
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        {project.client && (
                                            <CardDescription>
                                                {project.client}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                                            <span>Progres</span>
                                            <span>{project.progress}%</span>
                                        </div>
                                        <div
                                            className="h-2 overflow-hidden rounded-full bg-muted"
                                            role="progressbar"
                                            aria-valuenow={project.progress}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                        >
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{
                                                    width: `${Math.min(100, Math.max(0, project.progress))}%`,
                                                }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {performance && (
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Shopee</CardTitle>
                                        <CardDescription>
                                            30 hari terakhir
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {performance.shopee.isConnected ? (
                                            <div className="grid grid-cols-3 gap-4">
                                                <Metric
                                                    label="Omzet"
                                                    value={rupiah(
                                                        performance.shopee
                                                            .revenue,
                                                    )}
                                                />
                                                <Metric
                                                    label="Pesanan"
                                                    value={count(
                                                        performance.shopee
                                                            .orders,
                                                    )}
                                                />
                                                <Metric
                                                    label="ROAS"
                                                    value={roasText(
                                                        performance.shopee.roas,
                                                    )}
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Belum terhubung
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Meta Ads</CardTitle>
                                        <CardDescription>
                                            30 hari terakhir
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {performance.meta.isConnected ? (
                                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                                <Metric
                                                    label="Biaya iklan"
                                                    value={rupiah(
                                                        performance.meta.spend,
                                                    )}
                                                />
                                                <Metric
                                                    label="Pendapatan"
                                                    value={rupiah(
                                                        performance.meta
                                                            .revenue,
                                                    )}
                                                />
                                                <Metric
                                                    label="ROAS"
                                                    value={roasText(
                                                        performance.meta.roas,
                                                    )}
                                                />
                                                <Metric
                                                    label="Pembelian"
                                                    value={count(
                                                        performance.meta
                                                            .purchases,
                                                    )}
                                                />
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Belum terhubung
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarClock className="size-4" />
                                    Rapat terdekat
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {upcomingMeetings.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada rapat terjadwal.
                                    </p>
                                ) : (
                                    <ul className="divide-y">
                                        {upcomingMeetings.map((meeting) => (
                                            <li
                                                key={meeting.id}
                                                className="flex items-center justify-between gap-3 py-2 text-sm"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">
                                                        {meeting.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDateTime(
                                                            meeting.start_time,
                                                        )}
                                                        {meeting.project_name &&
                                                            ` · ${meeting.project_name}`}
                                                    </p>
                                                </div>
                                                {meeting.meeting_link && (
                                                    <a
                                                        href={
                                                            meeting.meeting_link
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                    >
                                                        Buka
                                                        <ExternalLink className="size-3" />
                                                    </a>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}

                {Array.isArray(portalNav) && portalNav.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Menu lainnya</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3 text-sm">
                            {portalNav.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="text-primary hover:underline"
                                >
                                    {item.title}
                                </Link>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
