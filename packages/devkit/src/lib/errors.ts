export class LongpointPluginError extends Error {
  constructor(
    message: string,
    public readonly details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'LongpointPluginError';
  }
}
