import { execSync } from 'child_process';
import { unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { OpenAPISpec } from '../../parsers/types';

export class TypeScriptTypeGenerator {
  /**
   * Normalize enum values in the OpenAPI spec to ensure they're arrays
   */
  private normalizeEnums(spec: OpenAPISpec): OpenAPISpec {
    const normalized = JSON.parse(JSON.stringify(spec)) as OpenAPISpec;

    const normalizeSchema = (schema: any): void => {
      if (!schema || typeof schema !== 'object') return;

      // Normalize enum field - convert objects to arrays
      if (schema.enum && !Array.isArray(schema.enum)) {
        if (typeof schema.enum === 'object') {
          schema.enum = Object.values(schema.enum).filter(
            (val) => typeof val === 'string' || typeof val === 'number'
          );
        }
      }

      // Recursively normalize nested schemas
      if (schema.properties) {
        Object.values(schema.properties).forEach(normalizeSchema);
      }
      if (
        schema.additionalProperties &&
        typeof schema.additionalProperties === 'object'
      ) {
        normalizeSchema(schema.additionalProperties);
      }
      if (schema.items) {
        normalizeSchema(schema.items);
      }
      if (schema.oneOf) {
        schema.oneOf.forEach(normalizeSchema);
      }
      if (schema.allOf) {
        schema.allOf.forEach(normalizeSchema);
      }
    };

    // Normalize all schemas in components
    if (normalized.components?.schemas) {
      Object.values(normalized.components.schemas).forEach(normalizeSchema);
    }

    // Normalize schemas in paths
    if (normalized.paths) {
      Object.values(normalized.paths).forEach((pathMethods) => {
        Object.values(pathMethods).forEach((operation) => {
          if (operation.parameters) {
            operation.parameters.forEach((param: any) => {
              if (param.schema) normalizeSchema(param.schema);
            });
          }
          if (operation.requestBody?.content) {
            Object.values(operation.requestBody.content).forEach(
              (content: any) => {
                if (content.schema) normalizeSchema(content.schema);
              }
            );
          }
          if (operation.responses) {
            Object.values(operation.responses).forEach((response: any) => {
              if (response.content) {
                Object.values(response.content).forEach((content: any) => {
                  if (content.schema) normalizeSchema(content.schema);
                });
              }
            });
          }
        });
      });
    }

    return normalized;
  }

  async generateTypes(spec: OpenAPISpec): Promise<string> {
    try {
      // Normalize enums in the spec before generating types
      const normalizedSpec = this.normalizeEnums(spec);

      // Create a temporary file for the OpenAPI spec
      const tempSpecPath = join(tmpdir(), `openapi-spec-${Date.now()}.json`);
      const tempTypesPath = join(tmpdir(), `types-${Date.now()}.ts`);

      try {
        // Write the spec to a temporary file
        writeFileSync(tempSpecPath, JSON.stringify(normalizedSpec, null, 2));

        // Use openapi-typescript CLI to generate types
        execSync(
          `npx openapi-typescript "${tempSpecPath}" -o "${tempTypesPath}" --alphabetize`,
          {
            stdio: 'pipe',
          }
        );

        // Read the generated types
        const types = require('fs').readFileSync(tempTypesPath, 'utf8');

        return types;
      } finally {
        // Clean up temporary files
        try {
          unlinkSync(tempSpecPath);
          unlinkSync(tempTypesPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      console.error('Error generating types:', error);
      throw new Error(`Failed to generate TypeScript types: ${error}`);
    }
  }
}
