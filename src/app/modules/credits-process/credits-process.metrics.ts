import client from 'prom-client';

// Registry
const register = new client.Registry();

// Enable default metrics (cpu, memory, etc.)
client.collectDefaultMetrics({ register });

// 1. API Latency Histogram
export const creditsProcessDuration = new client.Histogram({
  name: 'credits_process_duration_seconds',
  help: 'Duration of credits processing in seconds',
  labelNames: ['method', 'status', 'mode'], // mode: 'sync' | 'async'
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// 2. Total Requests Counter
export const creditsProcessTotal = new client.Counter({
  name: 'credits_process_total',
  help: 'Total number of credits process requests',
  labelNames: ['method', 'status'],
});

// 3. Error Counter
export const creditsProcessErrors = new client.Counter({
  name: 'credits_process_errors_total',
  help: 'Total number of credits process errors',
  labelNames: ['method', 'error_type'],
});

// 4. Batch Size Histogram
export const creditsBatchSize = new client.Histogram({
  name: 'credits_batch_size',
  help: 'Size of credit process batches',
  buckets: [1, 5, 10, 20, 50, 100],
});

// 5. Cache Metrics
export const creditsCacheHits = new client.Counter({
  name: 'credits_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'], // 'l1' | 'l2'
});

export const creditsCacheMisses = new client.Counter({
  name: 'credits_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
});

// 6. Active Circuit Breakers
export const circuitBreakerStatus = new client.Gauge({
  name: 'credits_circuit_breaker_status',
  help: 'Status of circuit breakers (0=closed/healthy, 1=open/broken)',
  labelNames: ['service'],
});

register.registerMetric(creditsProcessDuration);
register.registerMetric(creditsProcessTotal);
register.registerMetric(creditsProcessErrors);
register.registerMetric(creditsBatchSize);
register.registerMetric(creditsCacheHits);
register.registerMetric(creditsCacheMisses);
register.registerMetric(circuitBreakerStatus);

export default register;
