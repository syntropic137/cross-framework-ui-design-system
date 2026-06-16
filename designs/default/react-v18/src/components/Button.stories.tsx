import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  args: {
    children: "Primary button",
    variant: "primary",
    size: "md"
  },
  parameters: {
    layout: "padded"
  }
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {};

export const Ghost: Story = {
  args: {
    children: "Ghost button",
    variant: "ghost"
  }
};

export const Secondary: Story = {
  args: {
    children: "Secondary button",
    variant: "secondary"
  }
};

export const Danger: Story = {
  args: {
    children: "Danger button",
    variant: "danger"
  }
};

export const Loading: Story = {
  args: {
    children: "Saving",
    loading: true
  }
};

export const Sizes: Story = {
  args: {
    children: "Large button",
    size: "lg"
  }
};
