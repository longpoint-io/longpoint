export interface ConfigSchemaValue {
  label: string;
  type: string;
  required?: boolean;
  description?: string;
  immutable?: boolean;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  items?: {
    type: string;
    properties?: ConfigSchemaDefinition;
    minLength?: number;
    maxLength?: number;
    immutable?: boolean;
  };
  properties?: ConfigSchemaDefinition;
}

export interface ConfigSchemaDefinition {
  [key: string]: ConfigSchemaValue;
}

export type ConfigValues<
  T extends ConfigSchemaDefinition | undefined = Record<string, any>
> = T extends ConfigSchemaDefinition
  ? {
      [K in keyof T]: T[K]['type'] extends 'string' | 'secret'
        ? string
        : T[K]['type'] extends 'number'
        ? number
        : T[K]['type'] extends 'boolean'
        ? boolean
        : T[K]['type'] extends 'array'
        ? any[]
        : T[K]['type'] extends 'object'
        ? Record<string, any>
        : any;
    }
  : Record<string, any>;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
