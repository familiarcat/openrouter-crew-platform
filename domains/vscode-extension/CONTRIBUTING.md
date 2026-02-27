# Contributing to OpenRouter Crew VSCode Extension

First off, thank you for considering contributing! Your help is essential for making this a great tool for everyone.

## Table of Contents
- Code of Conduct
- Getting Started
  - Prerequisites
  - Installation
- Development Workflow
  - Running the Extension Locally
  - Running Tests
- Coding Guidelines
- Submitting Changes

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- **Node.js**: v20.0.0 or higher
- **pnpm**: v9.0.0 or higher
- **VSCode**: Latest stable version

### Installation

1.  **Fork & Clone**: Fork the repository on GitHub and clone your fork locally.
    ```bash
    git clone https://github.com/YOUR_USERNAME/openrouter-crew-platform.git
    cd openrouter-crew-platform
    ```

2.  **Install Dependencies**: Install all dependencies from the root of the monorepo.
    ```bash
    pnpm install
    ```

## Development Workflow

### Running the Extension Locally

1.  **Open the Extension Folder**: Open the `domains/vscode-extension` directory in a separate VSCode window.

2.  **Start the Compiler**: In a terminal, run the watch command from the **root** of the monorepo. This will automatically recompile the extension whenever you save a file.
    ```bash
    pnpm --filter openrouter-crew-vscode watch
    ```

3.  **Start Debugging**: Press `F5` in the VSCode window that has the extension code open. This will open a new "Extension Development Host" window with your extension loaded and the debugger attached.

### Running Tests

To run the unit and integration tests for the extension:

```bash
pnpm --filter openrouter-crew-vscode test
```

## Coding Guidelines

- **TypeScript**: All code should be written in TypeScript with strict mode enabled.
- **Linting**: Follow the ESLint rules defined in the project. Run `pnpm lint` to check your code.
- **Tests**: New features or bug fixes should include corresponding unit or integration tests.
- **Documentation**: Add JSDoc comments to new functions, classes, and interfaces.

## Submitting Changes

1.  **Create a Branch**: Create a new branch for your feature or bug fix.
2.  **Commit Your Changes**: Make your changes and commit them with a clear and descriptive message.
3.  **Push to Your Fork**: Push your changes to your forked repository.
4.  **Open a Pull Request**: Open a pull request from your fork to the main repository's `main` branch. Provide a detailed description of the changes you've made.