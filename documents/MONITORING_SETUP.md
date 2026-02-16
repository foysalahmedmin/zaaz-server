# Monitoring Setup Guide

The `docker-compose.dev.yml` and `docker-compose.prod.yml` files include configuration for Prometheus and Grafana. To fully enable application-level metrics, follow these steps:

## 1. Install Dependencies

```bash
pnpm add prom-client
```

## 2. Expose Metrics Endpoint

Update `src/app.ts` to include the metrics route:

```typescript
import client from 'prom-client';

// Enable default metrics collection
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Add metrics route
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

## 3. Verify

Access `http://localhost:5000/metrics` to see the exposed metrics. Prometheus will automatically scrape this endpoint based on the configuration in `monitoring/prometheus.yml`.
