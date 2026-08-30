# Agent Usage Guidelines

This document outlines how to use AI agents within the React CMS project.

## Available Agents

- **claude**: General-purpose agent for any task not fitting a specific type.
- **claude-code-guide**: For questions about Claude Code, Claude Agent SDK, or Claude API.
- **Explore**: Read‑only search agent for broad fan‑out searches.
- **general-purpose**: For researching complex questions and executing multi‑step tasks.
- **Plan**: Software architect agent for designing implementation plans.
- **statusline-setup**: To configure the user's Claude Code status line setting.

## How to Invoke an Agent

Use the `Agent` tool with the `subagent_type` parameter set to one of the above names.

Example:
```bash
Agent --subagent_type Explore --prompt "Find all files related to user authentication"
```

## Best Practices

- Prefer the **Explore** agent when you only need conclusions from many files.
- Use the **Plan** agent before starting non‑trivial implementation work.
- For questions about the CLI or SDK, start with **claude-code-guide**.
- Always read relevant files first (using `Read`, `Glob`, `Grep`) before asking an agent to avoid redundant work.

## Example Workflow

1. **Explore** the codebase to locate relevant modules.
2. **Plan** the implementation steps and get user approval.
3. Execute the plan using the **general‑purpose** or **claude** agent as needed.
4. Verify changes with the **verify** skill or manual testing.