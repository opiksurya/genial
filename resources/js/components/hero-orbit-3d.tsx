import {
    BrainCircuit,
    Database,
    Globe,
    Infinity as InfinityIcon,
    MessageCircle,
    Music2,
    Search,
    ShoppingBag,
    Sparkles,
    TrendingUp,
    Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';

export type HeroPlatformKey = 'shopee' | 'tiktok' | 'meta' | 'google';

type Metric = {
    title: string;
    roas: string;
    sales: string;
    growth: string;
    color: string;
};

type Props = {
    isDark: boolean;
    metrics: Record<HeroPlatformKey, Metric>;
    active: HeroPlatformKey;
    onSelect: (key: HeroPlatformKey) => void;
};

type Ring = { radius: number; tiltX: number; tiltZ: number; speed: number };

type OrbitNode = {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
    ring: number;
    angle: number;
    platform?: HeroPlatformKey;
};

// Scene units: the stage is a square from -VIEW to +VIEW with the AI core at the origin.
const VIEW = 104;
const FOCAL = 460;
const SAMPLES = 72;
const TAU = Math.PI * 2;

const RINGS: Ring[] = [
    { radius: 82, tiltX: -0.62, tiltZ: -0.22, speed: 0.2 },
    { radius: 50, tiltX: -0.95, tiltZ: 0.5, speed: -0.32 },
];

const NODES: OrbitNode[] = [
    {
        id: 'shopee',
        label: 'Shopee Ads',
        icon: ShoppingBag,
        color: '#EE4D2D',
        ring: 0,
        angle: 0,
        platform: 'shopee',
    },
    {
        id: 'tiktok',
        label: 'TikTok Ads',
        icon: Music2,
        color: '#14B8C4',
        ring: 0,
        angle: TAU / 6,
        platform: 'tiktok',
    },
    {
        id: 'meta',
        label: 'Meta Ads',
        icon: InfinityIcon,
        color: '#0866FF',
        ring: 0,
        angle: (TAU / 6) * 2,
        platform: 'meta',
    },
    {
        id: 'google',
        label: 'Google Ads',
        icon: Search,
        color: '#F4A400',
        ring: 0,
        angle: (TAU / 6) * 3,
        platform: 'google',
    },
    {
        id: 'seo',
        label: 'SEO',
        icon: Globe,
        color: '#10B981',
        ring: 0,
        angle: (TAU / 6) * 4,
    },
    {
        id: 'whatsapp',
        label: 'WhatsApp',
        icon: MessageCircle,
        color: '#25D366',
        ring: 0,
        angle: (TAU / 6) * 5,
    },
    {
        id: 'data',
        label: 'Data',
        icon: Database,
        color: '#2D90CA',
        ring: 1,
        angle: 0.4,
    },
    {
        id: 'analytics',
        label: 'Analitik',
        icon: TrendingUp,
        color: '#05BAF0',
        ring: 1,
        angle: 0.4 + TAU / 3,
    },
    {
        id: 'automation',
        label: 'Otomasi',
        icon: Workflow,
        color: '#FAD03D',
        ring: 1,
        angle: 0.4 + (TAU / 3) * 2,
    },
];

const PLATFORM_ORDER: HeroPlatformKey[] = [
    'shopee',
    'tiktok',
    'meta',
    'google',
];
const BARS = [35, 48, 42, 65, 78, 92, 110];

const project = (ring: Ring, angle: number, rx: number, ry: number) => {
    const x = ring.radius * Math.cos(angle);
    const z = ring.radius * Math.sin(angle);

    // Tilt the orbit plane, then apply the pointer-driven scene rotation.
    const y1 = -z * Math.sin(ring.tiltX);
    const z1 = z * Math.cos(ring.tiltX);
    const x2 = x * Math.cos(ring.tiltZ) - y1 * Math.sin(ring.tiltZ);
    const y2 = x * Math.sin(ring.tiltZ) + y1 * Math.cos(ring.tiltZ);
    const x3 = x2 * Math.cos(ry) + z1 * Math.sin(ry);
    const z3 = -x2 * Math.sin(ry) + z1 * Math.cos(ry);
    const y4 = y2 * Math.cos(rx) - z3 * Math.sin(rx);
    const z4 = y2 * Math.sin(rx) + z3 * Math.cos(rx);
    const scale = FOCAL / (FOCAL - z4);

    return { x: x3 * scale, y: y4 * scale, z: z4, scale };
};

/** Animated 3D scene: ad channels and data nodes orbiting an AI core. */
export default function HeroOrbit3D({
    isDark,
    metrics,
    active,
    onSelect,
}: Props) {
    const stageRef = useRef<HTMLDivElement>(null);
    const nodeRefs = useRef<(HTMLElement | null)[]>([]);
    const linkRefs = useRef<(SVGLineElement | null)[]>([]);
    const packetRefs = useRef<(SVGCircleElement | null)[]>([]);
    const backRefs = useRef<(SVGPathElement | null)[]>([]);
    const frontRefs = useRef<(SVGPathElement | null)[]>([]);
    const activeRef = useRef(active);
    const lastInteraction = useRef(0);

    useEffect(() => {
        activeRef.current = active;
    }, [active]);

    useEffect(() => {
        const stage = stageRef.current;

        if (!stage) {
            return;
        }

        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        const target = { x: 0, y: 0 };
        const tilt = { x: 0, y: 0 };
        let size = stage.clientWidth;
        let visible = true;
        let raf = 0;

        const resize = new ResizeObserver(() => {
            size = stage.clientWidth;
        });
        resize.observe(stage);

        const watcher = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
        });
        watcher.observe(stage);

        const onMove = (event: PointerEvent) => {
            const rect = stage.getBoundingClientRect();
            target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        };
        const onLeave = () => {
            target.x = 0;
            target.y = 0;
        };

        if (!reduced) {
            stage.addEventListener('pointermove', onMove);
            stage.addEventListener('pointerleave', onLeave);
        }

        const draw = (now: number) => {
            const time = reduced ? 0 : now / 1000;
            tilt.x += (target.x - tilt.x) * 0.06;
            tilt.y += (target.y - tilt.y) * 0.06;

            const rx = tilt.y * 0.3;
            const ry = tilt.x * 0.45;
            const px = size / (VIEW * 2);
            const chip = Math.min(1, Math.max(0.62, size / 520));

            RINGS.forEach((ring, index) => {
                let back = '';
                let front = '';
                let previous: 'back' | 'front' | null = null;

                for (let i = 0; i <= SAMPLES; i++) {
                    const point = project(ring, (i / SAMPLES) * TAU, rx, ry);
                    const side = point.z < 0 ? 'back' : 'front';
                    const segment = `${previous === side ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)} `;

                    if (side === 'back') {
                        back += segment;
                    } else {
                        front += segment;
                    }

                    previous = side;
                }

                backRefs.current[index]?.setAttribute('d', back);
                frontRefs.current[index]?.setAttribute('d', front);
            });

            NODES.forEach((node, index) => {
                const ring = RINGS[node.ring];
                const point = project(
                    ring,
                    node.angle + time * ring.speed,
                    rx,
                    ry,
                );
                const element = nodeRefs.current[index];

                if (element) {
                    const depth = (point.z / ring.radius + 1) / 2;
                    element.style.transform = `translate(-50%, -50%) translate(${(point.x * px).toFixed(1)}px, ${(point.y * px).toFixed(1)}px) scale(${(point.scale * chip).toFixed(3)})`;
                    element.style.zIndex = point.z >= 0 ? '30' : '10';
                    element.style.opacity = (0.5 + 0.5 * depth).toFixed(2);
                }

                const link = linkRefs.current[index];

                if (link) {
                    link.setAttribute('x1', point.x.toFixed(1));
                    link.setAttribute('y1', point.y.toFixed(1));
                }

                const packet = packetRefs.current[index];

                if (packet) {
                    // Data packets travel from each node into the AI core.
                    const progress = (time * 0.35 + index * 0.37) % 1;
                    packet.setAttribute(
                        'cx',
                        (point.x * (1 - progress)).toFixed(1),
                    );
                    packet.setAttribute(
                        'cy',
                        (point.y * (1 - progress)).toFixed(1),
                    );
                    packet.setAttribute(
                        'opacity',
                        reduced
                            ? '0'
                            : (Math.sin(progress * Math.PI) * 0.9).toFixed(2),
                    );
                }
            });
        };

        const loop = (now: number) => {
            if (visible) {
                draw(now);
            }

            raf = requestAnimationFrame(loop);
        };

        draw(0);

        if (!reduced) {
            raf = requestAnimationFrame(loop);
        }

        // Rotate the highlighted channel on its own unless the visitor just chose one.
        const cycle = reduced
            ? 0
            : window.setInterval(() => {
                  if (!visible || Date.now() - lastInteraction.current < 9000) {
                      return;
                  }

                  const next =
                      PLATFORM_ORDER[
                          (PLATFORM_ORDER.indexOf(activeRef.current) + 1) %
                              PLATFORM_ORDER.length
                      ];
                  onSelect(next);
              }, 3600);

        return () => {
            cancelAnimationFrame(raf);
            window.clearInterval(cycle);
            resize.disconnect();
            watcher.disconnect();
            stage.removeEventListener('pointermove', onMove);
            stage.removeEventListener('pointerleave', onLeave);
        };
    }, [onSelect]);

    const metric = metrics[active];
    const activeNode = NODES.find((node) => node.platform === active);
    const ringStroke = isDark ? 'rgba(5,186,240,0.6)' : 'rgba(45,144,202,0.7)';
    const tile = isDark
        ? 'bg-[#0c1322] border-slate-700/80'
        : 'bg-white border-slate-200';
    const glass = isDark
        ? 'bg-[#0c1322]/90 border-slate-700/80 text-slate-100'
        : 'bg-white/90 border-slate-200 text-slate-900 shadow-xl shadow-slate-300/50';
    const muted = isDark ? 'text-slate-400' : 'text-slate-500';

    const choose = (key: HeroPlatformKey) => {
        lastInteraction.current = Date.now();
        onSelect(key);
    };

    return (
        <div className="relative mx-auto w-full max-w-[540px]">
            <div
                ref={stageRef}
                className="relative aspect-[4/3] w-full touch-pan-y select-none"
            >
                <svg
                    viewBox={`${-VIEW} ${-VIEW * 0.75} ${VIEW * 2} ${VIEW * 1.5}`}
                    className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible"
                    aria-hidden="true"
                >
                    {RINGS.map((_, index) => (
                        <path
                            key={index}
                            ref={(element) => {
                                backRefs.current[index] = element;
                            }}
                            fill="none"
                            stroke={ringStroke}
                            strokeWidth="0.7"
                            strokeDasharray="1.5 2.5"
                            opacity="0.7"
                        />
                    ))}
                    {NODES.map((node, index) => (
                        <g key={node.id}>
                            <line
                                ref={(element) => {
                                    linkRefs.current[index] = element;
                                }}
                                x2="0"
                                y2="0"
                                stroke={node.color}
                                strokeWidth={
                                    node.platform === active ? 0.9 : 0.4
                                }
                                opacity={node.platform === active ? 0.75 : 0.28}
                            />
                            <circle
                                ref={(element) => {
                                    packetRefs.current[index] = element;
                                }}
                                r={node.platform === active ? 1.9 : 1.3}
                                fill={node.color}
                            />
                        </g>
                    ))}
                </svg>

                <div
                    className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
                    aria-hidden="true"
                >
                    <div className="relative flex size-[26vw] max-h-[132px] min-h-[84px] max-w-[132px] min-w-[84px] items-center justify-center">
                        <span className="absolute -inset-[38%] rounded-full bg-[radial-gradient(circle,rgba(5,186,240,0.38),transparent_65%)] blur-md motion-safe:animate-pulse" />
                        <span className="absolute -inset-[9%] rounded-full bg-[conic-gradient(from_0deg,#05BAF0,#FAD03D,#2D90CA,#05BAF0)] opacity-80 blur-[2px] motion-safe:animate-[spin_9s_linear_infinite]" />
                        <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_32%_28%,#7FE3F5_0%,#19A7EC_32%,#1B4F8F_70%,#0B2447_100%)] shadow-[inset_-10px_-14px_26px_rgba(4,16,40,0.55),0_18px_40px_-12px_rgba(5,186,240,0.7)]" />
                        <span className="absolute top-[14%] left-[20%] h-[22%] w-[34%] rounded-full bg-white/45 blur-[6px]" />
                        <span className="relative flex flex-col items-center text-white">
                            <BrainCircuit
                                className="size-[34%] min-h-6 min-w-6"
                                strokeWidth={1.6}
                            />
                            <span className="mt-0.5 text-[clamp(0.8rem,2.2vw,1.05rem)] leading-none font-extrabold tracking-wide">
                                AI
                            </span>
                        </span>
                    </div>
                </div>

                <svg
                    viewBox={`${-VIEW} ${-VIEW * 0.75} ${VIEW * 2} ${VIEW * 1.5}`}
                    className="pointer-events-none absolute inset-0 z-[25] h-full w-full overflow-visible"
                    aria-hidden="true"
                >
                    {RINGS.map((_, index) => (
                        <path
                            key={index}
                            ref={(element) => {
                                frontRefs.current[index] = element;
                            }}
                            fill="none"
                            stroke={ringStroke}
                            strokeWidth="1"
                        />
                    ))}
                </svg>

                {NODES.map((node, index) => {
                    const Icon = node.icon;
                    const isActive = node.platform === active;
                    const small = node.ring === 1;
                    const body = (
                        <>
                            <span
                                className={`flex items-center justify-center rounded-2xl border transition-shadow duration-300 ${tile} ${small ? 'size-10' : 'size-14'}`}
                                style={{
                                    boxShadow: isActive
                                        ? `0 0 0 2px ${node.color}, 0 14px 30px -8px ${node.color}`
                                        : `0 10px 22px -12px ${node.color}`,
                                }}
                            >
                                <Icon
                                    className={small ? 'size-[18px]' : 'size-6'}
                                    style={{ color: node.color }}
                                />
                            </span>
                            <span
                                className={`mt-1.5 rounded-full px-2 py-0.5 text-[11px] leading-none font-semibold whitespace-nowrap ${isDark ? 'bg-black/55 text-slate-200' : 'bg-white/85 text-slate-700'}`}
                            >
                                {node.label}
                            </span>
                        </>
                    );
                    const setRef = (element: HTMLElement | null) => {
                        nodeRefs.current[index] = element;
                    };
                    const base =
                        'absolute top-1/2 left-1/2 flex flex-col items-center will-change-transform';

                    return node.platform ? (
                        <button
                            key={node.id}
                            ref={setRef}
                            type="button"
                            onClick={() =>
                                choose(node.platform as HeroPlatformKey)
                            }
                            aria-pressed={isActive}
                            aria-label={`Lihat performa ${node.label}`}
                            className={`${base} cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#05BAF0]`}
                        >
                            {body}
                        </button>
                    ) : (
                        <div
                            key={node.id}
                            ref={setRef}
                            className={base}
                            aria-hidden="true"
                        >
                            {body}
                        </div>
                    );
                })}
            </div>

            <div
                className={`relative z-40 mx-auto mt-1 flex w-full max-w-[440px] items-stretch gap-4 rounded-2xl border p-4 backdrop-blur-md ${glass}`}
                aria-live="polite"
            >
                <div className="min-w-0 flex-1">
                    <p
                        className={`truncate text-[11px] font-semibold ${muted}`}
                    >
                        {metric.title}
                    </p>
                    <p className="mt-0.5 text-lg leading-tight font-extrabold sm:text-xl">
                        {metric.sales}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-snug">
                        <Sparkles className="size-3.5 shrink-0 text-[#E0A800]" />
                        <span className={muted}>
                            AI menyorot {activeNode?.label ?? 'kanal ini'}, ROAS{' '}
                            <span className="font-semibold text-[#E0A800]">
                                {metric.roas}
                            </span>
                        </span>
                    </p>
                </div>
                <div className="flex w-[38%] max-w-[150px] flex-col justify-between">
                    <span className="self-end rounded-lg border border-[#00A9E7]/25 bg-[#00A9E7]/10 px-2 py-0.5 text-xs font-bold text-[#00A9E7]">
                        {metric.growth}
                    </span>
                    <div className="mt-2 flex h-12 items-end gap-1">
                        {BARS.map((value, index) => (
                            <span
                                key={index}
                                className={`flex-1 rounded-t-sm bg-gradient-to-t transition-all duration-500 ${metric.color}`}
                                style={{ height: `${(value / 110) * 100}%` }}
                            />
                        ))}
                    </div>
                    <p className={`mt-1 text-right text-[10px] ${muted}`}>
                        Contoh tren penjualan
                    </p>
                </div>
            </div>
        </div>
    );
}
