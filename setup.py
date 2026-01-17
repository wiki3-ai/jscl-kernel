from pathlib import Path
from setuptools import setup

HERE = Path(__file__).parent.resolve()

# Get the long description from the README file
long_description = (HERE / "README.md").read_text(encoding="utf-8")

setup(
    name="jupyterlite-jscl-kernel",
    version="0.1.0",
    description="A Common Lisp kernel for JupyterLite using JSCL",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/wiki3-ai/jscl-kernel",
    author="JSCL Kernel Contributors",
    license="BSD-3-Clause",
    packages=["jupyterlite_jscl_kernel"],
    install_requires=[
        "jupyterlite-core>=0.3.0,<0.4.0",
    ],
    python_requires=">=3.8",
    include_package_data=True,
)
