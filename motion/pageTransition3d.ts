import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { animate } from 'animejs';
import { useReducedMotion } from './reducedMotion';

export function usePageTransition3D(contentRef: React.RefObject<HTMLElement>) {
    const location = useLocation();
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const element = contentRef.current;
        if (!element) return;

        if (prefersReducedMotion) {
            animate(element, {
                opacity: [0, 1],
                duration: 300,
                ease: 'outQuad'
            });
        } else {
            animate(element, {
                opacity: [0, 1],
                translateZ: [-40, 0],
                rotateY: [3, 0],
                duration: 450,
                ease: 'outExpo'
            });
        }
    }, [location.pathname, contentRef, prefersReducedMotion]);
}
