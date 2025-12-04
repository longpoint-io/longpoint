import { SelectedUser } from '@/modules/user/user.selectors';

export type RequestUser = SelectedUser;

declare module 'express' {
  interface Request {
    user?: RequestUser;
  }
}
