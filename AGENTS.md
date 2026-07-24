# NOSI Engine - AI Development Instructions

## Project Overview

NOSI Engine is an AI orchestration system that builds and manages websites.

Main components:

- server.js → API entry point
- orchestrator.js → Main workflow engine
- promptBuilder.js → Builds prompts for AI models
- validator.js → Validates AI output
- siteTreeSchema.js → Website structure schema
- config.js → Configuration

---

## Development Principles

Before making any change:

1. Read the related files.
2. Understand the current implementation.
3. Explain the intended change.
4. Modify the minimum amount of code.
5. Preserve existing functionality.

Never rewrite large sections unless explicitly requested.

---

## Coding Rules

- Keep code modular.
- Prefer readability.
- Avoid duplicate logic.
- Do not introduce unnecessary dependencies.
- Follow existing project style.
- Add comments only when they improve understanding.

---

## Debugging Rules

When fixing a bug:

1. Find the root cause.
2. Avoid temporary fixes.
3. Verify the fix.
4. Check for side effects.

---

## Testing

After important changes:

- Verify the project builds successfully.
- Run smoke tests.
- Check runtime behavior.
- Confirm no existing features are broken.

---

## Architecture

Always preserve the orchestration flow.

Changes affecting prompts, orchestration, or schema must be analyzed carefully before implementation.

---

## Response Style

Always:

- Explain your reasoning briefly.
- Describe what files will be modified.
- Mention possible risks.
- Summarize completed work.

Never invent project behavior.
Never assume undocumented functionality.
