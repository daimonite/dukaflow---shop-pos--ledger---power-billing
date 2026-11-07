// All "which day is it?" logic goes through here, so a sale made at 00:30 in
// Dar es Salaam lands on that day, not the previous one (UTC is 3 hours behind).
export const SHOP_TIMEZONE = 'Africa/Dar_es_Salaam';

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SHOP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Returns the shop-local calendar day as YYYY-MM-DD. */
export const shopDateKey = (input: string | Date = new Date()): string => {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  const d = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(d.getTime())) return '';
  return dayFormatter.format(d); // en-CA gives YYYY-MM-DD
};

/** Returns the shop-local month as YYYY-MM. */
export const shopMonthKey = (input: string | Date = new Date()): string =>
  shopDateKey(input).slice(0, 7);
