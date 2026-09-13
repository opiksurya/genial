import React from 'react';
import { motion } from 'framer-motion';

interface BlurTextProps {
    text: string;
    delay?: number;
    className?: string;
    animateBy?: 'words' | 'letters';
    direction?: 'top' | 'bottom';
}

export function BlurText({
    text,
    delay = 150,
    className = '',
    animateBy = 'words',
    direction = 'top',
}: BlurTextProps) {
    const elements = animateBy === 'words' ? text.split(' ') : text.split('');

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: delay / 1000,
            },
        },
    };

    const itemVariants = {
        hidden: {
            filter: 'blur(10px)',
            opacity: 0,
            y: direction === 'top' ? -20 : 20,
        },
        visible: {
            filter: 'blur(0px)',
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: 'easeOut',
            },
        },
    };

    return (
        <motion.span
            className={`inline-flex flex-wrap ${className}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {elements.map((el, i) => (
                <motion.span
                    key={i}
                    variants={itemVariants}
                    className="inline-block"
                    style={{ marginRight: animateBy === 'words' ? '0.25em' : '0' }}
                >
                    {el === ' ' ? '\u00A0' : el}
                </motion.span>
            ))}
        </motion.span>
    );
}
