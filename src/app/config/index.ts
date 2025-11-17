import dotenv from 'dotenv';
import path from 'path';

export type ExpiresIn = `${number}${'s' | 'm' | 'h' | 'd'}` | number;

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  node_dev: process.env.NODE_ENV as string,
  port: (process.env.PORT as string) || 5000,
  url:
    (process.env.URL as string) ||
    `http://localhost:${process.env.PORT || 5000}`,
  cluster_enabled: process.env.CLUSTER_ENABLED === 'true' ? true : false,
  redis_enabled: !!(
    process.env.REDIS_ENABLED === 'true' && !!process.env.REDIS_URL
  )
    ? true
    : false,
  redis_url: process.env.REDIS_URL as string,
  redis_password: process.env.REDIS_PASSWORD as string,
  database_url: process.env.DATABASE_URL as string,
  front_end_url: process.env.FRONT_END_URL as string,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS as string,
  default_password: process.env.DEFAULT_PASSWORD as string,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET as string,
  jwt_access_secret_expires_in: process.env
    .JWT_ACCESS_SECRET_EXPIRES_IN as ExpiresIn,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET as string,
  jwt_refresh_secret_expires_in: process.env
    .JWT_REFRESH_SECRET_EXPIRES_IN as ExpiresIn,
  jwt_reset_password_secret: process.env.JWT_RESET_PASSWORD_SECRET as string,
  jwt_reset_password_secret_expires_in: process.env
    .JWT_RESET_PASSWORD_SECRET_EXPIRES_IN as ExpiresIn,
  jwt_email_verification_secret: process.env
    .JWT_EMAIL_VERIFICATION_SECRET as string,
  jwt_email_verification_secret_expires_in: process.env
    .JWT_EMAIL_VERIFICATION_SECRET_EXPIRES_IN as ExpiresIn,
  session_secret: process.env.SESSION_SECRET as string,
  reset_password_ui_link: process.env.RESET_PASSWORD_UI_LINK as string,
  email_verification_ui_link: process.env.EMAIL_VERIFICATION_UI_LINK as string,
  auth_user_email: process.env.AUTH_USER_EMAIL as string,
  auth_user_email_password: process.env.AUTH_USER_EMAIL_PASSWORD as string,
};

// node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
// node -e "console.log(require('crypto').createHash('sha256').update('password' + 12).digest('hex'))"
