import type { ComponentType, GenerateOptions } from './types.js';

/**
 * Validates a component name follows React component naming conventions
 */
export function validateComponentName(name: string): { valid: boolean; error?: string } {
  if (!name) {
    return { valid: false, error: 'Component name is required' };
  }

  // Must start with uppercase letter
  if (!/^[A-Z]/.test(name)) {
    return { valid: false, error: 'Component name must start with an uppercase letter' };
  }

  // Must be PascalCase (letters and numbers only)
  if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
    return { valid: false, error: 'Component name must be PascalCase (letters and numbers only)' };
  }

  // Reasonable length limits
  if (name.length < 2) {
    return { valid: false, error: 'Component name must be at least 2 characters' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Component name must be less than 50 characters' };
  }

  // Reserved words check
  const reservedWords = [
    'React', 'Component', 'Element', 'Fragment', 'StrictMode',
    'Suspense', 'Provider', 'Consumer', 'Context', 'Ref'
  ];
  
  if (reservedWords.includes(name)) {
    return { valid: false, error: `"${name}" is a reserved word and cannot be used as a component name` };
  }

  return { valid: true };
}

/**
 * Validates component type
 */
export function validateComponentType(type: string): { valid: boolean; error?: string } {
  const validTypes: ComponentType[] = ['form', 'display', 'layout', 'utility'];
  
  if (!validTypes.includes(type as ComponentType)) {
    return { 
      valid: false, 
      error: `Invalid component type "${type}". Must be one of: ${validTypes.join(', ')}` 
    };
  }

  return { valid: true };
}

/**
 * Validates variant names
 */
export function validateVariants(variants: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const variant of variants) {
    // Must be camelCase
    if (!/^[a-z][a-zA-Z0-9]*$/.test(variant)) {
      errors.push(`Variant "${variant}" must be camelCase`);
    }

    // Reasonable length
    if (variant.length > 20) {
      errors.push(`Variant "${variant}" must be less than 20 characters`);
    }
  }

  // Check for duplicates
  const uniqueVariants = new Set(variants);
  if (uniqueVariants.size !== variants.length) {
    errors.push('Duplicate variants are not allowed');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates prop names
 */
export function validateProps(props: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const prop of props) {
    // Must be camelCase
    if (!/^[a-z][a-zA-Z0-9]*$/.test(prop)) {
      errors.push(`Prop "${prop}" must be camelCase`);
    }

    // Reserved prop names
    const reservedProps = [
      'children', 'className', 'style', 'key', 'ref', 'dangerouslySetInnerHTML'
    ];
    
    if (reservedProps.includes(prop)) {
      errors.push(`Prop "${prop}" is reserved and will be handled automatically`);
    }
  }

  // Check for duplicates
  const uniqueProps = new Set(props);
  if (uniqueProps.size !== props.length) {
    errors.push('Duplicate props are not allowed');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates all generation options
 */
export function validateGenerateOptions(options: GenerateOptions): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate component name
  const nameValidation = validateComponentName(options.name);
  if (!nameValidation.valid) {
    errors.push(nameValidation.error!);
  }

  // Validate component type if provided
  if (options.type) {
    const typeValidation = validateComponentType(options.type);
    if (!typeValidation.valid) {
      errors.push(typeValidation.error!);
    }
  }

  // Validate variants if provided
  if (options.variants && options.variants.length > 0) {
    const variantValidation = validateVariants(options.variants);
    if (!variantValidation.valid) {
      errors.push(...variantValidation.errors);
    }
  }

  // Validate props if provided
  if (options.props && options.props.length > 0) {
    const propValidation = validateProps(options.props);
    if (!propValidation.valid) {
      errors.push(...propValidation.errors);
    }
  }

  // Validate sizes if provided
  if (options.sizes && options.sizes.length > 0) {
    const validSizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    for (const size of options.sizes) {
      if (!validSizes.includes(size)) {
        errors.push(`Invalid size "${size}". Must be one of: ${validSizes.join(', ')}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
