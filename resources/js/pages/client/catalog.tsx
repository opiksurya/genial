import { Head } from "@inertiajs/react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/layouts/app-layout";
import type { BreadcrumbItem } from "@/types";

type CatalogService = {
    id: number;
    name: string;
    category: string | null;
    format: string | null;
    description: string | null;
    deliverables: string | null;
    client_price: number;
    unit: string | null;
    turnaround_days: number | null;
};

type Props = {
    services: CatalogService[];
    whatsappNumber: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Katalog Digital Kreatif", href: "/client/catalog" },
];

const priceFormat = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

const whatsappLink = (number: string, name: string): string =>
    `https://wa.me/${number.replace(/\D/g, "")}?text=` +
    encodeURIComponent(
        'Halo Genial Digital Solution, saya tertarik dengan layanan "' +
            name +
            '"',
    );

export default function ClientCatalog({ services, whatsappNumber }: Props) {
    const groups = new Map<string, CatalogService[]>();
    for (const service of services) {
        const key = service.category?.trim() || "Lainnya";
        groups.set(key, [...(groups.get(key) ?? []), service]);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Katalog Digital Kreatif" />
            <div className="flex flex-col gap-6 p-4">
                <h1 className="text-xl font-semibold">
                    Katalog Digital Kreatif
                </h1>

                {services.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            Katalog layanan belum tersedia.
                        </CardContent>
                    </Card>
                ) : (
                    Array.from(groups.entries()).map(([category, items]) => (
                        <section key={category} className="flex flex-col gap-3">
                            <h2 className="text-lg font-medium">{category}</h2>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {items.map((service) => (
                                    <Card key={service.id}>
                                        <CardContent className="flex h-full flex-col gap-3 py-4">
                                            <div>
                                                <p className="font-medium">
                                                    {service.name}
                                                </p>
                                                {service.format && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {service.format}
                                                    </p>
                                                )}
                                            </div>
                                            {service.description && (
                                                <p className="text-sm text-muted-foreground">
                                                    {service.description}
                                                </p>
                                            )}
                                            {service.deliverables && (
                                                <p className="text-sm">
                                                    <span className="font-medium">
                                                        Hasil:{" "}
                                                    </span>
                                                    {service.deliverables}
                                                </p>
                                            )}
                                            <div className="mt-auto flex flex-col gap-3">
                                                <div>
                                                    <p className="text-lg font-semibold">
                                                        {priceFormat.format(
                                                            service.client_price,
                                                        )}
                                                        {service.unit && (
                                                            <span className="text-sm font-normal text-muted-foreground">
                                                                {" "}
                                                                / {service.unit}
                                                            </span>
                                                        )}
                                                    </p>
                                                    {service.turnaround_days !==
                                                        null && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Estimasi{" "}
                                                            {
                                                                service.turnaround_days
                                                            }{" "}
                                                            hari kerja
                                                        </p>
                                                    )}
                                                </div>
                                                <Button asChild size="sm">
                                                    <a
                                                        href={whatsappLink(
                                                            whatsappNumber,
                                                            service.name,
                                                        )}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <MessageCircle />
                                                        Ajukan lewat WhatsApp
                                                    </a>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </AppLayout>
    );
}
