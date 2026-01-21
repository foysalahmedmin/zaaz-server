export type TGiveInitialCreditsPayload = {
  user_id: string;
  email?: string;
  credits?: number;
  duration?: number;
};

export type TGiveInitialCreditsResponse = {
  success: boolean;
  message: string;
  data: {
    _id: string;
    user: string;
    email?: string;
    package?: string | null;
    credits: number;
    expires_at?: string | null;
    initial_credits_given: boolean;
    created_at: string;
    updated_at: string;
  };
};

export type TGiveBonusCreditsPayload = {
  user_id: string;
  email?: string;
  credits: number;
  duration?: number;
};

export type TGiveBonusCreditsResponse = {
  success: boolean;
  message: string;
  data: {
    _id: string;
    user: string;
    email?: string;
    package?: string | null;
    credits: number;
    expires_at?: string | null;
    initial_credits_given: boolean;
    created_at: string;
    updated_at: string;
  };
};
