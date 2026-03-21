<div align="center">

# 🎌 ANISTREAM

**An Arabic-first anime streaming web app — browse, discover, and watch anime with Arabic subtitles.**

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)
![Anime.js](https://img.shields.io/badge/Anime.js-v4-FF6B6B?style=flat-square)

</div>

---

## ✨ Features

- 🎥 **Watch anime** via embedded players (6 server options)
- 🌍 **Arabic subtitles** built-in on supported servers
- 📺 **AniList-powered** catalog — trending, seasonal, and search
- 📋 **Episode data** from Jikan (MAL) with filler + recap labels
- 💾 **Watchlist & History** stored locally (no sign-up needed)
- 🎨 **Premium dark UI** with 3D animations, parallax, and ambient effects
- 📱 **Fully responsive** — mobile & desktop

## 🚀 Getting Started

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 3D Effects System

All "fake 3D" micro-interactions live in `/motion/` and use **anime.js v4** + CSS `perspective` / `preserve-3d`. No WebGL.

### Hooks

| Hook | File | Purpose |
|---|---|---|
| `useRafThrottle(cb)` | `motion/raf.ts` | Throttles any callback to 1-call-per-frame via `requestAnimationFrame`. Prevents layout thrash on `mousemove`. |
| `useReducedMotion()` | `motion/reducedMotion.ts` | Returns `true` when user prefers reduced motion. All hooks respect this. |
| `useTilt3D(ref, opts)` | `motion/tilt3d.ts` | Attach to any container — on desktop mousemove, the element tilts with `rotateX/Y`. |
| `useParallax3D(ref, layers)` | `motion/parallax3d.ts` | Multi-layer parallax: pass CSS selectors + depth values, mouse drives different `translateX/Y` per layer. |
| `useStaggerDepthReveal(ref, selector)` | `motion/staggerReveal.ts` | Intersection Observer triggers stagger animation: items fly from `translateZ(-50)` → 0 as they enter viewport. |
| `usePageTransition3D(ref)` | `motion/pageTransition3d.ts` | Wrap page content in a ref — on route change, incoming page animates from depth. |
| `useAmbientLight(ref, opts)` | `motion/ambientLight.ts` | Creates a blurred radial glow behind the referenced container. Returns `pulseGlow()` to trigger reactive pulses. |
| `triggerStaggerReveal(el, sel, reduced)` | `motion/staggerReveal.ts` | Imperative version — call directly (e.g. when search results update). |

### Adding a 3D effect to any new component

```tsx
import { useRef } from 'react';
import { useTilt3D } from '../motion/tilt3d';

function MyCard() {
  const ref = useRef<HTMLDivElement>(null);
  useTilt3D(ref, { maxTilt: 8, scale: 1.03 });

  return (
    <div ref={ref} className="perspective-1000 will-change-transform">
      {/* your content */}
    </div>
  );
}
```

### CSS Utilities (in `index.html`)

- `.perspective-1000` / `.perspective-2000` — sets perspective on container
- `.preserve-3d` — enables `transform-style: preserve-3d`
- `.will-change-transform` — hints GPU layer promotion
- `.shine-overlay` — pointer-events:none, mix-blend-mode:screen overlay for hologram effect
- `.stagger-item` — starts at `opacity: 0`, animated in by stagger hooks

### Performance

- All `mousemove` handlers use RAF throttle (max 60 calls/sec)
- Only `transform` and `opacity` are animated — no layout properties
- `will-change: transform` on interactive elements
- `translate3d` used everywhere to ensure GPU compositing

### Accessibility

- `prefers-reduced-motion: reduce` → all cursor tracking disabled, subtle fade/scale only
- Mobile → cursor tracking disabled, replaced with slow auto-float oscillation via anime.js loops
