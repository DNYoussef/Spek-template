"""Business process rules and operational parameters.

This module defines critical business logic constants used throughout
the system for process automation, error handling, and operational
constraints.

All values are based on:
- Business requirements analysis
- System reliability engineering
- Operational best practices for enterprise systems
"""

# Retry and Error Handling
MAXIMUM_RETRY_ATTEMPTS = 3
"""Maximum number of retry attempts for failed operations.

Based on reliability engineering analysis balancing system
resilience with resource utilization. Most transient failures
resolve within 3 attempts.
"""

RETRY_BACKOFF_MULTIPLIER = 2
"""Exponential backoff multiplier for retry delays.

Implements exponential backoff strategy to reduce system load
under failure conditions while maintaining reasonable response times.
"""

DEFAULT_RETRY_DELAY_SECONDS = 1
"""Initial delay in seconds before first retry attempt.

Base delay for exponential backoff calculation, chosen to balance
responsiveness with system stability.
"""

# Data Retention and Lifecycle
DAYS_RETENTION_PERIOD = 7
"""Default data retention period in days for temporary data.

Balances operational needs for data availability with storage
costs and privacy requirements. Extended retention requires
explicit configuration.
"""

LOG_RETENTION_DAYS = 30
"""Log file retention period in days.

Based on operational requirements for troubleshooting and
audit trail maintenance while managing storage costs.
"""

CACHE_EXPIRY_HOURS = 24
"""Default cache expiry time in hours.

Balances data freshness requirements with performance
optimization needs for cached operations.
"""

# Timeout and Performance
API_TIMEOUT_SECONDS = 30
"""Default API timeout in seconds for external service calls.

Based on service level agreements and user experience requirements.
Extended timeouts should be explicitly configured for specific use cases.
"""

SESSION_TIMEOUT_SECONDS = 3600
"""User session timeout in seconds (1 hour).

Balances security requirements with user convenience.
Based on industry standards for web application security.
"""

DATABASE_CONNECTION_TIMEOUT = 30
"""Database connection timeout in seconds.

Ensures system responsiveness while allowing for reasonable
network latency and database processing time.
"""

# Batch Processing
BATCH_PROCESSING_SIZE = 5
"""Default batch size for bulk operations.

Optimized for memory usage and processing efficiency.
Larger batches may cause memory pressure, smaller batches
reduce throughput efficiency.
"""

CONCURRENT_TASK_LIMIT = 10
"""Maximum number of concurrent tasks allowed.

Prevents system overload while maintaining parallel processing
benefits. Based on system capacity analysis and resource limits.
"""

MAXIMUM_QUEUE_SIZE = 1000
"""Maximum size for task queues.

Prevents unbounded queue growth that could lead to memory
exhaustion while providing sufficient buffering capacity.
"""

# Validation and Limits
MAXIMUM_INPUT_SIZE_MB = 10
"""Maximum input size in megabytes for uploaded content.

Based on system capacity and security considerations.
Prevents denial of service through large upload attacks.
"""

MINIMUM_PASSWORD_LENGTH = 8
"""Minimum password length for user accounts.

Based on current security best practices and compliance
requirements for enterprise systems.
"""

MAXIMUM_LOGIN_ATTEMPTS = 5
"""Maximum failed login attempts before account lockout.

Balances security (preventing brute force attacks) with
usability (allowing for legitimate user errors).
"""
