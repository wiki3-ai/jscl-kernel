import { IJSCLWorkerKernel } from './tokens';
import type { KernelMessage } from '@jupyterlab/services';

/**
 * A class that handles code execution in a JSCL worker.
 */
export class JSCLRemoteKernel implements IJSCLWorkerKernel {
  private _executionCount = 0;
  private _jsclEval: any;

  /**
   * Initialize the remote kernel.
   *
   * @param options The options for the kernel.
   */
  async initialize(options: IJSCLWorkerKernel.IOptions): Promise<void> {
    // Override console methods to post messages
    console.log = (...args: any[]) => {
      const bundle = {
        name: 'stdout',
        text: args.join(' ') + '\n'
      };
      postMessage({
        type: 'stream',
        bundle
      });
    };
    console.info = console.log;

    console.error = (...args: any[]) => {
      const bundle = {
        name: 'stderr',
        text: args.join(' ') + '\n'
      };
      postMessage({
        type: 'stream',
        bundle
      });
    };
    console.warn = console.error;

    self.onerror = (message, source, lineno, colno, error) => {
      const errorDetails = [
        `Error: ${message}`,
        source ? `Source: ${source}` : '',
        lineno ? `Line: ${lineno}` : '',
        colno ? `Column: ${colno}` : '',
        error ? `Stack: ${error.stack}` : ''
      ]
        .filter(Boolean)
        .join('\n');
      console.error(errorDetails);
    };

    // Load JSCL
    try {
      // Try to import JSCL from global scope first
      // @ts-expect-error JSCL is loaded globally
      if (typeof self.jscl !== 'undefined') {
        // @ts-expect-error JSCL is loaded globally
        this._jsclEval = self.jscl.evaluateString;
      } else {
        // Load JSCL from CDN if not bundled
        // Note: In production, consider bundling JSCL directly or using SRI
        // for enhanced security. See CONTRIBUTING.md for details.
        // Use type declaration for importScripts in worker context
        (self as any).importScripts(
          'https://cdn.jsdelivr.net/npm/jscl@0.9.0/jscl.js'
        );
        // @ts-expect-error JSCL is loaded globally
        this._jsclEval = self.jscl.evaluateString;
      }
    } catch (e) {
      console.error('Failed to load JSCL:', e);
      throw e;
    }
  }

  /**
   * Execute code in the worker kernel.
   */
  async execute(
    content: KernelMessage.IExecuteRequestMsg['content'],
    parent: any
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    const { code } = content;
    try {
      // Evaluate the Common Lisp code using JSCL
      const result = this._jsclEval(code);
      this._executionCount++;

      const textPlain = this._formatResult(result);
      const data: { ['text/plain']?: string } = {};
      if (typeof textPlain === 'string') {
        data['text/plain'] = textPlain;
      }

      const bundle: KernelMessage.IExecuteResultMsg['content'] = {
        data,
        metadata: {},
        execution_count: this._executionCount
      };
      postMessage({
        bundle,
        type: 'execute_result'
      });

      return {
        status: 'ok',
        execution_count: this._executionCount,
        user_expressions: {}
      };
    } catch (e) {
      const error = e as any;
      const name = error.name || 'Error';
      const message = error.message || String(error);
      const stack = error.stack || '';

      const bundle = {
        ename: name,
        evalue: message,
        traceback: stack ? [`${stack}`] : [message]
      };

      postMessage({
        bundle,
        type: 'execute_error'
      });

      return {
        status: 'error',
        execution_count: this._executionCount,
        ename: name,
        evalue: message,
        traceback: stack ? [`${stack}`] : [message]
      };
    }
  }

  /**
   * Handle the complete message
   */
  async complete(
    content: KernelMessage.ICompleteRequestMsg['content'],
    parent: any
  ): Promise<KernelMessage.ICompleteReplyMsg['content']> {
    // Basic completion - list all symbols in the global namespace
    const { code, cursor_pos } = content;
    const matches: string[] = [];

    // Get text before cursor
    const textBeforeCursor = code.slice(0, cursor_pos);
    const tokens = textBeforeCursor.split(/[\s()]+/);
    const lastToken = tokens[tokens.length - 1] || '';

    // Get Common Lisp symbols (basic implementation)
    // In a real implementation, you would query JSCL for available symbols
    const commonLispSymbols = [
      'defun',
      'defvar',
      'defparameter',
      'defmacro',
      'defclass',
      'let',
      'let*',
      'lambda',
      'if',
      'when',
      'unless',
      'cond',
      'loop',
      'do',
      'dolist',
      'dotimes',
      'car',
      'cdr',
      'cons',
      'list',
      'append',
      'reverse',
      'print',
      'princ',
      'format',
      '+',
      '-',
      '*',
      '/',
      '=',
      '<',
      '>',
      '<=',
      '>=',
      'and',
      'or',
      'not'
    ];

    for (const symbol of commonLispSymbols) {
      if (symbol.startsWith(lastToken)) {
        matches.push(symbol);
      }
    }

    return {
      status: 'ok',
      matches,
      cursor_start: cursor_pos - lastToken.length,
      cursor_end: cursor_pos,
      metadata: {}
    };
  }

  /**
   * Handle the inspect message
   */
  async inspect(
    content: KernelMessage.IInspectRequestMsg['content'],
    parent: any
  ): Promise<KernelMessage.IInspectReplyMsg['content']> {
    return {
      status: 'ok',
      found: false,
      data: {},
      metadata: {}
    };
  }

  /**
   * Handle the is_complete message
   */
  async isComplete(
    content: KernelMessage.IIsCompleteRequestMsg['content'],
    parent: any
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']> {
    const { code } = content;

    // Simple check for balanced parentheses
    let depth = 0;
    for (const char of code) {
      if (char === '(') {
        depth++;
      } else if (char === ')') {
        depth--;
      }
      if (depth < 0) {
        return { status: 'invalid' };
      }
    }

    if (depth === 0) {
      return { status: 'complete' };
    } else {
      return { status: 'incomplete', indent: '  ' };
    }
  }

  /**
   * Format the result for display
   */
  private _formatResult(result: any): string {
    // Handle Common Lisp NIL (represented as null in JavaScript)
    if (result === null) {
      return 'NIL';
    }

    if (result === undefined) {
      return 'undefined';
    }

    // JSCL returns JavaScript values
    if (typeof result === 'string') {
      return result;
    } else if (typeof result === 'object') {
      try {
        return JSON.stringify(result, null, 2);
      } catch {
        return String(result);
      }
    } else {
      return String(result);
    }
  }
}
