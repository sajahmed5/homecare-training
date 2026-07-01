import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // RLS tests hit the live Supabase project sequentially and share state.
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
