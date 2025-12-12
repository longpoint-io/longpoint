export const TemplateSource = {
  PLUGIN: 'plugin',
  CUSTOM: 'custom',
} as const;

export type TemplateSource =
  (typeof TemplateSource)[keyof typeof TemplateSource];
