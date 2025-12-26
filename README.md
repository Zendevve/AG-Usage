# Antigravity Usage

**The Definitive Quota Tracker for Antigravity AI.**

[![Version](https://img.shields.io/badge/version-0.5.0-blue)](https://marketplace.visualstudio.com/items?itemName=zendevve.antigravity-usage)
[![Privacy](https://img.shields.io/badge/privacy-100%25%20local-green)](https://github.com/Zendevve/antigravity-usage)
[![Works In](https://img.shields.io/badge/works%20in-DevContainers%20%7C%20WSL%20%7C%20SSH-orange)](https://github.com/Zendevve/antigravity-usage)

---

> **"Stop Guessing. Start Knowing."**

Antigravity Usage transforms your status bar into a precision instrument for AI quota monitoring. Unlike competitors, we provide **predictive analytics**, **universal compatibility**, and a **privacy-first** architecture.

## 🔒 Privacy Firewall

**100% Local. Zero Telemetry. Your Code Stays Yours.**

- All data processing happens locally on your machine
- No external network calls (we only talk to `localhost`)
- No analytics, no tracking, no data collection
- Safe for enterprise and air-gapped environments

## ✨ Features

### 📊 Predictive Analytics
- **Burn Rate Tracking**: Real-time consumption velocity (%/hour)
- **Time-to-Empty**: "You'll run out in ~2h 15m at this pace"
- **Session Stats**: Track your impact since VS Code opened
- **Active Model Detection**: Heuristic-based identification of which model you're using

### 🌐 Universal Compatibility (NEW in 0.5.0)
- **DevContainers**: Works inside Docker containers
- **WSL2**: Full Windows Subsystem for Linux support
- **Remote SSH**: Develop on any remote machine
- **Corporate VDI**: No `lsof` or admin rights required

Our hybrid detection uses Node.js socket scanning as primary method—no OS commands needed.

### 🧹 Smart Context Flush (NEW in 0.5.0)
When your agent gets stuck or confused, surgically clear the context without losing your work:
- `Ctrl+Shift+Alt+F` or `Antigravity: Flush Active Context`
- **Clears**: Conversation memory, code embeddings
- **Preserves**: Brain tasks, implementation plans, task.md files

### 💻 Dashboard
- Minimal, brutalist design
- Per-model quota breakdown
- Sparkline history charts
- Cache management

## 📊 Why AG-Usage?

| Feature | AG-Usage | Others |
|---------|:--------:|:------:|
| Predictive Analytics | ✅ | Partial |
| Universal Port Detection | ✅ | ❌ (lsof) |
| DevContainer Support | ✅ | ❌ |
| Smart Context Flush | ✅ | Nuclear only |
| Privacy (100% Local) | ✅ | Varies |
| Zero Configuration | ✅ | ❌ |

## 🔧 Commands

| Command | Shortcut | Description |
|---------|:--------:|-------------|
| `Antigravity: Open Dashboard` | — | Full webview dashboard |
| `Antigravity: Quick Status` | — | Quick model summary |
| `Antigravity: Flush Active Context` | `Ctrl+Shift+Alt+F` | Surgical context clear |
| `Antigravity: Clean Cache` | — | Nuclear delete (all data) |
| `Antigravity: Pin Model...` | — | Prioritize models in display |

## 📦 Installation

1. Open **Antigravity** or VS Code
2. `Ctrl+Shift+X` → Search **"Antigravity Usage"**
3. Click **Install**

## 🛠️ Technical Details

- **Hybrid Port Detection**: Socket scanner (primary) + OS commands (fallback)
- **Polling**: Configurable interval (30-300 seconds)
- **Burn Rate**: Sliding window average over historical snapshots
- **Active Detection**: First-derivative analysis of usage changes

## 🤝 Contributing

See [AGENTS.md](AGENTS.md) for MCAF compliance rules.

---
**Built by Zendevve** · MIT License · © 2025

