# Component Generator

A powerful CLI tool for generating React components that follow the design system standards. Built with TypeScript, Handlebars templates, and comprehensive validation.

## Features

- 🚀 **Fast Component Generation** - Create complete components in seconds
- 🛡️ **Safety First** - Never overwrites existing files without explicit permission
- 🎨 **Design Token Integration** - Automatically includes appropriate design tokens
- 📚 **Complete File Set** - Generates component, stories, tests, and styles
- ✅ **Validation** - Comprehensive input validation with helpful error messages
- 🔧 **Customizable** - Support for variants, sizes, props, and component types
- 📖 **Storybook Ready** - Generated stories work out of the box
- 🧪 **Test Coverage** - Complete test suites with accessibility testing

## Quick Start

```bash
# Generate a basic component
pnpm generate:component Button --dry-run

# Generate with variants and sizes
pnpm generate:component Badge --type=display --variants=variant,size --sizes=sm,md,lg

# Generate form component with props
pnpm generate:component Input --type=form --props=placeholder,required --variants=error

# Interactive mode
pnpm generate:component --interactive
```

## Usage

### Basic Syntax

```bash
pnpm generate:component <ComponentName> [options]
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `-t, --type <type>` | Component type: `form`, `display`, `layout`, `utility` | `--type=form` |
| `-v, --variants <variants>` | Comma-separated list of variants | `--variants=variant,size` |
| `-s, --sizes <sizes>` | Comma-separated list of sizes | `--sizes=sm,md,lg` |
| `-p, --props <props>` | Comma-separated list of custom props | `--props=placeholder,disabled` |
| `-i, --interactive` | Interactive mode with prompts | `--interactive` |
| `-d, --dry-run` | Preview without creating files | `--dry-run` |
| `-o, --output-dir <dir>` | Custom output directory | `--output-dir=./custom` |
| `-h, --help` | Show help information | `--help` |

### Component Types

| Type | Description | Use Cases | Design Tokens |
|------|-------------|-----------|---------------|
| `form` | Form controls and inputs | Input, Select, Textarea, Checkbox | `--surface`, `--fg`, `--border`, `--muted`, `--accent` |
| `display` | Visual display components | Button, Badge, Avatar, Icon | `--accent`, `--accent-contrast`, `--surface`, `--border` |
| `layout` | Layout and container components | Card, Container, Grid, Stack | `--surface`, `--border`, `--shadow-sm` |
| `utility` | Utility and overlay components | Modal, Tooltip, Dropdown, Toast | `--surface`, `--fg`, `--border`, `--shadow-md` |

### Variants

The generator supports intelligent variant detection:

| Variant Name | Generated Values | Default |
|--------------|------------------|---------|
| `variant` | `primary`, `secondary`, `ghost`, `danger` | `primary` |
| `size` | `sm`, `md`, `lg` | `md` |
| `color` | `primary`, `secondary`, `success`, `warning`, `danger` | `primary` |
| `state` | `default`, `hover`, `active`, `disabled` | `default` |
| `appearance` | `filled`, `outlined`, `ghost` | `filled` |

Custom variant names will generate `default` and the variant name as values.

## Generated Files

For a component named `Button`, the generator creates:

```
packages/component-libraries/react-v18/
├── src/components/Button.tsx           # React component with TypeScript
├── src/components/Button.stories.tsx   # Storybook stories
├── src/design-system/components/button.css  # Component styles
└── tests/components/Button.spec.tsx    # Test suite
```

### Component Features

Generated components include:

- ✅ **TypeScript interfaces** with proper prop types
- ✅ **forwardRef pattern** for accessibility
- ✅ **Variant type generation** with union types
- ✅ **clsx className composition** for conditional styles
- ✅ **Design token CSS imports** following naming conventions

### Stories Features

Generated Storybook stories include:

- ✅ **Default story** with sensible defaults
- ✅ **Variant stories** for each variant value
- ✅ **Form-specific examples** (disabled states, error handling)
- ✅ **All variants showcase** for design review
- ✅ **Interactive controls** for all props

### Test Features

Generated tests include:

- ✅ **Rendering tests** with proper queries
- ✅ **Variant class testing** for all variants
- ✅ **Accessibility testing** with proper roles
- ✅ **User interaction testing** for form components
- ✅ **forwardRef testing** for ref forwarding
- ✅ **Custom className merging** tests

### Style Features

Generated CSS includes:

- ✅ **CSS Layer architecture** (`@layer components`)
- ✅ **Design token integration** with semantic naming
- ✅ **Component type-specific base styles**
- ✅ **Variant-based styling** with BEM methodology
- ✅ **Size-based styling** with consistent spacing
- ✅ **Hover and focus states** for interactive components

## Examples

### Basic Display Component

```bash
pnpm generate:component Badge --type=display --variants=variant
```

Generates a Badge component with primary/secondary/ghost/danger variants.

### Form Component with Error States

```bash
pnpm generate:component TextInput --type=form --variants=error --props=placeholder,required
```

Generates a form input with error variant and custom props.

### Layout Component with Sizes

```bash
pnpm generate:component Container --type=layout --variants=size --sizes=sm,md,lg,xl
```

Generates a container component with multiple size options.

### Complex Component

```bash
pnpm generate:component ActionButton --type=display --variants=variant,size --sizes=sm,md,lg --props=loading,disabled
```

Generates a button with variants, sizes, and custom props.

## Safety Features

### File Protection

- **Never overwrites existing files** - Existing components are automatically skipped
- **Clear warnings** - Shows which files were skipped and why
- **Dry-run mode** - Preview all changes before committing
- **Validation** - Comprehensive input validation prevents invalid components

### Error Handling

- **Component name validation** - Ensures PascalCase naming
- **Reserved word checking** - Prevents conflicts with React/HTML
- **Type validation** - Only allows valid component types
- **Variant validation** - Ensures camelCase variant names
- **Template validation** - Catches template rendering errors

## Validation Rules

### Component Names

- ✅ Must start with uppercase letter (PascalCase)
- ✅ Must contain only letters and numbers
- ✅ Cannot be reserved words (`React`, `Component`, etc.)
- ✅ Cannot be empty

### Variants

- ✅ Must be camelCase
- ✅ Cannot contain special characters
- ✅ Cannot be duplicated
- ✅ Cannot be empty

### Props

- ✅ Must be camelCase
- ✅ Cannot contain special characters
- ✅ Cannot be duplicated

## Template System

The generator uses Handlebars templates with custom helpers:

### Available Helpers

| Helper | Description | Example |
|--------|-------------|---------|
| `if_eq` | Conditional rendering | `{{#if_eq type "form"}}...{{/if_eq}}` |
| `capitalize` | Capitalize first letter | `{{capitalize name}}` |
| `kebab` | Convert to kebab-case | `{{kebab componentName}}` |
| `camel` | Convert to camelCase | `{{camel componentName}}` |
| `has_items` | Check if array has items | `{{#if has_items variants}}...{{/if}}` |
| `design_tokens` | Get tokens for type | `{{design_tokens type}}` |

### Template Context

Templates receive a rich context object:

```typescript
interface TemplateContext {
  // Naming variations
  componentName: string;           // "Button"
  componentNameCamel: string;      // "button"
  componentNameKebab: string;      // "button"
  componentNamePascal: string;     // "Button"
  
  // Configuration
  type: ComponentType;             // "display" | "form" | "layout" | "utility"
  props: PropDefinition[];         // Custom props
  variants: VariantDefinition[];   // Variant definitions
  sizes: string[];                 // Size options
  
  // Feature flags
  hasVariants: boolean;            // Has any variants
  hasProps: boolean;               // Has custom props
  isFormComponent: boolean;        // Is form type
  needsForwardRef: boolean;        // Needs forwardRef
  
  // Design system integration
  designTokens: string[];          // Recommended tokens
  cssClasses: string[];            // Generated CSS classes
  accessibilityFeatures: string[]; // A11y recommendations
}
```

## Development

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

### Type Checking

```bash
pnpm typecheck
```

## Architecture

```
src/
├── cli.ts              # CLI entry point and argument parsing
├── generator.ts        # Main generation logic
├── template-engine.ts  # Handlebars template rendering
├── file-writer.ts      # Safe file writing with protection
├── validators.ts       # Input validation logic
└── types.ts           # TypeScript type definitions

templates/
├── component.hbs       # React component template
├── stories.hbs         # Storybook stories template
├── test.hbs           # Test suite template
└── styles.hbs         # CSS styles template
```

## Contributing

When adding new features:

1. **Add tests** - All new functionality must be tested
2. **Update templates** - Ensure templates support new features
3. **Update validation** - Add validation for new options
4. **Update documentation** - Keep this README current
5. **Follow patterns** - Maintain consistency with existing code

## Troubleshooting

### Common Issues

**"Component generation failed"**
- Check component name follows PascalCase
- Ensure no reserved words are used
- Verify all variants are camelCase

**"Template generation failed"**
- Check for syntax errors in custom templates
- Verify all required context variables are available
- Check Handlebars helper usage

**"Files were skipped"**
- Components already exist - use `--dry-run` to preview
- Check file permissions in target directory
- Verify output directory exists

### Getting Help

```bash
# Show help
pnpm generate:component --help

# Preview without changes
pnpm generate:component ComponentName --dry-run

# Use interactive mode for guidance
pnpm generate:component --interactive
```
