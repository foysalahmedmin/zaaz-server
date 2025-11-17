export const dirYearMonth = (
  date?: Date | string | number,
): {
  year: string;
  month: string;
  suffix: string;
} => {
  const now = date ? new Date(date) : new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const suffix = `${year}/${month}`;

  return { year, month, suffix };
};
