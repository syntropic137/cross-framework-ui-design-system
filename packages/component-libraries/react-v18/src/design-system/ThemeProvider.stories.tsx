import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeProvider } from "./ThemeProvider";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Input } from "../components/Input";

const meta: Meta<typeof ThemeProvider> = {
  title: "Design System/Theme Provider",
  component: ThemeProvider,
  parameters: {
    layout: "fullscreen"
  }
};

export default meta;

type Story = StoryObj<typeof ThemeProvider>;

export const Playground: Story = {
  render: () => (
    <ThemeProvider>
      <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <h1>Design System Playground</h1>
        <p>Use the selector in the bottom-right corner to switch themes.</p>
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <Button>Primary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
          </div>
          <Input placeholder="Your name" aria-label="Your name" />
        </Card>
      </main>
    </ThemeProvider>
  )
};
