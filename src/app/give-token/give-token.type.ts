export type TGiveInitialTokenPayload = {
  user_id: string;
  token?: number;
  duration?: number;
};

export type TGiveInitialTokenResponse = {
  success: boolean;
  message: string;
  data: {
    _id: string;
    user: string;
    package?: string | null;
    token: number;
    expires_at?: string | null;
    initial_token_given: boolean;
    created_at: string;
    updated_at: string;
  };
};

export type TGiveBonusTokenPayload = {
  user_id: string;
  token: number;
  duration?: number;
};

export type TGiveBonusTokenResponse = {
  success: boolean;
  message: string;
  data: {
    _id: string;
    user: string;
    package?: string | null;
    token: number;
    expires_at?: string | null;
    initial_token_given: boolean;
    created_at: string;
    updated_at: string;
  };
};
