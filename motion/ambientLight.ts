import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';
import { useReducedMotion } from './reducedMotion';

interface AmbientLightOptions {
    color?: string;
    intensity?: number;
}

export function useAmbientLight(
    containerRef: React.RefObject<HTMLElement>,
    options: AmbientLightOptions = {}
) {
    const { color = 'rgba(250, 204, 21, 0.25)', intensity = 1 } = options;
    const glowRef = useRef<HTMLDivElement | null>(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Create glow element behind the player
        const glow = document.createElement('div');
        glow.className = 'ambient-glow';
        glow.style.cssText = `
      position: absolute;
      inset: -30%;
      background: radial-gradient(ellipse at center, ${color}, transparent 70%);
      filter: blur(80px);
      pointer-events: none;
      z-index: -1;
      opacity: 0.4;
      will-change: transform, opacity;
      transform: scale(0.9);
    `;

        container.style.position = 'relative';
        container.insertBefore(glow, container.firstChild);
        glowRef.current = glow;

        if (prefersReducedMotion) {
            glow.style.opacity = '0.3';
            return () => { glow.remove(); };
        }

        // Idle breathing animation
        animate(glow, {
            scale: [0.9, 1.05, 0.9],
            opacity: [0.3, 0.5, 0.3],
            duration: 4000,
            loop: true,
            ease: 'inOutSine'
        });

        return () => { glow.remove(); };
    }, [containerRef, color, intensity, prefersReducedMotion]);

    /** Call to pulse the glow (e.g. on play/pause/seek) */
    const pulseGlow = (targetOpacity: number = 0.8, targetScale: number = 1.15) => {
        if (!glowRef.current || prefersReducedMotion) return;
        animate(glowRef.current, {
            opacity: [targetOpacity, 0.4],
            scale: [targetScale, 1],
            duration: 1200,
            ease: 'outExpo'
        });
    };

    return { glowRef, pulseGlow };
}
