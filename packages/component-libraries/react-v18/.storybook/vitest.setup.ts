import { beforeAll } from "vitest";
import { setProjectAnnotations } from "@storybook/react-vite";
import * as projectAnnotations from "./preview";

// Establishes the Storybook browser-test context for @storybook/addon-vitest.
const project = setProjectAnnotations([projectAnnotations]);

beforeAll(project.beforeAll);
