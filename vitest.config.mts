// vitest.config.mts
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        coverage: {
            provider: 'v8', // or 'v8'
        },
        exclude: [
            "tests/helpers/**",
            "tests/models/**",
            "docs/**",
            "html/**",
            "coverage/**",
            "**/*.js"
        ],
        globals: true,
        include: ["tests/**/*.ts"],
        reporters: ["html"]
    },
})