// Copyright (c) JSCL Kernel Contributors.
// Distributed under the terms of the GPL-3.0-or-later License.

/// <reference lib="webworker" />

import { IJSCLWorkerKernel } from './tokens';
import { KernelMessage } from '@jupyterlab/services';
import type { IJSCL } from './jscl.d';

// Type assertion helper for accessing jscl on global scope
const getJSCL = (): IJSCL | undefined => {
  return (self as unknown as { jscl?: IJSCL }).jscl;
};

export class JSCLRemoteKernel {
  private _executionCount = 0;
  private _jsclLoaded = false;
  private _jsclUrl = '';

  /**
   * Initialize the remote kernel.
   *
   * @param options The options for the kernel.
   */
  async initialize(options: IJSCLWorkerKernel.IOptions) {
    // Store the JSCL URL for loading later
    this._jsclUrl = options.jsclUrl || '';

    // Override console.log to send output to the notebook
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
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
      console.error(message);
    };

    // Load JSCL
    await this._loadJSCL();
  }

  /**
   * Load the JSCL runtime into the worker.
   */
  private async _loadJSCL(): Promise<void> {
    if (this._jsclLoaded) {
      return;
    }

    try {
      // Load JSCL from the provided URL (bundled with the extension)
      if (!this._jsclUrl) {
        throw new Error('JSCL URL not provided');
      }

      // The jscl.js is patched during build (see scripts/patch-jscl.js) to
      // export to `self` which works in WebWorkers. We also define `window`
      // pointing to `self` so JSCL code using #j:window works correctly.
      (self as unknown as { window: typeof self }).window = self;

      // Use fetch+eval since importScripts is not available in module workers
      const response = await fetch(this._jsclUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch JSCL: ${response.status} ${response.statusText}`
        );
      }
      const jsclCode = await response.text();
      // eslint-disable-next-line no-eval
      (0, eval)(jsclCode);

      this._jsclLoaded = true;
    } catch (e) {
      console.error('Failed to load JSCL:', e);
      throw e;
    }
  }

  /**
   * Execute code in the worker kernel.
   */
  async execute(content: any, parent: any) {
    const { code } = content;
    try {
      // Make sure JSCL is loaded
      if (!this._jsclLoaded) {
        await this._loadJSCL();
      }

      const jscl = getJSCL();
      if (!jscl) {
        throw new Error('JSCL runtime not loaded');
      }

      // Capture stdout by redirecting *standard-output* to a string stream.
      // Use standard Common Lisp with-output-to-string macro.
      // Wrap user code in progn to handle multiple forms (cells can have 0+ forms).
      // The result is the value of the last form, matching standard REPL behavior.
      const wrappedCode = `
        (let ((jscl-kernel::*captured-output* "")
              (jscl-kernel::*result-value* nil))
          (setq jscl-kernel::*captured-output*
                (with-output-to-string (*standard-output*)
                  (setq jscl-kernel::*result-value* (progn ${code}))))
          ;; Store in JS for retrieval
          (setf (jscl::oget (jscl::%js-vref "self") "__kernel_stdout__")
                (jscl::lisp-to-js jscl-kernel::*captured-output*))
          (setf (jscl::oget (jscl::%js-vref "self") "__kernel_result__")
                (jscl::lisp-to-js (prin1-to-string jscl-kernel::*result-value*)))
          jscl-kernel::*result-value*)
      `;

      // Evaluate the user's code with output capture
      jscl.evaluateString(wrappedCode);

      // Retrieve captured stdout and result from JS globals
      const capturedStdout = (self as any).__kernel_stdout__ as
        | string
        | undefined;
      const formattedResult = (self as any).__kernel_result__ as
        | string
        | undefined;

      // Clean up
      delete (self as any).__kernel_stdout__;
      delete (self as any).__kernel_result__;

      this._executionCount++;

      // Send captured stdout FIRST, before the result
      if (capturedStdout && capturedStdout.length > 0) {
        postMessage({
          type: 'stream',
          bundle: { name: 'stdout', text: capturedStdout }
        });
      }

      // Result is already a formatted string from prin1-to-string
      const textPlain = formattedResult;

      const data: { ['text/plain']?: string } = {};
      if (
        typeof textPlain === 'string' &&
        textPlain !== 'NIL' &&
        textPlain !== ''
      ) {
        data['text/plain'] = textPlain;
      }

      const bundle: KernelMessage.IExecuteResultMsg['content'] = {
        data,
        metadata: {},
        execution_count: this._executionCount
      };

      // Only send execute_result if there's actual data to display
      if (Object.keys(data).length > 0) {
        postMessage({
          bundle,
          type: 'execute_result'
        });
      }

      return {
        status: 'ok',
        user_expressions: {}
      };
    } catch (e) {
      const error = e as Error;
      const name = error.name || 'Error';
      const message = error.message || String(e);
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
        ename: name,
        evalue: message,
        traceback: stack ? [`${stack}`] : [message]
      };
    }
  }

  /**
   * Handle the complete message - provide basic symbol completion
   */
  async complete(content: any, parent: any) {
    const { code, cursor_pos } = content;

    // Extract the word being typed
    const words =
      code.slice(0, cursor_pos).match(/([a-zA-Z0-9\-*+/?!]+)$/) ?? [];
    const word = words[0]?.toUpperCase() ?? '';

    // Get Common Lisp symbols for completion
    const matches: string[] = [];

    // Basic Common Lisp keywords and common functions
    const commonSymbols = [
      'DEFUN',
      'DEFMACRO',
      'DEFVAR',
      'DEFPARAMETER',
      'DEFCLASS',
      'DEFMETHOD',
      'LET',
      'LET*',
      'LAMBDA',
      'FLET',
      'LABELS',
      'MACROLET',
      'IF',
      'WHEN',
      'UNLESS',
      'COND',
      'CASE',
      'TYPECASE',
      'DO',
      'DO*',
      'DOLIST',
      'DOTIMES',
      'LOOP',
      'CAR',
      'CDR',
      'CONS',
      'LIST',
      'APPEND',
      'REVERSE',
      'LENGTH',
      'FIRST',
      'SECOND',
      'THIRD',
      'REST',
      'NTH',
      'NTHCDR',
      'MAPCAR',
      'MAPCAN',
      'MAPC',
      'MAPLIST',
      'APPLY',
      'FUNCALL',
      'FUNCTION',
      'SETF',
      'SETQ',
      'PUSH',
      'POP',
      'EQ',
      'EQL',
      'EQUAL',
      'EQUALP',
      'NULL',
      'NOT',
      'AND',
      'OR',
      'PRINT',
      'PRIN1',
      'PRINC',
      'FORMAT',
      'WRITE',
      'READ',
      'READ-LINE',
      'READ-CHAR',
      'NUMBERP',
      'STRINGP',
      'SYMBOLP',
      'LISTP',
      'CONSP',
      'ATOM',
      'PROGN',
      'PROG1',
      'PROG2',
      'BLOCK',
      'RETURN',
      'RETURN-FROM',
      'CATCH',
      'THROW',
      'UNWIND-PROTECT',
      'MULTIPLE-VALUE-BIND',
      'MULTIPLE-VALUE-LIST',
      'VALUES',
      'T',
      'NIL'
    ];

    if (word) {
      for (const sym of commonSymbols) {
        if (sym.startsWith(word)) {
          matches.push(sym.toLowerCase());
        }
      }
    }

    return {
      matches,
      cursor_start: cursor_pos - word.length,
      cursor_end: cursor_pos,
      metadata: {},
      status: 'ok'
    };
  }
}
