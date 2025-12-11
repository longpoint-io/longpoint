import {
  ConfigSchemaDefinition,
  ConfigValues,
  ValidationResult,
} from './types.js';

export interface ConfigSchemaOptions {
  /**
   * Encryption function for secret values.
   * @param value
   * @returns
   */
  encrypt?: (value: string) => string | Promise<string>;
  /**
   * Decryption function for secret values.
   * @param value
   * @returns
   */
  decrypt?: (value: string) => string | Promise<string>;
  /**
   * Error class to throw when validation fails.
   */
  validationErrorClass?: new (errors: string[]) => Error;
}

export class ConfigSchema {
  private readonly decrypt: (value: string) => string | Promise<string>;
  private readonly encrypt: (value: string) => string | Promise<string>;
  private readonly validationErrorClass?: new (errors: string[]) => Error;

  constructor(
    private readonly schema: ConfigSchemaDefinition,
    options?: ConfigSchemaOptions
  ) {
    this.decrypt = options?.decrypt ?? ((value: string) => value);
    this.encrypt = options?.encrypt ?? ((value: string) => value);
    this.validationErrorClass = options?.validationErrorClass;
  }

  /**
   * Validates configuration values against the schema.
   * @param values - The configuration values to validate.
   * @returns ValidationResult with valid boolean and detailed error messages.
   */
  validate(values: ConfigValues): ValidationResult {
    return this.validateInternal(this.schema, values);
  }

  /**
   * Processes inbound configuration values.
   * @param values - The configuration values to process.
   * @returns The processed configuration values.
   * @example
   * const configSchema = new ConfigSchema({
   *   name: {
   *     type: 'secret',
   *     required: true,
   *   },
   *   description: {
   *     type: 'string',
   *     required: false,
   *   },
   * });
   * const values = { name: 'test', description: 'test' };
   * const processedValues = await configSchema.processInboundValues(values);
   * // processedValues = { name: 'some-encrypted-value', description: 'test' }
   */
  async processInboundValues(values: ConfigValues): Promise<ConfigValues> {
    const validationResult = this.validate(values);
    if (!validationResult.valid) {
      if (this.validationErrorClass) {
        throw new this.validationErrorClass(validationResult.errors);
      }
      throw new Error(validationResult.errors.join(', '));
    }
    const encryptedValues = await this.encryptConfigValues(values, this.schema);
    return encryptedValues;
  }

  /**
   * Processes outbound configuration values.
   * @param values - The configuration values to process.
   * @returns The processed configuration values.
   * @example
   * const configSchema = new ConfigSchema({
   *   name: {
   *     type: 'secret',
   *     required: true,
   *   },
   *   description: {
   *     type: 'string',
   *     required: false,
   *   },
   * });
   * const values = { name: 'some-encrypted-value', description: 'test' };
   * const processedValues = await configSchema.processOutboundValues(values);
   * // processedValues = { name: 'test', description: 'test' }
   */
  async processOutboundValues(values: ConfigValues): Promise<ConfigValues> {
    const decryptedValues = await this.decryptConfigValues(values, this.schema);
    const validationResult = this.validate(decryptedValues);
    if (!validationResult.valid) {
      if (this.validationErrorClass) {
        throw new this.validationErrorClass(validationResult.errors);
      }
      throw new Error(validationResult.errors.join(', '));
    }
    return decryptedValues;
  }

  /**
   * Validates that immutable fields have not been changed.
   * @param oldValues - The existing configuration values (should be decrypted).
   * @param newValues - The new configuration values to validate against.
   * @returns ValidationResult with valid boolean and detailed error messages.
   * @example
   * const configSchema = new ConfigSchema({
   *   id: {
   *     type: 'string',
   *     required: true,
   *     immutable: true,
   *   },
   *   name: {
   *     type: 'string',
   *     required: false,
   *   },
   * });
   * const oldValues = { id: '123', name: 'old' };
   * const newValues = { id: '456', name: 'new' };
   * const result = configSchema.validateImmutableFields(oldValues, newValues);
   * // result.valid = false, result.errors = ['id is immutable and cannot be changed']
   */
  validateImmutableFields(
    oldValues: ConfigValues,
    newValues: ConfigValues
  ): ValidationResult {
    return this.validateImmutableFieldsInternal(
      this.schema,
      oldValues,
      newValues
    );
  }

  private validateInternal(
    schema: ConfigSchemaDefinition,
    values: ConfigValues,
    path = ''
  ) {
    const errors: string[] = [];

    // Check for unknown fields
    const schemaKeys = Object.keys(schema);
    const valueKeys = Object.keys(values);
    const unknownFields = valueKeys.filter((key) => !schemaKeys.includes(key));

    for (const unknownField of unknownFields) {
      const fieldPath = path ? `${path}.${unknownField}` : unknownField;
      errors.push(`${fieldPath} is not defined in the schema`);
    }

    // Validate each field in the schema
    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      const fieldPath = path ? `${path}.${fieldName}` : fieldName;
      const fieldValue = values[fieldName];

      // Check required fields
      if (
        fieldSchema.required &&
        (fieldValue === undefined || fieldValue === null || fieldValue === '')
      ) {
        errors.push(`${fieldPath} is required`);
        continue; // Skip further validation for missing required fields
      }

      // Skip validation if field is not provided and not required
      if (fieldValue === undefined || fieldValue === null) {
        continue;
      }

      // Validate field type
      const typeError = this.validateFieldType(
        fieldPath,
        fieldValue,
        fieldSchema.type,
        fieldSchema.enum
      );
      if (typeError) {
        errors.push(typeError);
        continue; // Skip nested validation if type is wrong
      }

      // Validate length constraints
      const lengthError = this.validateFieldLength(
        fieldPath,
        fieldValue,
        fieldSchema.type,
        fieldSchema.minLength,
        fieldSchema.maxLength
      );
      if (lengthError) {
        errors.push(lengthError);
      }

      // Validate nested objects
      if (fieldSchema.type === 'object' && fieldSchema.properties) {
        const nestedResult = this.validateInternal(
          fieldSchema.properties,
          fieldValue as Record<string, unknown>,
          fieldPath
        );
        errors.push(...nestedResult.errors);
      }

      // Validate array items
      if (fieldSchema.type === 'array' && fieldSchema.items) {
        const arrayValue = fieldValue as unknown[];
        if (Array.isArray(arrayValue)) {
          for (let i = 0; i < arrayValue.length; i++) {
            const itemPath = `${fieldPath}[${i}]`;

            if (
              fieldSchema.items.type === 'object' &&
              fieldSchema.items.properties
            ) {
              const itemResult = this.validateInternal(
                fieldSchema.items.properties,
                arrayValue[i] as Record<string, unknown>,
                itemPath
              );
              errors.push(...itemResult.errors);
            } else {
              const itemTypeError = this.validateFieldType(
                itemPath,
                arrayValue[i],
                fieldSchema.items.type,
                fieldSchema.items.enum
              );
              if (itemTypeError) {
                errors.push(itemTypeError);
              }
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Internal method to validate immutable fields recursively
   */
  private validateImmutableFieldsInternal(
    schema: ConfigSchemaDefinition,
    oldValues: ConfigValues,
    newValues: ConfigValues,
    path = ''
  ): ValidationResult {
    const errors: string[] = [];

    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      const fieldPath = path ? `${path}.${fieldName}` : fieldName;
      const oldValue = oldValues[fieldName];
      const newValue = newValues[fieldName];

      // Check if field is immutable
      if (fieldSchema.immutable) {
        // If old value exists, it cannot be changed or removed
        if (oldValue !== undefined && oldValue !== null) {
          if (newValue === undefined || newValue === null) {
            errors.push(`${fieldPath} is immutable and cannot be removed`);
          } else if (!this.valuesEqual(oldValue, newValue)) {
            errors.push(`${fieldPath} is immutable and cannot be changed`);
          }
        }
      }

      // Validate nested objects
      if (
        fieldSchema.type === 'object' &&
        fieldSchema.properties &&
        typeof oldValue === 'object' &&
        oldValue !== null &&
        !Array.isArray(oldValue) &&
        typeof newValue === 'object' &&
        newValue !== null &&
        !Array.isArray(newValue)
      ) {
        const nestedResult = this.validateImmutableFieldsInternal(
          fieldSchema.properties,
          oldValue as ConfigValues,
          newValue as ConfigValues,
          fieldPath
        );
        errors.push(...nestedResult.errors);
      }

      // Validate array items
      if (
        fieldSchema.type === 'array' &&
        fieldSchema.items &&
        Array.isArray(oldValue) &&
        Array.isArray(newValue)
      ) {
        // Check if the array itself is immutable
        if (fieldSchema.immutable) {
          if (!this.valuesEqual(oldValue, newValue)) {
            errors.push(`${fieldPath} is immutable and cannot be changed`);
          }
        }

        // Check if array items are immutable
        if (fieldSchema.items.immutable) {
          const maxLength = Math.max(oldValue.length, newValue.length);
          for (let i = 0; i < maxLength; i++) {
            const itemPath = `${fieldPath}[${i}]`;
            const oldItem = oldValue[i];
            const newItem = newValue[i];

            if (oldItem !== undefined && oldItem !== null) {
              if (!this.valuesEqual(oldItem, newItem)) {
                errors.push(`${itemPath} is immutable and cannot be changed`);
              }
            }
          }
        }

        // Validate nested objects in array items
        if (
          fieldSchema.items.type === 'object' &&
          fieldSchema.items.properties
        ) {
          const maxLength = Math.max(oldValue.length, newValue.length);
          for (let i = 0; i < maxLength; i++) {
            const itemPath = `${fieldPath}[${i}]`;
            const oldItem = oldValue[i];
            const newItem = newValue[i];

            if (
              typeof oldItem === 'object' &&
              oldItem !== null &&
              !Array.isArray(oldItem) &&
              typeof newItem === 'object' &&
              newItem !== null &&
              !Array.isArray(newItem)
            ) {
              const itemResult = this.validateImmutableFieldsInternal(
                fieldSchema.items.properties,
                oldItem as ConfigValues,
                newItem as ConfigValues,
                itemPath
              );
              errors.push(...itemResult.errors);
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Deep equality check for values
   */
  private valuesEqual(oldValue: unknown, newValue: unknown): boolean {
    // Handle null/undefined
    if (oldValue === newValue) {
      return true;
    }

    if (oldValue === null || oldValue === undefined) {
      return newValue === null || newValue === undefined;
    }

    if (newValue === null || newValue === undefined) {
      return false;
    }

    // Handle arrays
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      if (oldValue.length !== newValue.length) {
        return false;
      }
      return oldValue.every((item, index) =>
        this.valuesEqual(item, newValue[index])
      );
    }

    // Handle objects
    if (
      typeof oldValue === 'object' &&
      typeof newValue === 'object' &&
      !Array.isArray(oldValue) &&
      !Array.isArray(newValue)
    ) {
      const oldKeys = Object.keys(oldValue);
      const newKeys = Object.keys(newValue);

      if (oldKeys.length !== newKeys.length) {
        return false;
      }

      return oldKeys.every((key) =>
        this.valuesEqual(
          (oldValue as Record<string, unknown>)[key],
          (newValue as Record<string, unknown>)[key]
        )
      );
    }

    // Primitive comparison
    return oldValue === newValue;
  }

  /**
   * Validates a single field's type
   * @param path - The field path for error messages
   * @param value - The value to validate
   * @param expectedType - The expected type from the schema
   * @param enumValues - Optional array of allowed enum values
   * @returns Error message if invalid, null if valid
   */
  private validateFieldType(
    path: string,
    value: unknown,
    expectedType: string,
    enumValues?: string[]
  ): string | null {
    switch (expectedType) {
      case 'string':
      case 'secret':
        if (typeof value !== 'string') {
          return `${path} must be a string`;
        }
        // Validate enum if provided
        if (enumValues && enumValues.length > 0) {
          if (!enumValues.includes(value)) {
            return `${path} must be one of: ${enumValues.join(', ')}`;
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${path} must be a number`;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${path} must be a boolean`;
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return `${path} must be an array`;
        }
        break;

      case 'object':
        if (
          typeof value !== 'object' ||
          value === null ||
          Array.isArray(value)
        ) {
          return `${path} must be an object`;
        }
        break;

      default:
        break;
    }

    return null;
  }

  /**
   * Validates field length constraints
   * @param path - The field path for error messages
   * @param value - The value to validate
   * @param fieldType - The field type
   * @param minLength - Minimum length constraint
   * @param maxLength - Maximum length constraint
   * @returns Error message if invalid, null if valid
   */
  private validateFieldLength(
    path: string,
    value: unknown,
    fieldType: string,
    minLength?: number,
    maxLength?: number
  ): string | null {
    if (minLength === undefined && maxLength === undefined) {
      return null;
    }

    let length: number;

    switch (fieldType) {
      case 'string':
      case 'secret':
        if (typeof value !== 'string') {
          return null; // Type validation will catch this
        }
        length = value.length;
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return null; // Type validation will catch this
        }
        length = value.length;
        break;

      case 'object':
        if (
          typeof value !== 'object' ||
          value === null ||
          Array.isArray(value)
        ) {
          return null; // Type validation will catch this
        }
        length = Object.keys(value).length;
        break;

      default:
        // Length validation not applicable for other types
        return null;
    }

    if (minLength !== undefined && length < minLength) {
      return `${path} must have at least ${minLength} ${this.getLengthUnit(
        fieldType,
        minLength
      )}`;
    }

    if (maxLength !== undefined && length > maxLength) {
      return `${path} must have at most ${maxLength} ${this.getLengthUnit(
        fieldType,
        maxLength
      )}`;
    }

    return null;
  }

  /**
   * Encrypts secret values in a configuration object based on a schema
   */
  private async encryptConfigValues(
    configValues: ConfigValues,
    schema: ConfigSchemaDefinition
  ): Promise<ConfigValues> {
    const encrypted = { ...configValues };

    for (const [key, value] of Object.entries(configValues)) {
      const fieldSchema = schema[key];

      if (fieldSchema?.type === 'secret' && typeof value === 'string') {
        encrypted[key] = await this.encrypt(value);
      } else if (
        // handle nested objects
        fieldSchema?.type === 'object' &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        encrypted[key] = await this.encryptConfigValues(
          value,
          fieldSchema.properties || {}
        );
      } else if (
        // handle arrays with secrets
        fieldSchema?.type === 'array' &&
        Array.isArray(value) &&
        fieldSchema.items
      ) {
        encrypted[key] = await Promise.all(
          value.map(async (item) => {
            if (
              fieldSchema.items!.type === 'secret' &&
              typeof item === 'string'
            ) {
              return this.encrypt(item);
            } else if (
              fieldSchema.items!.type === 'object' &&
              typeof item === 'object' &&
              item !== null
            ) {
              return this.encryptConfigValues(
                item,
                fieldSchema.items!.properties || {}
              );
            }
            return item;
          })
        );
      }
    }

    return encrypted;
  }

  /**
   * Decrypts secret values in a configuration object based on a schema
   */
  private async decryptConfigValues(
    configValues: ConfigValues,
    schema: ConfigSchemaDefinition
  ): Promise<ConfigValues> {
    const decrypted = { ...configValues };

    for (const [key, value] of Object.entries(configValues)) {
      const fieldSchema = schema[key];

      if (fieldSchema?.type === 'secret' && typeof value === 'string') {
        decrypted[key] = await this.decrypt(value);
      } else if (
        // handle nested objects
        fieldSchema?.type === 'object' &&
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        decrypted[key] = await this.decryptConfigValues(
          value,
          fieldSchema.properties || {}
        );
      } else if (
        // handle arrays with secrets
        fieldSchema?.type === 'array' &&
        Array.isArray(value) &&
        fieldSchema.items
      ) {
        decrypted[key] = await Promise.all(
          value.map(async (item) => {
            if (
              fieldSchema.items!.type === 'secret' &&
              typeof item === 'string'
            ) {
              return await this.decrypt(item);
            } else if (
              fieldSchema.items!.type === 'object' &&
              typeof item === 'object' &&
              item !== null
            ) {
              return await this.decryptConfigValues(
                item,
                fieldSchema.items!.properties || {}
              );
            }
            return item;
          })
        );
      }
    }

    return decrypted;
  }

  /**
   * Gets the appropriate unit for length validation error messages
   * @param fieldType - The field type
   * @returns The unit string (characters, items, properties)
   */
  private getLengthUnit(fieldType: string, count: number): string {
    const moreThanOne = count > 1;
    switch (fieldType) {
      case 'string':
      case 'secret':
        return 'character' + (moreThanOne ? 's' : '');
      case 'array':
        return 'item' + (moreThanOne ? 's' : '');
      case 'object':
        return 'propert' + (moreThanOne ? 'ies' : 'y');
      default:
        return 'element' + (moreThanOne ? 's' : '');
    }
  }
}
