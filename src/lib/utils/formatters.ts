import { APP_CONFIG } from '@/constants/config';

export function formatCurrency(
  amount: number,
  currency: string = APP_CONFIG.defaultCurrency,
): string {
  return `${currency} ${amount.toLocaleString()}`;
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
