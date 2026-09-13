import React, { useRef, useState } from 'react';

interface TiltedCardProps {
    children: React.ReactNode;
    maxDegree?: number;
    className?: string;
}

export function TiltedCard({
    children,
    maxDegree = 15,
    className = '',
}: TiltedCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const rY = ((mouseX - width / 2) / (width / 2)) * maxDegree;
        const rX = ((height / 2 - mouseY) / (height / 2)) * maxDegree;

        setRotateX(rX);
        setRotateY(rY);
    };

    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
        setIsHovered(false);
    };

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            className={`transition-transform duration-150 ease-out cursor-pointer ${className}`}
            style={{
                transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${isHovered ? 1.02 : 1}, ${isHovered ? 1.02 : 1}, 1)`,
                transformStyle: 'preserve-3d',
            }}
        >
            {children}
        </div>
    );
}
