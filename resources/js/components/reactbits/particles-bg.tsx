import React, { useEffect, useRef } from 'react';

interface ParticlesBgProps {
    particleCount?: number;
    particleColor?: string;
    speed?: number;
    className?: string;
}

export function ParticlesBg({
    particleCount = 50,
    particleColor = 'rgba(0, 169, 231, 0.4)',
    speed = 0.5,
    className = '',
}: ParticlesBgProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
        let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

        const handleResize = () => {
            if (!canvas) return;
            width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
            height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        const particles: {
            x: number;
            y: number;
            radius: number;
            vx: number;
            vy: number;
            alpha: number;
        }[] = [];

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2 + 1,
                vx: (Math.random() - 0.5) * speed,
                vy: (Math.random() - 0.5) * speed,
                alpha: Math.random() * 0.5 + 0.2,
            });
        }

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = particleColor.replace(/[\d\.]+\)$/g, `${p.alpha})`);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [particleCount, particleColor, speed]);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
        />
    );
}
