import { Head, router } from "@inertiajs/react";
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

type PortalFreelancer = {
    id: number;
    name: string;
    initials: string;
    skill: string | null;
    portfolio_link: string | null;
    stats: {
        completed: number;
        active: number;
        total: number;
    };
};

type Props = {
    freelancers: PortalFreelancer[];
    projects: PortalProject[];
    selectedProjectId: number | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Freelancer Hub", href: "/client/freelancers" },
];

const isWebLink = (link: string | null): link is string =>
    link !== null && /^https?:\/\//i.test(link);

export default function ClientFreelancers({
    freelancers,
    projects,
    selectedProjectId,
}: Props) {
    const changeProject = (value: string) => {
        router.get(
            "/client/freelancers",
            value === "all" ? {} : { project_id: value },
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Freelancer Hub" />
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-xl font-semibold">Freelancer Hub</h1>
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

                {freelancers.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            Belum ada freelancer yang mengerjakan proyek Anda.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {freelancers.map((freelancer) => (
                            <Card key={freelancer.id}>
                                <CardContent className="flex flex-col gap-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10">
                                            <AvatarFallback>
                                                {freelancer.initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">
                                                {freelancer.name}
                                            </p>
                                            {freelancer.skill && (
                                                <p className="truncate text-sm text-muted-foreground">
                                                    {freelancer.skill}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div>
                                            <p className="text-lg font-semibold">
                                                {freelancer.stats.completed}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Selesai
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold">
                                                {freelancer.stats.active}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Berjalan
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold">
                                                {freelancer.stats.total}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Total
                                            </p>
                                        </div>
                                    </div>
                                    {isWebLink(freelancer.portfolio_link) && (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                        >
                                            <a
                                                href={freelancer.portfolio_link}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <ExternalLink />
                                                Lihat portofolio
                                            </a>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
