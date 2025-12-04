import { SelectedUser } from '@/shared/selectors/user.selectors';

declare module 'express' {
  interface Request {
    user?: SelectedUser;
  }
}
