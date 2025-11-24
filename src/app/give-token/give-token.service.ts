import axios from 'axios';
import {
  TGiveBonusTokenPayload,
  TGiveBonusTokenResponse,
  TGiveInitialTokenPayload,
  TGiveInitialTokenResponse,
} from './give-token.type';

const TOKEN_SERVER_URL =
  process.env.TOKEN_SERVER_URL || 'http://localhost:5000';
const SERVER_API_KEY = process.env.SERVER_API_KEY || '';

export const giveInitialToken = async (
  payload: TGiveInitialTokenPayload,
): Promise<TGiveInitialTokenResponse> => {
  const res = await axios.post<TGiveInitialTokenResponse>(
    `${TOKEN_SERVER_URL}/api/user-wallets/give-initial-token`,
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

export const giveBonusToken = async (
  payload: TGiveBonusTokenPayload,
): Promise<TGiveBonusTokenResponse> => {
  const res = await axios.post<TGiveBonusTokenResponse>(
    `${TOKEN_SERVER_URL}/api/user-wallets/give-bonus-token`,
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
