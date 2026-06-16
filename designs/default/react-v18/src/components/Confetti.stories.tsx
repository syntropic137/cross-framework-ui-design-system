import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Confetti } from "./Confetti";
import { Button } from "./Button";

const meta: Meta<typeof Confetti> = {
  title: "Components/Confetti",
  component: Confetti,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    particleCount: {
      control: { type: "range", min: 10, max: 200, step: 10 },
      description: "Number of particles to generate",
    },
    duration: {
      control: { type: "range", min: 1000, max: 8000, step: 500 },
      description: "Animation duration in milliseconds",
    },
    spread: {
      control: { type: "range", min: 50, max: 300, step: 10 },
      description: "Spread radius for particle explosion",
    },
    colors: {
      control: "object",
      description: "Array of colors for confetti particles",
    },
    shapes: {
      control: "check",
      options: ["rectangle", "circle"],
      description: "Available particle shapes",
    },
    x: {
      control: { type: "range", min: 0, max: window.innerWidth, step: 10 },
      description: "Starting X position for confetti explosion",
    },
    y: {
      control: { type: "range", min: 0, max: window.innerHeight, step: 10 },
      description: "Starting Y position for confetti explosion",
    },
    active: {
      control: "boolean",
      description: "Whether confetti is currently active",
    },
    onComplete: {
      action: "completed",
      description: "Callback when animation completes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    particleCount: 50,
    duration: 3000,
    spread: 100,
    colors: [
      "var(--confetti-color-1)",
      "var(--confetti-color-2)",
      "var(--confetti-color-3)",
      "var(--confetti-color-4)",
      "var(--confetti-color-5)",
      "var(--confetti-color-6)",
      "var(--confetti-color-7)",
      "var(--confetti-color-8)",
    ],
    shapes: ["rectangle", "circle"],
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false,
  },
  render: (args) => {
    const [active, setActive] = useState(false);

    const triggerConfetti = () => {
      setActive(true);
      // Auto-reset after animation
      setTimeout(() => setActive(false), args.duration || 3000);
    };

    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Confetti Component</h1>
        <p>Click the button to trigger confetti!</p>
        <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "2rem" }}>
          Use the controls below to customize the confetti effect
        </p>
        <Button 
          onClick={triggerConfetti}
          style={{ marginTop: "2rem" }}
        >
          Celebrate! 🎉
        </Button>
        <Confetti 
          {...args} 
          active={active} 
          onComplete={() => setActive(false)} 
        />
      </div>
    );
  },
};

export const CustomColors: Story = {
  args: {
    particleCount: 50,
    duration: 3000,
    spread: 100,
    colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"],
    shapes: ["rectangle", "circle"],
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false,
  },
  render: (args) => {
    const [active, setActive] = useState(false);

    const triggerConfetti = () => {
      setActive(true);
      setTimeout(() => setActive(false), args.duration || 3000);
    };

    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Custom Colors</h1>
        <p>Confetti with custom color palette</p>
        <Button 
          onClick={triggerConfetti}
          style={{ marginTop: "2rem" }}
        >
          Custom Colors 🎨
        </Button>
        <Confetti 
          {...args} 
          active={active} 
          onComplete={() => setActive(false)} 
        />
      </div>
    );
  },
};

export const HighDensity: Story = {
  args: {
    particleCount: 150,
    duration: 4000,
    spread: 200,
    colors: [
      "var(--confetti-color-1)",
      "var(--confetti-color-2)",
      "var(--confetti-color-3)",
      "var(--confetti-color-4)",
      "var(--confetti-color-5)",
      "var(--confetti-color-6)",
      "var(--confetti-color-7)",
      "var(--confetti-color-8)",
    ],
    shapes: ["rectangle", "circle"],
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false,
  },
  render: (args) => {
    const [active, setActive] = useState(false);

    const triggerConfetti = () => {
      setActive(true);
      setTimeout(() => setActive(false), args.duration || 4000);
    };

    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>High Density</h1>
        <p>More particles for bigger celebrations</p>
        <Button 
          onClick={triggerConfetti}
          style={{ marginTop: "2rem" }}
        >
          Big Celebration! 🎊
        </Button>
        <Confetti 
          {...args} 
          active={active} 
          onComplete={() => setActive(false)} 
        />
      </div>
    );
  },
};

export const CirclesOnly: Story = {
  args: {
    particleCount: 50,
    duration: 3000,
    spread: 100,
    colors: [
      "var(--confetti-color-1)",
      "var(--confetti-color-2)",
      "var(--confetti-color-3)",
      "var(--confetti-color-4)",
      "var(--confetti-color-5)",
      "var(--confetti-color-6)",
      "var(--confetti-color-7)",
      "var(--confetti-color-8)",
    ],
    shapes: ["circle"],
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false,
  },
  render: (args) => {
    const [active, setActive] = useState(false);

    const triggerConfetti = () => {
      setActive(true);
      setTimeout(() => setActive(false), args.duration || 3000);
    };

    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Circles Only</h1>
        <p>Confetti with only circle shapes</p>
        <Button 
          onClick={triggerConfetti}
          style={{ marginTop: "2rem" }}
        >
          Circles! ⭕
        </Button>
        <Confetti 
          {...args} 
          active={active} 
          onComplete={() => setActive(false)} 
        />
      </div>
    );
  },
};

export const LongDuration: Story = {
  args: {
    particleCount: 50,
    duration: 5000,
    spread: 100,
    colors: [
      "var(--confetti-color-1)",
      "var(--confetti-color-2)",
      "var(--confetti-color-3)",
      "var(--confetti-color-4)",
      "var(--confetti-color-5)",
      "var(--confetti-color-6)",
      "var(--confetti-color-7)",
      "var(--confetti-color-8)",
    ],
    shapes: ["rectangle", "circle"],
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false,
  },
  render: (args) => {
    const [active, setActive] = useState(false);

    const triggerConfetti = () => {
      setActive(true);
      setTimeout(() => setActive(false), args.duration || 5000);
    };

    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Long Duration</h1>
        <p>Extended celebration animation</p>
        <Button 
          onClick={triggerConfetti}
          style={{ marginTop: "2rem" }}
        >
          Extended Party! 🎉
        </Button>
        <Confetti 
          {...args} 
          active={active} 
          onComplete={() => setActive(false)} 
        />
      </div>
    );
  },
};

export const CustomPosition: Story = {
  args: {
    particleCount: 50,
    duration: 3000,
    spread: 100,
    colors: [
      "var(--confetti-color-1)",
      "var(--confetti-color-2)",
      "var(--confetti-color-3)",
      "var(--confetti-color-4)",
      "var(--confetti-color-5)",
      "var(--confetti-color-6)",
      "var(--confetti-color-7)",
      "var(--confetti-color-8)",
    ],
    shapes: ["rectangle", "circle"],
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false,
  },
  render: (args) => {
    const [active, setActive] = useState(false);

    const triggerConfetti = () => {
      setActive(true);
      setTimeout(() => setActive(false), args.duration || 3000);
    };

    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Custom Position</h1>
        <p>Confetti explosion from custom position</p>
        <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "2rem" }}>
          Use the X and Y position controls to change the explosion origin
        </p>
        <Button 
          onClick={triggerConfetti}
          style={{ 
            marginTop: "2rem", 
            position: "absolute", 
            top: args.y, 
            left: args.x,
            transform: "translate(-50%, -50%)"
          }}
        >
          Explode Here! 💥
        </Button>
        <Confetti 
          {...args} 
          active={active} 
          onComplete={() => setActive(false)} 
        />
      </div>
    );
  },
};
