import { ConfigSchemaValue } from '@longpoint/config-schema';

const watermarkInput: ConfigSchemaValue = {
  label: 'Watermark',
  type: 'object',
  description: 'Add watermark to video',
  properties: {
    enabled: {
      label: 'Enabled',
      type: 'boolean',
      description: 'Enable watermark overlay',
    },
    imagePath: {
      label: 'Watermark image path',
      type: 'string',
      description: 'Path to watermark image file',
      placeholder: '/path/to/watermark.png',
    },
    position: {
      label: 'Position',
      type: 'string',
      description: 'Watermark position on video',
      placeholder: 'bottom-right',
    },
    opacity: {
      label: 'Opacity',
      type: 'number',
      description: 'Watermark opacity (0.0 to 1.0)',
      placeholder: '0.5',
    },
    size: {
      label: 'Watermark size',
      type: 'object',
      description: 'Watermark dimensions',
      properties: {
        width: {
          label: 'Width',
          type: 'number',
          description: 'Width in pixels',
        },
        height: {
          label: 'Height',
          type: 'number',
          description: 'Height in pixels',
        },
        scale: {
          label: 'Scale percentage',
          type: 'number',
          description: 'Scale as percentage of video dimensions (0-100)',
        },
      },
    },
  },
};

export default watermarkInput;
