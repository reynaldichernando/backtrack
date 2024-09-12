import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names into a single string and merges Tailwind CSS classes.
 *
 * @param {...ClassValue[]} inputs - The class names to combine.
 * @returns {string} - The merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts the video ID from a given YouTube URL.
 *
 * @param {string} url - The URL of the YouTube video.
 * @returns {string | null} - The extracted video ID or null if the video ID cannot be found.
 */
export function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

/**
 * Generates a thumbnail URL for a given video ID.
 *
 * @param {string} videoId - The ID of the video.
 * @returns {string} - The generated thumbnail URL.
 */
export function generateThumbnailUrl(videoId: string | null): string {
  if (!videoId) {
    return '';
  }
  return `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`;
}

/**
 * Checks if a given URL is a YouTube URL.
 *
 * @param {string} url - The URL to check.
 * @returns {boolean} - Whether the URL is a YouTube URL or not.
 */
export function isYoutubeUrl(url: string): boolean {
  const regex = /^https?:\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;
  return regex.test(url);
}
