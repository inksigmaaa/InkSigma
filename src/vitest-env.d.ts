// Brings the @testing-library/jest-dom matcher augmentation (toBeInTheDocument,
// etc.) into the TypeScript program so `expect(...)` in *.test.tsx typechecks.
// Lives under src/ so it is covered by tsconfig's include globs.
import "@testing-library/jest-dom/vitest";
