import {
  ClassificationProvider,
  ClassificationProviderArgs,
  ClassifyArgs,
  LLMFieldCaptureInputValues,
} from '@longpoint/devkit/classifier';
import { JsonObject } from '@longpoint/types';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod.mjs';
import z from 'zod';
import { OpenAIPluginSettings } from './settings.js';

export class OpenAIClassificationProvider extends ClassificationProvider<OpenAIPluginSettings> {
  constructor(args: ClassificationProviderArgs<OpenAIPluginSettings>) {
    super(args);
  }

  async classify(
    args: ClassifyArgs<LLMFieldCaptureInputValues>
  ): Promise<JsonObject> {
    const client = new OpenAI({
      apiKey: this.pluginSettings.apiKey,
    });
    const mainTypes = [z.string(), z.number(), z.boolean()];
    const schema = z.object(
      args.classifierInput.fieldCapture.reduce((acc, curr) => {
        acc[curr.name] = z.union([...mainTypes, z.array(z.union(mainTypes))]);
        return acc;
      }, {} as Record<string, z.ZodType>)
    );

    const systemPrompt = `
      You are a classifier.
      You will be given an image and a list of fields to capture.
      You will need to capture the fields from the image, based on each field's instructions.
      Some fields will have no particular instructions, in which case use your best judgment to capture the field.
      e.g. For the field "type", with instructions "Choose the type of fruit", the response might be: {"type": "apple"}
    `;

    const response = await client.responses.parse({
      model: this.providerId,
      instructions: systemPrompt,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              detail: 'auto',
              image_url: args.source.base64DataUri ?? args.source.url,
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(schema, 'classifier_output'),
      },
    });

    return (response.output_parsed as JsonObject) ?? {};
  }
}
