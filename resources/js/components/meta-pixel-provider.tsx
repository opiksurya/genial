import { useMetaPixel } from '@/hooks/use-meta-pixel';

export default function MetaPixelProvider({ children }: { children: React.ReactNode }) {
    useMetaPixel();
    return <>{children}</>;
}
