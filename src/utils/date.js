import { parseISO, format } from 'date-fns';

export function prettyDate(iso) {
  try {
    return format(parseISO(iso), 'MMM dd, yyyy');
  } catch (e) {
    return iso;
  }
}
