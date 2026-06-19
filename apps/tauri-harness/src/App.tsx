import "@syntropic137/design-tokens/generated/design-tokens.css";
import { useState } from "react";
import { ThemeProvider } from "@syntropic137/default-react-v18";
import { ui, activeDesign } from "./ui/adapter.js";

const { badge: Badge, button: Button, toggle: Toggle } = ui;

export function App() {
  const [pressed, setPressed] = useState(false);

  return (
    <ThemeProvider>
      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h1>Design System Harness</h1>
        <p style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#666", marginTop: 0 }}>
          design: <strong>{activeDesign}</strong>
        </p>

        <section style={{ marginBottom: "2rem" }}>
          <h2>Button</h2>
          <Button variant="primary">Primary</Button>{" "}
          <Button variant="secondary">Secondary</Button>{" "}
          <Button variant="ghost">Ghost</Button>{" "}
          <Button variant="danger">Danger</Button>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h2>Badge</h2>
          <Badge variant="solid" tone="neutral">
            Neutral
          </Badge>{" "}
          <Badge variant="solid" tone="accent">
            Accent
          </Badge>{" "}
          <Badge variant="outline" tone="success">
            Success
          </Badge>{" "}
          <Badge variant="soft" tone="danger">
            Danger
          </Badge>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h2>Toggle</h2>
          <Toggle pressed={pressed} onPressedChange={setPressed}>
            {pressed ? "ON" : "OFF"}
          </Toggle>
        </section>
      </main>
    </ThemeProvider>
  );
}
