import axios from 'axios';
import {
  TGiveBonusCreditsPayload,
  TGiveBonusCreditsResponse,
  TGiveInitialCreditsPayload,
  TGiveInitialCreditsResponse,
} from './give-credits.type';

const TOKEN_SERVER_URL =
  process.env.TOKEN_SERVER_URL || 'http://localhost:5000';
const SERVER_API_KEY = process.env.SERVER_API_KEY || '';

export const giveInitialCredits = async (
  payload: TGiveInitialCreditsPayload,
): Promise<TGiveInitialCreditsResponse> => {
  const res = await axios.post<TGiveInitialCreditsResponse>(
    `${TOKEN_SERVER_URL}/api/user-wallets/give-initial-credits`,
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

export const giveBonusCredits = async (
  payload: TGiveBonusCreditsPayload,
): Promise<TGiveBonusCreditsResponse> => {
  const res = await axios.post<TGiveBonusCreditsResponse>(
    `${TOKEN_SERVER_URL}/api/user-wallets/give-bonus-credits`,
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
