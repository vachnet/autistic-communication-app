# Bounded coding and review workflow

Use the session's available model and effort controls; this project does not silently switch models or use separate paid coding services.

| Work | Owner | Tools | Cost boundary |
| --- | --- | --- | --- |
| Requirements, UI, native integration | Main agent | apply_patch, shell, official Expo docs | Reuse a compact requirement checklist |
| Pure sentence rules and tests | One sub-agent | apply_patch, Node test runner | Own only domain.ts and domain.test.ts |
| Targeted review | Reuse the same sub-agent | Read-only source inspection | Audio lifecycle, persistence, and requirement gaps; up to six findings |
| Checks and APK build | Automated tools | TypeScript, Node tests, Expo, Gradle | Repeat only for changed behavior or failures |

Pass exact APIs, file ownership, acceptance criteria, and environment limits. Avoid agents reviewing the same code, repeated research, and extra external coding tools. Do not claim a token saving percentage without a measured baseline.

This implementation used one sub-agent for domain rules and a second bounded task on that same agent for integration review. All agents used the current session model; no model switch was performed.

The later cross-platform build and accessibility pass stayed in the main session. Shared logic was extracted into small modules so its tests run with installed Node/TypeScript tools without downloading a second coding tool or test service. Native component tests and screenshots remain separate checks requiring dependencies and native builds.
