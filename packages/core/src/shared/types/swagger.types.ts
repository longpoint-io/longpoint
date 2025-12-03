export const SdkTag = {
  Analysis: 'analysis',
  Assets: 'assets',
  Collections: 'collections',
  Plugins: 'plugins',
  Search: 'search',
  Storage: 'storage',
  System: 'system',
} as const;

export type SdkTag = (typeof SdkTag)[keyof typeof SdkTag];
