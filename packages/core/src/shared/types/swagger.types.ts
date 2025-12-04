export const SdkTag = {
  Analysis: 'analysis',
  Assets: 'assets',
  Collections: 'collections',
  Plugins: 'plugins',
  Search: 'search',
  Storage: 'storage',
  System: 'system',
  Users: 'users',
} as const;

export type SdkTag = (typeof SdkTag)[keyof typeof SdkTag];

export type SerializableVersion = 'default' | 'details' | 'reference';
export interface Serializable {
  toDto(version?: SerializableVersion): Promise<any> | any;
}
