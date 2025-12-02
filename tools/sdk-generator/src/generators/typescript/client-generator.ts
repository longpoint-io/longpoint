import * as fs from 'fs';
import * as path from 'path';
import { OpenAPIParser, OpenAPISpec, ParsedOperation } from '../../parsers';
import { GeneratedFiles, GeneratorConfig, LanguageGenerator } from '../base';
import { TypeScriptTypeGenerator } from './type-generator';

export class TypeScriptGenerator extends LanguageGenerator {
  name = 'typescript';

  async generate(
    spec: OpenAPISpec,
    config: GeneratorConfig
  ): Promise<GeneratedFiles> {
    const parser = new OpenAPIParser(spec);
    const operations = parser.parseOperations();
    const generator = new TypeScriptClientGenerator(operations);
    const typeGenerator = new TypeScriptTypeGenerator();

    // Generate types from the OpenAPI spec
    const types = await typeGenerator.generateTypes(spec);

    return {
      'src/types.ts': types,
      'src/client.ts': generator.generateClient(),
      'src/index.ts': generator.generateIndex(),
      'package.json': generator.generatePackageJson(config),
      'tsconfig.json': generator.generateTsConfig(),
    };
  }
}

class TypeScriptClientGenerator {
  private operations: ParsedOperation[];

  constructor(operations: ParsedOperation[]) {
    this.operations = operations;
  }

  generateClient(): string {
    const groupedOps = this.groupOperationsByTag();
    const clientMethods = this.generateClientMethods(groupedOps);
    const clientInitializations =
      this.generateClientInitializations(groupedOps);
    const resourceClasses = this.generateResourceClasses(groupedOps);

    return `import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { paths, components } from './types';

export interface ClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export class Longpoint {
  private httpClient: AxiosInstance;
${clientMethods}

  constructor(config: ClientConfig = {}) {
    this.httpClient = axios.create({
      baseURL: config.baseUrl || 'http://localhost:3000/api',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { Authorization: \`Bearer \${config.apiKey}\` })
      }
    });
${clientInitializations}
  }
}

${resourceClasses}

// Export default instance
export const longpoint = new Longpoint();
export default longpoint;
`;
  }

  generateIndex(): string {
    return `// Main SDK exports
export { longpoint, Longpoint } from './client';
export type { ClientConfig } from './client';

// Re-export types from the generated types file
export type * from './types';
`;
  }

  generatePackageJson(config: GeneratorConfig): string {
    let version = config.version || '0.1.0';
    if (config.outputDir) {
      const existingPkgPath = path.join(config.outputDir, 'package.json');
      if (fs.existsSync(existingPkgPath)) {
        try {
          const existing = JSON.parse(fs.readFileSync(existingPkgPath, 'utf8'));
          version = existing.version;
        } catch (error) {
          console.warn(
            'Warning: Could not read existing package.json version, using default'
          );
        }
      }
    }

    return JSON.stringify(
      {
        name: config.packageName || '@longpoint/sdk',
        version,
        author: 'Longpoint',
        description:
          config.description || 'TypeScript SDK for the Longpoint API',
        keywords: ['longpoint', 'api', 'sdk', 'typescript'],
        license: 'MIT',
        type: 'module',
        main: 'dist/index.js',
        types: 'dist/index.d.ts',
        files: ['dist'],
        scripts: {
          build: 'tsc',
          dev: 'tsc --watch',
        },

        dependencies: {
          axios: '^1.6.0',
        },
        devDependencies: {
          '@types/node': '^20.0.0',
          typescript: '^5.0.0',
        },
        exports: {
          '.': {
            types: './dist/index.d.ts',
            import: './dist/index.js',
            default: './dist/index.js',
          },
          './package.json': './package.json',
        },
        publicConfig: {
          access: 'public',
        },
        nx: {
          targets: {
            build: {
              dependsOn: ['@longpoint/sdk-generator:create:typescript'],
            },
          },
        },
      },
      null,
      2
    );
  }

  generateTsConfig(): string {
    return JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'ES2020',
          moduleResolution: 'bundler',
          lib: ['ES2020'],
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          declaration: true,
          declarationMap: true,
          sourceMap: true,
          composite: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2
    );
  }

  private groupOperationsByTag(): Record<string, ParsedOperation[]> {
    const grouped: Record<string, ParsedOperation[]> = {};

    for (const op of this.operations) {
      if (!grouped[op.tag]) {
        grouped[op.tag] = [];
      }
      grouped[op.tag].push(op);
    }

    return grouped;
  }

  private generateClientMethods(
    groupedOps: Record<string, ParsedOperation[]>
  ): string {
    return Object.keys(groupedOps)
      .map((tag) => `  ${tag}: ${this.capitalize(tag)}Client;`)
      .join('\n');
  }

  private generateClientInitializations(
    groupedOps: Record<string, ParsedOperation[]>
  ): string {
    return Object.keys(groupedOps)
      .map(
        (tag) =>
          `    this.${tag} = new ${this.capitalize(
            tag
          )}Client(this.httpClient);`
      )
      .join('\n');
  }

  private generateResourceClasses(
    groupedOps: Record<string, ParsedOperation[]>
  ): string {
    return Object.entries(groupedOps)
      .map(([tag, ops]) => this.generateResourceClass(tag, ops))
      .join('\n\n');
  }

  private generateResourceClass(
    tag: string,
    operations: ParsedOperation[]
  ): string {
    const className = `${this.capitalize(tag)}Client`;
    const methods = operations
      .map((op) => this.generateMethod(op))
      .join('\n\n  ');

    return `class ${className} {
  constructor(private httpClient: AxiosInstance) {}

  ${methods}
}`;
  }

  private generateMethod(operation: ParsedOperation): string {
    const methodName = this.camelCase(operation.operationId);
    const params = this.generateMethodParams(operation);
    const docString = this.generateDocString(operation);
    const methodBody = this.generateMethodBody(operation);

    return `${docString}  async ${methodName}(${params}): Promise<${operation.responseType}> {
    ${methodBody}
  }`;
  }

  private generateDocString(operation: ParsedOperation): string {
    const lines = [];

    if (operation.summary) {
      lines.push(`  /**`);
      lines.push(`   * ${operation.summary}`);
      if (operation.description) {
        lines.push(`   *`);
        lines.push(`   * ${operation.description}`);
      }
      lines.push(`   */`);
    }

    return lines.length > 0 ? lines.join('\n') + '\n  ' : '  ';
  }

  private generateMethodParams(operation: ParsedOperation): string {
    const params: string[] = [];

    // Extract path parameter names from the path template itself
    // This ensures we use the correct names even if there's a mismatch
    // between the path template and operation parameters
    const pathParamNames = this.extractPathParamNames(operation.path);

    // Use path template names to ensure they match the URL replacement
    pathParamNames.forEach((paramName) => {
      params.push(`${paramName}: string`);
    });

    // Request body
    if (operation.requestBody) {
      const required = operation.requestBody.required ? '' : '?';
      params.push(`data${required}: ${operation.requestBody.type}`);
    }

    // Query parameters (optional)
    const queryParams = operation.parameters.filter((p) => p.in === 'query');
    if (queryParams.length > 0) {
      params.push(
        `options?: { ${queryParams
          .map((p) => `${p.name}?: ${p.type}`)
          .join('; ')} }`
      );
    }

    return params.join(', ');
  }

  private generateMethodBody(operation: ParsedOperation): string {
    // Extract path parameter names from the path template itself
    const pathParamNames = this.extractPathParamNames(operation.path);
    const queryParams = operation.parameters.filter((p) => p.in === 'query');

    let path = operation.path;
    // Replace path parameters using the names from the path template
    pathParamNames.forEach((paramName) => {
      path = path.replace(
        `{${paramName}}`,
        `\${encodeURIComponent(String(${paramName}))}`
      );
    });

    const lines = [];

    if (queryParams.length > 0) {
      lines.push(`    const params = new URLSearchParams();`);
      lines.push(`    if (options) {`);
      queryParams.forEach((param) => {
        lines.push(`      if (options.${param.name} !== undefined) {`);
        // Check if parameter is an array type
        const isArray = param.type.endsWith('[]');
        if (isArray) {
          lines.push(`        if (Array.isArray(options.${param.name})) {`);
          lines.push(`          options.${param.name}.forEach((item) => {`);
          lines.push(
            `            params.append('${param.name}', String(item));`
          );
          lines.push(`          });`);
          lines.push(`        } else {`);
          lines.push(
            `          params.append('${param.name}', String(options.${param.name}));`
          );
          lines.push(`        }`);
        } else {
          lines.push(
            `        params.append('${param.name}', String(options.${param.name}));`
          );
        }
        lines.push(`      }`);
      });
      lines.push(`    }`);
      lines.push(`    const queryString = params.toString();`);
      lines.push(
        `    const url = \`${path}\${queryString ? \`?\${queryString}\` : ''}\`;`
      );
    } else {
      lines.push(`    const url = \`${path}\`;`);
    }

    if (operation.requestBody) {
      if (operation.method === 'DELETE') {
        lines.push(
          `    const response = await this.httpClient.${operation.method.toLowerCase()}(url, { data });`
        );
      } else {
        lines.push(
          `    const response = await this.httpClient.${operation.method.toLowerCase()}(url, data);`
        );
      }
    } else {
      lines.push(
        `    const response = await this.httpClient.${operation.method.toLowerCase()}(url);`
      );
    }

    lines.push(`    return response.data;`);

    return lines.join('\n    ');
  }

  private camelCase(str: string): string {
    return str.replace(/([A-Z])/g, (match, p1, offset) => {
      return offset === 0 ? p1.toLowerCase() : p1;
    });
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Extract parameter names from a path template
   * e.g., "storage-units/{storageUnitId}" -> ["storageUnitId"]
   */
  private extractPathParamNames(path: string): string[] {
    const matches = path.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return matches.map((match) => match.slice(1, -1)); // Remove { and }
  }
}
