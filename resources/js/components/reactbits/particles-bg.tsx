import React, { useEffect, useRef } from 'react';

interface ParticlesBgProps {
    particleCount?: number;
    color?: string;
    speed?: number;
    className?: string;
}

export function ParticlesBg({
    particleCount = 60,
    color = '#00A9E7',
    speed = 0.6,
    className = '',
}: ParticlesBgProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const updateSize = () => {
            const rect = canvas.parentElement?.getBoundingClientRect();
            canvas.width = rect?.width || window.innerWidth;
            canvas.height = rect?.height || window.innerHeight;
        };

        updateSize();
        window.addEventListener('resize', updateSize);

        const particles = Array.from({ length: particleCount }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2.5 + 1,
            vx: (Math.random() - 0.5) * speed,
            vy: (Math.random() - 0.5) * speed,
            alpha: Math.random() * 0.6 + 0.3,
        }));

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connecting lines between close particles
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 110) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = color;
                        ctx.globalAlpha = (1 - dist / 110) * 0.25;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }

            // Draw particles
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.globalAlpha = p.alpha;
                ctx.fill();
            });

            ctx.globalAlpha = 1.0;
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', updateSize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [particleCount, color, speed]);

    return (
        <canvas
            ref={canvasRef}
            className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${className}`}
        />
    );
}
