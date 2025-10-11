/**
 * Utility functions for persisting user data to localStorage
 */

export interface StoredUserData {
  analysisHistory: any[];
  drivers: any[];
  vehicles: any[];
  lastLogin: string;
}

const STORAGE_PREFIX = 'driveguard_';

/**
 * Save user data to localStorage
 */
export const saveUserData = (userEmail: string, data: StoredUserData): void => {
  try {
    const key = `${STORAGE_PREFIX}${userEmail}`;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

/**
 * Load user data from localStorage
 */
export const loadUserData = (userEmail: string): StoredUserData | null => {
  try {
    const key = `${STORAGE_PREFIX}${userEmail}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
  return null;
};

/**
 * Clear user data from localStorage
 */
export const clearUserData = (userEmail: string): void => {
  try {
    const key = `${STORAGE_PREFIX}${userEmail}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

/**
 * Get all stored user emails (for cleanup or migration)
 */
export const getStoredUserEmails = (): string[] => {
  try {
    const emails: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        emails.push(key.replace(STORAGE_PREFIX, ''));
      }
    }
    return emails;
  } catch (error) {
    console.error('Error getting stored user emails:', error);
    return [];
  }
};

/**
 * Clear all test account data to ensure clean state
 */
export const clearTestAccountData = (): void => {
  try {
    const testAccounts = ['1@test.in', '2@test.in'];
    testAccounts.forEach(email => {
      clearUserData(email);
    });
  } catch (error) {
    console.error('Error clearing test account data:', error);
  }
};