import { existsSync } from 'fs';
import { dirname, join } from 'path';

/**
 * Finds the first `node_modules` directory starting from the start path, and walking
 * up the directory tree.
 * @param startPath
 * @returns The path to the first `node_modules` directory, or `null` if no directory is found.
 * @example
 * ```ts
 * findNodeModulesPath('/path/to/project');
 * // returns '/path/to/project/node_modules'
 *
 * findNodeModulesPath('/path/to/project/src');
 * // returns '/path/to/project/node_modules'
 *
 * findNodeModulesPath('/path/to/project/src/app');
 * // returns '/path/to/project/node_modules'
 * ```
 */
export function findNodeModulesPath(startPath: string): string | null {
  let currentPath = startPath;

  while (currentPath !== dirname(currentPath)) {
    const nodeModulesPath = join(currentPath, 'node_modules');
    if (existsSync(nodeModulesPath)) {
      return nodeModulesPath;
    }
    currentPath = dirname(currentPath);
  }

  return null;
}

/**
 * Finds the path to a package in the node_modules directory
 * @param packageName The name of the package
 * @param startPath The path to start searching from
 * @returns The path to the package, or `null` if no package is found.
 * @example
 * ```ts
 * findPackagePath('@longpoint/core', '/path/to/project');
 * // returns '/path/to/project/node_modules/@longpoint/core'
 *
 * findPackagePath('longpoint-plugin-openai', '/path/to/project/src');
 * // returns '/path/to/project/node_modules/longpoint-plugin-openai'
 * ```
 */
export function findPackagePath(
  packageName: string,
  startPath: string
): string | null {
  const nodeModulesPath = findNodeModulesPath(startPath);
  if (!nodeModulesPath) {
    return null;
  }
  const packagePath = join(nodeModulesPath, packageName);
  if (existsSync(packagePath)) {
    return packagePath;
  }
  return null;
}
