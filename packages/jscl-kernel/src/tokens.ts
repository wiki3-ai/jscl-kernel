import type { KernelMessage } from '@jupyterlab/services';

/**
 * The JSCL worker kernel interface.
 */
export interface IJSCLWorkerKernel {
  /**
   * Initialize the kernel.
   */
  initialize(options: IJSCLWorkerKernel.IOptions): Promise<void>;

  /**
   * Execute code.
   */
  execute(
    content: KernelMessage.IExecuteRequestMsg['content'],
    parent: any
  ): Promise<KernelMessage.IExecuteReplyMsg['content']>;

  /**
   * Complete code.
   */
  complete(
    content: KernelMessage.ICompleteRequestMsg['content'],
    parent: any
  ): Promise<KernelMessage.ICompleteReplyMsg['content']>;

  /**
   * Inspect code.
   */
  inspect(
    content: KernelMessage.IInspectRequestMsg['content'],
    parent: any
  ): Promise<KernelMessage.IInspectReplyMsg['content']>;

  /**
   * Check if code is complete.
   */
  isComplete(
    content: KernelMessage.IIsCompleteRequestMsg['content'],
    parent: any
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']>;
}

export namespace IJSCLWorkerKernel {
  export interface IOptions {
    /**
     * The location of the JSCL compiler.
     */
    jsclLocation?: string;
  }
}

/**
 * The remote JSCL worker kernel interface.
 */
export interface IRemoteJSCLWorkerKernel extends IJSCLWorkerKernel {
  // empty for now
}
