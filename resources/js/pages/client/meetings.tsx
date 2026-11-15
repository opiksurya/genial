import { Head, router } from "@inertiajs/react";
import { CalendarClock, Download, ExternalLink, MapPin } from "lucide-react";
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

type PortalProject = {
    id: number;
    name: string;
};

type PortalMeeting = {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    platform: string | null;
    meeting_link: string | null;
    location: string | null;
    status: string | null;
    project_name: string | null;
};

type Props = {
    meetings: PortalMeeting[];
    projects: PortalProject[];
    selectedProjectId: number | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Agenda Meeting", href: "/client/meetings" },
];

const PLATFORM_LABEL: Record<string, string> = {
    google_meet: "Google Meet",
    zoom: "Zoom",
    offline: "Tatap muka",
    phone: "Telepon",
};

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString("id-ID", {
        dateStyle: "full",
        timeStyle: "short",
    });

export default function ClientMeetings({
    meetings,
    projects,
    selectedProjectId,
}: Props) {
    const changeProject = (value: string) => {
        router.get(
            "/client/meetings",
            value === "all" ? {} : { project_id: value },
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Agenda Meeting" />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-semibold">Agenda Meeting</h1>
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

                {meetings.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            Belum ada agenda meeting.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-3">
                        {meetings.map((meeting) => (
                            <Card key={meeting.id}>
                                <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-start md:justify-between">
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium">
                                                {meeting.title}
                                            </p>
                                            {meeting.status && (
                                                <Badge variant="secondary">
                                                    {meeting.status}
                                                </Badge>
                                            )}
                                            {meeting.platform && (
                                                <Badge variant="outline">
                                                    {PLATFORM_LABEL[
                                                        meeting.platform
                                                    ] ?? meeting.platform}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <CalendarClock className="size-4" />
                                            {formatDateTime(meeting.start_time)}
                                        </p>
                                        {meeting.project_name && (
                                            <p className="text-xs text-muted-foreground">
                                                {meeting.project_name}
                                            </p>
                                        )}
                                        {meeting.location && (
                                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="size-3" />
                                                {meeting.location}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 flex-wrap gap-2">
                                        {meeting.meeting_link && (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                            >
                                                <a
                                                    href={meeting.meeting_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <ExternalLink />
                                                    Buka tautan
                                                </a>
                                            </Button>
                                        )}
                                        <Button asChild size="sm" variant="outline">
                                            <a
                                                href={`/client/meetings/${meeting.id}/ics`}
                                                download
                                            >
                                                <Download />
                                                Unduh ICS
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
