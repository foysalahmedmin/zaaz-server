import dotenv from 'dotenv';
import path from 'path';

export type ExpiresIn = `${number}${'s' | 'm' | 'h' | 'd'}` | number;

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  // 🌐 Server Configuration
  node_env: process.env.NODE_ENV as string,
  port: process.env.PORT as string,
  url:
    (process.env.URL as string) ||
    `http://localhost:${process.env.PORT || 5000}`,

  // 🗄️ Database Configuration
  database_url: process.env.DATABASE_URL as string,

  // 🔐 Security Configuration
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS as string,
  session_secret: process.env.SESSION_SECRET as string,
  server_api_key: process.env.SERVER_API_KEY as string,
  default_password: process.env.DEFAULT_PASSWORD as string,

  // 🪪 JWT Configuration
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

  // ⚙️ Cluster Configuration
  cluster_enabled: process.env.CLUSTER_ENABLED === 'true',

  // ⚡ Redis Configuration
  redis_enabled:
    process.env.REDIS_ENABLED === 'true' &&
    (!!process.env.REDIS_HOST || !!process.env.REDIS_URL),
  redis_host: process.env.REDIS_HOST as string,
  redis_port: process.env.REDIS_PORT as string,
  redis_password: process.env.REDIS_PASSWORD as string,
  redis_url: process.env.REDIS_URL as string,

  // 🐇 RabbitMQ Configuration
  rabbitmq_enabled:
    process.env.RABBITMQ_ENABLED === 'true' && !!process.env.RABBITMQ_URL,
  rabbitmq_url: process.env.RABBITMQ_URL as string,

  // 🌍 CORS Configuration
  cors_origins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
        .filter(Boolean)
        .map((origin) => origin.trim())
    : [],

  // 🌍 Frontend Configuration
  adminpanel_url: process.env.ADMINPANEL_URL as string,
  website_url: process.env.WEBSITE_URL as string,

  // 🔗 UI Links Configuration
  reset_password_ui_link: process.env.RESET_PASSWORD_UI_LINK as string,
  email_verification_ui_link: process.env.EMAIL_VERIFICATION_UI_LINK as string,

  // 📧 Email Configuration
  email: process.env.EMAIL as string,
  email_provider: process.env.EMAIL_PROVIDER as string,

  smtp_host: process.env.SMTP_HOST as string,
  smtp_port: process.env.SMTP_PORT as string,
  smtp_email: process.env.SMTP_EMAIL as string,
  smtp_email_password: process.env.SMTP_EMAIL_PASSWORD as string,

  resend_email: process.env.RESEND_EMAIL as string,
  resend_api_key: process.env.RESEND_API_KEY as string,

  sendgrid_email: process.env.SENDGRID_EMAIL as string,
  sendgrid_api_key: process.env.SENDGRID_API_KEY as string,

  // 💳 Credits & Token Pricing Configuration
  default_credit_price: process.env.DEFAULT_CREDIT_PRICE as string,
  default_input_token_price: process.env.DEFAULT_INPUT_TOKEN_PRICE as string,
  default_output_token_price: process.env.DEFAULT_OUTPUT_TOKEN_PRICE as string,

  // 🔐 Google OAuth Configuration
  google_client_id: process.env.GOOGLE_CLIENT_ID as string,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET as string,

  // ☁️ Google Cloud Configuration
  google_application_credentials: process.env
    .GOOGLE_APPLICATION_CREDENTIALS as string,

  google_cloud_storage_bucket: process.env
    .GOOGLE_CLOUD_STORAGE_BUCKET as string,

  google_cloud_project_id: process.env.GOOGLE_CLOUD_PROJECT_ID as string,

  // 💳 Stripe Configuration
  stripe_public_key: process.env.STRIPE_PUBLIC_KEY as string,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY as string,
  stripe_webhook_secret_key: process.env.STRIPE_WEBHOOK_SECRET_KEY as string,

  stripe_public_key_test: process.env.STRIPE_PUBLIC_KEY_TEST as string,
  stripe_secret_key_test: process.env.STRIPE_SECRET_KEY_TEST as string,
  stripe_webhook_secret_key_test: process.env
    .STRIPE_WEBHOOK_SECRET_KEY_TEST as string,

  // 💰 bKash Configuration
  bkash_username: process.env.BKASH_USERNAME as string,
  bkash_password: process.env.BKASH_PASSWORD as string,
  bkash_app_key: process.env.BKASH_APP_KEY as string,
  bkash_app_secret: process.env.BKASH_APP_SECRET as string,
  bkash_base_url: process.env.BKASH_BASE_URL as string,

  bkash_username_test: process.env.BKASH_USERNAME_TEST as string,
  bkash_password_test: process.env.BKASH_PASSWORD_TEST as string,
  bkash_app_key_test: process.env.BKASH_APP_KEY_TEST as string,
  bkash_app_secret_test: process.env.BKASH_APP_SECRET_TEST as string,
  bkash_base_url_test: process.env.BKASH_BASE_URL_TEST as string,

  // 🏦 SSLCommerz Configuration
  sslcommerz_store_id: process.env.SSLCOMMERZ_STORE_ID as string,
  sslcommerz_store_password: process.env.SSLCOMMERZ_STORE_PASSWORD as string,
  sslcommerz_base_url: process.env.SSLCOMMERZ_BASE_URL as string,

  sslcommerz_store_id_test: process.env.SSLCOMMERZ_STORE_ID_TEST as string,
  sslcommerz_store_password_test: process.env
    .SSLCOMMERZ_STORE_PASSWORD_TEST as string,
  sslcommerz_base_url_test: process.env.SSLCOMMERZ_BASE_URL_TEST as string,
};

// =========================================================
// 🔐 Secret Generator Commands
// =========================================================

// Generate secure random secret
// node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

// Generate hashed password
// node -e "console.log(require('crypto').createHash('sha256').update('password' + 12).digest('hex'))"
