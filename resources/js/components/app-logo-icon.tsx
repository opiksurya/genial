import type { HTMLAttributes } from 'react';

export default function AppLogoIcon(props: HTMLAttributes<HTMLImageElement>) {
    return (
        <img 
            src="/logo.png" 
            alt="Genial Digital Solution" 
            {...props} 
            className={`object-contain ${props.className ?? 'size-6'}`} 
        />
    );
}
