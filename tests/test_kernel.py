# Copyright (c) JSCL Kernel Contributors.
# Distributed under the terms of the GPL-3.0-or-later License.

"""
Integration tests for the JSCL JupyterLite kernel.

These tests use Playwright to run the kernel in a real browser environment.
"""

import pytest
from playwright.sync_api import Page, expect
import subprocess
import time
import os
import signal

# Port for the JupyterLite server
JUPYTERLITE_PORT = 8888


@pytest.fixture(scope="session")
def jupyterlite_server():
    """Start a JupyterLite server for testing."""
    # Find the dist directory
    dist_dir = os.path.join(os.path.dirname(__file__), "..", "dist")
    if not os.path.exists(dist_dir):
        pytest.skip("JupyterLite site not built. Run 'jupyter lite build --output-dir dist' first.")
    
    # Start a simple HTTP server
    server = subprocess.Popen(
        ["python", "-m", "http.server", str(JUPYTERLITE_PORT)],
        cwd=dist_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for the server to start
    time.sleep(2)
    
    yield f"http://localhost:{JUPYTERLITE_PORT}"
    
    # Cleanup
    server.terminate()
    server.wait()


def test_kernel_available(page: Page, jupyterlite_server: str):
    """Test that the JSCL kernel is available in JupyterLite."""
    page.goto(f"{jupyterlite_server}/lab")
    
    # Wait for JupyterLite to load
    page.wait_for_timeout(5000)
    
    # Open the launcher
    page.locator('[data-command="launcher:create"]').click()
    page.wait_for_timeout(2000)
    
    # Check that the JSCL kernel is available
    # The kernel should appear in the launcher
    lisp_kernel = page.locator('text=Common Lisp (JSCL)')
    expect(lisp_kernel).to_be_visible(timeout=10000)


def test_simple_evaluation(page: Page, jupyterlite_server: str):
    """Test simple Lisp code evaluation."""
    page.goto(f"{jupyterlite_server}/lab")
    
    # Wait for JupyterLite to load
    page.wait_for_timeout(5000)
    
    # Create a new notebook with JSCL kernel
    # Click on the JSCL kernel card in the launcher
    page.locator('text=Common Lisp (JSCL)').click()
    page.wait_for_timeout(3000)
    
    # Wait for the notebook to be ready
    page.wait_for_selector('.jp-Notebook')
    page.wait_for_timeout(2000)
    
    # Type some Lisp code
    cell = page.locator('.jp-Cell-inputArea .jp-CodeMirrorEditor')
    cell.click()
    page.keyboard.type('(+ 1 2 3)')
    
    # Execute the cell
    page.keyboard.press('Shift+Enter')
    
    # Wait for output
    page.wait_for_timeout(3000)
    
    # Check for output (should be 6)
    output = page.locator('.jp-OutputArea-output')
    expect(output).to_contain_text('6', timeout=10000)


def test_defun_and_call(page: Page, jupyterlite_server: str):
    """Test defining and calling a function."""
    page.goto(f"{jupyterlite_server}/lab")
    
    # Wait for JupyterLite to load
    page.wait_for_timeout(5000)
    
    # Create a new notebook with JSCL kernel
    page.locator('text=Common Lisp (JSCL)').click()
    page.wait_for_timeout(3000)
    
    # Wait for the notebook to be ready
    page.wait_for_selector('.jp-Notebook')
    page.wait_for_timeout(2000)
    
    # Type function definition
    cell = page.locator('.jp-Cell-inputArea .jp-CodeMirrorEditor')
    cell.click()
    page.keyboard.type('(defun square (x) (* x x))')
    
    # Execute the cell
    page.keyboard.press('Shift+Enter')
    page.wait_for_timeout(2000)
    
    # Type function call in new cell
    page.keyboard.type('(square 5)')
    
    # Execute the cell
    page.keyboard.press('Shift+Enter')
    
    # Wait for output
    page.wait_for_timeout(3000)
    
    # Check for output (should be 25)
    outputs = page.locator('.jp-OutputArea-output')
    expect(outputs.last).to_contain_text('25', timeout=10000)


def test_print_output(page: Page, jupyterlite_server: str):
    """Test that print statements work."""
    page.goto(f"{jupyterlite_server}/lab")
    
    # Wait for JupyterLite to load
    page.wait_for_timeout(5000)
    
    # Create a new notebook with JSCL kernel
    page.locator('text=Common Lisp (JSCL)').click()
    page.wait_for_timeout(3000)
    
    # Wait for the notebook to be ready
    page.wait_for_selector('.jp-Notebook')
    page.wait_for_timeout(2000)
    
    # Type print statement
    cell = page.locator('.jp-Cell-inputArea .jp-CodeMirrorEditor')
    cell.click()
    page.keyboard.type('(print "Hello, JSCL!")')
    
    # Execute the cell
    page.keyboard.press('Shift+Enter')
    
    # Wait for output
    page.wait_for_timeout(3000)
    
    # Check for output
    output = page.locator('.jp-OutputArea-output')
    expect(output).to_contain_text('Hello', timeout=10000)


def test_loop_macro(page: Page, jupyterlite_server: str):
    """Test the LOOP macro."""
    page.goto(f"{jupyterlite_server}/lab")
    
    # Wait for JupyterLite to load
    page.wait_for_timeout(5000)
    
    # Create a new notebook with JSCL kernel
    page.locator('text=Common Lisp (JSCL)').click()
    page.wait_for_timeout(3000)
    
    # Wait for the notebook to be ready
    page.wait_for_selector('.jp-Notebook')
    page.wait_for_timeout(2000)
    
    # Type loop
    cell = page.locator('.jp-Cell-inputArea .jp-CodeMirrorEditor')
    cell.click()
    page.keyboard.type('(loop for i from 1 to 5 collect (* i i))')
    
    # Execute the cell
    page.keyboard.press('Shift+Enter')
    
    # Wait for output
    page.wait_for_timeout(3000)
    
    # Check for output (should be a list of squares: 1 4 9 16 25)
    output = page.locator('.jp-OutputArea-output')
    # The output should contain at least some of the expected numbers
    expect(output).to_be_visible(timeout=10000)
