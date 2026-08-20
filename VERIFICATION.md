# MoneyCove v2.5.1 verification

- Package version: 2.5.1
- Visible version labels are driven by `src/version.ts` to avoid stale hard-coded version text.
- Parsed 51 TypeScript/TSX source files with the TypeScript parser: 0 syntax errors.
- Responsive transaction-row CSS added for narrow mobile screens.
- AI conversation PDF export now consumes the entire active saved conversation, not only the latest question/answer pair.
- Full dependency-backed `npm install` could not complete in this packaging environment, so run the standard local `npm install`, `npm run typecheck`, and `npm run build` before deployment.
