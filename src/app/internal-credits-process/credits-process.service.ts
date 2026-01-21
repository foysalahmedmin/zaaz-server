import axios from 'axios';
import {
  TCreditsProcessEndMultimodelPayload,
  TCreditsProcessEndMultimodelResponse,
  TCreditsProcessEndPayload,
  TCreditsProcessEndResponse,
  TCreditsProcessStartPayload,
  TCreditsProcessStartResponse,
} from './credits-process.type';

const TOKEN_SERVER_URL =
  process.env.TOKEN_SERVER_URL || 'http://localhost:5000';
const SERVER_API_KEY = process.env.SERVER_API_KEY || '';

/**
 * Start credit process
 */
export const creditsProcessStart = async (
  payload: TCreditsProcessStartPayload,
): Promise<TCreditsProcessStartResponse> => {
  const res = await axios.post<TCreditsProcessStartResponse>(
    `${TOKEN_SERVER_URL}/api/credits-process/start`,
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

/**
 * End credit process (Single-model)
 */
export const creditsProcessEnd = async (
  payload: TCreditsProcessEndPayload,
): Promise<TCreditsProcessEndResponse> => {
  const res = await axios.post<TCreditsProcessEndResponse>(
    `${TOKEN_SERVER_URL}/api/credits-process/end`,
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

/**
 * End credit process (Multi-model)
 */
export const creditsProcessEndMultimodel = async (
  payload: TCreditsProcessEndMultimodelPayload,
): Promise<TCreditsProcessEndMultimodelResponse> => {
  const res = await axios.post<TCreditsProcessEndMultimodelResponse>(
    `${TOKEN_SERVER_URL}/api/credits-process/end-multimodel`,
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
