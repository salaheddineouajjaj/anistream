import React, { useRef, useEffect } from 'react';
import { useRafThrottle } from './raf';
import { useReducedMotion, isMobile } from './reducedMotion';

interface LayerConfig {
    selector: string;
    depth: number; // 0-1, higher = more movement
}

export function useParallax3D(containerRef: React.RefObject<HTMLElement>, layersConfig: LayerConfig[]) {
    const prefersReducedMotion = useReducedMotion();
    const mobile = useRef(isMobile());

    const handleMouseMove = useRafThrottle((e: MouseEvent) => {
        if (!containerRef.current || prefersReducedMotion || mobile.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const moveX = (x - centerX) / centerX;
        const moveY = (y - centerY) / centerY;

        layersConfig.forEach(({ selector, depth }) => {
            const layers = containerRef.current!.querySelectorAll(selector);
            layers.forEach((layer) => {
                const el = layer as HTMLElement;
                const translateX = moveX * depth * 30;
                const translateY = moveY * depth * 30;
                const rotateY = moveX * depth * 8;
                const rotateX = -moveY * depth * 8;

                el.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
                el.style.transition = 'transform 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99)';
            });
        });
    });

    const handleMouseLeave = () => {
        if (!containerRef.current || prefersReducedMotion || mobile.current) return;

        layersConfig.forEach(({ selector }) => {
            const layers = containerRef.current!.querySelectorAll(selector);
            layers.forEach((layer) => {
                const el = layer as HTMLElement;
                el.style.transform = 'translate3d(0, 0, 0) rotateY(0deg) rotateX(0deg)';
            });
        });
    };

    useEffect(() => {
        const element = containerRef.current;
        if (!element || prefersReducedMotion || mobile.current) return;

        element.addEventListener('mousemove', handleMouseMove as any);
        element.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            element.removeEventListener('mousemove', handleMouseMove as any);
            element.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [containerRef, handleMouseMove, prefersReducedMotion]);
}
