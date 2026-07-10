export const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

export const parseStringList = (value: string[] | string | null | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(',').map((item) => item.trim()).filter(Boolean);
};
