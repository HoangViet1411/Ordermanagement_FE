import { User } from '../services/user.service';

// Helper function to check if account is unverified
function isUnverifiedAccount(userStatus: string, email?: string): boolean {
  const status = (userStatus || '').toUpperCase();
  return status === 'UNCONFIRMED' || 
         status === 'FORCE_CHANGE_PASSWORD' ||
         (status === 'UNKNOWN' && (!email || email === 'N/A'));
}

export enum UserStatusType {
  DISABLED = 'disabled',
  UNVERIFIED = 'unverified',
  ENABLED = 'enabled'
}

export interface UserStatusResult {
  type: UserStatusType;
  class: string;
  text: string;
}

/**
 * Calculate user status based on user data
 */
export function calculateUserStatus(user: User | null, showNAForNoEmail = false): UserStatusResult {
  if (!user) {
    return {
      type: UserStatusType.UNVERIFIED,
      class: showNAForNoEmail ? '' : 'status-unverified',
      text: showNAForNoEmail ? 'N/A' : 'Unverified'
    };
  }

  // Check if user is soft deleted
  if (user.deletedAt || user.isDeleted) {
    return {
      type: UserStatusType.DISABLED,
      class: 'status-disabled',
      text: 'Disabled'
    };
  }

  // Check if account doesn't have email
  if (!user.account || !user.account.email || user.account.email === 'N/A') {
    return {
      type: UserStatusType.UNVERIFIED,
      class: showNAForNoEmail ? '' : 'status-unverified',
      text: showNAForNoEmail ? 'N/A' : 'Unverified'
    };
  }

  // Check if account exists and is unverified
  if (user.account && isUnverifiedAccount(user.account.userStatus || '', user.account.email)) {
    return {
      type: UserStatusType.UNVERIFIED,
      class: 'status-unverified',
      text: 'Unverified'
    };
  }

  // Check account enabled status
  if (user.account) {
    if (user.account.enabled) {
      return {
        type: UserStatusType.ENABLED,
        class: 'status-enabled',
        text: 'Active'
      };
    } else {
      return {
        type: UserStatusType.DISABLED,
        class: 'status-disabled',
        text: 'Disabled'
      };
    }
  }

  // If no account info, default to unverified
  return {
    type: UserStatusType.UNVERIFIED,
    class: showNAForNoEmail ? '' : 'status-unverified',
    text: showNAForNoEmail ? 'N/A' : 'Unverified'
  };
}

