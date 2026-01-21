export const DEFAULT_AI_MODEL = {
  name: 'Default AI Model',
  value: 'default-model',
  provider: 'system',
  input_token_price: Number(process.env.DEFAULT_INPUT_TOKEN_PRICE || 0.0000003),
  output_token_price: Number(
    process.env.DEFAULT_OUTPUT_TOKEN_PRICE || 0.0000025,
  ),
  currency: 'USD',
  is_initial: true,
  is_active: true,
};
