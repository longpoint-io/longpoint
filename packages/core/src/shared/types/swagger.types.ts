export const SdkTag = {
  AI: 'ai',
  Analysis: 'analysis',
  Media: 'media',
  Search: 'search',
  Storage: 'storage',
  System: 'system',
} as const;

export type SdkTag = (typeof SdkTag)[keyof typeof SdkTag];
