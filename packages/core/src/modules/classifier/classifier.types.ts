export const ClassifierSource = {
  PLUGIN: 'plugin',
  CUSTOM: 'custom',
} as const;

export type ClassifierSource =
  (typeof ClassifierSource)[keyof typeof ClassifierSource];
