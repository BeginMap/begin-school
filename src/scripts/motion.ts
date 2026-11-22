// One motion character for the whole site: the same eases and durations as the CSS tokens.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

export const EASE = {
  focus: 'expo.out',     // --ease-focus
  move: 'power3.inOut',  // --ease-move
  snap: 'back.out(1.6)', // --ease-snap
};
export const DUR = { s: 0.16, m: 0.42, l: 0.9, xl: 1.4 };

export { gsap, ScrollTrigger };

export const isRTL = () => document.documentElement.dir === 'rtl';
export const pageLang = () => document.documentElement.lang;
