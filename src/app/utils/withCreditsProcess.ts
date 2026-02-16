import {
  creditsProcessEnd,
  creditsProcessStart,
} from '../modules/credits-process/credits-process.service';

interface CreditsProcessOptions {
  feature_endpoint_id: string;
  user_id: string | ((...args: any[]) => string);
}

export const withCreditsProcess = <
  T extends any[],
  R extends { input_token?: number; output_token?: number },
>(
  options: CreditsProcessOptions,
  serviceFn: (...args: T) => Promise<R>,
) => {
  return async (...args: T): Promise<R> => {
    const { feature_endpoint_id, user_id } = options;

    // Get user ID
    const userId = typeof user_id === 'function' ? user_id(...args) : user_id;

    // Start credits process
    const startResult = await creditsProcessStart({
      user_id: userId,
      feature_endpoint_id,
    });

    if (startResult.status !== 'accessible') {
      throw new Error(
        `Insufficient credits. Available: ${startResult.credits}`,
      );
    }

    // Execute service
    const result = await serviceFn(...args);

    // Get input_token and output_token from result
    const inputToken = result.input_token || 0;
    const outputToken = result.output_token || 0;

    // End credits process if tokens > 0
    if (inputToken > 0 || outputToken > 0) {
      try {
        await creditsProcessEnd({
          user_id: userId,
          feature_endpoint_id,
          usages: [
            {
              input_tokens: inputToken,
              output_tokens: outputToken,
              ai_model: (result as any).ai_model || (result as any).model,
            },
          ],
        });
      } catch (error) {
        console.error('[Credits Process] End error:', error);
      }
    }

    return result;
  };
};
