# Antigravity Usage

**Real-time quota monitoring for your AntiGravity AI models.**

This extension adds a status bar item to VS Code (or AntiGravity) that displays your current AI model quota usage. It helps you stay aware of your limits without checking external dashboards.

## Features

- **Real-Time Monitoring**: Polls usage data every minute.
- **Status Bar Integration**:
  - `$(check)`: Healthy (> 20% remaining)
  - `$(warning)`: Low (< 20% remaining)
  - `$(error)`: Exhausted
- **Interactive Menu**: Click the status bar item to see details for all models (Gemini, Claude, GPT, etc.).

## Installation

### For Testing/Development
1. Open this folder in VS Code.
2. Press **F5** to start the Extension Development Host.

### For Daily Use
1. Install the `.vsix` file:
   - Run `code --install-extension antigravity-quota-0.0.1.vsix`
   - OR drag and drop the `.vsix` file into the Extensions view.

## Configuration

Currently, the extension mocks the server connection for demonstration purposes. Real process detection will be enabled in v0.1.0.

## Contributing

See [AGENTS.md](AGENTS.md) for development rules and MCAF compliance.
