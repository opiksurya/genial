import {
    BrainCircuit,
    Check,
    Database,
    Globe,
    Infinity as InfinityIcon,
    MessageCircle,
    Music2,
    Search,
    ShoppingBag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
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

type Channel = {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
    x: number;
    y: number;
    platform?: HeroPlatformKey;
};

// The scene is drawn on a flat PLANE x PLANE board that is then tilted into an isometric view.
const PLANE = 600;
const TILE = 72;
const HUB = { x: 252, y: 252, size: 96 };
const HUB_CENTER = HUB.x + HUB.size / 2;

const CHANNELS: Channel[] = [
    {
        id: 'shopee',
        label: 'Shopee',
        icon: ShoppingBag,
        color: '#EE4D2D',
        x: 14,
        y: 96,
        platform: 'shopee',
    },
    {
        id: 'tiktok',
        label: 'TikTok',
        icon: Music2,
        color: '#14B8C4',
        x: 14,
        y: 196,
        platform: 'tiktok',
    },
    {
        id: 'meta',
        label: 'Meta Ads',
        icon: InfinityIcon,
        color: '#0866FF',
        x: 14,
        y: 296,
        platform: 'meta',
    },
    {
        id: 'google',
        label: 'Google Ads',
        icon: Search,
        color: '#F4A400',
        x: 110,
        y: 46,
        platform: 'google',
    },
    { id: 'seo', label: 'SEO', icon: Globe, color: '#10B981', x: 110, y: 346 },
    {
        id: 'whatsapp',
        label: 'WhatsApp',
        icon: MessageCircle,
        color: '#25D366',
        x: 14,
        y: 396,
    },
];

const PLATFORM_ORDER: HeroPlatformKey[] = [
    'shopee',
    'tiktok',
    'meta',
    'google',
];
const BARS = [34, 52, 44, 70, 88];

/** Circuit-style route on the board from a channel tile into the AI hub. */
const route = (channel: Channel) => {
    const startX = channel.x + TILE;
    const startY = channel.y + TILE / 2;
    const bend = 212;
    const entryY = Math.min(
        HUB.y + HUB.size - 14,
        Math.max(HUB.y + 14, startY),
    );
    const radius = 14;

    if (Math.abs(entryY - startY) < 2) {
        return `M${startX} ${startY} H${HUB.x}`;
    }

    const down = entryY > startY ? 1 : -1;

    return [
        `M${startX} ${startY}`,
        `H${bend - radius}`,
        `Q${bend} ${startY} ${bend} ${startY + down * radius}`,
        `V${entryY - down * radius}`,
        `Q${bend} ${entryY} ${bend + radius} ${entryY}`,
        `H${HUB.x}`,
    ].join(' ');
};

const OUTPUT_ROUTES = [
    {
        id: 'report',
        color: '#05BAF0',
        d: `M${HUB.x + HUB.size} ${HUB_CENTER} H404`,
    },
    {
        id: 'bars',
        color: '#FAD03D',
        d: `M${HUB_CENTER} ${HUB.y} V150 Q${HUB_CENTER} 136 ${HUB_CENTER + 14} 136 H372`,
    },
    {
        id: 'stack',
        color: '#2D90CA',
        d: `M${HUB_CENTER} ${HUB.y + HUB.size} V442`,
    },
];

type SlabProps = {
    x: number;
    y: number;
    width: number;
    depth: number;
    height: number;
    radius?: number;
    side: string;
    face: string;
    faceStyle?: CSSProperties;
    lift?: number;
    bob?: number;
    children?: ReactNode;
};

/** A rounded block extruded upward from the board, built from stacked layers. */
function Slab({
    x,
    y,
    width,
    depth,
    height,
    radius = 16,
    side,
    face,
    faceStyle,
    lift = 0,
    bob,
    children,
}: SlabProps) {
    const layers = Math.max(2, Math.round(height / 2));

    return (
        <div
            className="absolute [transform-style:preserve-3d]"
            style={{ left: x, top: y, width, height: depth }}
        >
            <div
                className="absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d]"
                style={{ transform: `translateZ(${lift}px)` }}
            >
                <div
                    className={`absolute inset-0 [transform-style:preserve-3d] ${bob === undefined ? '' : 'hero-iso-bob'}`}
                    style={
                        bob === undefined
                            ? undefined
                            : { animationDelay: `${bob}s` }
                    }
                >
                    {Array.from({ length: layers }, (_, index) => (
                        <span
                            key={index}
                            className="absolute inset-0"
                            style={{
                                borderRadius: radius,
                                background: side,
                                transform: `translateZ(${((index * height) / layers).toFixed(1)}px)`,
                            }}
                        />
                    ))}
                    <div
                        className={`absolute inset-0 ${face}`}
                        style={{
                            borderRadius: radius,
                            transform: `translateZ(${height}px)`,
                            ...faceStyle,
                        }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Isometric, animated scene: ad channels feed an AI hub that drives reports and dashboards. */
export default function HeroIso3D({
    isDark,
    metrics,
    active,
    onSelect,
}: Props) {
    const frameRef = useRef<HTMLDivElement>(null);
    const boardRef = useRef<HTMLDivElement>(null);
    const activeRef = useRef(active);
    const lastInteraction = useRef(0);

    useEffect(() => {
        activeRef.current = active;
    }, [active]);

    useEffect(() => {
        const frame = frameRef.current;
        const board = boardRef.current;

        if (!frame || !board) {
            return;
        }

        const reduced = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        const target = { x: 0, y: 0 };
        const tilt = { x: 0, y: 0 };
        const fit = () =>
            frame.clientWidth / (frame.clientWidth < 480 ? 720 : 590);
        let scale = fit();
        let visible = true;
        let raf = 0;

        const apply = (time: number) => {
            tilt.x += (target.x - tilt.x) * 0.05;
            tilt.y += (target.y - tilt.y) * 0.05;

            // A slow idle sway keeps the scene alive; the pointer adds to it.
            const sway = reduced ? 0 : Math.sin(time / 2600) * 2.2;
            const rotateX = 57 - tilt.y * 5;
            const rotateZ = -43 + sway + tilt.x * 7;
            board.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)}) rotateX(${rotateX.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg)`;
        };

        const resize = new ResizeObserver(() => {
            scale = fit();
            apply(performance.now());
        });
        resize.observe(frame);

        const watcher = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            frame.dataset.paused = visible ? 'false' : 'true';
        });
        watcher.observe(frame);

        const onMove = (event: PointerEvent) => {
            const rect = frame.getBoundingClientRect();
            target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        };
        const onLeave = () => {
            target.x = 0;
            target.y = 0;
        };

        const loop = (now: number) => {
            if (visible) {
                apply(now);
            }

            raf = requestAnimationFrame(loop);
        };

        apply(0);

        if (!reduced) {
            frame.addEventListener('pointermove', onMove);
            frame.addEventListener('pointerleave', onLeave);
            raf = requestAnimationFrame(loop);
        }

        // Move the highlighted channel on its own unless the visitor just chose one.
        const cycle = reduced
            ? 0
            : window.setInterval(() => {
                  if (!visible || Date.now() - lastInteraction.current < 9000) {
                      return;
                  }

                  onSelect(
                      PLATFORM_ORDER[
                          (PLATFORM_ORDER.indexOf(activeRef.current) + 1) %
                              PLATFORM_ORDER.length
                      ],
                  );
              }, 3600);

        return () => {
            cancelAnimationFrame(raf);
            window.clearInterval(cycle);
            resize.disconnect();
            watcher.disconnect();
            frame.removeEventListener('pointermove', onMove);
            frame.removeEventListener('pointerleave', onLeave);
        };
    }, [onSelect]);

    const metric = metrics[active];
    const activeChannel = CHANNELS.find(
        (channel) => channel.platform === active,
    );

    const side = isDark ? '#07101f' : '#b9cde4';
    const tileFace = isDark
        ? 'bg-gradient-to-br from-[#16233c] to-[#0c1526] border border-white/10'
        : 'bg-gradient-to-br from-white to-[#eaf2fb] border border-white';
    const track = isDark ? 'rgba(5,186,240,0.22)' : 'rgba(45,144,202,0.28)';
    const ink = isDark ? 'text-slate-100' : 'text-slate-800';
    const soft = isDark ? 'text-slate-400' : 'text-slate-500';
    const line = isDark ? 'bg-white/15' : 'bg-slate-300/80';

    const choose = (key: HeroPlatformKey) => {
        lastInteraction.current = Date.now();
        onSelect(key);
    };

    return (
        <div className="relative mx-auto w-full max-w-[620px]">
            <style>{`
                @media (prefers-reduced-motion: no-preference) {
                    .hero-iso-bob { animation: hero-iso-bob 5.5s ease-in-out infinite; }
                    .hero-iso-flow { animation: hero-iso-flow 3.2s linear infinite; }
                    .hero-iso-pulse { animation: hero-iso-pulse 2.8s ease-in-out infinite; }
                    .hero-iso-spread { animation: hero-iso-spread 6s ease-in-out infinite; }
                    .hero-iso-grow { animation: hero-iso-grow 4.5s ease-in-out infinite; }
                    [data-paused='true'] .hero-iso-bob,
                    [data-paused='true'] .hero-iso-flow,
                    [data-paused='true'] .hero-iso-pulse,
                    [data-paused='true'] .hero-iso-spread,
                    [data-paused='true'] .hero-iso-grow { animation-play-state: paused; }
                }
                @keyframes hero-iso-bob { 0%, 100% { transform: translateZ(0); } 50% { transform: translateZ(9px); } }
                @keyframes hero-iso-flow { from { stroke-dashoffset: 520; } to { stroke-dashoffset: 0; } }
                @keyframes hero-iso-pulse { 0%, 100% { opacity: 0.55; transform: scale(0.92); } 50% { opacity: 1; transform: scale(1.08); } }
                @keyframes hero-iso-spread { 0%, 100% { transform: translateZ(var(--z)); } 50% { transform: translateZ(calc(var(--z) * 1.7)); } }
                @keyframes hero-iso-grow { 0%, 100% { transform: translateZ(0) scale(1); } 50% { transform: translateZ(8px) scale(1.04); } }
            `}</style>

            <div
                ref={frameRef}
                className="relative aspect-[10/8] w-full touch-pan-y select-none [perspective:1800px]"
            >
                <span
                    className="pointer-events-none absolute top-1/2 left-1/2 size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                    style={{
                        background: isDark
                            ? 'radial-gradient(circle, rgba(5,186,240,0.28), transparent 65%)'
                            : 'radial-gradient(circle, rgba(5,186,240,0.30), rgba(250,208,61,0.14) 45%, transparent 70%)',
                    }}
                    aria-hidden="true"
                />

                <div
                    ref={boardRef}
                    className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]"
                    style={{
                        width: PLANE,
                        height: PLANE,
                        transformOrigin: 'center',
                    }}
                >
                    {/* Circuit lines on the board, with light travelling along them */}
                    <svg
                        width={PLANE}
                        height={PLANE}
                        viewBox={`0 0 ${PLANE} ${PLANE}`}
                        className="absolute inset-0 overflow-visible"
                        style={{ transform: 'translateZ(1px)' }}
                        aria-hidden="true"
                    >
                        {CHANNELS.map((channel, index) => {
                            const isActive = channel.platform === active;

                            return (
                                <g key={channel.id}>
                                    <path
                                        d={route(channel)}
                                        fill="none"
                                        stroke={track}
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d={route(channel)}
                                        fill="none"
                                        stroke={channel.color}
                                        strokeWidth={isActive ? 5 : 3.5}
                                        strokeLinecap="round"
                                        strokeDasharray="46 214"
                                        className="hero-iso-flow"
                                        style={{
                                            animationDelay: `${-index * 0.55}s`,
                                            filter: `drop-shadow(0 0 ${isActive ? 9 : 5}px ${channel.color})`,
                                        }}
                                    />
                                </g>
                            );
                        })}
                        {OUTPUT_ROUTES.map((output, index) => (
                            <g key={output.id}>
                                <path
                                    d={output.d}
                                    fill="none"
                                    stroke={track}
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                />
                                <path
                                    d={output.d}
                                    fill="none"
                                    stroke={output.color}
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeDasharray="40 220"
                                    className="hero-iso-flow"
                                    style={{
                                        animationDelay: `${-1.4 - index * 0.7}s`,
                                        filter: `drop-shadow(0 0 7px ${output.color})`,
                                    }}
                                />
                            </g>
                        ))}
                    </svg>

                    {/* Channel tiles */}
                    {CHANNELS.map((channel, index) => {
                        const Icon = channel.icon;
                        const isActive = channel.platform === active;
                        const face = (
                            <span
                                className={`flex h-full w-full flex-col items-center justify-center gap-1 ${ink}`}
                            >
                                <Icon
                                    className="size-7"
                                    style={{ color: channel.color }}
                                    strokeWidth={2.2}
                                />
                                <span className="text-[10px] leading-none font-bold">
                                    {channel.label}
                                </span>
                            </span>
                        );

                        return (
                            <div
                                key={channel.id}
                                className="[transform-style:preserve-3d]"
                            >
                                <span
                                    className="hero-iso-pulse absolute rounded-3xl blur-md"
                                    style={{
                                        left: channel.x - 8,
                                        top: channel.y - 8,
                                        width: TILE + 16,
                                        height: TILE + 16,
                                        background: channel.color,
                                        opacity: isActive ? 0.9 : 0.55,
                                        animationDelay: `${index * 0.4}s`,
                                    }}
                                    aria-hidden="true"
                                />
                                <Slab
                                    x={channel.x}
                                    y={channel.y}
                                    width={TILE}
                                    depth={TILE}
                                    height={14}
                                    side={side}
                                    face={tileFace}
                                    faceStyle={{
                                        boxShadow: isActive
                                            ? `0 0 0 2.5px ${channel.color}, 0 0 22px ${channel.color}`
                                            : `inset 0 -3px 0 ${channel.color}`,
                                    }}
                                    lift={isActive ? 20 : 0}
                                    bob={index * 0.45}
                                >
                                    {channel.platform ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                choose(
                                                    channel.platform as HeroPlatformKey,
                                                )
                                            }
                                            aria-pressed={isActive}
                                            aria-label={`Lihat performa ${channel.label}`}
                                            className="h-full w-full cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#05BAF0]"
                                        >
                                            {face}
                                        </button>
                                    ) : (
                                        face
                                    )}
                                </Slab>
                            </div>
                        );
                    })}

                    {/* AI hub */}
                    <span
                        className="hero-iso-pulse absolute rounded-[36px] blur-xl"
                        style={{
                            left: HUB.x - 22,
                            top: HUB.y - 22,
                            width: HUB.size + 44,
                            height: HUB.size + 44,
                            background:
                                'radial-gradient(circle, #05BAF0, rgba(250,208,61,0.55) 60%, transparent 75%)',
                        }}
                        aria-hidden="true"
                    />
                    <Slab
                        x={HUB.x}
                        y={HUB.y}
                        width={HUB.size}
                        depth={HUB.size}
                        height={26}
                        radius={22}
                        side={isDark ? '#0a3a66' : '#1B6FB5'}
                        face="bg-gradient-to-br from-[#3DD0FF] via-[#19A7EC] to-[#1B4F8F] border border-white/50"
                        faceStyle={{
                            boxShadow:
                                '0 0 34px rgba(5,186,240,0.85), inset 0 0 18px rgba(255,255,255,0.35)',
                        }}
                        bob={0.2}
                    >
                        <span
                            className="flex h-full w-full flex-col items-center justify-center text-white"
                            aria-hidden="true"
                        >
                            <BrainCircuit
                                className="size-9"
                                strokeWidth={1.7}
                            />
                            <span className="mt-0.5 text-sm leading-none font-extrabold tracking-wide">
                                AI
                            </span>
                        </span>
                    </Slab>

                    {/* Data analytics: bars rising from a base plate */}
                    <Slab
                        x={372}
                        y={84}
                        width={176}
                        depth={104}
                        height={8}
                        side={side}
                        face={tileFace}
                        radius={18}
                    >
                        <span
                            className={`absolute top-2 left-3 flex items-center gap-1 text-[10px] font-bold ${ink}`}
                        >
                            <Database className="size-3 text-[#2D90CA]" />
                            Data analitik
                        </span>
                    </Slab>
                    {BARS.map((height, index) => (
                        <div
                            key={index}
                            className="hero-iso-grow absolute [transform-style:preserve-3d]"
                            style={{
                                left: 0,
                                top: 0,
                                animationDelay: `${index * 0.35}s`,
                            }}
                        >
                            <Slab
                                x={390 + index * 29}
                                y={126}
                                width={20}
                                depth={46}
                                height={8 + height}
                                radius={6}
                                side={
                                    index === BARS.length - 1
                                        ? '#C99A00'
                                        : isDark
                                          ? '#0B5E94'
                                          : '#1F86C9'
                                }
                                face={
                                    index === BARS.length - 1
                                        ? 'bg-[#FAD03D] shadow-[0_0_18px_rgba(250,208,61,0.9)]'
                                        : 'bg-[#4CCBF5] shadow-[0_0_14px_rgba(5,186,240,0.75)]'
                                }
                            />
                        </div>
                    ))}

                    {/* Result panel: floating glass card with the highlighted channel's sample figures */}
                    <span
                        className="absolute rounded-[32px] blur-2xl"
                        style={{
                            left: 392,
                            top: 232,
                            width: 216,
                            height: 176,
                            background: 'rgba(5,186,240,0.35)',
                        }}
                        aria-hidden="true"
                    />
                    <Slab
                        x={404}
                        y={236}
                        width={190}
                        depth={158}
                        height={8}
                        radius={22}
                        side={
                            isDark
                                ? 'rgba(10,30,60,0.75)'
                                : 'rgba(150,190,225,0.75)'
                        }
                        face={
                            isDark
                                ? 'bg-[#101c33]/85 border border-white/15 backdrop-blur-sm'
                                : 'bg-white/85 border border-white backdrop-blur-sm'
                        }
                        faceStyle={{
                            boxShadow: '0 0 26px rgba(5,186,240,0.45)',
                        }}
                        lift={30}
                        bob={1.1}
                    >
                        <span
                            className={`flex h-full w-full flex-col p-3.5 ${ink}`}
                            aria-live="polite"
                        >
                            <span className="flex items-center justify-between">
                                <span
                                    className={`text-[10px] font-semibold ${soft}`}
                                >
                                    {activeChannel?.label ?? 'Kanal'}
                                </span>
                                <span className="rounded-md bg-[#00A9E7]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#0B8FCB]">
                                    {metric.growth}
                                </span>
                            </span>
                            <span className="mt-1 text-[17px] leading-tight font-extrabold">
                                {metric.sales}
                            </span>
                            <span className="mt-2 flex items-center gap-2.5">
                                <span className="hero-iso-pulse flex size-10 shrink-0 items-center justify-center rounded-full border-[3px] border-[#05BAF0] text-[#05BAF0] shadow-[0_0_16px_rgba(5,186,240,0.9)]">
                                    <Check className="size-5" strokeWidth={3} />
                                </span>
                                <span className="flex-1 space-y-1.5">
                                    <span
                                        className={`block h-1.5 w-full rounded-full ${line}`}
                                    />
                                    <span
                                        className={`block h-1.5 w-3/4 rounded-full ${line}`}
                                    />
                                    <span className="block h-1.5 w-1/2 rounded-full bg-[#FAD03D]" />
                                </span>
                            </span>
                            <span
                                className={`mt-auto flex items-center justify-between text-[10px] ${soft}`}
                            >
                                <span>Contoh data</span>
                                <span className="font-bold text-[#D49B00]">
                                    ROAS {metric.roas}
                                </span>
                            </span>
                        </span>
                    </Slab>

                    {/* Dashboard: stacked layers that breathe apart */}
                    {[0, 1, 2].map((layer) => (
                        <div
                            key={layer}
                            className="hero-iso-spread absolute [transform-style:preserve-3d]"
                            style={{
                                left: 0,
                                top: 0,
                                ['--z' as string]: `${layer * 16}px`,
                                transform: `translateZ(${layer * 16}px)`,
                            }}
                        >
                            <Slab
                                x={214}
                                y={442}
                                width={172}
                                depth={136}
                                height={6}
                                radius={18}
                                side={side}
                                face={
                                    layer === 2
                                        ? tileFace
                                        : isDark
                                          ? 'bg-[#0f1a2e] border border-white/10'
                                          : 'bg-[#dfeaf6] border border-white/70'
                                }
                                faceStyle={
                                    layer === 2
                                        ? {
                                              boxShadow:
                                                  '0 0 20px rgba(45,144,202,0.45)',
                                          }
                                        : undefined
                                }
                            >
                                {layer === 2 && (
                                    <span
                                        className={`flex h-full w-full flex-col gap-2 p-3 ${ink}`}
                                        aria-hidden="true"
                                    >
                                        <span className="text-[10px] font-bold">
                                            Dashboard klien
                                        </span>
                                        {[0, 1, 2].map((row) => (
                                            <span
                                                key={row}
                                                className="flex items-center gap-2"
                                            >
                                                <span
                                                    className="size-4 shrink-0 rounded-md"
                                                    style={{
                                                        background: [
                                                            '#05BAF0',
                                                            '#FAD03D',
                                                            '#2D90CA',
                                                        ][row],
                                                    }}
                                                />
                                                <span
                                                    className={`h-1.5 flex-1 rounded-full ${line}`}
                                                />
                                                <span
                                                    className={`h-1.5 w-6 rounded-full ${line}`}
                                                />
                                            </span>
                                        ))}
                                    </span>
                                )}
                            </Slab>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
