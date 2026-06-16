import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  args: {
    children: "Badge content",
    variant: "solid",
    tone: "neutral",
    size: "md",
  },
  parameters: {
    layout: "padded"
  }
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const VariantSolid: Story = {
  args: {
    variant: "solid"
  }
};

export const VariantSoft: Story = {
  args: {
    variant: "soft"
  }
};

export const VariantOutline: Story = {
  args: {
    variant: "outline"
  }
};

export const SizeSm: Story = {
  args: {
    size: "sm"
  }
};

export const SizeMd: Story = {
  args: {
    size: "md"
  }
};

export const SizeLg: Story = {
  args: {
    size: "lg"
  }
};



export const AllVariants: Story = {
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
        alignItems: "center"
      }}
    >
      <Badge variant="solid">Variant: solid</Badge>
      <Badge variant="soft">Variant: soft</Badge>
      <Badge variant="outline">Variant: outline</Badge>
      <Badge tone="danger">Tone: danger</Badge>
      <Badge tone="success">Tone: success</Badge>
      <Badge tone="warning">Tone: warning</Badge>
      <Badge tone="accent">Tone: accent</Badge>
      <Badge size="sm">Size: sm</Badge>
      <Badge size="md">Size: md</Badge>
      <Badge size="lg">Size: lg</Badge>
    </div>
  )
};
