import httpStatus from 'http-status';
import AppError from '../../builder/AppError';
import AppQuery from '../../builder/AppQuery';
import { TokenProfitHistory } from './token-profit-history.model';
import { TTokenProfitHistory } from './token-profit-history.type';

export const getTokenProfitHistories = async (
  tokenProfitId: string,
  query: Record<string, unknown> = {},
): Promise<{
  data: TTokenProfitHistory[];
  meta: { total: number; page: number; limit: number };
}> => {
  const tokenProfitHistoryQuery = new AppQuery<TTokenProfitHistory>(
    TokenProfitHistory.find({ token_profit: tokenProfitId }).populate([
      { path: 'token_profit' },
    ]),
    query,
  )
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  const result = await tokenProfitHistoryQuery.execute();

  return result;
};

export const getTokenProfitHistory = async (
  id: string,
): Promise<TTokenProfitHistory> => {
  const result = await TokenProfitHistory.findById(id).populate([
    { path: 'token_profit' },
  ]);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Token profit history not found');
  }
  return result;
};

