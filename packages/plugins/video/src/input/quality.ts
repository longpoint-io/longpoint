import { ConfigSchemaValue } from '@longpoint/config-schema';

const qualityInput: ConfigSchemaValue = {
  label: 'Quality settings',
  type: 'object',
  description: 'Video quality and encoding settings',
  properties: {
    bitrate: {
      label: 'Bitrate',
      type: 'number',
      description: 'Video bitrate in kbps',
      placeholder: '5000',
    },
    codec: {
      label: 'Video codec',
      type: 'string',
      description: 'Video codec to use (e.g., h264, h265, vp9)',
      placeholder: 'h264',
    },
    preset: {
      label: 'Encoding preset',
      type: 'string',
      description: 'Encoding preset (e.g., fast, medium, slow)',
      placeholder: 'medium',
    },
    crf: {
      label: 'Constant Rate Factor',
      type: 'number',
      description: 'Quality factor (0-51, lower is better quality)',
      placeholder: '23',
    },
  },
};

export default qualityInput;
