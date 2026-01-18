// Copyright (c) JSCL Kernel Contributors.
// Distributed under the terms of the GPL-3.0-or-later License.

/**
 * A WebWorker entrypoint that uses comlink to handle postMessage details
 */
import { expose } from 'comlink';

import { JSCLRemoteKernel } from './worker';

const worker = new JSCLRemoteKernel();

expose(worker);
