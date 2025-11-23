import axios from 'axios';
import {
  TTokenProcessEndPayload,
  TTokenProcessEndResponse,
  TTokenProcessStartPayload,
  TTokenProcessStartResponse,
} from './token-process.type';

const TOKEN_SERVER_URL =
  process.env.TOKEN_SERVER_URL || 'http://localhost:5000';
const SERVER_API_KEY = process.env.SERVER_API_KEY || '';

export const tokenProcessStart = async (
  payload: TTokenProcessStartPayload,
): Promise<TTokenProcessStartResponse> => {
  const res = await axios.post<TTokenProcessStartResponse>(
    `${TOKEN_SERVER_URL}/api/token-process/start`,
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

export const tokenProcessEnd = async (
  payload: TTokenProcessEndPayload,
): Promise<TTokenProcessEndResponse> => {
  const res = await axios.post<TTokenProcessEndResponse>(
    `${TOKEN_SERVER_URL}/api/token-process/end`,
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
