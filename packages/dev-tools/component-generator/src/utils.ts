/**
 * Utility functions for component generation
 */

/**
 * Converts PascalCase to kebab-case
 */
export function pascalToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

/**
 * Converts PascalCase to camelCase
 */
export function pascalToCamel(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Gets current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Checks if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    const { access } = await import('fs/promises');
    await access(path);
    return true;
  } catch {
    return false;
  }
}
