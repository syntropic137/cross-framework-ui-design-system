import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toggle } from "./Toggle";

const meta: Meta<typeof Toggle> = {
  title: "Components/Toggle",
  component: Toggle,
  args: {
    "aria-label": "Notifications"
  }
};

export default meta;

type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  args: {
    defaultPressed: false
  }
};

export const Pressed: Story = {
  args: {
    pressed: true,
    "aria-label": "Always on"
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultPressed: true,
    "aria-label": "Disabled toggle"
  }
};

export const WithLabel: Story = {
  render: (args) => {
    const [pressed, setPressed] = useState(false);

    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        <label htmlFor="toggle-marketing" style={{ fontSize: "var(--text-sm)" }}>
          Marketing emails
        </label>
        <Toggle
          {...args}
          id="toggle-marketing"
          pressed={pressed}
          onPressedChange={setPressed}
          aria-label="Marketing emails"
        />
      </div>
    );
  }
};
