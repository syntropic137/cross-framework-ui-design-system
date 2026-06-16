import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./Input";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  args: {
    placeholder: "Your name"
  },
  parameters: {
    layout: "padded"
  }
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: {
    "aria-label": "Email address",
    type: "email",
    placeholder: "email@example.com"
  }
};
