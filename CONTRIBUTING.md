# JSCL Kernel Development

This document provides information for developers working on the JSCL kernel.

## Project Structure

```
jscl-kernel/
├── packages/
│   ├── jscl-kernel/              # Core kernel implementation
│   │   ├── src/
│   │   │   ├── kernel.ts         # Main kernel class
│   │   │   ├── worker.ts         # JSCL worker implementation
│   │   │   ├── comlink.worker.ts # Comlink wrapper
│   │   │   ├── tokens.ts         # TypeScript interfaces
│   │   │   └── index.ts          # Package exports
│   │   └── package.json
│   └── jscl-kernel-extension/    # JupyterLab extension
│       ├── src/
│       │   ├── index.ts          # Extension registration
│       │   └── declarations.d.ts # Type declarations
│       ├── style/
│       │   └── icons/            # Kernel logos
│       └── package.json
├── jupyterlite_jscl_kernel/      # Python package
├── pyproject.toml                # Python packaging config
├── setup.py                      # Python setup script
├── lerna.json                    # Lerna monorepo config
└── package.json                  # Root package config
```

## Development Workflow

### Initial Setup

```bash
# Install dependencies
yarn install

# Build all packages
yarn run build
```

### Making Changes

```bash
# Watch for changes and rebuild automatically
yarn run watch
```

### Testing Changes

To test the kernel in JupyterLite:

1. Build the packages:
   ```bash
   yarn run build
   ```

2. Install the Python package in development mode:
   ```bash
   pip install -e .
   ```

3. Build your JupyterLite site:
   ```bash
   jupyter lite build
   ```

4. Serve the JupyterLite site:
   ```bash
   jupyter lite serve
   ```

### Code Quality

```bash
# Run linting
yarn run lint:check

# Fix linting issues automatically
yarn run lint

# Clean build artifacts
yarn run clean
```

## Architecture

### Kernel Architecture

The JSCL kernel follows the JupyterLite kernel architecture:

1. **Main Kernel (`kernel.ts`)**: Extends `BaseKernel` from `@jupyterlite/services`
   - Handles kernel info requests
   - Manages code execution requests
   - Provides code completion
   - Implements parenthesis matching for Lisp

2. **Worker (`worker.ts`)**: Runs in a Web Worker
   - Loads and initializes JSCL compiler
   - Evaluates Common Lisp code
   - Handles console output redirection
   - Returns execution results

3. **Communication**: Uses Comlink for seamless communication between main thread and worker

### JSCL Integration

The kernel loads JSCL in the worker context:

- First tries to use bundled JSCL if available
- Falls back to loading from CDN (https://cdn.jsdelivr.net/npm/jscl@0.9.0/jscl.js)
- Uses `jscl.evaluateString()` to execute Common Lisp code

**Security Note**: The current implementation loads JSCL from a CDN without Subresource Integrity (SRI) checks. For production deployments, consider:

1. Bundling JSCL directly with the kernel
2. Adding SRI hash verification if loading from CDN
3. Using a private CDN or hosting JSCL yourself

To bundle JSCL directly, add it as a dependency and import it in `worker.ts` instead of using `importScripts()`.

### Message Flow

1. User enters code in notebook
2. JupyterLite sends `execute_request` to kernel
3. Kernel forwards to worker via Comlink
4. Worker evaluates code with JSCL
5. Worker posts results back to kernel
6. Kernel publishes results to JupyterLite

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests
5. Submit a pull request

## Debugging

### Browser DevTools

The kernel runs in the browser, so you can use browser DevTools:

1. Open DevTools (F12)
2. Check Console for errors
3. Use Sources tab to debug TypeScript (source maps included)
4. Check Network tab for JSCL loading issues

### Worker Debugging

Worker code can be debugged:

1. Look for worker errors in Console
2. Use `console.log()` in worker code (will appear in kernel output)
3. Check for JSCL loading errors

## Common Issues

### JSCL Not Loading

If JSCL fails to load:
- Check browser console for network errors
- Verify CDN is accessible
- Consider bundling JSCL directly

### Code Not Executing

If code doesn't execute:
- Check for balanced parentheses
- Look for JSCL compilation errors
- Verify kernel is properly initialized

### Module Resolution Issues

If imports fail:
- Ensure all dependencies are installed
- Check TypeScript configuration
- Verify module system compatibility

## Release Process

1. Update version in `package.json` and `lerna.json`
2. Update version in `pyproject.toml` and `setup.py`
3. Build packages: `yarn run build`
4. Run tests and linting
5. Commit and tag release
6. Publish to npm: `lerna publish`
7. Publish to PyPI: `python -m build && twine upload dist/*`

## Resources

- [JupyterLite Documentation](https://jupyterlite.readthedocs.io/)
- [JSCL Documentation](https://github.com/jscl-project/jscl)
- [JupyterLab Extension Development](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html)
- [Common Lisp HyperSpec](http://www.lispworks.com/documentation/HyperSpec/Front/index.htm)
