import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFiles } from "../src/lib/scaffold.ts";

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "scaffold-")); });
afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

describe("writeFiles", () => {
  it("creates nested files and reports them written", () => {
    const target = join(dir, "src/ui/adapter.ts");
    const res = writeFiles([{ path: target, contents: "export const ui = {};\n" }], { overwrite: false });
    expect(res.written).toEqual([target]);
    expect(readFileSync(target, "utf8")).toBe("export const ui = {};\n");
  });

  it("skips an existing file when overwrite is false", () => {
    const target = join(dir, "a.ts");
    writeFiles([{ path: target, contents: "first\n" }], { overwrite: false });
    const res = writeFiles([{ path: target, contents: "second\n" }], { overwrite: false });
    expect(res.skipped).toEqual([target]);
    expect(readFileSync(target, "utf8")).toBe("first\n");
  });

  it("overwrites when overwrite is true", () => {
    const target = join(dir, "a.ts");
    writeFiles([{ path: target, contents: "first\n" }], { overwrite: false });
    const res = writeFiles([{ path: target, contents: "second\n" }], { overwrite: true });
    expect(res.written).toEqual([target]);
    expect(readFileSync(target, "utf8")).toBe("second\n");
  });
});
