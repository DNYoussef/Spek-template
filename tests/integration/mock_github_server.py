#!/usr/bin/env python3
"""
Mock GitHub API Server for Testing GitHub Bridge Integration

This mock server validates that GitHubBridge makes real HTTP requests
and handles authentication properly - no theater allowed.
"""

import json
import logging
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from threading import Thread
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MockGitHubHandler(BaseHTTPRequestHandler):
    """Mock GitHub API request handler for testing."""

    def __init__(self, *args, **kwargs):
        self.received_requests = []
        super().__init__(*args, **kwargs)

    def do_POST(self):
        """Handle POST requests (comments, status checks, issues)."""
        path = self.path
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        # Parse the request
        try:
            request_data = json.loads(post_data.decode('utf-8'))
        except json.JSONDecodeError:
            request_data = {}

        # Log request for verification
        request_log = {
            "method": "POST",
            "path": path,
            "headers": dict(self.headers),
            "data": request_data,
            "timestamp": datetime.now().isoformat()
        }

        # Store in class variable for test verification
        if not hasattr(MockGitHubHandler, 'requests_log'):
            MockGitHubHandler.requests_log = []
        MockGitHubHandler.requests_log.append(request_log)

        logger.info(f"POST {path}")
        logger.info(f"Headers: {dict(self.headers)}")
        logger.info(f"Data: {request_data}")

        # Validate authentication
        auth_header = self.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('token '):
            self.send_error(401, "Unauthorized")
            return

        # Route based on path
        if '/comments' in path:
            self._handle_comment_creation(request_data)
        elif '/statuses/' in path:
            self._handle_status_check(request_data)
        elif '/issues' in path and not '/comments' in path:
            self._handle_issue_creation(request_data)
        else:
            self.send_error(404, "Not Found")

    def do_GET(self):
        """Handle GET requests (PR files, etc)."""
        path = self.path

        # Log request
        request_log = {
            "method": "GET",
            "path": path,
            "headers": dict(self.headers),
            "timestamp": datetime.now().isoformat()
        }

        if not hasattr(MockGitHubHandler, 'requests_log'):
            MockGitHubHandler.requests_log = []
        MockGitHubHandler.requests_log.append(request_log)

        logger.info(f"GET {path}")

        # Validate authentication
        auth_header = self.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('token '):
            self.send_error(401, "Unauthorized")
            return

        if '/pulls/' in path and '/files' in path:
            self._handle_pr_files()
        else:
            self.send_error(404, "Not Found")

    def _handle_comment_creation(self, data):
        """Handle PR comment creation."""
        if 'body' not in data:
            self.send_error(400, "Missing body")
            return

        # Validate comment has required content
        body = data['body']
        required_sections = ['Code Quality Analysis Results', 'Summary', 'Violations Found']
        missing_sections = [s for s in required_sections if s not in body]

        if missing_sections:
            logger.warning(f"Comment missing sections: {missing_sections}")

        response = {
            "id": 123456789,
            "url": "https://api.github.com/repos/test/repo/issues/comments/123456789",
            "html_url": "https://github.com/test/repo/pull/1#issuecomment-123456789",
            "body": body,
            "user": {"login": "analyzer-bot"},
            "created_at": datetime.now().isoformat() + "Z",
            "updated_at": datetime.now().isoformat() + "Z"
        }

        self.send_response(201)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

    def _handle_status_check(self, data):
        """Handle status check updates."""
        required_fields = ['state', 'description', 'context']
        missing_fields = [f for f in required_fields if f not in data]

        if missing_fields:
            self.send_error(400, f"Missing fields: {missing_fields}")
            return

        if data['state'] not in ['pending', 'success', 'failure', 'error']:
            self.send_error(400, "Invalid state")
            return

        response = {
            "id": 987654321,
            "url": "https://api.github.com/repos/test/repo/statuses/abc123",
            "state": data['state'],
            "description": data['description'],
            "context": data['context'],
            "created_at": datetime.now().isoformat() + "Z"
        }

        self.send_response(201)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

    def _handle_issue_creation(self, data):
        """Handle issue creation."""
        if 'title' not in data or 'body' not in data:
            self.send_error(400, "Missing title or body")
            return

        response = {
            "id": 555666777,
            "number": 42,
            "title": data['title'],
            "body": data['body'],
            "state": "open",
            "labels": data.get('labels', []),
            "user": {"login": "analyzer-bot"},
            "created_at": datetime.now().isoformat() + "Z",
            "html_url": "https://github.com/test/repo/issues/42"
        }

        self.send_response(201)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

    def _handle_pr_files(self):
        """Handle PR files listing."""
        files = [
            {
                "filename": "src/main.py",
                "status": "modified",
                "additions": 10,
                "deletions": 2,
                "changes": 12
            },
            {
                "filename": "tests/test_main.py",
                "status": "added",
                "additions": 25,
                "deletions": 0,
                "changes": 25
            }
        ]

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(files).encode())

    def log_message(self, format, *args):
        """Override to reduce noise."""
        pass


class MockGitHubServer:
    """Mock GitHub API server for integration testing."""

    def __init__(self, port=8888):
        self.port = port
        self.server = None
        self.thread = None

    def start(self):
        """Start the mock server."""
        self.server = HTTPServer(('localhost', self.port), MockGitHubHandler)
        self.thread = Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

        # Wait for server to start
        time.sleep(0.1)
        logger.info(f"Mock GitHub server started on http://localhost:{self.port}")

    def stop(self):
        """Stop the mock server."""
        if self.server:
            self.server.shutdown()
            self.server.server_close()
            if self.thread:
                self.thread.join(timeout=1)
        logger.info("Mock GitHub server stopped")

    def get_requests(self):
        """Get all requests received by the server."""
        return getattr(MockGitHubHandler, 'requests_log', [])

    def clear_requests(self):
        """Clear request log."""
        MockGitHubHandler.requests_log = []


if __name__ == "__main__":
    # Run standalone for manual testing
    server = MockGitHubServer()
    try:
        server.start()
        print("Mock GitHub server running on http://localhost:8888")
        print("Press Ctrl+C to stop")
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        server.stop()
        print("Server stopped")