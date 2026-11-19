import { useMemo } from 'react';

type Ribbon = {
    id: string;
    base: number;
    drift: number;
    freq: number;
    phase: number;
    width: number;
    twist: number;
    twistPhase: number;
    stops: [string, string, string];
};

const W = 1600;
const H = 520;
const STEP = 10;
const LINES = 48;

const RIBBONS: Ribbon[] = [
    {
        id: 'a',
        base: 190,
        drift: 85,
        freq: 0.0055,
        phase: 0.4,
        width: 140,
        twist: 0.0042,
        twistPhase: 0.2,
        stops: ['#19A7EC', '#1B6FD1', '#1B4F8F'],
    },
    {
        id: 'b',
        base: 200,
        drift: 75,
        freq: 0.0071,
        phase: 2.1,
        width: 125,
        twist: 0.0035,
        twistPhase: 1.7,
        stops: ['#FF6B8A', '#FF9E7A', '#FAD03D'],
    },
    {
        id: 'c',
        base: 185,
        drift: 95,
        freq: 0.0046,
        phase: 4.0,
        width: 110,
        twist: 0.0051,
        twistPhase: 3.1,
        stops: ['#7FE3F5', '#19A7EC', '#6C7BFF'],
    },
];

const centre = (r: Ribbon, x: number) =>
    r.base +
    r.drift * Math.sin(x * r.freq + r.phase) +
    r.drift * 0.35 * Math.sin(x * r.freq * 2.3 + r.phase * 1.7);

// Signed half-width: it passes through zero, so the ribbon twists over itself.
const half = (r: Ribbon, x: number) =>
    r.width *
    Math.sin(x * r.twist + r.twistPhase) *
    (0.55 + 0.45 * Math.sin(x * 0.0021 + r.phase));

const points = (r: Ribbon, t: number): [number, number][] => {
    const result: [number, number][] = [];

    for (let x = -20; x <= W + 20; x += STEP) {
        result.push([x, centre(r, x) + t * half(r, x)]);
    }

    return result;
};

const line = (pts: [number, number][]) =>
    pts
        .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`)
        .join(' ');

const area = (r: Ribbon) => {
    const top = points(r, -1);
    const bottom = points(r, 1).reverse();

    return `${line(top)} ${bottom.map(([x, y]) => `L${x} ${y.toFixed(1)}`).join(' ')} Z`;
};

/** Decorative ribbon-mesh artwork: thin gradient lines drawn between two curves. */
export default function LoginWave({ className }: { className?: string }) {
    const ribbons = useMemo(
        () =>
            RIBBONS.map((ribbon) => ({
                ribbon,
                lines: Array.from({ length: LINES }, (_, k) =>
                    line(points(ribbon, (k / (LINES - 1)) * 2 - 1)),
                ),
                fill: area(ribbon),
            })),
        [],
    );

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid slice"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                {RIBBONS.map((r) => (
                    <linearGradient
                        key={r.id}
                        id={`wave-${r.id}`}
                        x1="0"
                        x2="1"
                        y1="0"
                        y2="0"
                    >
                        <stop offset="0" stopColor={r.stops[0]} />
                        <stop offset="0.5" stopColor={r.stops[1]} />
                        <stop offset="1" stopColor={r.stops[2]} />
                    </linearGradient>
                ))}
            </defs>
            {ribbons.map(({ ribbon, lines, fill }) => (
                <g key={ribbon.id}>
                    <path
                        d={fill}
                        fill={`url(#wave-${ribbon.id})`}
                        opacity="0.3"
                    />
                    {lines.map((d, i) => (
                        <path
                            key={i}
                            d={d}
                            fill="none"
                            stroke={`url(#wave-${ribbon.id})`}
                            strokeWidth="0.8"
                            opacity={i === 0 || i === LINES - 1 ? 1 : 0.72}
                        />
                    ))}
                </g>
            ))}
        </svg>
    );
}
