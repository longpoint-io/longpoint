export type ComparisonOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'in'
  | 'notIn'
  | 'greaterThan'
  | 'lessThan';

export type FieldType = 'enum' | 'number' | 'string' | 'metadata';

export interface FieldDefinition {
  path: string;
  label: string;
  type: FieldType;
  enumValues?: string[];
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
    variant: {
      fields: [
        {
          path: 'variant.type',
          label: 'Type',
          type: 'enum',
          enumValues: ['ORIGINAL', 'THUMBNAIL', 'DERIVATIVE'],
          operators: ['equals', 'notEquals', 'contains'],
          description: 'The type of the variant',
        },
        // {
        //   path: 'variant.status',
        //   label: 'Status',
        //   type: 'enum',
        //   enumValues: ['WAITING_FOR_UPLOAD', 'PROCESSING', 'READY', 'FAILED'],
        //   operators: ['equals', 'notEquals', 'contains'],
        //   description: 'The status of the variant',
        // },
        {
          path: 'variant.mimeType',
          label: 'MIME Type',
          type: 'enum',
          enumValues: [
            'image/jpg',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/webm',
            'video/quicktime',
          ],
          operators: ['equals', 'notEquals', 'contains'],
          description: 'The MIME type of the variant',
        },
        // {
        //   path: 'variant.width',
        //   label: 'Width',
        //   type: 'number',
        //   operators: [
        //     'equals',
        //     'notEquals',
        //     'greaterThan',
        //     'lessThan',
        //     'in',
        //     'notIn',
        //   ],
        //   description: 'The width of the variant in pixels',
        // },
        // {
        //   path: 'variant.height',
        //   label: 'Height',
        //   type: 'number',
        //   operators: [
        //     'equals',
        //     'notEquals',
        //     'greaterThan',
        //     'lessThan',
        //     'in',
        //     'notIn',
        //   ],
        //   description: 'The height of the variant in pixels',
        // },
        {
          path: 'variant.size',
          label: 'Size',
          type: 'number',
          operators: [
            'equals',
            'notEquals',
            'greaterThan',
            'lessThan',
            'in',
            'notIn',
          ],
          description: 'The size of the variant in bytes',
        },
        // {
        //   path: 'variant.duration',
        //   label: 'Duration',
        //   type: 'number',
        //   operators: [
        //     'equals',
        //     'notEquals',
        //     'greaterThan',
        //     'lessThan',
        //     'in',
        //     'notIn',
        //   ],
        //   description: 'The duration of the variant in seconds',
        // },
        {
          path: 'variant.metadata',
          label: 'Metadata',
          type: 'metadata',
          operators: [
            'equals',
            'notEquals',
            'contains',
            'in',
            'notIn',
            'greaterThan',
            'lessThan',
          ],
          description:
            'Freeform metadata field. Use dot notation for nested paths (e.g., "category", "my-classifier.tags")',
        },
      ],
    },
    asset: {
      fields: [
        {
          path: 'asset.id',
          label: 'ID',
          type: 'string',
          operators: [
            'equals',
            'notEquals',
            'contains',
            'in',
            'notIn',
            'greaterThan',
            'lessThan',
          ],
          description: 'The ID of the asset',
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
