export const slugify = (text: string) => {
  return text.toString().trim().replace(/\s+/g, '-');
};
