import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.DEV ? 'http://localhost:3000' : undefined,
  plugins: [
    inferAdditionalFields({
      user: {
        permissions: {
          type: 'json',
          input: false,
        },
      },
    }),
  ],
});
