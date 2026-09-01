import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/testing/setup-vitest.ts"],
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        // --- Test & Dev infrastructure ---
        "**/*.spec.ts", // Test files themselves
        "**/*.mock.ts", // Mock files used by tests
        "**/testing/**", // Test setup and helpers
        ".local/**", // Local dev setup
        "**/*.dto.ts", // DTOs are pure data structures with no logic

        // --- Application bootstrap & global config ---
        "src/main.ts", // NestJS bootstrap entry point - no testable logic
        "src/globals.ts", // Global mutable state / constants
        "src/logging.ts", // Winston logger setup - side-effect only
        "src/plugin.ts", // Plugin loader - filesystem + dynamic imports

        // --- NestJS modules (includes app.module.ts) ---
        "**/*.module.ts", // Module definitions are pure DI wiring with no logic

        // --- Database ---
        "**/migrations/**", // Auto-generated TypeORM migrations - tested by running them
        "**/legacy-entities/**", // Legacy v12 entities kept only for migration compatibility
        "**/database/db_configuration.ts", // TypeORM DataSource config - side-effect only

        // --- Auth (Passport) ---
        "**/auth/strategies/**", // Passport strategies - tightly coupled to external auth providers
        "**/auth/controllers/**", // Auth controllers - thin wrappers over Passport flows
        "**/auth/guards/basic-auth.guard.ts", // Trivial super.canActivate() wrapper
        "**/auth/guards/oauth2.guard.ts", // Trivial super.canActivate() wrapper
        "**/auth/guards/refresh-token.guard.ts", // Trivial super.canActivate() wrapper

        // --- Metadata providers ---
        "**/metadata/providers/rawg-legacy/**", // RAWG legacy provider - deprecated external API
      ],
    },
  },
});
