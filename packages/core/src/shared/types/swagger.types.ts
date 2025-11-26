export const SdkTag = {
  Analysis: 'analysis',
  Media: 'media',
  Search: 'search',
  Storage: 'storage',
  System: 'system',
} as const;

export type SdkTag = (typeof SdkTag)[keyof typeof SdkTag];
