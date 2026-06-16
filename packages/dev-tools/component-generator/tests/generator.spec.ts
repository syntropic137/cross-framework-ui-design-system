import { describe, expect, it } from "vitest";
import { generateComponent } from "../src/generator.js";

describe("generateComponent", () => {
  it("generates styles and stories with current design-token names", async () => {
    const result = await generateComponent({
      name: "TokenProbe",
      type: "display",
      variants: ["variant", "color"],
      sizes: ["sm", "md", "lg"],
      dryRun: true,
      outputDir: "/tmp/component-generator-token-probe",
    });

    expect(result.success).toBe(true);

    const styles = result.files.find((file) => file.type === "styles");
    const stories = result.files.find((file) => file.type === "stories");

    expect(styles?.content).toContain("var(--ds-color-accent)");
    expect(styles?.content).toContain("var(--ds-space-2)");
    expect(styles?.content).not.toMatch(/var\(--(?!ds-)[a-z0-9-]+/i);
    expect(styles?.content).not.toMatch(/#[0-9a-f]{3,8}/i);

    expect(stories?.content).not.toMatch(/var\(--(?!ds-)[a-z0-9-]+/i);
    expect(stories?.content).not.toMatch(/#[0-9a-f]{3,8}/i);
  });
});
