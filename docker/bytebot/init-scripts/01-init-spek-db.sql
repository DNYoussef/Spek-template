-- SPEK Enhanced Development Platform - Database Initialization Script
-- Production-ready PostgreSQL initialization for Bytebot desktop automation
-- Version: 1.0.0
-- Last Updated: 2024-09-18

-- Create SPEK-specific database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create SPEK schemas
CREATE SCHEMA IF NOT EXISTS spek_desktop;
CREATE SCHEMA IF NOT EXISTS spek_evidence;
CREATE SCHEMA IF NOT EXISTS spek_agents;
CREATE SCHEMA IF NOT EXISTS spek_security;

-- Grant permissions to SPEK user
GRANT USAGE ON SCHEMA spek_desktop TO spekuser;
GRANT USAGE ON SCHEMA spek_evidence TO spekuser;
GRANT USAGE ON SCHEMA spek_agents TO spekuser;
GRANT USAGE ON SCHEMA spek_security TO spekuser;

GRANT CREATE ON SCHEMA spek_desktop TO spekuser;
GRANT CREATE ON SCHEMA spek_evidence TO spekuser;
GRANT CREATE ON SCHEMA spek_agents TO spekuser;
GRANT CREATE ON SCHEMA spek_security TO spekuser;

-- Desktop Sessions Table
CREATE TABLE IF NOT EXISTS spek_desktop.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_name VARCHAR(255) NOT NULL,
    agent_id VARCHAR(255),
    desktop_container_id VARCHAR(255),
    vnc_port INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    security_context JSONB DEFAULT '{}'
);

-- Evidence Collection Table
CREATE TABLE IF NOT EXISTS spek_evidence.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES spek_desktop.sessions(id) ON DELETE CASCADE,
    evidence_type VARCHAR(100) NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    mime_type VARCHAR(255),
    checksum VARCHAR(255),
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    analysis_results JSONB DEFAULT '{}'
);

-- Agent Registry Table
CREATE TABLE IF NOT EXISTS spek_agents.registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type VARCHAR(100) NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    capabilities TEXT[],
    model_configuration JSONB DEFAULT '{}',
    mcp_servers TEXT[],
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    performance_metrics JSONB DEFAULT '{}'
);

-- Agent Tasks Table
CREATE TABLE IF NOT EXISTS spek_agents.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES spek_agents.registry(id) ON DELETE CASCADE,
    session_id UUID REFERENCES spek_desktop.sessions(id) ON DELETE CASCADE,
    task_type VARCHAR(100) NOT NULL,
    task_description TEXT,
    task_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    result JSONB DEFAULT '{}',
    error_details TEXT
);

-- Security Audit Table
CREATE TABLE IF NOT EXISTS spek_security.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255),
    session_id UUID,
    agent_id UUID,
    event_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity VARCHAR(20) DEFAULT 'info'
);

-- Configuration Table
CREATE TABLE IF NOT EXISTS spek_desktop.configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS spek_desktop.performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES spek_desktop.sessions(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metric_unit VARCHAR(50),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_status ON spek_desktop.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON spek_desktop.sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_agent_id ON spek_desktop.sessions(agent_id);

CREATE INDEX IF NOT EXISTS idx_evidence_session_id ON spek_evidence.collections(session_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON spek_evidence.collections(evidence_type);
CREATE INDEX IF NOT EXISTS idx_evidence_collected_at ON spek_evidence.collections(collected_at);

CREATE INDEX IF NOT EXISTS idx_agents_type ON spek_agents.registry(agent_type);
CREATE INDEX IF NOT EXISTS idx_agents_status ON spek_agents.registry(status);

CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON spek_agents.tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON spek_agents.tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON spek_agents.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON spek_agents.tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_event_type ON spek_security.audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON spek_security.audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON spek_security.audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_config_key ON spek_desktop.configuration(config_key);

CREATE INDEX IF NOT EXISTS idx_metrics_session_id ON spek_desktop.performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_metrics_type ON spek_desktop.performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_metrics_recorded_at ON spek_desktop.performance_metrics(recorded_at);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sessions_updated_at 
    BEFORE UPDATE ON spek_desktop.sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuration_updated_at 
    BEFORE UPDATE ON spek_desktop.configuration 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default configuration values
INSERT INTO spek_desktop.configuration (config_key, config_value, description) VALUES
    ('desktop.default_resolution', '{"width": 1920, "height": 1080}', 'Default desktop resolution'),
    ('desktop.session_timeout', '3600', 'Default session timeout in seconds'),
    ('evidence.collection_enabled', 'true', 'Enable evidence collection'),
    ('evidence.max_file_size', '104857600', 'Maximum evidence file size in bytes (100MB)'),
    ('agents.max_concurrent_tasks', '10', 'Maximum concurrent tasks per agent'),
    ('security.audit_enabled', 'true', 'Enable security audit logging'),
    ('security.session_encryption', 'true', 'Enable session data encryption')
ON CONFLICT (config_key) DO NOTHING;

-- Insert default agent types
INSERT INTO spek_agents.registry (agent_type, agent_name, capabilities, model_configuration, mcp_servers) VALUES
    ('desktop-automator', 'Desktop Automation Agent', 
     ARRAY['screen_capture', 'mouse_control', 'keyboard_input', 'application_launch'], 
     '{"model": "gpt-5-codex", "platform": "openai"}',
     ARRAY['claude-flow', 'memory', 'playwright', 'puppeteer']),
    ('ui-tester', 'UI Testing Agent', 
     ARRAY['ui_testing', 'accessibility_check', 'performance_test', 'cross_browser_test'], 
     '{"model": "claude-opus-4.1", "platform": "anthropic"}',
     ARRAY['claude-flow', 'memory', 'playwright', 'eva']),
    ('desktop-qa-specialist', 'Desktop QA Specialist', 
     ARRAY['quality_assurance', 'test_automation', 'bug_detection', 'regression_test'], 
     '{"model": "claude-opus-4.1", "platform": "anthropic"}',
     ARRAY['claude-flow', 'memory', 'eva']),
    ('visual-inspector', 'Visual Inspection Agent', 
     ARRAY['visual_testing', 'screenshot_analysis', 'layout_verification', 'design_validation'], 
     '{"model": "gpt-5-codex", "platform": "openai"}',
     ARRAY['claude-flow', 'memory', 'figma', 'playwright']),
    ('workflow-coordinator', 'Workflow Coordination Agent', 
     ARRAY['task_coordination', 'workflow_management', 'resource_allocation', 'progress_tracking'], 
     '{"model": "claude-sonnet-4", "platform": "anthropic"}',
     ARRAY['claude-flow', 'memory', 'sequential-thinking'])
ON CONFLICT DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW spek_desktop.active_sessions AS
SELECT 
    s.*,
    COUNT(t.id) as active_tasks,
    COUNT(e.id) as evidence_count
FROM spek_desktop.sessions s
LEFT JOIN spek_agents.tasks t ON s.id = t.session_id AND t.status IN ('pending', 'running')
LEFT JOIN spek_evidence.collections e ON s.id = e.session_id
WHERE s.status = 'active'
GROUP BY s.id;

CREATE OR REPLACE VIEW spek_agents.agent_performance AS
SELECT 
    r.id,
    r.agent_type,
    r.agent_name,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'failed' THEN 1 END) as failed_tasks,
    AVG(EXTRACT(EPOCH FROM (t.completed_at - t.started_at))) as avg_task_duration,
    r.last_active
FROM spek_agents.registry r
LEFT JOIN spek_agents.tasks t ON r.id = t.agent_id
GROUP BY r.id, r.agent_type, r.agent_name, r.last_active;

-- Grant permissions on all tables and views
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA spek_desktop TO spekuser;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA spek_evidence TO spekuser;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA spek_agents TO spekuser;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA spek_security TO spekuser;

GRANT SELECT ON ALL VIEWS IN SCHEMA spek_desktop TO spekuser;
GRANT SELECT ON ALL VIEWS IN SCHEMA spek_agents TO spekuser;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA spek_desktop TO spekuser;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA spek_evidence TO spekuser;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA spek_agents TO spekuser;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA spek_security TO spekuser;

-- Log successful initialization
INSERT INTO spek_security.audit_log (event_type, event_data, severity) VALUES
    ('database_initialization', '{"schemas_created": ["spek_desktop", "spek_evidence", "spek_agents", "spek_security"], "version": "1.0.0"}', 'info');

-- Create database maintenance functions
CREATE OR REPLACE FUNCTION spek_desktop.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM spek_desktop.sessions 
        WHERE status = 'expired' 
           OR (expires_at IS NOT NULL AND expires_at < NOW())
        RETURNING id
    )
    SELECT COUNT(*) INTO cleaned_count FROM deleted;
    
    INSERT INTO spek_security.audit_log (event_type, event_data, severity) VALUES
        ('session_cleanup', format('{"sessions_cleaned": %s}', cleaned_count), 'info');
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION spek_evidence.cleanup_old_evidence(retention_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM spek_evidence.collections 
        WHERE collected_at < NOW() - INTERVAL '1 day' * retention_days
        RETURNING id
    )
    SELECT COUNT(*) INTO cleaned_count FROM deleted;
    
    INSERT INTO spek_security.audit_log (event_type, event_data, severity) VALUES
        ('evidence_cleanup', format('{"evidence_cleaned": %s, "retention_days": %s}', cleaned_count, retention_days), 'info');
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Schedule regular maintenance (requires pg_cron extension in production)
-- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT spek_desktop.cleanup_expired_sessions();');
-- SELECT cron.schedule('cleanup-evidence', '0 3 * * *', 'SELECT spek_evidence.cleanup_old_evidence(30);');

COMMIT;
