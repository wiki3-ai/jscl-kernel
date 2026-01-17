# jscl-kernel

[![Github Actions Status](https://github.com/wiki3-ai/jscl-kernel/workflows/Build/badge.svg)](https://github.com/wiki3-ai/jscl-kernel/actions)

A Common Lisp kernel for JupyterLite using the JSCL (JavaScript Common Lisp) compiler.

This kernel allows you to run Common Lisp code directly in your browser using JupyterLite, powered by the [JSCL](https://github.com/jscl-project/jscl) compiler which compiles Common Lisp to JavaScript.

## Features

- Run Common Lisp code in JupyterLite notebooks
- No server required - runs entirely in the browser
- Supports a substantial subset of Common Lisp
- Syntax highlighting and basic code completion
- Parenthesis matching for balanced expressions

## Requirements

- JupyterLite >= 0.3.0
- Node.js >= 18 (for building)

## Installation

### For JupyterLite sites

To install the kernel in your JupyterLite deployment:

```bash
pip install jupyterlite-jscl-kernel
```

Then build your JupyterLite site:

```bash
jupyter lite build
```

### For development

To install for development:

```bash
# Clone the repository
git clone https://github.com/wiki3-ai/jscl-kernel.git
cd jscl-kernel

# Install dependencies
yarn install

# Build the packages
yarn run build

# Install the Python package in development mode
pip install -e .
```

## Usage

Once installed, the Common Lisp (JSCL) kernel will be available in your JupyterLite deployment. Create a new notebook and select "Common Lisp (JSCL)" as the kernel.

### Example Code

```lisp
;; Define a function
(defun factorial (n)
  (if (<= n 1)
      1
      (* n (factorial (- n 1)))))

;; Call the function
(factorial 5)
;; => 120

;; Use list functions
(mapcar #'(lambda (x) (* x x)) '(1 2 3 4 5))
;; => (1 4 9 16 25)

;; Print to output
(print "Hello from Common Lisp!")
```

## Supported Common Lisp Features

JSCL supports a substantial subset of Common Lisp, including:

- Multiple values
- Explicit control transfers (`tagbody`, `go`)
- Non-local exits (`catch`, `throw`, `block`, `return-from`)
- Lexical and special variables
- Optional and keyword arguments
- Packages
- The `LOOP` macro
- Partial support for CLOS (Common Lisp Object System)
- `SETF` places
- The `format` function

For more details on JSCL's Common Lisp support, see the [JSCL documentation](https://github.com/jscl-project/jscl).

## Development

### Building

```bash
yarn run build
```

### Watching for changes

```bash
yarn run watch
```

### Linting

```bash
yarn run lint
```

### Cleaning

```bash
yarn run clean
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the BSD-3-Clause License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [JSCL Project](https://github.com/jscl-project/jscl) - The JavaScript Common Lisp compiler
- [JupyterLite](https://github.com/jupyterlite/jupyterlite) - The JupyterLab distribution that runs in the browser
- [JupyterLite JavaScript Kernel](https://github.com/jupyterlite/javascript-kernel) - Reference implementation for JupyterLite kernels

## Related Projects

- [JSCL](https://github.com/jscl-project/jscl) - JavaScript Common Lisp
- [JupyterLite](https://github.com/jupyterlite/jupyterlite) - Jupyter in the browser
- [Common Lisp HyperSpec](http://www.lispworks.com/documentation/HyperSpec/Front/index.htm) - The Common Lisp language specification
