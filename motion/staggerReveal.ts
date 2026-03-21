import React, { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import { useReducedMotion } from './reducedMotion';

export function useStaggerDepthReveal(
    containerRef: React.RefObject<HTMLElement>,
    itemSelector: string = '.stagger-item',
    options: { threshold?: number; delay?: number } = {}
) {
    const { threshold = 0.1, delay = 80 } = options;
    const prefersReducedMotion = useReducedMotion();
    const hasAnimated = useRef(false);

    useEffect(() => {
        const element = containerRef.current;
        if (!element || hasAnimated.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated.current) {
                        hasAnimated.current = true;
                        const items = element.querySelectorAll(itemSelector);

                        if (prefersReducedMotion) {
                            animate(items, {
                                opacity: [0, 1],
                                duration: 400,
                                delay: stagger(50),
                                ease: 'outQuad'
                            });
                        } else {
                            animate(items, {
                                opacity: [0, 1],
                                translateZ: [-50, 0],
                                rotateX: [6, 0],
                                scale: [0.95, 1],
                                duration: 600,
                                delay: stagger(delay),
                                ease: 'outBack(1.7)'
                            });
                        }

                        observer.disconnect();
                    }
                });
            },
            { threshold }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [containerRef, itemSelector, threshold, delay, prefersReducedMotion]);
}

/** Imperative version: call this to animate items directly (for search results) */
export function triggerStaggerReveal(
    container: HTMLElement,
    itemSelector: string = '.stagger-item',
    reducedMotion: boolean = false
) {
    const items = container.querySelectorAll(itemSelector);
    if (!items.length) return;

    if (reducedMotion) {
        return animate(items, {
            opacity: [0, 1],
            duration: 300,
            delay: stagger(40),
            ease: 'outQuad'
        });
    }

    return animate(items, {
        opacity: [0, 1],
        translateZ: [-50, 0],
        rotateX: [6, 0],
        scale: [0.95, 1],
        duration: 500,
        delay: stagger(60),
        ease: 'outBack(1.7)'
    });
}
