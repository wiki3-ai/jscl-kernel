// Copyright (c) JSCL Kernel Contributors.
// Distributed under the terms of the GPL-3.0-or-later License.

/**
 * Type declarations for the JSCL (JavaScript Common Lisp) runtime.
 * JSCL is loaded via importScripts and exposes a global `jscl` object.
 */

/**
 * JSCL internal write function type
 */
type JSCLWriteString = (str: string) => void;

/**
 * JSCL internals interface
 */
interface IJSCLInternals {
  '%write-string'?: JSCLWriteString;
}

/**
 * JSCL global object interface
 */
interface IJSCL {
  /**
   * Evaluate a Common Lisp string and return the result.
   * @param code - Common Lisp code to evaluate
   * @returns The result of evaluating the code
   */
  evaluateString: (code: string) => unknown;

  /**
   * Internal JSCL functions
   */
  internals?: IJSCLInternals;

  /**
   * JSCL packages
   */
  packages?: {
    CL?: {
      symbols: Record<string, unknown>;
    };
  };
}

/**
 * Augment the global scope to include the jscl object loaded via importScripts
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface WorkerGlobalScope {
    jscl?: IJSCL;
  }
}

export type { IJSCL, IJSCLInternals, JSCLWriteString };
