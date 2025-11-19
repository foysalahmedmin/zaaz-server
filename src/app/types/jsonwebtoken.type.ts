export type TRole = 'super-admin' | 'admin' | 'user';

export type TJwtPayload = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role?: TRole;
  is_verified?: boolean;
};
