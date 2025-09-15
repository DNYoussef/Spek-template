"""Setup configuration for the SPEK Analyzer module."""

from setuptools import setup, find_packages

setup(
    name="spek-analyzer",
    version="1.0.0",
    description="SPEK Enhanced Development Platform - Quality Analyzer",
    author="SPEK Team",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "pyyaml>=6.0",
        "networkx>=3.0",
        "numpy>=1.20.0",
        "radon>=5.0.0",
        "pylint>=2.0.0",
        "mypy>=1.0.0",
        "flake8>=4.0.0",
        "bandit>=1.7.0",
    ],
    entry_points={
        "console_scripts": [
            "spek-analyzer=analyzer.__main__:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
)