# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-17

### Added
- Initial release of JSCL kernel for JupyterLite
- Core kernel implementation using JSCL compiler
- Web Worker-based code execution
- Support for Common Lisp code execution in the browser
- Basic code completion for Common Lisp keywords
- Parenthesis balancing for Lisp expressions
- Console output redirection (stdout/stderr)
- Error handling and traceback display
- TypeScript implementation with full type safety
- JupyterLab extension for kernel registration
- Python packaging for easy installation
- Comprehensive documentation and examples
- Development tools (linting, formatting, building)

### Features
- Execute Common Lisp code directly in JupyterLite notebooks
- No server required - runs entirely in the browser
- JSCL compiler integration via CDN or bundled
- Syntax highlighting for Common Lisp
- Basic introspection and help

### Dependencies
- JupyterLite >= 0.3.0
- JSCL 0.9.0
- Node.js >= 18 (for development)

[0.1.0]: https://github.com/wiki3-ai/jscl-kernel/releases/tag/v0.1.0
