import { User } from '../services/user.service';

/**
 * Get user initials from first and last name
 */
export function getUserInitials(user: User | null): string {
  if (!user) return '?';
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const first = firstName.charAt(0).toUpperCase();
  const last = lastName.charAt(0).toUpperCase();
  return first && last ? `${first}${last}` : first || last || '?';
}

