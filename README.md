# 🧠 Advanced Engineering Prompts (2026 Standards)

This directory contains high-fidelity prompts designed to guide AI agents (Claude 3.5 Sonnet, GPT-4o, etc.) in resolving specific architectural and maintenance issues within the OpenRouter Crew Platform.

## Usage

These prompts are structured using **XML tags** for context delimitation and **Chain-of-Thought** activation. They are compatible with:
1. **Local AI Clients** (Cursor, VSCode Copilot, Cline)
2. **Web Interfaces** (OpenRouter, ChatGPT, Claude.ai)
3. **CLI Agents** (via `crew` CLI if configured)

## Available Protocols

### 1. Fix VSCode Encoding
**Target**: `domains/vscode-extension`
**Issue**: Base64 encoding failure on emojis (`✅`).
**Goal**: Implement safe UTF-8 buffer handling.

### 2. Fix Dashboard Build
**Target**: `domains/alex-ai-universal/dashboard`
**Issue**: Broken relative imports (`../../../../`) and missing path aliases.
**Goal**: Align import paths with Domain-Driven Design (DDD) boundaries.

## Prompt Engineering Standards

- **<system_role>**: Defines the expert persona (Security Architect, DDD Specialist).
- **<context>**: Provides the exact error logs and environment details.
- **<constraints>**: Enforces the "Dark Forest Protocol" (Verify Then Trust).
- **<execution_steps>**: Detailed algorithmic approach to the solution.
- **<output_format>**: Instructions for unified diffs or shell commands.