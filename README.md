# jscl-kernel

A Common Lisp kernel for JupyterLite using [JSCL](https://jscl-project.github.io/) (JavaScript Common Lisp).

[![Build](https://github.com/wiki3-ai/jscl-kernel/actions/workflows/build.yml/badge.svg)](https://github.com/wiki3-ai/jscl-kernel/actions/workflows/build.yml)

## Overview

This kernel allows you to run Common Lisp code directly in your browser using JupyterLite. It uses JSCL, a Common Lisp to JavaScript compiler, to execute Lisp code in a Web Worker.

## Features

- Run Common Lisp code in the browser without any server
- Works with JupyterLite >= 0.7.0
- Basic code completion for Common Lisp symbols
- Streaming output support

## Installation

### For JupyterLite

```bash
pip install jupyterlite-core jupyterlite-jscl-kernel
jupyter lite build
```

### For GitHub Pages

```bash
git checkout gh-pages
pip install jupyterlite-core .
jupyter lite build --output-dir docs
git commit -am "Rebuild gh-pages docs" docs
```

### For Development

```bash
# Clone the repository
git clone https://github.com/wiki3-ai/jscl-kernel.git
cd jscl-kernel

# Install dependencies
pip install -e ".[dev]"
jlpm install
jlpm build

# Build the JupyterLab extension
jupyter labextension develop . --overwrite
```

## Usage

After installing, you can create a new notebook and select "Common Lisp (JSCL)" as the kernel.

### Example

```lisp
;; Define a function
(defun factorial (n)
  (if (<= n 1)
      1
      (* n (factorial (- n 1)))))

;; Call the function
(factorial 10)
```

### Supported Features

JSCL supports a subset of Common Lisp, including:

- Special operators and macros
- Multiple values
- Lexical and special variables
- Optional and keyword arguments
- The LOOP macro
- Basic CLOS support

For more details on JSCL's capabilities, see the [JSCL documentation](https://jscl-project.github.io/).

## Testing

### Run Unit Tests

```bash
jlpm test
```

### Run Integration Tests

Integration tests use Playwright to test the kernel in a real browser environment:

```bash
sudo -E npx playwright install-deps && npx playwright install
pip install pytest pytest-playwright
playwright install chromium
jupyter lite build --output-dir dist
pytest tests/ -v --browser chromium
```

## Development

### Project Structure

```
jscl-kernel/
├── packages/
│   ├── jscl-kernel/          # Core kernel implementation
│   │   ├── src/
│   │   │   ├── kernel.ts     # Main kernel class
│   │   │   ├── worker.ts     # JSCL Web Worker integration
│   │   │   └── tokens.ts     # Type definitions
│   │   └── style/
│   └── jscl-kernel-extension/ # JupyterLab extension
│       └── src/
│           └── index.ts      # Extension plugin
├── jupyterlite_jscl_kernel/  # Python package
└── tests/                    # Integration tests
```

### Building

```bash
jlpm install
jlpm build:prod
```

### Watching for Changes

```bash
jlpm watch
```

## Requirements

- Python >= 3.10
- JupyterLite >= 0.7.0
- JupyterLab >= 4.0.0

## License

This project is licensed under the GPL-3.0-or-later License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [JSCL Project](https://github.com/jscl-project/jscl) - The Common Lisp to JavaScript compiler
- [JupyterLite](https://github.com/jupyterlite/jupyterlite) - Jupyter running in the browser
- [jupyterlite/javascript-kernel](https://github.com/jupyterlite/javascript-kernel) - Inspiration for the kernel architecture
