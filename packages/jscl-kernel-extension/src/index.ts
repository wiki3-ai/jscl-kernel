// Copyright (c) JSCL Kernel Contributors.
// Distributed under the terms of the GPL-3.0-or-later License.

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import type { IKernel } from '@jupyterlite/services';

import { IKernelSpecs } from '@jupyterlite/services';

import { JSCLKernel } from '@jupyterlite/jscl-kernel';

import lispLogo32 from '../style/icons/logo-32x32.png';

import lispLogo64 from '../style/icons/logo-64x64.png';

/**
 * A plugin to register the JSCL Common Lisp kernel.
 */
const kernel: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlite/jscl-kernel-extension:kernel',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterFrontEnd, kernelspecs: IKernelSpecs) => {
    kernelspecs.register({
      spec: {
        name: 'jscl',
        display_name: 'Common Lisp (JSCL)',
        language: 'common-lisp',
        argv: [],
        spec: {
          argv: [],
          env: {},
          display_name: 'Common Lisp (JSCL)',
          language: 'common-lisp',
          interrupt_mode: 'message',
          metadata: {}
        },
        resources: {
          'logo-32x32': lispLogo32,
          'logo-64x64': lispLogo64
        }
      },
      create: async (options: IKernel.IOptions): Promise<IKernel> => {
        return new JSCLKernel(options);
      }
    });
  }
};

const plugins: JupyterFrontEndPlugin<void>[] = [kernel];

export default plugins;
