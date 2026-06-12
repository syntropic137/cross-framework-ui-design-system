import type { GenerateOptions, GenerationResult, TemplateContext, PropDefinition, VariantDefinition } from './types.js';
import { generateFilesFromTemplates } from './template-engine.js';
import { writeGeneratedFiles, updatePackageExports } from './file-writer.js';

/**
 * Main component generation function
 */
export async function generateComponent(options: GenerateOptions): Promise<GenerationResult> {
  try {
    // Build template context
    const context = buildTemplateContext(options);
    
    // Generate files using templates
    const files = await generateFilesFromTemplates(context);

    // Write files to disk (unless dry run)
    const writeResult = await writeGeneratedFiles(files, {
      dryRun: options.dryRun,
      overwrite: false, // Never overwrite existing files
      outputDir: options.outputDir
    });

    // Update package exports if files were written
    if (!options.dryRun && writeResult.success && writeResult.filesWritten.length > 0) {
      await updatePackageExports(context.componentName, options.outputDir);
    }

    // Build warnings
    const warnings: string[] = [];
    if (options.dryRun) {
      warnings.push('This is a dry run - no files were actually created');
    }
    if (writeResult.filesSkipped.length > 0) {
      warnings.push(`Skipped existing files: ${writeResult.filesSkipped.join(', ')}`);
      warnings.push('Use --overwrite flag to replace existing files (not recommended)');
    }

    return {
      success: writeResult.success,
      files,
      errors: writeResult.errors,
      warnings
    };
  } catch (error) {
    return {
      success: false,
      files: [],
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: []
    };
  }
}

/**
 * Builds template context from generation options
 */
function buildTemplateContext(options: GenerateOptions): TemplateContext {
  const componentName = options.name;
  const componentNameCamel = componentName.charAt(0).toLowerCase() + componentName.slice(1);
  const componentNameKebab = componentName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  
  // Parse props
  const props: PropDefinition[] = (options.props || []).map(prop => ({
    name: prop,
    type: 'string', // Default type, could be enhanced later
    optional: true,
    description: `${prop} prop for ${componentName}`
  }));

  // Parse variants
  const variants: VariantDefinition[] = (options.variants || []).map(variant => ({
    name: variant,
    values: getVariantValues(variant),
    defaultValue: getDefaultVariantValue(variant)
  }));

  // Determine design tokens based on component type
  const designTokens = getDesignTokensForType(options.type || 'display');
  
  return {
    // Naming variations
    componentName,
    componentNameCamel,
    componentNameKebab,
    componentNamePascal: componentName,
    
    // Component configuration
    type: options.type || 'display',
    props,
    variants,
    sizes: options.sizes || [],
    
    // Feature flags
    hasVariants: variants.length > 0,
    hasProps: props.length > 0,
    isFormComponent: options.type === 'form',
    needsForwardRef: true, // Most components need forwardRef
    
    // Design system integration
    designTokens,
    cssClasses: generateCssClasses(componentNameKebab, variants),
    accessibilityFeatures: getAccessibilityFeatures(options.type || 'display'),
    
    // Metadata
    timestamp: new Date().toISOString(),
    author: 'Component Generator'
  };
}

/**
 * Gets default values for common variant types
 */
function getVariantValues(variantName: string): string[] {
  const commonVariants: Record<string, string[]> = {
    variant: ['primary', 'secondary', 'ghost', 'danger'],
    size: ['sm', 'md', 'lg'],
    color: ['primary', 'secondary', 'success', 'warning', 'danger'],
    state: ['default', 'hover', 'active', 'disabled'],
    appearance: ['filled', 'outlined', 'ghost']
  };

  return commonVariants[variantName] || ['default', variantName];
}

/**
 * Gets default value for a variant
 */
function getDefaultVariantValue(variantName: string): string {
  const defaults: Record<string, string> = {
    variant: 'primary',
    size: 'md',
    color: 'primary',
    state: 'default',
    appearance: 'filled'
  };

  return defaults[variantName] || 'default';
}

/**
 * Gets design tokens based on component type
 */
function getDesignTokensForType(type: string): string[] {
  const tokenMap: Record<string, string[]> = {
    form: ['--surface', '--fg', '--border', '--muted', '--accent'],
    display: ['--accent', '--accent-contrast', '--surface', '--border', '--shadow-sm'],
    layout: ['--surface', '--border', '--shadow-sm', '--radius-md'],
    utility: ['--surface', '--fg', '--border', '--shadow-md', '--radius-md']
  };

  return tokenMap[type] || tokenMap.display;
}

/**
 * Generates CSS class names for variants
 */
function generateCssClasses(baseClass: string, variants: VariantDefinition[]): string[] {
  const classes = [baseClass];
  
  for (const variant of variants) {
    for (const value of variant.values) {
      classes.push(`${baseClass}--${value}`);
    }
  }
  
  return classes;
}

/**
 * Gets accessibility features based on component type
 */
function getAccessibilityFeatures(type: string): string[] {
  const a11yMap: Record<string, string[]> = {
    form: ['aria-label', 'aria-describedby', 'aria-invalid', 'required'],
    display: ['aria-label', 'role'],
    layout: ['aria-label', 'role', 'aria-expanded'],
    utility: ['aria-label', 'role', 'aria-hidden', 'aria-modal']
  };

  return a11yMap[type] || a11yMap.display;
}
