// Base URL of the MTGOEnchantWordleService backend (the bridge to MTGODatabase).
// Overridable at build time through the `__API_BASE_URL__` define in vite.config.js
// (set VITE_API_BASE_URL in the environment when running vite).
export const API_BASE_URL =
  typeof __API_BASE_URL__ !== 'undefined' ? __API_BASE_URL__ : 'http://localhost:8081';
