import { JsonObject } from '@longpoint/types';

// export interface ClassifyArgs<T extends ConfigValues = ConfigValues> {
//   source: AssetSource;
//   modelConfig: T;
// }

export interface Classify {
  classify(args: any): Promise<JsonObject>;
}
