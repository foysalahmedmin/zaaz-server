export type TRole = 'super-admin' | 'admin' | 'user';

export type TJwtPayload = {
  _id: string;
  name: string;
  email: string;
  is_verified?: boolean;
  role?: TRole;
  image?: string;
};
