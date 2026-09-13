import React, { useEffect, useState } from 'react';

interface CountUpProps {
    to: number;
    from?: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    className?: string;
}

export function CountUp({
    to,
    from = 0,
    duration = 2,
    prefix = '',
    suffix = '',
    decimals = 0,
    className = '',
}: CountUpProps) {
    const [count, setCount] = useState(from);

    useEffect(() => {
        let startTime: number | null = null;
        let animationFrame: number;

        const updateCount = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            
            // EaseOutQuad formula
            const easeProgress = 1 - (1 - progress) * (1 - progress);
            const current = from + (to - from) * easeProgress;
            
            setCount(current);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(updateCount);
            }
        };

        animationFrame = requestAnimationFrame(updateCount);

        return () => cancelAnimationFrame(animationFrame);
    }, [to, from, duration]);

    return (
        <span className={className}>
            {prefix}
            {count.toFixed(decimals)}
            {suffix}
        </span>
    );
}
