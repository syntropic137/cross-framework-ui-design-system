import { describe, it, expect } from 'vitest';
import { 
  validateComponentName, 
  validateComponentType, 
  validateVariants, 
  validateProps,
  validateGenerateOptions 
} from '../src/validators.js';

describe('validateComponentName', () => {
  it('accepts valid PascalCase names', () => {
    expect(validateComponentName('Button')).toEqual({ valid: true });
    expect(validateComponentName('SelectInput')).toEqual({ valid: true });
    expect(validateComponentName('DataTable')).toEqual({ valid: true });
  });

  it('rejects names that do not start with uppercase', () => {
    const result = validateComponentName('button');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('uppercase letter');
  });

  it('rejects names with invalid characters', () => {
    const result = validateComponentName('Button-Input');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('PascalCase');
  });

  it('rejects reserved words', () => {
    const result = validateComponentName('React');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('reserved word');
  });

  it('rejects empty names', () => {
    const result = validateComponentName('');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });
});

describe('validateComponentType', () => {
  it('accepts valid component types', () => {
    expect(validateComponentType('form')).toEqual({ valid: true });
    expect(validateComponentType('display')).toEqual({ valid: true });
    expect(validateComponentType('layout')).toEqual({ valid: true });
    expect(validateComponentType('utility')).toEqual({ valid: true });
  });

  it('rejects invalid component types', () => {
    const result = validateComponentType('invalid');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid component type');
  });
});

describe('validateVariants', () => {
  it('accepts valid camelCase variants', () => {
    const result = validateVariants(['primary', 'secondary', 'danger']);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects non-camelCase variants', () => {
    const result = validateVariants(['Primary', 'secondary-variant']);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects duplicate variants', () => {
    const result = validateVariants(['primary', 'primary']);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate'))).toBe(true);
  });
});

describe('validateGenerateOptions', () => {
  it('validates complete options successfully', () => {
    const options = {
      name: 'TestComponent',
      type: 'display' as const,
      variants: ['primary', 'secondary'],
      sizes: ['sm', 'md', 'lg'],
      props: ['disabled', 'loading']
    };
    
    const result = validateGenerateOptions(options);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('accumulates all validation errors', () => {
    const options = {
      name: 'invalid-name',
      type: 'invalid' as never,
      variants: ['Invalid', 'duplicate', 'duplicate'],
      sizes: ['invalid-size'],
      props: ['Invalid-prop']
    };
    
    const result = validateGenerateOptions(options);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});
