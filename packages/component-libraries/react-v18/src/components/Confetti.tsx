import React, { useState, useEffect, useCallback } from "react";
import clsx from "clsx";
import "../design-system/components/confetti.css";

export type ConfettiShape = "rectangle" | "circle";

export interface ConfettiProps {
  /** Number of particles to generate */
  particleCount?: number;
  /** Array of colors for confetti particles */
  colors?: string[];
  /** Animation duration in milliseconds */
  duration?: number;
  /** Spread radius for particle explosion */
  spread?: number;
  /** Available particle shapes */
  shapes?: ConfettiShape[];
  /** Whether confetti is currently active */
  active?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Starting position for confetti explosion */
  x?: number;
  /** Starting position for confetti explosion */
  y?: number;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  shape: ConfettiShape;
  size: number;
  rotation: number;
  delay: number;
  duration: number;
  burstX: number;
  burstY: number;
  driftX: number;
  fallY: number;
  swayX: number;
}

const DEFAULT_COLORS = [
  "var(--confetti-color-1)",
  "var(--confetti-color-2)",
  "var(--confetti-color-3)",
  "var(--confetti-color-4)",
  "var(--confetti-color-5)",
  "var(--confetti-color-6)",
  "var(--confetti-color-7)",
  "var(--confetti-color-8)",
];

const DEFAULT_SHAPES: ConfettiShape[] = ["rectangle", "circle"];

export const Confetti: React.FC<ConfettiProps> = ({
  particleCount = 50,
  colors = DEFAULT_COLORS,
  duration = 3000,
  spread = 100,
  shapes = DEFAULT_SHAPES,
  active = false,
  onComplete,
  x = window.innerWidth / 2,
  y = window.innerHeight / 2,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  const generateParticles = useCallback((): Particle[] => {
    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Completely random angle for true explosion effect
      const angle = Math.random() * Math.PI * 2;
      const burstForce = 50 + Math.random() * 100; // Stronger burst force
      const spreadFactor = spread / 100;
      
      // Calculate burst direction (explosive outward force)
      const burstX = Math.cos(angle) * burstForce * spreadFactor;
      const burstY = Math.sin(angle) * burstForce * spreadFactor - Math.random() * 40; // More varied upward bias
      
      // Calculate drift and fall for realistic physics
      const driftX = (Math.random() - 0.5) * 150 * spreadFactor; // More horizontal drift
      const fallY = 150 + Math.random() * 300; // More varied vertical fall distance
      
      // Simple swaying motion for natural movement
      const swayX = (Math.random() - 0.5) * 100 * spreadFactor; // Horizontal swaying motion
      
      newParticles.push({
        id: Math.random().toString(36).substr(2, 9),
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        size: 8 + Math.random() * 8,
        rotation: Math.random() * 360,
        delay: Math.random() * 200,
        duration: duration + Math.random() * 1000,
        burstX,
        burstY,
        driftX,
        fallY,
        swayX,
      });
    }
    
    return newParticles;
  }, [particleCount, colors, spread, shapes, x, y, duration]);

  useEffect(() => {
    if (active) {
      const newParticles = generateParticles();
      setParticles(newParticles);

      // Clean up particles after animation
      const cleanupTimer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, Math.max(...newParticles.map(p => p.duration + p.delay)) + 100);

      return () => clearTimeout(cleanupTimer);
    }
  }, [active, generateParticles, onComplete]);

  if (!active && particles.length === 0) {
    return null;
  }

  return (
    <div className={clsx("confetti", active && "confetti--active")}>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={clsx(
            "confetti-particle",
            `confetti-particle--${particle.shape}`,
            `confetti-particle--color-${colors.indexOf(particle.color) + 1}`
          )}
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${particle.duration}ms`,
            "--burst-x": `${particle.burstX}px`,
            "--burst-y": `${particle.burstY}px`,
            "--drift-x": `${particle.driftX}px`,
            "--fall-y": `${particle.fallY}px`,
            "--sway-x": `${particle.swayX}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
