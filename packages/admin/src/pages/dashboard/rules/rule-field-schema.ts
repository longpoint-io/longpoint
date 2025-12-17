import { components } from '@longpoint/sdk';
import {
  ComparisonOperator,
  NumericOperators,
  StringOperators,
  SupportedMimeType,
} from '@longpoint/types';

export type FieldType = 'enum' | 'number' | 'string' | 'metadata';

export interface FieldDefinition {
  path: string;
  label: string;
  type: FieldType;
  enumValues?: string[] | Array<{ label?: string; value: string }>;
  operators: ComparisonOperator[];
  description?: string;
}

export interface RootObjectFields {
  fields: FieldDefinition[];
}

export interface TriggerEventSchema {
  rootObjects: {
    [root: string]: RootObjectFields;
  };
}

const ASSET_VARIANT_READY_SCHEMA: TriggerEventSchema = {
  rootObjects: {
    asset: {
      fields: [
        {
          path: 'asset.id',
          label: 'ID',
          type: 'string',
          operators: StringOperators,
        },
      ],
    },
    variant: {
      fields: [
        {
          path: 'variant.type',
          label: 'Type',
          type: 'enum',
          enumValues: [
            { label: 'Original', value: 'ORIGINAL' },
            { label: 'Thumbnail', value: 'THUMBNAIL' },
            { label: 'Derivative', value: 'DERIVATIVE' },
          ] satisfies Array<{
            label: string;
            value: components['schemas']['AssetVariant']['type'];
          }>,
          operators: StringOperators,
        },
        {
          path: 'variant.mimeType',
          label: 'MIME Type',
          type: 'enum',
          enumValues: Object.values(SupportedMimeType),
          operators: StringOperators,
        },
        {
          path: 'variant.size',
          label: 'Size',
          type: 'number',
          operators: NumericOperators,
          description: 'The size of the variant in bytes',
        },
        {
          path: 'variant.metadata',
          label: 'Metadata',
          type: 'metadata',
          operators: Object.values(ComparisonOperator),
          description:
            'Freeform metadata field. Use dot notation for nested paths (e.g., "category", "my-classifier.tags")',
        },
      ],
    },
  },
};

const SCHEMAS: Record<string, TriggerEventSchema> = {
  'asset.variant.ready': ASSET_VARIANT_READY_SCHEMA,
};

export function getTriggerEventSchema(
  triggerEvent: string
): TriggerEventSchema | null {
  return SCHEMAS[triggerEvent] || null;
}

export function getFieldDefinition(
  triggerEvent: string,
  fieldPath: string
): FieldDefinition | null {
  const schema = getTriggerEventSchema(triggerEvent);
  if (!schema) return null;

  // Check if it's a metadata field with nested path
  if (fieldPath.startsWith('variant.metadata.')) {
    const metadataField = schema.rootObjects.variant?.fields.find(
      (f) => f.path === 'variant.metadata'
    );
    if (metadataField) {
      return {
        ...metadataField,
        path: fieldPath,
      };
    }
  }

  // Check all root objects for exact match
  for (const rootObject of Object.values(schema.rootObjects)) {
    const field = rootObject.fields.find((f) => f.path === fieldPath);
    if (field) return field;
  }

  return null;
}

export function getAllFields(triggerEvent: string): FieldDefinition[] {
  const schema = getTriggerEventSchema(triggerEvent);
  if (!schema) return [];

  return Object.values(schema.rootObjects).flatMap(
    (rootObject) => rootObject.fields
  );
}

export function getRootObjects(triggerEvent: string): string[] {
  const schema = getTriggerEventSchema(triggerEvent);
  if (!schema) return [];

  return Object.keys(schema.rootObjects);
}

export function getFieldsForRoot(
  triggerEvent: string,
  root: string
): FieldDefinition[] {
  const schema = getTriggerEventSchema(triggerEvent);
  if (!schema) return [];

  return schema.rootObjects[root]?.fields || [];
}
