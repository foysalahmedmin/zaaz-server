import CircuitBreaker from 'opossum';
import { circuitBreakerStatus } from './credits-process.metrics';

const options: CircuitBreaker.Options = {
  timeout: 3000, // If function time > 3s, trigger failure
  errorThresholdPercentage: 50, // When 50% of requests fail
  resetTimeout: 10000, // Wait 10s before trying again
};

export const createCreditsBreaker = (
  action: (...args: any[]) => Promise<any>,
  name: string,
) => {
  const breaker = new CircuitBreaker(action, { ...options, name });

  breaker.on('open', () => {
    circuitBreakerStatus.set({ service: name }, 1);
    console.warn(`[Circuit Breaker] OPEN: ${name}`);
  });

  breaker.on('halfOpen', () => {
    console.log(`[Circuit Breaker] HALF-OPEN: ${name}`);
  });

  breaker.on('close', () => {
    circuitBreakerStatus.set({ service: name }, 0);
    console.log(`[Circuit Breaker] CLOSED: ${name}`);
  });

  breaker.on('fallback', () => {
    console.warn(`[Circuit Breaker] FALLBACK TRIGGERED: ${name}`);
  });

  return breaker;
};
