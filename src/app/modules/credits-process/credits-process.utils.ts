export const calculateTokenCosts = (
  input_token: number,
  output_token: number,
  input_token_price: number,
  output_token_price: number,
  credit_price: number,
) => {
  const input_cost_price = input_token * input_token_price;
  const output_cost_price = output_token * output_token_price;
  const total_cost_price = input_cost_price + output_cost_price;

  const input_cost_credits = input_cost_price / credit_price;
  const output_cost_credits = output_cost_price / credit_price;
  const base_cost_credits = total_cost_price / credit_price;

  return {
    input_cost_price,
    output_cost_price,
    total_cost_price,
    input_cost_credits,
    output_cost_credits,
    base_cost_credits,
  };
};

export const calculateAuditCredits = (
  base_cost_credits: number,
  profit_percentage: number,
  credit_price: number,
) => {
  const profit_credits = base_cost_credits * (profit_percentage / 100);
  const cost_credits = base_cost_credits + profit_credits;

  // Use Math.ceil for rounding up to ensure we cover costs
  const rounding_credits = Math.ceil(cost_credits) - cost_credits;
  const final_total_credits = Math.ceil(cost_credits);

  // Calculate price equivalents (optional, for reference)
  const cost_price = cost_credits * credit_price;
  const final_total_price = final_total_credits * credit_price;
  const rounding_price = rounding_credits * credit_price;

  return {
    profit_credits,
    cost_credits,
    rounding_credits,
    final_total_credits,
    cost_price,
    final_total_price,
    rounding_price,
  };
};

export const mapUsageAuditDetails = (usageInfo: any, audit: any) => {
  // Mapping logic ... keeping it simple for now or copying from existing if complex
  // Assuming the service handles the main mapping, this utility might just be helpers
  // This function seems to be used in service, let's assume it returns a clean object
  return {
    ai_model: usageInfo.ai_model,
    input_tokens: usageInfo.input_tokens,
    output_tokens: usageInfo.output_tokens,
    input_credits: audit.input_cost_credits, // Approximation if needed
    output_credits: audit.output_cost_credits,
    input_token_price: usageInfo.input_token_price,
    output_token_price: usageInfo.output_token_price,
    profit_credits_percentage: usageInfo.profit_credits_percentage,
    profit_credits: audit.profit_credits,
    cost_credits: audit.cost_credits,
    cost_price: audit.cost_price, // internal only?
    credits: audit.final_total_credits,
    price: audit.final_total_price,
    rounding_credits: audit.rounding_credits,
    rounding_price: audit.rounding_price,
    // ... other fields
    credit_price: usageInfo.credit_price,
  };
};
