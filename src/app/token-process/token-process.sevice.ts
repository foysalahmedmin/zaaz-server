import axios from 'axios';
import {
  TTokenProcessEndPayload,
  TTokenProcessEndResponse,
  TTokenProcessStartPayload,
  TTokenProcessStartResponse,
} from './token-process.type';

const TOKEN_SERVER_URL =
  process.env.TOKEN_SERVER_URL || 'http://localhost:5000';

export const tokenProcessStart = async (
  payload: TTokenProcessStartPayload,
): Promise<TTokenProcessStartResponse> => {
  const res = await axios.get<TTokenProcessStartResponse>(
    `${TOKEN_SERVER_URL}/api/token-process/start`,
    { params: payload },
  );
  return res.data;
};

export const tokenProcessEnd = async (
  payload: TTokenProcessEndPayload,
): Promise<TTokenProcessEndResponse> => {
  const res = await axios.post<TTokenProcessEndResponse>(
    `${TOKEN_SERVER_URL}/api/token-process/end`,
    payload,
  );
  return res.data;
};
