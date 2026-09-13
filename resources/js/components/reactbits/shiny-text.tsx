import React from 'react';

interface ShinyTextProps {
    text: string;
    disabled?: boolean;
    speed?: number;
    className?: string;
}

export function ShinyText({
    text,
    disabled = false,
    speed = 3,
    className = '',
}: ShinyTextProps) {
    const animationDuration = `${speed}s`;

    return (
        <span
            className={`inline-block bg-clip-text text-transparent ${
                disabled ? '' : 'animate-shiny-sweep'
            } ${className}`}
            style={{
                backgroundImage:
                    'linear-gradient(110deg, #05BAF0 20%, #ffffff 45%, #FAD03D 55%, #00A9E7 80%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                animationDuration: animationDuration,
            }}
        >
            {text}
        </span>
    );
}
