export type ComponentType = 'form' | 'display' | 'layout' | 'utility';

export interface PropDefinition {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
}

export interface VariantDefinition {
  name: string;
  values: string[];
  defaultValue?: string;
}

export interface GenerateOptions {
  name: string;
  type?: ComponentType;
  variants?: string[];
  sizes?: string[];
  props?: string[];
  interactive?: boolean;
  dryRun?: boolean;
  outputDir?: string;
}

export interface TemplateContext {
  // Naming variations
  componentName: string;        // "Select"
  componentNameCamel: string;   // "select"
  componentNameKebab: string;   // "select"
  componentNamePascal: string;  // "Select"
  
  // Component configuration
  type: ComponentType;
  props: PropDefinition[];
  variants: VariantDefinition[];
  sizes: string[];
  
  // Feature flags
  hasVariants: boolean;
  hasProps: boolean;
  isFormComponent: boolean;
  needsForwardRef: boolean;
  
  // Design system integration
  designTokens: string[];
  cssClasses: string[];
  accessibilityFeatures: string[];
  
  // Metadata
  timestamp: string;
  author: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'component' | 'stories' | 'test' | 'styles' | 'export';
}

export interface GenerationResult {
  success: boolean;
  files: GeneratedFile[];
  errors: string[];
  warnings: string[];
}
