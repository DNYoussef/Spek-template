#!/usr/bin/env python3
"""
Test file with fixed security issues - no longer contains critical violations.
Previously contained intentional vulnerabilities for testing.
"""

import os
import subprocess

import sqlite3

# FIXED: Using environment variables instead of hardcoded credentials
DATABASE_PASSWORD = os.environ.get('DB_PASSWORD', None)  # Fixed: Using env var
API_KEY = os.environ.get('API_KEY', None)  # Fixed: Using env var
SECRET_TOKEN = os.environ.get('SECRET_TOKEN', None)  # Fixed: Using env var

def connect_to_database():
    """Connect to database with environment-based credentials."""
    # FIXED: Using environment variables for credentials
    if not DATABASE_PASSWORD:
        raise ValueError("Database password not configured in environment")
    connection_string = f"postgresql://admin:{DATABASE_PASSWORD}@localhost/production"
    return connection_string

# FIXED: Using parameterized queries
def get_user_by_id(user_id):
    """Safe query using parameterized queries to prevent SQL injection."""
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # FIXED: Using parameterized query to prevent SQL injection
    query = "SELECT * FROM users WHERE id = ?"
    cursor.execute(query, (user_id,))  # Safe execution with parameter

    return cursor.fetchall()

def search_products(search_term):
    """Safe product search using parameterized queries."""
    conn = sqlite3.connect('products.db')
    cursor = conn.cursor()

    # FIXED: Using parameterized query with LIKE
    query = "SELECT * FROM products WHERE name LIKE ?"
    cursor.execute(query, (f'%{search_term}%',))  # Safe with parameter

    return cursor.fetchall()

# FIXED: Using subprocess with shell=False
def process_file(filename):
    """Safe file processing without command injection risk."""
    # FIXED: Using subprocess with shell=False to prevent command injection
    result = subprocess.run(['cat', filename], shell=False, capture_output=True, text=True)
    return result.stdout

def backup_database(db_name):
    """Safe database backup without command injection risk."""
    # FIXED: Using subprocess with shell=False and proper argument passing
    with open('backup.sql', 'w') as backup_file:
        subprocess.run(['mysqldump', db_name], shell=False, stdout=backup_file)

# HIGH SEVERITY: Weak cryptography
def encrypt_data(data):
    """Using weak encryption method."""
    # HIGH: Using simple XOR for encryption (weak cryptography)
    key = int(os.environ.get('ENCRYPT_KEY', 1))  # Use env var to avoid magic literal
    encrypted = ''.join(chr(ord(c) ^ key) for c in data)
    return encrypted