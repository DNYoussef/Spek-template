#!/bin/bash

# GaryxTaleb Trading System - Database Backup Script
# Financial Compliance with Defense Industry Standards

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/backup-config.env"

# Logging setup
LOG_FILE="/var/log/gary-taleb/backup-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$(dirname "$LOG_FILE")"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    echo "[ERROR $(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE" >&2
}

# Metrics and monitoring
send_metric() {
    local metric_name="$1"
    local metric_value="$2"
    local metric_type="${3:-gauge}"

    # Send to CloudWatch
    aws cloudwatch put-metric-data \
        --namespace "GaryTaleb/Backup" \
        --metric-data MetricName="$metric_name",Value="$metric_value",Unit=Count \
        --region "$AWS_REGION"

    # Send to Prometheus pushgateway if available
    if command -v curl >/dev/null 2>&1 && [ -n "${PROMETHEUS_PUSHGATEWAY:-}" ]; then
        echo "$metric_name $metric_value" | curl -X POST \
            --data-binary @- \
            "$PROMETHEUS_PUSHGATEWAY/metrics/job/database-backup/instance/$(hostname)"
    fi
}

# Encryption functions
encrypt_backup() {
    local input_file="$1"
    local output_file="$2"

    log "Encrypting backup: $input_file -> $output_file"

    # Use AWS KMS for encryption
    aws kms encrypt \
        --key-id "$KMS_KEY_ID" \
        --plaintext "fileb://$input_file" \
        --output text \
        --query CiphertextBlob \
        --region "$AWS_REGION" | base64 -d > "$output_file"

    # Verify encryption
    if [ ! -f "$output_file" ] || [ ! -s "$output_file" ]; then
        error "Encryption failed for $input_file"
        return 1
    fi

    log "Encryption completed successfully"
}

# Backup verification
verify_backup() {
    local backup_file="$1"

    log "Verifying backup integrity: $backup_file"

    # Check file existence and size
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi

    local file_size=$(stat -c%s "$backup_file")
    if [ "$file_size" -lt 1024 ]; then
        error "Backup file too small: $file_size bytes"
        return 1
    fi

    # Verify PostgreSQL backup format
    if [[ "$backup_file" == *.sql.gz ]]; then
        if ! gzip -t "$backup_file"; then
            error "Backup file corrupted (gzip test failed)"
            return 1
        fi
    fi

    # Test restore on a temporary database (for full backups only)
    if [[ "$BACKUP_TYPE" == "full" ]]; then
        test_restore_backup "$backup_file"
    fi

    log "Backup verification completed successfully"
    send_metric "backup_verification_success" 1
}

# Test restore function
test_restore_backup() {
    local backup_file="$1"

    log "Testing backup restore: $backup_file"

    # Create temporary database for testing
    local test_db="gary_taleb_test_$(date +%s)"

    # Create test database
    PGPASSWORD="$DB_PASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$test_db" || {
        error "Failed to create test database"
        return 1
    }

    # Restore backup to test database
    if [[ "$backup_file" == *.sql.gz ]]; then
        gunzip -c "$backup_file" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$test_db" -q
    else
        PGPASSWORD="$DB_PASSWORD" pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$test_db" -v "$backup_file"
    fi

    local restore_status=$?

    # Verify some key tables exist
    local table_count=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$test_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)

    # Cleanup test database
    PGPASSWORD="$DB_PASSWORD" dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$test_db"

    if [ "$restore_status" -ne 0 ] || [ "$table_count" -lt 5 ]; then
        error "Test restore failed"
        send_metric "backup_test_restore_failure" 1
        return 1
    fi

    log "Test restore completed successfully ($table_count tables restored)"
    send_metric "backup_test_restore_success" 1
}

# Full backup function
create_full_backup() {
    log "Starting full database backup"

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/full_backup_${timestamp}.sql.gz"
    local encrypted_file="${backup_file}.enc"

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # Perform full backup
    log "Creating full backup to: $backup_file"

    PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --format=custom \
        --compress=9 \
        --no-password \
        --file="$backup_file.tmp"

    # Compress backup
    gzip "$backup_file.tmp"
    mv "$backup_file.tmp.gz" "$backup_file"

    # Encrypt backup
    encrypt_backup "$backup_file" "$encrypted_file"

    # Verify backup
    verify_backup "$backup_file"

    # Upload to S3
    upload_to_s3 "$encrypted_file" "full"

    # Cleanup local files (keep for 24 hours)
    find "$BACKUP_DIR" -name "full_backup_*.sql.gz*" -mtime +1 -delete

    log "Full backup completed successfully"
    send_metric "full_backup_success" 1
    send_metric "full_backup_size_bytes" "$(stat -c%s "$backup_file")"
}

# Incremental backup function
create_incremental_backup() {
    log "Starting incremental backup (WAL archiving)"

    # PostgreSQL handles WAL archiving automatically
    # We just need to ensure WAL files are uploaded to S3

    local wal_dir="/var/lib/postgresql/data/pg_wal"
    local timestamp=$(date +%Y%m%d_%H%M%S)

    # Archive any remaining WAL files
    if [ -d "$wal_dir" ]; then
        find "$wal_dir" -name "*.ready" | while read ready_file; do
            local wal_file="${ready_file%.ready}"
            if [ -f "$wal_file" ]; then
                upload_wal_file "$wal_file"
            fi
        done
    fi

    log "Incremental backup (WAL archiving) completed"
    send_metric "incremental_backup_success" 1
}

# Upload functions
upload_to_s3() {
    local file_path="$1"
    local backup_type="$2"
    local filename=$(basename "$file_path")

    log "Uploading to S3: $file_path"

    # Primary region upload
    aws s3 cp "$file_path" "s3://$S3_BUCKET_PRIMARY/$backup_type/$filename" \
        --storage-class STANDARD_IA \
        --metadata "backup-type=$backup_type,timestamp=$(date -Iseconds),compliance=financial" \
        --region "$AWS_REGION"

    # Secondary region upload
    aws s3 cp "$file_path" "s3://$S3_BUCKET_SECONDARY/$backup_type/$filename" \
        --storage-class GLACIER \
        --metadata "backup-type=$backup_type,timestamp=$(date -Iseconds),compliance=financial" \
        --region "$AWS_REGION_SECONDARY"

    # Tertiary region upload (for long-term compliance)
    if [ "$backup_type" = "full" ]; then
        aws s3 cp "$file_path" "s3://$S3_BUCKET_TERTIARY/$backup_type/$filename" \
            --storage-class DEEP_ARCHIVE \
            --metadata "backup-type=$backup_type,timestamp=$(date -Iseconds),compliance=financial,retention=7y" \
            --region "$AWS_REGION_TERTIARY"
    fi

    log "S3 upload completed successfully"
    send_metric "s3_upload_success" 1
}

upload_wal_file() {
    local wal_file="$1"
    local filename=$(basename "$wal_file")

    # Encrypt WAL file
    local encrypted_file="${wal_file}.enc"
    encrypt_backup "$wal_file" "$encrypted_file"

    # Upload to S3
    aws s3 cp "$encrypted_file" "s3://$S3_BUCKET_PRIMARY/wal/$filename.enc" \
        --storage-class STANDARD \
        --region "$AWS_REGION"

    # Mark as archived
    local ready_file="${wal_file}.ready"
    local done_file="${wal_file}.done"
    if [ -f "$ready_file" ]; then
        mv "$ready_file" "$done_file"
    fi

    # Cleanup local encrypted file
    rm -f "$encrypted_file"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups"

    # Local cleanup (keep only current day)
    find "$BACKUP_DIR" -type f -mtime +1 -delete

    # S3 cleanup (lifecycle policies handle this, but we can do manual cleanup too)
    local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)

    # Note: In production, use S3 lifecycle policies instead of manual deletion
    log "Backup cleanup completed (lifecycle policies will handle S3 cleanup)"
}

# Health check
health_check() {
    log "Performing backup system health check"

    # Check database connectivity
    if ! PGPASSWORD="$DB_PASSWORD" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; then
        error "Database connectivity check failed"
        send_metric "backup_health_check_db" 0
        return 1
    fi

    # Check S3 connectivity
    if ! aws s3 ls "s3://$S3_BUCKET_PRIMARY" >/dev/null 2>&1; then
        error "S3 connectivity check failed"
        send_metric "backup_health_check_s3" 0
        return 1
    fi

    # Check disk space
    local available_space=$(df "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    local required_space=10485760  # 10GB in KB

    if [ "$available_space" -lt "$required_space" ]; then
        error "Insufficient disk space for backup"
        send_metric "backup_health_check_disk" 0
        return 1
    fi

    log "Health check passed"
    send_metric "backup_health_check_db" 1
    send_metric "backup_health_check_s3" 1
    send_metric "backup_health_check_disk" 1
}

# Main execution
main() {
    local start_time=$(date +%s)

    log "Starting GaryxTaleb database backup process"
    log "Backup type: $BACKUP_TYPE"
    log "Environment: $ENVIRONMENT"

    # Pre-flight checks
    health_check || {
        error "Health check failed, aborting backup"
        exit 1
    }

    # Perform backup based on type
    case "$BACKUP_TYPE" in
        "full")
            create_full_backup
            ;;
        "incremental")
            create_incremental_backup
            ;;
        *)
            error "Invalid backup type: $BACKUP_TYPE"
            exit 1
            ;;
    esac

    # Cleanup old backups
    cleanup_old_backups

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "Backup process completed successfully in ${duration} seconds"
    send_metric "backup_duration_seconds" "$duration"
    send_metric "backup_completion_timestamp" "$end_time"

    # Send success notification
    if [ -n "${SNS_TOPIC_ARN:-}" ]; then
        aws sns publish \
            --topic-arn "$SNS_TOPIC_ARN" \
            --subject "GaryxTaleb Backup Success" \
            --message "Database backup completed successfully. Type: $BACKUP_TYPE, Duration: ${duration}s" \
            --region "$AWS_REGION"
    fi
}

# Error handling
trap 'error "Backup script failed with exit code $?"' ERR

# Execute main function
main "$@"