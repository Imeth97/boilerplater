/**
 * Converts null values to undefined to match expected string | undefined types
 * This is useful for handling database fields that can be null but TypeScript expects undefined
 */
export function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}