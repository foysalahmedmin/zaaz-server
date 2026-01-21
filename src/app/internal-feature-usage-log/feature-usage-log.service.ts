import axios from 'axios';
import {
  TFeatureUsageLogFromServer,
  TFeatureUsageLogResponse,
} from './feature-usage-log.type';

const TOKEN_SERVER_URL =
  process.env.TOKEN_SERVER_URL || 'http://localhost:5000';
const SERVER_API_KEY = process.env.SERVER_API_KEY || '';

/**
 * Create feature usage log via API
 */
export const createFeatureUsageLog = async (
  payload: TFeatureUsageLogFromServer,
): Promise<TFeatureUsageLogResponse> => {
  const res = await axios.post<TFeatureUsageLogResponse>(
    `${TOKEN_SERVER_URL}/api/feature-usage-logs`,
    payload,
    {
      headers: {
        'x-server-api-key': SERVER_API_KEY,
        'Content-Type': 'application/json',
      },
    },
  );
  return res.data;
};
