import { expose } from 'comlink';
import { JSCLRemoteKernel } from './worker';

const worker = new JSCLRemoteKernel();

expose(worker);
