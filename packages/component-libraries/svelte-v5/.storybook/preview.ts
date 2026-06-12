import type { Preview } from "@storybook/svelte";

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark",  value: "#0c0f14" },
      ],
    },
  },
  globalTypes: {
    theme: {
      name:         "Theme",
      defaultValue: "light",
      toolbar: {
        icon:  "paintbrush",
        items: ["light", "dark", "rose"],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals["theme"] ?? "light";
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme === "light" ? "" : theme);
      }
      return Story();
    },
  ],
};

export default preview;
