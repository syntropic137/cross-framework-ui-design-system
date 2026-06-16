import type { Preview } from "@storybook/react-vite";
import { ThemeProvider } from "../src/design-system/ThemeProvider";
import "../src/design-system/styles.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div style={{ padding: "24px", minHeight: "100vh", background: "var(--bg)" }}>
          <Story />
        </div>
      </ThemeProvider>
    )
  ]
};

export default preview;
