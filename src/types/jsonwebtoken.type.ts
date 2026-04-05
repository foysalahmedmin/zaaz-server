export type TRole =
  | 'super-admin'
  | 'admin'
  | 'editor'
  | 'author'
  | 'contributor'
  | 'subscriber'
  | 'user';

export type TJwtPayload = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role?: TRole;
  is_verified?: boolean;
  auth_source?: 'email' | 'google';
  token_version?: number;
};


