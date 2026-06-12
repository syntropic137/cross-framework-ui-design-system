import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  args: {
    children: "Badge content",
    variant: "primary",
    size: "md",
  },
  parameters: {
    layout: "padded"
  }
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const VariantPrimary: Story = {
  args: {
    variant: "primary"
  }
};

export const VariantSecondary: Story = {
  args: {
    variant: "secondary"
  }
};

export const VariantGhost: Story = {
  args: {
    variant: "ghost"
  }
};

export const VariantDanger: Story = {
  args: {
    variant: "danger"
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
      <Badge variant="primary">Variant: primary</Badge>
      <Badge variant="secondary">Variant: secondary</Badge>
      <Badge variant="ghost">Variant: ghost</Badge>
      <Badge variant="danger">Variant: danger</Badge>
      <Badge size="sm">Size: sm</Badge>
      <Badge size="md">Size: md</Badge>
      <Badge size="lg">Size: lg</Badge>
    </div>
  )
};
