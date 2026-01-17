// Copyright (c) JSCL Kernel Contributors.
// Distributed under the terms of the GPL-3.0-or-later License.

/**
 * Definitions for the JSCL kernel.
 */

import type { Remote } from 'comlink';

import { IWorkerKernel } from '@jupyterlite/services';

/**
 * An interface for JSCL workers.
 */
export interface IJSCLWorkerKernel extends IWorkerKernel {
  /**
   * Handle any lazy initialization activities.
   */
  initialize(options: IJSCLWorkerKernel.IOptions): Promise<void>;
}

/**
 * An convenience interface for JSCL workers wrapped by a comlink Remote.
 */
export interface IRemoteJSCLWorkerKernel extends Remote<IJSCLWorkerKernel> {}

/**
 * An namespace for JSCL workers.
 */
export namespace IJSCLWorkerKernel {
  /**
   * Initialization options for a worker.
   */
  export interface IOptions extends IWorkerKernel.IOptions {
    /**
     * The URL to load the JSCL library from.
     */
    jsclUrl?: string;
  }
}
