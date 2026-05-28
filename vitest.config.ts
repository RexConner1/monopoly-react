import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: "./src/test/setupTests.ts",
        include: ["src/**/*.test.ts", "src/**/*.test.tsx", "shared/**/*.test.ts"],
        clearMocks: true,
        restoreMocks: true,
        mockReset: true,
    },
});