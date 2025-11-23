import {
  tokenProcessEnd,
  tokenProcessStart,
} from '../token-process/token-process.service';

interface TokenProcessOptions {
  feature_endpoint_id: string;
  user_id: string | ((...args: any[]) => string);
}

export const withTokenProcess = <T extends any[], R extends { cost?: number }>(
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

    // Get cost from result
    const tokenCost = result.cost || 0;

    // End token process if cost > 0
    if (tokenCost > 0) {
      try {
        await tokenProcessEnd({
          user_id: userId,
          feature_endpoint_id,
          cost: tokenCost,
        });
      } catch (error) {
        console.error('[Token Process] End error:', error);
      }
    }

    return result;
  };
};
