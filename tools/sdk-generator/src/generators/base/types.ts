export interface GeneratedFiles {
  [filename: string]: string;
}

export interface GeneratorConfig {
  baseUrl?: string;
  packageName?: string;
  version?: string;
  description?: string;
  outputDir?: string;
  operationIdDelimiter?: string;
}
