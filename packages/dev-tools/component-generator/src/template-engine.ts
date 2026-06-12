import Handlebars from 'handlebars';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { TemplateContext, GeneratedFile } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Template file paths
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

export interface TemplateEngine {
  renderComponent(context: TemplateContext): Promise<string>;
  renderStories(context: TemplateContext): Promise<string>;
  renderTest(context: TemplateContext): Promise<string>;
  renderStyles(context: TemplateContext): Promise<string>;
}

class HandlebarsTemplateEngine implements TemplateEngine {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Helper for conditional rendering
    Handlebars.registerHelper('if_eq', (a: unknown, b: unknown, options: Handlebars.HelperOptions) => {
      return a === b ? options.fn(options.data?.root) : options.inverse(options.data?.root);
    });

    // Helper for joining arrays
    Handlebars.registerHelper('join', function(array: string[], separator: string) {
      return array.join(separator);
    });

    // Helper for capitalizing first letter
    Handlebars.registerHelper('capitalize', function(str: string) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Helper for converting to kebab-case
    Handlebars.registerHelper('kebab', function(str: string) {
      return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
    });

    // Helper for converting to camelCase
    Handlebars.registerHelper('camel', function(str: string) {
      return str.charAt(0).toLowerCase() + str.slice(1);
    });

    // Helper for checking if array has items
    Handlebars.registerHelper('has_items', function(array: unknown[]) {
      return Array.isArray(array) && array.length > 0;
    });

    // Helper for design token recommendations based on component type
    Handlebars.registerHelper('design_tokens', function(type: string) {
      const tokenMap = {
        form: ['--surface', '--fg', '--border', '--muted', '--accent'],
        display: ['--accent', '--accent-contrast', '--surface', '--border'],
        layout: ['--surface', '--border', '--shadow-sm'],
        utility: ['--surface', '--fg', '--border', '--shadow-md']
      };
      return tokenMap[type as keyof typeof tokenMap] || tokenMap.display;
    });
  }

  private async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templates.has(templateName)) {
      return this.templates.get(templateName)!;
    }

    try {
      const templatePath = join(TEMPLATES_DIR, `${templateName}.hbs`);
      const templateSource = await readFile(templatePath, 'utf-8');
      const template = Handlebars.compile(templateSource);
      this.templates.set(templateName, template);
      return template;
    } catch (error) {
      throw new Error(`Failed to load template "${templateName}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async renderComponent(context: TemplateContext): Promise<string> {
    const template = await this.loadTemplate('component');
    return template(context);
  }

  async renderStories(context: TemplateContext): Promise<string> {
    const template = await this.loadTemplate('stories');
    return template(context);
  }

  async renderTest(context: TemplateContext): Promise<string> {
    const template = await this.loadTemplate('test');
    return template(context);
  }

  async renderStyles(context: TemplateContext): Promise<string> {
    const template = await this.loadTemplate('styles');
    return template(context);
  }
}

// Singleton instance
let templateEngine: TemplateEngine | null = null;

export function getTemplateEngine(): TemplateEngine {
  if (!templateEngine) {
    templateEngine = new HandlebarsTemplateEngine();
  }
  return templateEngine;
}

/**
 * Generates all files for a component using templates
 */
export async function generateFilesFromTemplates(context: TemplateContext): Promise<GeneratedFile[]> {
  const engine = getTemplateEngine();
  
  const files: GeneratedFile[] = [];

  try {
    // Generate component file
    const componentContent = await engine.renderComponent(context);
    files.push({
      path: `src/components/${context.componentName}.tsx`,
      content: componentContent,
      type: 'component'
    });

    // Generate stories file
    const storiesContent = await engine.renderStories(context);
    files.push({
      path: `src/components/${context.componentName}.stories.tsx`,
      content: storiesContent,
      type: 'stories'
    });

    // Generate test file
    const testContent = await engine.renderTest(context);
    files.push({
      path: `tests/components/${context.componentName}.spec.tsx`,
      content: testContent,
      type: 'test'
    });

    // Generate styles file
    const stylesContent = await engine.renderStyles(context);
    files.push({
      path: `src/design-system/components/${context.componentNameKebab}.css`,
      content: stylesContent,
      type: 'styles'
    });

    return files;
  } catch (error) {
    throw new Error(`Template generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
