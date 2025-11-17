export type TRole = 'super-admin' | 'admin' | 'user';

export type TJwtPayload = {
  _id: string;
  name: string;
  email: string;
  is_verified?: boolean;
  role?: TRole;
  sub?: string;
  image?: string;
  package?: string;
};
