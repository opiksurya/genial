import React, { useEffect, useRef, useState } from 'react';

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
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        let startTime: number | null = null;
        let animationFrame: number;

        const updateCount = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const current = from + (to - from) * easeProgress;
            
            setCount(current);

            if (progress < 1) {
                animationFrame = requestAnimationFrame(updateCount);
            }
        };

        animationFrame = requestAnimationFrame(updateCount);

        return () => cancelAnimationFrame(animationFrame);
    }, [isVisible, to, from, duration]);

    return (
        <span ref={elementRef} className={className}>
            {prefix}
            {count.toFixed(decimals)}
            {suffix}
        </span>
    );
}
