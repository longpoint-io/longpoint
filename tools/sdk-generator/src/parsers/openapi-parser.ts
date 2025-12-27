import { OpenAPISchema, OpenAPISpec, ParsedOperation } from './types';

export class OpenAPIParser {
  private spec: OpenAPISpec;

  constructor(spec: OpenAPISpec) {
    this.spec = spec;
  }

  parseOperations(): ParsedOperation[] {
    const operations: ParsedOperation[] = [];
    const globalTags = new Set(this.spec.tags.map((tag) => tag.name));

    for (const [path, methods] of Object.entries(this.spec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (!operation.tags || operation.tags.length === 0) continue;

        const tag = operation.tags[0];
        if (!globalTags.has(tag)) continue;

        const parsedOp: ParsedOperation = {
          tag,
          method: method.toUpperCase(),
          path: this.cleanPath(path),
          operationId:
            operation.operationId || this.generateOperationId(method, path),
          summary: operation.summary || '',
          description: operation.description,
          parameters: this.parseParameters(operation.parameters || []),
          requestBody: this.parseRequestBody(operation.requestBody),
          responseType: this.parseResponseType(operation.responses),
        };

        operations.push(parsedOp);
      }
    }

    return operations;
  }

  private cleanPath(path: string): string {
    return path.replace(/^\/api/, '').replace(/^\//, '');
  }

  private generateOperationId(method: string, path: string): string {
    const pathParts = path.split('/').filter(Boolean);
    const resource = pathParts[0] || 'unknown';
    const action = this.getActionFromMethod(method);
    return `${action}${this.capitalize(resource)}`;
  }

  private getActionFromMethod(method: string): string {
    const actions: Record<string, string> = {
      get: 'get',
      post: 'create',
      put: 'update',
      patch: 'update',
      delete: 'delete',
    };
    return actions[method.toLowerCase()] || method.toLowerCase();
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private parseParameters(parameters: any[]): Array<{
    name: string;
    in: 'path' | 'query' | 'header';
    required: boolean;
    type: string;
  }> {
    return parameters.map((param) => ({
      name: param.name,
      in: param.in,
      required: param.required || false,
      type: this.getTypeFromSchema(param.schema),
    }));
  }

  private parseRequestBody(
    requestBody?: any
  ): { required: boolean; type: string } | undefined {
    if (!requestBody) return undefined;

    const content = requestBody.content?.['application/json'];
    if (!content) return undefined;

    return {
      required: requestBody.required || false,
      type: this.getTypeFromSchema(content.schema),
    };
  }

  private parseResponseType(responses: Record<string, any>): string {
    const successResponse =
      responses['200'] || responses['201'] || responses['204'];
    if (!successResponse?.content?.['application/json']) {
      return 'void';
    }
    return this.getTypeFromSchema(
      successResponse.content['application/json'].schema
    );
  }

  private getTypeFromSchema(schema: OpenAPISchema): string {
    if (!schema) return 'any';

    // Handle schema references
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop();
      return refName ? `components['schemas']['${refName}']` : 'any';
    }

    // Handle oneOf (union types)
    if (schema.oneOf && schema.oneOf.length > 0) {
      const types = schema.oneOf
        .map((item) => {
          if (item.$ref) {
            const refName = item.$ref.split('/').pop();
            return refName ? `components['schemas']['${refName}']` : null;
          }
          if (item.type === 'array' && item.items) {
            const itemType = this.getTypeFromSchema(item.items);
            return `${itemType}[]`;
          }
          if (item.type) {
            return this.getTypeFromSchema({ type: item.type } as OpenAPISchema);
          }
          return null;
        })
        .filter((type): type is string => type !== null);
      return types.length > 0 ? types.join(' | ') : 'any';
    }

    // Handle allOf (composition)
    if (schema.allOf && schema.allOf.length > 0) {
      const refs = schema.allOf
        .map((item) => item.$ref)
        .filter(Boolean)
        .map((ref) => ref!.split('/').pop());
      return refs.length > 0 ? `components['schemas']['${refs[0]}']` : 'any';
    }

    // Handle primitive types
    if (schema.type === 'string') {
      if (schema.enum) {
        return schema.enum.map((val) => `'${val}'`).join(' | ');
      }
      return 'string';
    }

    if (schema.type === 'number' || schema.type === 'integer') {
      return 'number';
    }

    if (schema.type === 'boolean') {
      return 'boolean';
    }

    if (schema.type === 'array') {
      const itemType = this.getTypeFromSchema(schema.items || {});
      return `${itemType}[]`;
    }

    // Handle object types
    if (schema.type === 'object' || schema.properties) {
      if (!schema.properties) return 'Record<string, any>';

      const properties = Object.entries(schema.properties)
        .map(([key, propSchema]) => {
          const isRequired = schema.required?.includes(key) || false;
          const optional = isRequired ? '' : '?';
          const type = this.getTypeFromSchema(propSchema);
          return `  ${key}${optional}: ${type};`;
        })
        .join('\n');

      return `{\n${properties}\n}`;
    }

    return 'any';
  }
}
