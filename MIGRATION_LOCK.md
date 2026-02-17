# Migration Lock

This repository has completed migration to the `src/` runtime for call execution, adapters, tool definitions, and integration boundaries.

Legacy top-level `services/` and `functions/` runtime adapters have been removed.
New development should only add runtime logic under `src/`.
