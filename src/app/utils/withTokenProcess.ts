import {
  tokenProcessEnd,
  tokenProcessStart,
} from '../token-process/token-process.service';

interface TokenProcessOptions {
  feature_endpoint_id: string;
  user_id: string | ((...args: any[]) => string);
}

export const withTokenProcess = <
  T extends any[],
  R extends { input_token?: number; output_token?: number },
>(
  options: TokenProcessOptions,
  serviceFn: (...args: T) => Promise<R>,
) => {
  return async (...args: T): Promise<R> => {
    const { feature_endpoint_id, user_id } = options;

    // Get user ID
    const userId = typeof user_id === 'function' ? user_id(...args) : user_id;

    // Start token process
    const startResult = await tokenProcessStart({
      user_id: userId,
      feature_endpoint_id,
    });

    if (startResult.data.status !== 'access-able') {
      throw new Error(
        `Insufficient tokens. Available: ${startResult.data.token}`,
      );
    }

    // Execute service
    const result = await serviceFn(...args);

    // Get input_token and output_token from result
    const inputToken = result.input_token || 0;
    const outputToken = result.output_token || 0;

    // End token process if tokens > 0
    if (inputToken > 0 || outputToken > 0) {
      try {
        await tokenProcessEnd({
          user_id: userId,
          feature_endpoint_id,
          input_token: inputToken,
          output_token: outputToken,
          model: (result as any).model,
        });
      } catch (error) {
        console.error('[Token Process] End error:', error);
      }
    }

    return result;
  };
};
