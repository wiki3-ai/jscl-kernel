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
      importScripts(this._jsclUrl);
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

      // Capture output during evaluation
      const originalWriteString = jscl.internals?.['%write-string'];

      // Set up output capture
      if (jscl.internals) {
        jscl.internals['%write-string'] = (str: string) => {
          // Stream output immediately
          postMessage({
            type: 'stream',
            bundle: { name: 'stdout', text: str }
          });
        };
      }

      // Evaluate the Common Lisp code
      const result = jscl.evaluateString(code);

      // Restore original write function
      if (originalWriteString && jscl.internals) {
        jscl.internals['%write-string'] = originalWriteString;
      }

      this._executionCount++;

      // Format the result for display
      const textPlain = this._formatResult(result);
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

  /**
   * Format a JSCL result for display.
   */
  private _formatResult(val: any): string | undefined {
    if (val === undefined || val === null) {
      return undefined;
    }

    // JSCL returns JavaScript values that represent Lisp objects
    // Try to convert them to a readable string representation
    try {
      if (typeof val === 'string') {
        return val;
      }
      if (typeof val === 'number' || typeof val === 'boolean') {
        return String(val);
      }
      if (Array.isArray(val)) {
        return this._formatList(val);
      }
      if (typeof val === 'object' && val !== null) {
        // Check if it has a toString method that gives meaningful output
        const str = String(val);
        if (str !== '[object Object]') {
          return str;
        }
        // Try to format as a Lisp object
        return JSON.stringify(val);
      }
      return String(val);
    } catch {
      return String(val);
    }
  }

  /**
   * Format a list (array) as a Lisp list.
   */
  private _formatList(arr: any[]): string {
    if (arr.length === 0) {
      return 'NIL';
    }
    const items = arr.map(item => {
      if (Array.isArray(item)) {
        return this._formatList(item);
      }
      return String(item);
    });
    return '(' + items.join(' ') + ')';
  }
}
