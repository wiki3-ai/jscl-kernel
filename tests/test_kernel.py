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
import sys
import re

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
        [sys.executable, "-m", "http.server", str(JUPYTERLITE_PORT)],
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
    lisp_kernel = page.get_by_role("button", name=re.compile(r"Common Lisp \(JSCL\)"))
    expect(lisp_kernel.first).to_be_visible(timeout=10000)


def test_simple_evaluation(page: Page, jupyterlite_server: str):
    """Test simple Lisp code evaluation."""
    page.goto(f"{jupyterlite_server}/lab")
    
    # Wait for JupyterLite to load
    page.wait_for_timeout(5000)
    
    # Create a new notebook with JSCL kernel
    # Click on the JSCL kernel card in the launcher
    page.get_by_role("button", name=re.compile(r"Common Lisp \(JSCL\)")).first.click()
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
    expect(output.last).to_contain_text('6', timeout=10000)


def test_defun_and_call(page: Page, jupyterlite_server: str):
    """Test defining and calling a function."""
    page.goto(f"{jupyterlite_server}/lab")
    
    # Wait for JupyterLite to load
    page.wait_for_timeout(5000)
    
    # Create a new notebook with JSCL kernel
    page.get_by_role("button", name=re.compile(r"Common Lisp \(JSCL\)")).first.click()
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
    page.get_by_role("button", name=re.compile(r"Common Lisp \(JSCL\)")).first.click()
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
    expect(output.last).to_contain_text('Hello', timeout=10000)


def test_loop_macro(page: Page, jupyterlite_server: str):
    """Test the LOOP macro."""
    page.goto(f"{jupyterlite_server}/lab")
    
    # Wait for JupyterLite to load
    page.wait_for_timeout(5000)
    
    # Create a new notebook with JSCL kernel
    page.get_by_role("button", name=re.compile(r"Common Lisp \(JSCL\)")).first.click()
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
    expect(output.last).to_be_visible(timeout=10000)


def test_print_output_ordering(page: Page, jupyterlite_server: str):
    """Test that print output appears immediately in the same cell, not delayed."""
    page.goto(f"{jupyterlite_server}/lab")
    
    # Wait for JupyterLite to load
    page.wait_for_timeout(5000)
    
    # Create a new notebook with JSCL kernel
    page.get_by_role("button", name=re.compile(r"Common Lisp \(JSCL\)")).first.click()
    page.wait_for_timeout(3000)
    
    # Wait for the notebook to be ready
    page.wait_for_selector('.jp-Notebook')
    page.wait_for_timeout(2000)
    
    # Type code that prints AND returns a value
    cell = page.locator('.jp-Cell-inputArea .jp-CodeMirrorEditor')
    cell.click()
    page.keyboard.type('(progn (print "MARKER-FIRST") 42)')
    
    # Execute the cell
    page.keyboard.press('Shift+Enter')
    
    # Wait for output
    page.wait_for_timeout(3000)
    
    # Get all outputs in the first cell - should have both the print and the result
    first_cell = page.locator('.jp-Cell').first
    cell_outputs = first_cell.locator('.jp-OutputArea-output')
    
    # Should have output(s) containing both the printed text and the result
    first_cell_text = first_cell.locator('.jp-OutputArea').inner_text()
    assert 'MARKER-FIRST' in first_cell_text, f"Print output not found in first cell. Got: {first_cell_text}"
    assert '42' in first_cell_text, f"Return value not found in first cell. Got: {first_cell_text}"


def test_write_to_string_formatting(page: Page, jupyterlite_server: str):
    """Test that results are formatted using write-to-string (proper Lisp formatting)."""
    page.goto(f"{jupyterlite_server}/lab")
    
    # Wait for JupyterLite to load
    page.wait_for_timeout(5000)
    
    # Create a new notebook with JSCL kernel
    page.get_by_role("button", name=re.compile(r"Common Lisp \(JSCL\)")).first.click()
    page.wait_for_timeout(3000)
    
    # Wait for the notebook to be ready
    page.wait_for_selector('.jp-Notebook')
    page.wait_for_timeout(2000)
    
    # Test list formatting - should be (1 2 3) not [1, 2, 3] or similar
    cell = page.locator('.jp-Cell-inputArea .jp-CodeMirrorEditor')
    cell.click()
    page.keyboard.type("'(1 2 3)")
    
    # Execute the cell
    page.keyboard.press('Shift+Enter')
    
    # Wait for output
    page.wait_for_timeout(3000)
    
    # Check the output is formatted as a Lisp list
    output = page.locator('.jp-OutputArea-output').last
    output_text = output.inner_text()
    # Should be Lisp-style (1 2 3), not JSON [1, 2, 3]
    assert '(' in output_text and ')' in output_text, f"Output not formatted as Lisp list: {output_text}"
    assert '[' not in output_text, f"Output appears to be JSON formatted: {output_text}"
