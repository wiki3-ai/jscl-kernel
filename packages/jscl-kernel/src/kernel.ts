import type { KernelMessage } from '@jupyterlab/services';
import { BaseKernel, type IKernel } from '@jupyterlite/services';
import { PromiseDelegate } from '@lumino/coreutils';
import { wrap } from 'comlink';
import { IRemoteJSCLWorkerKernel } from './tokens';

/**
 * A kernel that executes Common Lisp code using JSCL in a Web Worker.
 */
export class JSCLKernel extends BaseKernel implements IKernel {
  private _worker!: Worker;
  private _ready = new PromiseDelegate<void>();
  public remoteKernel!: IRemoteJSCLWorkerKernel;

  /**
   * Instantiate a new JSCLKernel
   *
   * @param options The instantiation options for a new JSCLKernel
   */
  constructor(options: JSCLKernel.IOptions) {
    super(options);
    this._worker = this.initWorker(options);
    this._worker.onmessage = (e: MessageEvent) =>
      this._processWorkerMessage(e.data);
    this.remoteKernel = this.initRemote(options);
    this._ready.resolve();
  }

  /**
   * Dispose the kernel.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._worker.terminate();
    super.dispose();
  }

  /**
   * A promise that is fulfilled when the kernel is ready.
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /**
   * Handle a kernel_info_request message
   */
  async kernelInfoRequest(): Promise<KernelMessage.IInfoReplyMsg['content']> {
    const content: KernelMessage.IInfoReply = {
      implementation: 'jscl',
      implementation_version: '0.1.0',
      language_info: {
        codemirror_mode: {
          name: 'commonlisp'
        },
        file_extension: '.lisp',
        mimetype: 'text/x-common-lisp',
        name: 'common-lisp',
        nbconvert_exporter: 'commonlisp',
        pygments_lexer: 'common-lisp',
        version: '0.9.0'
      },
      protocol_version: '5.3',
      status: 'ok',
      banner: 'JSCL - A Common Lisp kernel running in the browser',
      help_links: [
        {
          text: 'JSCL Documentation',
          url: 'https://github.com/jscl-project/jscl'
        },
        {
          text: 'Common Lisp HyperSpec',
          url: 'http://www.lispworks.com/documentation/HyperSpec/Front/index.htm'
        }
      ]
    };
    return content;
  }

  /**
   * Handle an `execute_request` message
   *
   * @param content The request content.
   */
  async executeRequest(
    content: KernelMessage.IExecuteRequestMsg['content']
  ): Promise<KernelMessage.IExecuteReplyMsg['content']> {
    const result = await this.remoteKernel.execute(content, this.parent);
    result.execution_count = this.executionCount;
    return result;
  }

  /**
   * Handle a `complete_request` message
   *
   * @param content The request content.
   */
  async completeRequest(
    content: KernelMessage.ICompleteRequestMsg['content']
  ): Promise<KernelMessage.ICompleteReplyMsg['content']> {
    return await this.remoteKernel.complete(content, this.parent);
  }

  /**
   * Handle an `inspect_request` message
   *
   * @param content The request content.
   */
  async inspectRequest(
    content: KernelMessage.IInspectRequestMsg['content']
  ): Promise<KernelMessage.IInspectReplyMsg['content']> {
    return await this.remoteKernel.inspect(content, this.parent);
  }

  /**
   * Handle an `is_complete_request` message
   *
   * @param content The request content.
   */
  async isCompleteRequest(
    content: KernelMessage.IIsCompleteRequestMsg['content']
  ): Promise<KernelMessage.IIsCompleteReplyMsg['content']> {
    return await this.remoteKernel.isComplete(content, this.parent);
  }

  /**
   * Handle an `input_reply` message
   *
   * @param content The request content.
   */
  async inputReply(
    content: KernelMessage.IInputReplyMsg['content']
  ): Promise<void> {
    // Not implemented
  }

  /**
   * Handle a `comm_info_request` message
   *
   * @param content The request content.
   */
  async commInfoRequest(
    content: KernelMessage.ICommInfoRequestMsg['content']
  ): Promise<KernelMessage.ICommInfoReplyMsg['content']> {
    return {
      comms: {},
      status: 'ok'
    };
  }

  /**
   * Handle a `comm_open` message
   */
  async commOpen(msg: KernelMessage.ICommOpenMsg): Promise<void> {
    // Not implemented
  }

  /**
   * Handle a `comm_msg` message
   */
  async commMsg(msg: KernelMessage.ICommMsgMsg): Promise<void> {
    // Not implemented
  }

  /**
   * Handle a `comm_close` message
   */
  async commClose(msg: KernelMessage.ICommCloseMsg): Promise<void> {
    // Not implemented
  }

  /**
   * Initialize the worker.
   */
  protected initWorker(options: JSCLKernel.IOptions): Worker {
    // Create the worker using the comlink worker
    const worker = new Worker(new URL('./comlink.worker', import.meta.url), {
      type: 'module'
    });
    return worker;
  }

  /**
   * Initialize the remote kernel.
   */
  protected initRemote(options: JSCLKernel.IOptions): IRemoteJSCLWorkerKernel {
    const remote = wrap<IRemoteJSCLWorkerKernel>(this._worker);
    void remote.initialize({});
    return remote;
  }

  /**
   * Process a message from the worker.
   */
  private _processWorkerMessage(msg: any): void {
    if (!msg.type) {
      return;
    }

    switch (msg.type) {
      case 'stream': {
        this.stream(msg.bundle, this.parent?.header);
        break;
      }
      case 'execute_result': {
        this.publishExecuteResult(msg.bundle, this.parent?.header);
        break;
      }
      case 'execute_error': {
        this.publishExecuteError(msg.bundle, this.parent?.header);
        break;
      }
      case 'display_data': {
        this.displayData(msg.bundle, this.parent?.header);
        break;
      }
      default:
        break;
    }
  }
}

/**
 * A namespace for JSCLKernel statics.
 */
export namespace JSCLKernel {
  /**
   * The instantiation options for a JSCLKernel.
   */
  export interface IOptions extends IKernel.IOptions {
    /**
     * The location of the JSCL compiler.
     */
    jsclLocation?: string;
  }
}
