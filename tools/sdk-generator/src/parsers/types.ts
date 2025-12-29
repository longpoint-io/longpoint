export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  tags: Array<{
    name: string;
    description?: string;
  }>;
  paths: Record<string, Record<string, OpenAPIOperation>>;
  components: {
    schemas: Record<string, OpenAPISchema>;
  };
}

export interface OpenAPISchema {
  type?: string;
  properties?: Record<string, OpenAPISchema>;
  required?: string[];
  enum?: any[];
  format?: string;
  description?: string;
  example?: any;
  allOf?: Array<{ $ref?: string; [key: string]: any }>;
  oneOf?: Array<{
    type?: string;
    $ref?: string;
    items?: OpenAPISchema;
    [key: string]: any;
  }>;
  $ref?: string;
  items?: OpenAPISchema;
  additionalProperties?: boolean | OpenAPISchema;
}

export interface OpenAPIOperation {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: Array<{
    name: string;
    in: 'path' | 'query' | 'header';
    required?: boolean;
    schema: any;
  }>;
  requestBody?: {
    required?: boolean;
    content: Record<
      string,
      {
        schema: any;
      }
    >;
  };
  responses: Record<
    string,
    {
      description?: string;
      content?: Record<
        string,
        {
          schema: any;
        }
      >;
    }
  >;
  security?: Array<Record<string, string[]>>;
}

export interface ParsedOperation {
  tag: string;
  method: string;
  path: string;
  operationId: string;
  summary: string;
  description?: string;
  parameters: Array<{
    name: string;
    in: 'path' | 'query' | 'header';
    required: boolean;
    type: string;
  }>;
  requestBody?: {
    required: boolean;
    type: string;
  };
  responseType: string;
}
