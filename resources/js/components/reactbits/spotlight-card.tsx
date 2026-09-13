import React, { useRef, useState } from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    spotlightColor?: string;
}

export function SpotlightCard({
    children,
    className = '',
    spotlightColor = 'rgba(5, 186, 240, 0.35)',
    ...props
}: SpotlightCardProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${className}`}
            {...props}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 z-10"
                style={{
                    opacity,
                    background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 65%)`,
                }}
            />
            <div className="relative z-20 h-full">{children}</div>
        </div>
    );
}
