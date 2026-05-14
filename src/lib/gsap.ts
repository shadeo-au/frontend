import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';

gsap.registerPlugin(ScrollTrigger, Observer);
gsap.defaults({
  ease: 'power3.out',
  overwrite: 'auto',
});

export const prefersReducedMotion = () => (
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
);

export { gsap, ScrollTrigger, Observer };
