export const SdkTag = {
  Assets: 'assets',
  Classifiers: 'classifiers',
  Collections: 'collections',
  Plugins: 'plugins',
  Rules: 'rules',
  Search: 'search',
  Storage: 'storage',
  System: 'system',
  Transform: 'transform',
  Users: 'users',
} as const;

export type SdkTag = (typeof SdkTag)[keyof typeof SdkTag];

export const SerializableVersion = {
  Default: 'default',
  Details: 'details',
  Reference: 'reference',
} as const;

export type SerializableVersion =
  (typeof SerializableVersion)[keyof typeof SerializableVersion];

export interface Serializable {
  toDto(version?: SerializableVersion): Promise<any> | any;
}
