import { writeFile, mkdir, access } from 'fs/promises';
import { dirname, join } from 'path';
import type { GeneratedFile } from './types.js';

export interface FileWriteOptions {
  dryRun?: boolean;
  overwrite?: boolean;
  outputDir?: string;
}

export interface FileWriteResult {
  success: boolean;
  filesWritten: string[];
  filesSkipped: string[];
  errors: string[];
}

/**
 * Writes generated files to disk with safety checks
 */
export async function writeGeneratedFiles(
  files: GeneratedFile[],
  options: FileWriteOptions = {}
): Promise<FileWriteResult> {
  const { dryRun = false, overwrite = false, outputDir } = options;
  const filesWritten: string[] = [];
  const filesSkipped: string[] = [];
  const errors: string[] = [];

  // Determine base directory
  const baseDir = outputDir || process.cwd();
  const targetDir = join(baseDir, 'packages/component-libraries/react-v18');

  for (const file of files) {
    try {
      const fullPath = join(targetDir, file.path);
      
      // Check if file already exists
      const fileExists = await checkFileExists(fullPath);
      
      if (fileExists && !overwrite) {
        filesSkipped.push(file.path);
        continue;
      }

      if (dryRun) {
        filesWritten.push(file.path);
        continue;
      }

      // Ensure directory exists
      await mkdir(dirname(fullPath), { recursive: true });
      
      // Write file
      await writeFile(fullPath, file.content, 'utf-8');
      filesWritten.push(file.path);
      
    } catch (error) {
      errors.push(`Failed to write ${file.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    success: errors.length === 0,
    filesWritten,
    filesSkipped,
    errors
  };
}

/**
 * Checks if a file exists
 */
async function checkFileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Updates package exports to include new component
 */
export async function updatePackageExports(_componentName: string, outputDir?: string): Promise<void> {
  const baseDir = outputDir || process.cwd();
  const packageDir = join(baseDir, 'packages/component-libraries/react-v18');
  
  try {
    // Update src/index.ts
    const indexPath = join(packageDir, 'src/index.ts');
    const indexExists = await checkFileExists(indexPath);
    
    if (indexExists) {
      // TODO: Implement index.ts update logic
      // For now, we'll just note that this needs to be done manually
    }
    
    // Update src/components/index.ts if it exists
    const componentsIndexPath = join(packageDir, 'src/components/index.ts');
    const componentsIndexExists = await checkFileExists(componentsIndexPath);
    
    if (componentsIndexExists) {
      // TODO: Implement components index update logic
      // For now, we'll just note that this needs to be done manually
    }
    
  } catch (error) {
    // Non-critical error, just log it
    console.warn(`Warning: Could not update package exports: ${error instanceof Error ? error.message : String(error)}`);
  }
}
