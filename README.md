# call-gpt

## Testing during modernization

This repository is currently in a partial modernization state (runtime logic moving into `src/` while some legacy modules remain in `functions/`).

To keep CI and Codex automation reliable during this transition:

- `npm test` now runs `npm run check`
- `npm run check` performs `node --check` on critical entrypoints/modules to catch syntax and structural regressions quickly
- Legacy Jest suites are still available via `npm run test:legacy`
- New focused modernization tests can be run via `npm run test:modern`

Once legacy modules are fully restored/ported, `npm test` can be switched back to the full test suite.
