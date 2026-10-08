import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Smoothly scrolls the window to an element with offset for sticky headers.
 */
export function smoothScrollTo(element: HTMLElement | null, offset: number = 85) {
  if (!element) return;
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  window.scrollTo({
    top: Math.max(0, offsetPosition),
    behavior: "smooth",
  });
}
