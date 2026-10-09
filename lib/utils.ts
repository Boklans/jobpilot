import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Smoothly scrolls the window to an element centered vertically in the viewport.
 */
export function scrollIntoCenter(element: HTMLElement | null) {
  if (!element) return;
  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
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

/**
 * Normalizes a vacancy URL for robust deduplication:
 * strips tracking query params (?ref=, ?utm_*), removes trailing slashes,
 * and handles case insensitivity.
 */
export function normalizeJobUrl(url?: string): string {
  if (!url) return "";
  try {
    const u = new URL(url.trim());
    const searchParams = new URLSearchParams(u.search);
    const trackingParams = ["ref", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "from", "source"];
    trackingParams.forEach((p) => searchParams.delete(p));
    const pathname = u.pathname.replace(/\/+$/, "");
    const cleanSearch = searchParams.toString();
    return `${u.origin.toLowerCase()}${pathname.toLowerCase()}${cleanSearch ? "?" + cleanSearch : ""}`;
  } catch {
    return url.trim().toLowerCase().replace(/\/+$/, "").replace(/[?&]ref=.*$/, "");
  }
}

/**
 * Computes a unique deduplication identity key for a job listing:
 * based on normalized URL, or fallback combination of company + title.
 */
export function getJobIdentityKey(job: { sourceUrl?: string; company?: string; title?: string }): string {
  const normUrl = normalizeJobUrl(job.sourceUrl);
  if (normUrl) {
    return `url:${normUrl}`;
  }
  const comp = (job.company || "").trim().toLowerCase().replace(/\s+/g, " ");
  const tit = (job.title || "").trim().toLowerCase().replace(/\s+/g, " ");
  return `meta:${comp}__${tit}`;
}

/**
 * Checks whether two job objects represent the same vacancy.
 */
export function areSameJob(
  jobA: { sourceUrl?: string; company?: string; title?: string },
  jobB: { sourceUrl?: string; company?: string; title?: string }
): boolean {
  return getJobIdentityKey(jobA) === getJobIdentityKey(jobB);
}
