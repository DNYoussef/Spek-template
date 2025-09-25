# SPEK Enhanced Development Platform - Complete Reference Guide
## System Overview
Complete reference for the SPEK Enhanced Development Platform with 90+ AI agents, 172 slash commands, and comprehensive theater detection.

## Quick Commands Reference
### reference/COMMANDS.md
# Complete Slash Commands Reference

This document provides comprehensive documentation for all 17 slash commands in the SPEK-AUGMENT development template. Commands are organized by workflow phase and include detailed usage examples, integration patterns, and troubleshooting guidance.

> [TARGET] **Quick Start**: New to SPEK? See `examples/getting-started.md` for step-by-step tutorial  
> [U+1F4D6] **Cheat Sheet**: See `docs/QUICK-REFERENCE.md` for command syntax summary  
> [TOOL] **Troubleshooting**: See `examples/troubleshooting.md` for common issues

## [U+1F517] Command Categories

### [Core SPEK Commands](#core-spek-commands)
Planning and specification management

### [Analysis & Impact Commands](#analysis--impact-commands)  
Change analysis and failure routing

### reference/QUICK-REFERENCE.md
# Quick Reference - Slash Commands Cheat Sheet

## [ROCKET] Command Overview

### Research Commands (NEW)
| Command | Purpose | Constraints | Output |
|---------|---------|-------------|--------|
| `/research:web` | Web search for existing solutions | - | `research-web.json` |
| `/research:github` | GitHub repository analysis | Quality scoring | `research-github.json` |
| `/research:models` | AI model discovery (HuggingFace) | Size/deployment filters | `research-models.json` |
| `/research:deep` | Deep technical research | MCP tools integration | `research-deep.json` |
| `/research:analyze` | Large-context synthesis | Gemini processing | `research-analyze.json` |

### Core Commands  
| Command | Purpose | Constraints | Output |
