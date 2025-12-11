import { ConfigSchema, ConfigSchemaOptions } from './config-schema.js';

const options: ConfigSchemaOptions = {
  encrypt: (value: string) => `encrypted-${value}`,
  decrypt: (value: string) => value.replace('encrypted-', ''),
};

describe('ConfigSchema', () => {
  describe('validate', () => {
    describe('required field validation', () => {
      it('should pass when all required fields are provided', () => {
        const schema = new ConfigSchema({
          name: {
            label: 'Name',
            type: 'string',
            required: true,
          },
          description: {
            label: 'Description',
            type: 'string',
            required: false,
          },
        });

        const values = {
          name: 'Test Name',
          description: 'Test Description',
        };

        const result = schema.validate(values);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should fail when required fields are missing', () => {
        const schema = new ConfigSchema({
          name: {
            label: 'Name',
            type: 'string',
            required: true,
          },
          description: {
            label: 'Description',
            type: 'string',
            required: false,
          },
        });

        const values = {
          description: 'Test Description',
        };

        const result = schema.validate(values);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('name is required');
      });

      it('should fail when required fields are empty strings', () => {
        const schema = new ConfigSchema({
          name: {
            label: 'Name',
            type: 'string',
            required: true,
          },
        });

        const values = {
          name: '',
        };

        const result = schema.validate(values);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('name is required');
      });
    });

    describe('type validation', () => {
      it('should validate string types', () => {
        const schema = new ConfigSchema({
          name: {
            label: 'Name',
            type: 'string',
          },
        });

        const validResult = schema.validate({ name: 'test' });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({ name: 123 });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain('name must be a string');
      });

      it('should validate number types', () => {
        const schema = new ConfigSchema({
          count: {
            label: 'Count',
            type: 'number',
          },
        });

        const validResult = schema.validate({ count: 42 });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({
          count: 'not a number',
        });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain('count must be a number');
      });

      it('should validate boolean types', () => {
        const schema = new ConfigSchema({
          enabled: {
            label: 'Enabled',
            type: 'boolean',
          },
        });

        const validResult = schema.validate({ enabled: true });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({ enabled: 'true' });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain('enabled must be a boolean');
      });

      it('should validate array types', () => {
        const schema = new ConfigSchema({
          items: {
            label: 'Items',
            type: 'array',
          },
        });

        const validResult = schema.validate({ items: [1, 2, 3] });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({
          items: 'not an array',
        });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain('items must be an array');
      });

      it('should validate object types', () => {
        const schema = new ConfigSchema({
          config: {
            label: 'Config',
            type: 'object',
          },
        });

        const validResult = schema.validate({
          config: { key: 'value' },
        });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({
          config: 'not an object',
        });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain('config must be an object');
      });

      it('should validate secret types as strings', () => {
        const schema = new ConfigSchema({
          apiKey: {
            label: 'API Key',
            type: 'secret',
          },
        });

        const validResult = schema.validate({ apiKey: 'secret123' });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({ apiKey: 123 });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain('apiKey must be a string');
      });

      it('should validate enum types', () => {
        const schema = new ConfigSchema({
          status: {
            label: 'Status',
            type: 'string',
            enum: ['active', 'inactive', 'pending'],
          },
        });

        const validResult = schema.validate({ status: 'active' });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({ status: 'invalid' });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain(
          'status must be one of: active, inactive, pending'
        );
      });

      it('should validate enum types with secret fields', () => {
        const schema = new ConfigSchema({
          apiKey: {
            label: 'API Key',
            type: 'secret',
            enum: ['key1', 'key2', 'key3'],
          },
        });

        const validResult = schema.validate({ apiKey: 'key1' });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({ apiKey: 'invalid-key' });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain(
          'apiKey must be one of: key1, key2, key3'
        );
      });

      it('should validate enum types in nested objects', () => {
        const schema = new ConfigSchema({
          user: {
            label: 'User',
            type: 'object',
            properties: {
              role: {
                label: 'Role',
                type: 'string',
                enum: ['admin', 'user', 'guest'],
              },
            },
          },
        });

        const validResult = schema.validate({
          user: { role: 'admin' },
        });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({
          user: { role: 'superadmin' },
        });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain(
          'user.role must be one of: admin, user, guest'
        );
      });

      it('should validate enum types in array items', () => {
        const schema = new ConfigSchema({
          tags: {
            label: 'Tags',
            type: 'array',
            items: {
              type: 'string',
              enum: ['tag1', 'tag2', 'tag3'],
            },
          },
        });

        const validResult = schema.validate({
          tags: ['tag1', 'tag2'],
        });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({
          tags: ['tag1', 'invalid-tag'],
        });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain(
          'tags[1] must be one of: tag1, tag2, tag3'
        );
      });

      it('should allow empty enum array (no restriction)', () => {
        const schema = new ConfigSchema({
          status: {
            label: 'Status',
            type: 'string',
            enum: [],
          },
        });

        const validResult = schema.validate({ status: 'any-value' });
        expect(validResult.valid).toBe(true);
      });
    });

    describe('nested object validation', () => {
      it('should validate nested object properties', () => {
        const schema = new ConfigSchema({
          user: {
            label: 'User',
            type: 'object',
            properties: {
              name: {
                label: 'Name',
                type: 'string',
                required: true,
              },
              age: {
                label: 'Age',
                type: 'number',
              },
            },
          },
        });

        const validResult = schema.validate({
          user: {
            name: 'John',
            age: 30,
          },
        });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({
          user: {
            age: 'not a number',
          },
        });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain('user.name is required');
        expect(invalidResult.errors).toContain('user.age must be a number');
      });
    });

    describe('array item validation', () => {
      it('should validate array items with primitive types', () => {
        const schema = new ConfigSchema({
          tags: {
            label: 'Tags',
            type: 'array',
            items: {
              type: 'string',
            },
          },
        });

        const validResult = schema.validate({
          tags: ['tag1', 'tag2', 'tag3'],
        });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({
          tags: ['tag1', 123, 'tag3'],
        });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain('tags[1] must be a string');
      });

      it('should validate array items with object types', () => {
        const schema = new ConfigSchema({
          fieldCapture: {
            label: 'Fields to capture',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  label: 'Name',
                  type: 'string',
                  required: true,
                },
                instructions: {
                  label: 'Instructions',
                  type: 'string',
                },
              },
            },
          },
        });

        const validResult = schema.validate({
          fieldCapture: [
            {
              name: 'field1',
              instructions: 'Capture field 1',
            },
            {
              name: 'field2',
            },
          ],
        });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({
          fieldCapture: [
            {
              name: 'field1',
              instructions: 'Capture field 1',
            },
            {
              instructions: 'Missing name',
            },
          ],
        });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain(
          'fieldCapture[1].name is required'
        );
      });
    });

    describe('unknown field rejection', () => {
      it('should reject unknown fields', () => {
        const schema = new ConfigSchema({
          name: {
            label: 'Name',
            type: 'string',
          },
        });

        const result = schema.validate({
          name: 'Test',
          unknownField: 'Should be rejected',
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'unknownField is not defined in the schema'
        );
      });

      it('should reject unknown fields in nested objects', () => {
        const schema = new ConfigSchema({
          user: {
            label: 'User',
            type: 'object',
            properties: {
              name: {
                label: 'Name',
                type: 'string',
              },
            },
          },
        });

        const result = schema.validate({
          user: {
            name: 'John',
            unknownField: 'Should be rejected',
          },
        });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'user.unknownField is not defined in the schema'
        );
      });
    });

    describe('length validation', () => {
      it('should validate string minLength and maxLength', () => {
        const schema = new ConfigSchema({
          name: {
            label: 'Name',
            type: 'string',
            minLength: 2,
            maxLength: 10,
          },
        });

        const validResult = schema.validate({ name: 'John' });
        expect(validResult.valid).toBe(true);

        const tooShortResult = schema.validate({ name: 'A' });
        expect(tooShortResult.valid).toBe(false);
        expect(tooShortResult.errors).toContain(
          'name must have at least 2 characters'
        );

        const tooLongResult = schema.validate({
          name: 'VeryLongName',
        });
        expect(tooLongResult.valid).toBe(false);
        expect(tooLongResult.errors).toContain(
          'name must have at most 10 characters'
        );
      });

      it('should validate array minLength and maxLength', () => {
        const schema = new ConfigSchema({
          items: {
            label: 'Items',
            type: 'array',
            minLength: 1,
            maxLength: 3,
          },
        });

        const validResult = schema.validate({ items: [1, 2] });
        expect(validResult.valid).toBe(true);

        const tooShortResult = schema.validate({ items: [] });
        expect(tooShortResult.valid).toBe(false);
        expect(tooShortResult.errors).toContain(
          'items must have at least 1 item'
        );

        const tooLongResult = schema.validate({
          items: [1, 2, 3, 4],
        });
        expect(tooLongResult.valid).toBe(false);
        expect(tooLongResult.errors).toContain(
          'items must have at most 3 items'
        );
      });

      it('should validate object minLength and maxLength', () => {
        const schema = new ConfigSchema({
          config: {
            label: 'Config',
            type: 'object',
            minLength: 1,
            maxLength: 2,
          },
        });

        const validResult = schema.validate({
          config: { key: 'value' },
        });
        expect(validResult.valid).toBe(true);

        const tooShortResult = schema.validate({ config: {} });
        expect(tooShortResult.valid).toBe(false);
        expect(tooShortResult.errors).toContain(
          'config must have at least 1 property'
        );

        const tooLongResult = schema.validate({
          config: { key1: 'value1', key2: 'value2', key3: 'value3' },
        });
        expect(tooLongResult.valid).toBe(false);
        expect(tooLongResult.errors).toContain(
          'config must have at most 2 properties'
        );
      });

      it('should validate only minLength constraint', () => {
        const schema = new ConfigSchema({
          name: {
            label: 'Name',
            type: 'string',
            minLength: 3,
          },
        });

        const validResult = schema.validate({ name: 'John' });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({ name: 'Jo' });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain(
          'name must have at least 3 characters'
        );
      });

      it('should validate only maxLength constraint', () => {
        const schema = new ConfigSchema({
          name: {
            label: 'Name',
            type: 'string',
            maxLength: 5,
          },
        });

        const validResult = schema.validate({ name: 'John' });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({
          name: 'VeryLongName',
        });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain(
          'name must have at most 5 characters'
        );
      });

      it('should not validate length for unsupported types', () => {
        const schema = new ConfigSchema({
          count: {
            label: 'Count',
            type: 'number',
            minLength: 1,
            maxLength: 10,
          },
          enabled: {
            label: 'Enabled',
            type: 'boolean',
            minLength: 1,
            maxLength: 10,
          },
        });

        const result = schema.validate({ count: 5, enabled: true });
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('complex validation scenarios', () => {
      it('should validate the anthropic classifier schema example', () => {
        const schema = new ConfigSchema({
          fieldCapture: {
            label: 'Fields to capture',
            type: 'array',
            minLength: 1,
            maxLength: 10,
            items: {
              type: 'object',
              properties: {
                name: {
                  label: 'Name',
                  type: 'string',
                  description: 'The name of the field to capture',
                  required: true,
                  minLength: 1,
                  maxLength: 50,
                },
                instructions: {
                  label: 'Instructions',
                  type: 'string',
                  description: 'Instructions for filling the field',
                  maxLength: 200,
                },
              },
            },
          },
        });

        const validResult = schema.validate({
          fieldCapture: [
            {
              name: 'person',
              instructions: 'Extract person names',
            },
            {
              name: 'location',
              instructions: 'Extract location names',
            },
          ],
        });
        expect(validResult.valid).toBe(true);

        const invalidResult = schema.validate({
          fieldCapture: [
            {
              instructions: 'Missing name',
            },
            {
              name: 123, // Wrong type
              instructions: 'Extract location names',
            },
          ],
        });
        expect(invalidResult.valid).toBe(false);
        expect(invalidResult.errors).toContain(
          'fieldCapture[0].name is required'
        );
        expect(invalidResult.errors).toContain(
          'fieldCapture[1].name must be a string'
        );
      });

      it('should validate length constraints in complex nested structures', () => {
        const schema = new ConfigSchema({
          fieldCapture: {
            label: 'Fields to capture',
            type: 'array',
            minLength: 1,
            maxLength: 2,
            items: {
              type: 'object',
              minLength: 1,
              maxLength: 2,
              properties: {
                name: {
                  label: 'Name',
                  type: 'string',
                  required: true,
                  minLength: 2,
                  maxLength: 20,
                },
              },
            },
          },
        });

        // Valid: 1 item with 1 property
        const validResult = schema.validate({
          fieldCapture: [{ name: 'John' }],
        });
        expect(validResult.valid).toBe(true);

        // Invalid: too many items
        const tooManyItemsResult = schema.validate({
          fieldCapture: [{ name: 'John' }, { name: 'Jane' }, { name: 'Bob' }],
        });
        expect(tooManyItemsResult.valid).toBe(false);
        expect(tooManyItemsResult.errors).toContain(
          'fieldCapture must have at most 2 items'
        );

        // Invalid: item has too many properties
        const tooManyPropsResult = schema.validate({
          fieldCapture: [{ name: 'John', extra: 'value' }],
        });
        expect(tooManyPropsResult.valid).toBe(false);
        expect(tooManyPropsResult.errors).toContain(
          'fieldCapture[0].extra is not defined in the schema'
        );

        // Invalid: name too short
        const nameTooShortResult = schema.validate({
          fieldCapture: [{ name: 'A' }],
        });
        expect(nameTooShortResult.valid).toBe(false);
        expect(nameTooShortResult.errors).toContain(
          'fieldCapture[0].name must have at least 2 characters'
        );
      });

      it('should validate object length constraints when properties are defined', () => {
        const schema = new ConfigSchema({
          config: {
            label: 'Config',
            type: 'object',
            minLength: 1,
            maxLength: 2,
            properties: {
              key1: {
                label: 'Key 1',
                type: 'string',
              },
              key2: {
                label: 'Key 2',
                type: 'string',
              },
              key3: {
                label: 'Key 3',
                type: 'string',
              },
            },
          },
        });

        // Valid: 1 property
        const validResult = schema.validate({
          config: { key1: 'value1' },
        });
        expect(validResult.valid).toBe(true);

        // Valid: 2 properties
        const validTwoPropsResult = schema.validate({
          config: { key1: 'value1', key2: 'value2' },
        });
        expect(validTwoPropsResult.valid).toBe(true);

        // Invalid: too many properties (3 properties exceed maxLength of 2)
        const tooManyPropsResult = schema.validate({
          config: { key1: 'value1', key2: 'value2', key3: 'value3' },
        });
        expect(tooManyPropsResult.valid).toBe(false);
        expect(tooManyPropsResult.errors).toContain(
          'config must have at most 2 properties'
        );

        // Invalid: no properties (empty object)
        const noPropsResult = schema.validate({
          config: {},
        });
        expect(noPropsResult.valid).toBe(false);
        expect(noPropsResult.errors).toContain(
          'config must have at least 1 property'
        );
      });
    });
  });

  describe('processInboundValues', () => {
    it('should encrypt secret fields only', async () => {
      const schema = new ConfigSchema(
        {
          apiKey: {
            label: 'API Key',
            type: 'secret',
          },
          name: {
            label: 'Name',
            type: 'string',
          },
        },
        options
      );

      const values = { apiKey: 'secret123', name: 'John Doe' };

      const result = await schema.processInboundValues(values);
      expect(result.apiKey).not.toBe(values.apiKey);
      expect(result.name).toBe(values.name);
      expect(result.apiKey).toBe('encrypted-secret123');
    });

    it('should handle nested objects with secrets', async () => {
      const schema = new ConfigSchema(
        {
          user: {
            label: 'User',
            type: 'object',
            properties: {
              name: {
                label: 'Name',
                type: 'string',
              },
              favoriteColor: {
                label: 'Favorite Color',
                type: 'secret',
              },
            },
          },
        },
        options
      );

      const values = {
        user: {
          name: 'John Doe',
          favoriteColor: 'blue',
        },
      };

      const result = await schema.processInboundValues(values);

      expect(result.user.name).toBe(values.user.name);
      expect(result.user.favoriteColor).not.toBe(values.user.favoriteColor);
      expect(result.user.favoriteColor).toBe('encrypted-blue');
    });

    it('should handle arrays of secrets', async () => {
      const schema = new ConfigSchema(
        {
          apiKeys: {
            label: 'API Keys',
            type: 'array',
            items: {
              type: 'secret',
            },
          },
        },
        options
      );

      const values = { apiKeys: ['key1', 'key2', 'key3'] };

      const result = await schema.processInboundValues(values);
      expect(result.apiKeys).toHaveLength(3);
      expect(result.apiKeys[0]).toBe('encrypted-key1');
      expect(result.apiKeys[1]).toBe('encrypted-key2');
      expect(result.apiKeys[2]).toBe('encrypted-key3');
    });

    it('should handle arrays of objects with secrets', async () => {
      const schema = new ConfigSchema(
        {
          credentials: {
            label: 'Credentials',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                username: {
                  label: 'Username',
                  type: 'string',
                },
                password: {
                  label: 'Password',
                  type: 'secret',
                },
              },
            },
          },
        },
        options
      );

      const values = {
        credentials: [
          { username: 'user1', password: 'pass1' },
          { username: 'user2', password: 'pass2' },
        ],
      };

      const result = await schema.processInboundValues(values);
      expect(result.credentials).toHaveLength(2);
      expect(result.credentials[0].username).toBe('user1');
      expect(result.credentials[0].password).toBe('encrypted-pass1');
      expect(result.credentials[1].username).toBe('user2');
      expect(result.credentials[1].password).toBe('encrypted-pass2');
    });

    it('should handle mixed array types', async () => {
      const schema = new ConfigSchema(
        {
          items: {
            label: 'Items',
            type: 'array',
            items: {
              type: 'string',
            },
          },
          secrets: {
            label: 'Secrets',
            type: 'array',
            items: {
              type: 'secret',
            },
          },
        },
        options
      );

      const values = {
        items: ['item1', 'item2'],
        secrets: ['secret1', 'secret2'],
      };

      const result = await schema.processInboundValues(values);
      expect(result.items).toEqual(['item1', 'item2']);
      expect(result.secrets[0]).toBe('encrypted-secret1');
      expect(result.secrets[1]).toBe('encrypted-secret2');
    });

    it('should handle null and undefined values', async () => {
      const schema = new ConfigSchema(
        {
          apiKey: {
            label: 'API Key',
            type: 'secret',
            required: false,
          },
          name: {
            label: 'Name',
            type: 'string',
            required: false,
          },
          user: {
            label: 'User',
            type: 'object',
            properties: {
              secret: {
                label: 'Secret',
                type: 'secret',
                required: false,
              },
            },
          },
        },
        options
      );

      const values = {
        apiKey: null,
        name: undefined,
        user: {
          secret: null,
        },
      };

      const result = await schema.processInboundValues(values);
      expect(result.apiKey).toBeNull();
      expect(result.name).toBeUndefined();
      expect(result.user.secret).toBeNull();
    });

    it('should handle empty arrays', async () => {
      const schema = new ConfigSchema(
        {
          secrets: {
            label: 'Secrets',
            type: 'array',
            items: {
              type: 'secret',
            },
          },
          credentials: {
            label: 'Credentials',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                password: {
                  label: 'Password',
                  type: 'secret',
                },
              },
            },
          },
        },
        options
      );

      const values = {
        secrets: [],
        credentials: [],
      };

      const result = await schema.processInboundValues(values);
      expect(result.secrets).toEqual([]);
      expect(result.credentials).toEqual([]);
    });
  });

  describe('processOutboundValues', () => {
    it('should decrypt secret fields only', async () => {
      const schema = new ConfigSchema(
        {
          apiKey: {
            label: 'API Key',
            type: 'secret',
          },
          name: {
            label: 'Name',
            type: 'string',
          },
        },
        options
      );

      const values = {
        apiKey: 'encrypted-secret123',
        name: 'John Doe',
      };

      const result = await schema.processOutboundValues(values);
      expect(result.apiKey).toBe('secret123');
      expect(result.name).toBe('John Doe');
    });

    it('should handle nested objects with secrets', async () => {
      const schema = new ConfigSchema(
        {
          user: {
            label: 'User',
            type: 'object',
            properties: {
              name: {
                label: 'Name',
                type: 'string',
              },
              favoriteColor: {
                label: 'Favorite Color',
                type: 'secret',
              },
            },
          },
        },
        options
      );

      const values = {
        user: {
          name: 'John Doe',
          favoriteColor: 'encrypted-blue',
        },
      };

      const result = await schema.processOutboundValues(values);
      expect(result.user.name).toBe('John Doe');
      expect(result.user.favoriteColor).toBe('blue');
    });

    it('should handle arrays of secrets', async () => {
      const schema = new ConfigSchema(
        {
          apiKeys: {
            label: 'API Keys',
            type: 'array',
            items: {
              type: 'secret',
            },
          },
        },
        options
      );

      const values = {
        apiKeys: ['encrypted-key1', 'encrypted-key2', 'encrypted-key3'],
      };

      const result = await schema.processOutboundValues(values);
      expect(result.apiKeys).toHaveLength(3);
      expect(result.apiKeys[0]).toBe('key1');
      expect(result.apiKeys[1]).toBe('key2');
      expect(result.apiKeys[2]).toBe('key3');
    });

    it('should handle arrays of objects with secrets', async () => {
      const schema = new ConfigSchema(
        {
          credentials: {
            label: 'Credentials',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                username: {
                  label: 'Username',
                  type: 'string',
                },
                password: {
                  label: 'Password',
                  type: 'secret',
                },
              },
            },
          },
        },
        options
      );

      const values = {
        credentials: [
          { username: 'user1', password: 'encrypted-pass1' },
          { username: 'user2', password: 'encrypted-pass2' },
        ],
      };

      const result = await schema.processOutboundValues(values);
      expect(result.credentials).toHaveLength(2);
      expect(result.credentials[0].username).toBe('user1');
      expect(result.credentials[0].password).toBe('pass1');
      expect(result.credentials[1].username).toBe('user2');
      expect(result.credentials[1].password).toBe('pass2');
    });

    it('should handle null and undefined values', async () => {
      const schema = new ConfigSchema(
        {
          apiKey: {
            label: 'API Key',
            type: 'secret',
            required: false,
          },
          name: {
            label: 'Name',
            type: 'string',
            required: false,
          },
          user: {
            label: 'User',
            type: 'object',
            properties: {
              secret: {
                label: 'Secret',
                type: 'secret',
                required: false,
              },
            },
          },
        },
        options
      );

      const values = {
        apiKey: null,
        name: undefined,
        user: {
          secret: null,
        },
      };

      const result = await schema.processOutboundValues(values);
      expect(result.apiKey).toBeNull();
      expect(result.name).toBeUndefined();
      expect(result.user.secret).toBeNull();
    });

    it('should handle empty arrays', async () => {
      const schema = new ConfigSchema(
        {
          secrets: {
            label: 'Secrets',
            type: 'array',
            items: {
              type: 'secret',
            },
          },
          credentials: {
            label: 'Credentials',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                password: {
                  label: 'Password',
                  type: 'secret',
                },
              },
            },
          },
        },
        options
      );

      const values = {
        secrets: [],
        credentials: [],
      };

      const result = await schema.processOutboundValues(values);
      expect(result.secrets).toEqual([]);
      expect(result.credentials).toEqual([]);
    });
  });

  describe('validateImmutableFields', () => {
    describe('basic immutable field validation', () => {
      it('should pass when immutable field values are the same', () => {
        const schema = new ConfigSchema({
          id: {
            label: 'ID',
            type: 'string',
            immutable: true,
          },
          name: {
            label: 'Name',
            type: 'string',
          },
        });

        const oldValues = { id: '123', name: 'old' };
        const newValues = { id: '123', name: 'new' };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should fail when immutable field value is changed', () => {
        const schema = new ConfigSchema({
          id: {
            label: 'ID',
            type: 'string',
            immutable: true,
          },
          name: {
            label: 'Name',
            type: 'string',
          },
        });

        const oldValues = { id: '123', name: 'old' };
        const newValues = { id: '456', name: 'new' };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'id is immutable and cannot be changed'
        );
      });

      it('should fail when immutable field is removed', () => {
        const schema = new ConfigSchema({
          id: {
            label: 'ID',
            type: 'string',
            immutable: true,
          },
          name: {
            label: 'Name',
            type: 'string',
          },
        });

        const oldValues = { id: '123', name: 'old' };
        const newValues = { name: 'new' };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'id is immutable and cannot be removed'
        );
      });

      it('should allow setting immutable field when old value is undefined', () => {
        const schema = new ConfigSchema({
          id: {
            label: 'ID',
            type: 'string',
            immutable: true,
          },
        });

        const oldValues = {};
        const newValues = { id: '123' };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should allow setting immutable field when old value is null', () => {
        const schema = new ConfigSchema({
          id: {
            label: 'ID',
            type: 'string',
            immutable: true,
          },
        });

        const oldValues = { id: null };
        const newValues = { id: '123' };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('nested object immutable field validation', () => {
      it('should validate immutable fields in nested objects', () => {
        const schema = new ConfigSchema({
          user: {
            label: 'User',
            type: 'object',
            properties: {
              id: {
                label: 'ID',
                type: 'string',
                immutable: true,
              },
              name: {
                label: 'Name',
                type: 'string',
              },
            },
          },
        });

        const oldValues = {
          user: {
            id: '123',
            name: 'old',
          },
        };
        const newValues = {
          user: {
            id: '456',
            name: 'new',
          },
        };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'user.id is immutable and cannot be changed'
        );
      });

      it('should pass when nested immutable fields are unchanged', () => {
        const schema = new ConfigSchema({
          user: {
            label: 'User',
            type: 'object',
            properties: {
              id: {
                label: 'ID',
                type: 'string',
                immutable: true,
              },
              name: {
                label: 'Name',
                type: 'string',
              },
            },
          },
        });

        const oldValues = {
          user: {
            id: '123',
            name: 'old',
          },
        };
        const newValues = {
          user: {
            id: '123',
            name: 'new',
          },
        };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate deeply nested immutable fields', () => {
        const schema = new ConfigSchema({
          config: {
            label: 'Config',
            type: 'object',
            properties: {
              database: {
                label: 'Database',
                type: 'object',
                properties: {
                  connectionId: {
                    label: 'Connection ID',
                    type: 'string',
                    immutable: true,
                  },
                  host: {
                    label: 'Host',
                    type: 'string',
                  },
                },
              },
            },
          },
        });

        const oldValues = {
          config: {
            database: {
              connectionId: 'conn-123',
              host: 'localhost',
            },
          },
        };
        const newValues = {
          config: {
            database: {
              connectionId: 'conn-456',
              host: 'example.com',
            },
          },
        };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'config.database.connectionId is immutable and cannot be changed'
        );
      });
    });

    describe('array immutable field validation', () => {
      it('should validate immutable array fields', () => {
        const schema = new ConfigSchema({
          tags: {
            label: 'Tags',
            type: 'array',
            immutable: true,
            items: {
              type: 'string',
            },
          },
        });

        const oldValues = { tags: ['tag1', 'tag2'] };
        const newValues = { tags: ['tag1', 'tag3'] };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'tags is immutable and cannot be changed'
        );
      });

      it('should pass when immutable array is unchanged', () => {
        const schema = new ConfigSchema({
          tags: {
            label: 'Tags',
            type: 'array',
            immutable: true,
            items: {
              type: 'string',
            },
          },
        });

        const oldValues = { tags: ['tag1', 'tag2'] };
        const newValues = { tags: ['tag1', 'tag2'] };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate immutable array items', () => {
        const schema = new ConfigSchema({
          items: {
            label: 'Items',
            type: 'array',
            items: {
              type: 'string',
              immutable: true,
            },
          },
        });

        const oldValues = { items: ['item1', 'item2'] };
        const newValues = { items: ['item1', 'item3'] };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'items[1] is immutable and cannot be changed'
        );
      });

      it('should pass when immutable array items are unchanged', () => {
        const schema = new ConfigSchema({
          items: {
            label: 'Items',
            type: 'array',
            items: {
              type: 'string',
              immutable: true,
            },
          },
        });

        const oldValues = { items: ['item1', 'item2'] };
        const newValues = { items: ['item1', 'item2'] };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate immutable fields in array of objects', () => {
        const schema = new ConfigSchema({
          users: {
            label: 'Users',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  label: 'ID',
                  type: 'string',
                  immutable: true,
                },
                name: {
                  label: 'Name',
                  type: 'string',
                },
              },
            },
          },
        });

        const oldValues = {
          users: [
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' },
          ],
        };
        const newValues = {
          users: [
            { id: '1', name: 'Alice Updated' },
            { id: '3', name: 'Bob' },
          ],
        };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'users[1].id is immutable and cannot be changed'
        );
      });

      it('should pass when immutable fields in array of objects are unchanged', () => {
        const schema = new ConfigSchema({
          users: {
            label: 'Users',
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  label: 'ID',
                  type: 'string',
                  immutable: true,
                },
                name: {
                  label: 'Name',
                  type: 'string',
                },
              },
            },
          },
        });

        const oldValues = {
          users: [
            { id: '1', name: 'Alice' },
            { id: '2', name: 'Bob' },
          ],
        };
        const newValues = {
          users: [
            { id: '1', name: 'Alice Updated' },
            { id: '2', name: 'Bob Updated' },
          ],
        };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('complex immutable field scenarios', () => {
      it('should validate multiple immutable fields', () => {
        const schema = new ConfigSchema({
          id: {
            label: 'ID',
            type: 'string',
            immutable: true,
          },
          createdAt: {
            label: 'Created At',
            type: 'string',
            immutable: true,
          },
          name: {
            label: 'Name',
            type: 'string',
          },
        });

        const oldValues = {
          id: '123',
          createdAt: '2024-01-01',
          name: 'old',
        };
        const newValues = {
          id: '456',
          createdAt: '2024-01-02',
          name: 'new',
        };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'id is immutable and cannot be changed'
        );
        expect(result.errors).toContain(
          'createdAt is immutable and cannot be changed'
        );
      });

      it('should handle mixed mutable and immutable fields', () => {
        const schema = new ConfigSchema({
          id: {
            label: 'ID',
            type: 'string',
            immutable: true,
          },
          name: {
            label: 'Name',
            type: 'string',
          },
          description: {
            label: 'Description',
            type: 'string',
          },
        });

        const oldValues = {
          id: '123',
          name: 'old',
          description: 'old desc',
        };
        const newValues = {
          id: '123',
          name: 'new',
          description: 'new desc',
        };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate immutable fields with different types', () => {
        const schema = new ConfigSchema({
          id: {
            label: 'ID',
            type: 'string',
            immutable: true,
          },
          count: {
            label: 'Count',
            type: 'number',
            immutable: true,
          },
          enabled: {
            label: 'Enabled',
            type: 'boolean',
            immutable: true,
          },
        });

        const oldValues = {
          id: '123',
          count: 42,
          enabled: true,
        };
        const newValues = {
          id: '456',
          count: 43,
          enabled: false,
        };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'id is immutable and cannot be changed'
        );
        expect(result.errors).toContain(
          'count is immutable and cannot be changed'
        );
        expect(result.errors).toContain(
          'enabled is immutable and cannot be changed'
        );
      });

      it('should handle empty arrays with immutable items', () => {
        const schema = new ConfigSchema({
          items: {
            label: 'Items',
            type: 'array',
            items: {
              type: 'string',
              immutable: true,
            },
          },
        });

        const oldValues = { items: [] };
        const newValues = { items: [] };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle arrays with different lengths when items are immutable', () => {
        const schema = new ConfigSchema({
          items: {
            label: 'Items',
            type: 'array',
            items: {
              type: 'string',
              immutable: true,
            },
          },
        });

        const oldValues = { items: ['item1', 'item2'] };
        const newValues = { items: ['item1'] };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'items[1] is immutable and cannot be changed'
        );
      });
    });

    describe('edge cases', () => {
      it('should handle undefined values in oldValues', () => {
        const schema = new ConfigSchema({
          id: {
            label: 'ID',
            type: 'string',
            immutable: true,
          },
        });

        const oldValues = { id: undefined };
        const newValues = { id: '123' };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle null values correctly', () => {
        const schema = new ConfigSchema({
          id: {
            label: 'ID',
            type: 'string',
            immutable: true,
          },
        });

        const oldValues = { id: null };
        const newValues = { id: null };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle missing fields in newValues', () => {
        const schema = new ConfigSchema({
          id: {
            label: 'ID',
            type: 'string',
            immutable: true,
          },
        });

        const oldValues = { id: '123' };
        const newValues = {};

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'id is immutable and cannot be removed'
        );
      });

      it('should handle complex nested structures with immutable fields', () => {
        const schema = new ConfigSchema({
          config: {
            label: 'Config',
            type: 'object',
            properties: {
              database: {
                label: 'Database',
                type: 'object',
                properties: {
                  connectionId: {
                    label: 'Connection ID',
                    type: 'string',
                    immutable: true,
                  },
                  credentials: {
                    label: 'Credentials',
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          label: 'ID',
                          type: 'string',
                          immutable: true,
                        },
                        username: {
                          label: 'Username',
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        const oldValues = {
          config: {
            database: {
              connectionId: 'conn-123',
              credentials: [
                { id: 'cred-1', username: 'user1' },
                { id: 'cred-2', username: 'user2' },
              ],
            },
          },
        };
        const newValues = {
          config: {
            database: {
              connectionId: 'conn-456', // Changed
              credentials: [
                { id: 'cred-1', username: 'user1-updated' },
                { id: 'cred-3', username: 'user2' }, // Changed id
              ],
            },
          },
        };

        const result = schema.validateImmutableFields(oldValues, newValues);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'config.database.connectionId is immutable and cannot be changed'
        );
        expect(result.errors).toContain(
          'config.database.credentials[1].id is immutable and cannot be changed'
        );
      });
    });
  });
});
