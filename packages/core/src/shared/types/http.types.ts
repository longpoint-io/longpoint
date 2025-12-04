import { SelectedUser } from '@/modules/user/user.selectors';

declare module 'express' {
  interface Request {
    user?: SelectedUser;
  }
}
