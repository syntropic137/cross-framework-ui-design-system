import type { Meta, StoryObj } from "@storybook/react";
import { Card } from "./Card";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  args: {
    children: (
      <>
        <h3 style={{ marginTop: 0 }}>Card title</h3>
        <p>Cards use semantic tokens for surface, border, and text colors.</p>
      </>
    )
  },
  parameters: {
    layout: "padded"
  }
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {};

export const Interactive: Story = {
  args: {
    interactive: true,
    children: (
      <>
        <h3 style={{ marginTop: 0 }}>Interactive card</h3>
        <p>Hover to see the elevated shadow.</p>
      </>
    )
  }
};
