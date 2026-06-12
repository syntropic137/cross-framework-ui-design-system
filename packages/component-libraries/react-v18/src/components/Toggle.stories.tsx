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
    defaultChecked: false
  }
};

export const Checked: Story = {
  args: {
    checked: true,
    "aria-label": "Always on"
  }
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
    "aria-label": "Disabled toggle"
  }
};

export const WithLabel: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(false);

    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        <label htmlFor="toggle-marketing" style={{ fontSize: "var(--text-sm)" }}>
          Marketing emails
        </label>
        <Toggle
          {...args}
          id="toggle-marketing"
          checked={checked}
          onCheckedChange={setChecked}
          aria-label="Marketing emails"
        />
      </div>
    );
  }
};
