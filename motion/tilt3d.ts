import React, { useRef, useEffect } from 'react';
import { useRafThrottle } from './raf';
import { useReducedMotion, isMobile } from './reducedMotion';

interface Tilt3DOptions {
    maxTilt?: number;
    scale?: number;
    speed?: number;
    glare?: boolean;
}

export function useTilt3D(containerRef: React.RefObject<HTMLElement>, options: Tilt3DOptions = {}) {
    const {
        maxTilt = 10,
        scale = 1.05,
        speed = 400,
        glare = false
    } = options;

    const prefersReducedMotion = useReducedMotion();
    const mobile = useRef(isMobile());

    const handleMouseMove = useRafThrottle((e: MouseEvent) => {
        if (!containerRef.current || prefersReducedMotion || mobile.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -maxTilt;
        const rotateY = ((x - centerX) / centerX) * maxTilt;

        containerRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
        containerRef.current.style.transition = `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`;
    });

    const handleMouseLeave = () => {
        if (!containerRef.current || prefersReducedMotion || mobile.current) return;
        containerRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
        containerRef.current.style.transition = `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`;
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
