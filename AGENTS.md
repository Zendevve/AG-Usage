# AntiGravity Quota - AGENTS.md

## Context
This repository contains the "AntiGravity Quota" VS Code extension.
It follows the MCAF (Managed Code Coding AI Framework).

## Development Flow
1. **Describe**: Update `docs/Features/` before coding.
2. **Plan**: Create `implementation_plan.md` and get approval.
3. **Implement**: Write code and tests together.
4. **Verify**: Run tests and static analysis.
5. **Document**: Update docs to reflect reality.

## Maintainer Preferences
- Use TypeScript for all extension code.
- Prefer functional patterns over heavy class inheritance where possible, but adhere to VS Code API patterns.
- Keep the status bar item minimal.
- "Quota" refers to the available usage limit.

## Testing Discipline
- **Unit Tests**: `npm run test`
- **Integration/E2E**: `npm run test:e2e` (to be defined)
- **Linting**: `npm run lint`

## Commands
- **Build**: `npm run compile`
- **Test**: `npm run test`
- **Package**: `npx vsce package`

## Self-Learning
- If build/test commands fail, analyze the error output before asking the user.
- If specific VS Code API quirks are discovered, document them in `docs/Development/vscode-quirks.md`.
