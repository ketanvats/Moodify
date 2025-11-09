// src/types/chromecast.d.ts

// This file provides TypeScript definitions for the Google Cast SDK.
// It prevents TypeScript errors when accessing `window.cast` and `window.chrome.cast`.

declare global {
  interface Window {
    __onGCastApiAvailable?: (isAvailable: boolean) => void;
    cast?: typeof chrome.cast;
  }
}

export {};