#!/usr/bin/env python3
"""Setup script for SPEK Connascence Analyzer"""

from setuptools import setup, find_packages

setup(
    name="spek-connascence-analyzer",
    version="2.0.0",
    description="SPEK-driven connascence analysis with NASA compliance",
    long_description="Comprehensive code quality analyzer with connascence detection, NASA POT10 compliance checking, and architectural analysis capabilities.",
    author="SPEK Template Team",
    packages=find_packages(),
    install_requires=[
        "astroid>=2.15.0,<3.0.0",
        "pylint>=2.17.0,<3.0.0", 
        "pathspec>=0.11.0,<1.0.0",
        "toml>=0.10.0,<1.0.0",
        "pyyaml>=6.0,<7.0",
        "dataclasses-json>=0.5.9,<1.0.0",
        "typing-extensions>=4.7.0,<5.0.0",
        "jsonschema>=4.19.0,<5.0.0",
        "requests>=2.31.0,<3.0.0"
    ],
    python_requires=">=3.8",
    entry_points={
        "console_scripts": [
            "connascence=analyzer.core:main",
            "spek-analyzer=analyzer.core:main"
        ]
    },
    package_dir={"": "."},
    include_package_data=True,
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Quality Assurance",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
)