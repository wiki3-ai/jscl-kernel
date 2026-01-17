/**
 * Test script to verify JSCL kernel execution without manual UI testing
 * Run with: node test-kernel.js
 */

import { JSCLKernel } from './lib/index.js';

async function testKernelExecution() {
  console.log('Creating JSCL kernel...');
  
  const messages = [];
  const kernel = new JSCLKernel({
    id: 'test-kernel',
    name: 'test-kernel',
    sendMessage: (msg) => {
      console.log('Kernel sent message:', JSON.stringify(msg, null, 2));
      messages.push(msg);
    },
    location: 'http://localhost:8000',
  });

  console.log('Waiting for kernel ready...');
  try {
    await Promise.race([
      kernel.ready,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Kernel ready timeout after 10s')), 10000)
      )
    ]);
    console.log('Kernel is ready!');
  } catch (error) {
    console.error('Kernel failed to become ready:', error);
    process.exit(1);
  }

  console.log('Executing code: (+ 1 2)');
  try {
    const result = await Promise.race([
      kernel.executeRequest({
        code: '(+ 1 2)',
        silent: false,
        store_history: true,
        user_expressions: {},
        allow_stdin: false,
        stop_on_error: false
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Execute timeout after 5s')), 5000)
      )
    ]);
    
    console.log('Execution result:', JSON.stringify(result, null, 2));
    console.log('Messages received:', messages.length);
    
    if (result.status === 'ok') {
      console.log('✓ Test PASSED');
      process.exit(0);
    } else {
      console.error('✗ Test FAILED: status was', result.status);
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Test FAILED with error:', error);
    console.log('Messages received before error:', messages);
    process.exit(1);
  }
}

testKernelExecution().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
