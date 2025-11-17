export type TErrorSources = {
  path: string | number;
  message: string;
}[];

export type TErrorResponse = {
  status: number;
  message: string;
  sources: TErrorSources;
};
