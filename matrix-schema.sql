-- OptiMail "Matrix-Level" Database Schema
-- Generated on: August 9, 2025
-- Purpose: Full production schema for agentive OptiMail system

-- =====================================================
-- USER PROFILES TABLE
-- Stores user preferences, settings, and configuration
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    
    -- Communication preferences
    default_tone VARCHAR(50) DEFAULT 'professional' CHECK (default_tone IN ('professional', 'casual', 'formal', 'friendly', 'concise')),
    signature_html TEXT,
    include_signature BOOLEAN DEFAULT true,
    
    -- Language settings
    primary_language VARCHAR(5) DEFAULT 'en',
    secondary_languages TEXT[], -- Array of language codes
    
    -- Time and availability preferences
    time_windows JSONB DEFAULT '[]', -- Array of time window objects
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Auto-send confidence settings
    confidence_auto_send INTEGER DEFAULT 70 CHECK (confidence_auto_send >= 0 AND confidence_auto_send <= 100),
    auto_send_enabled BOOLEAN DEFAULT false,
    
    -- Privacy and security
    data_retention_days INTEGER DEFAULT 90,
    allow_ai_learning BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Usage statistics
    total_emails_processed INTEGER DEFAULT 0,
    total_templates_created INTEGER DEFAULT 0,
    total_calendar_events_created INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profile_email ON user_profile(email);
CREATE INDEX IF NOT EXISTS idx_user_profile_updated_at ON user_profile(updated_at);

-- =====================================================
-- CONTACTS PROFILE TABLE  
-- Per-contact relationship and interaction history
-- =====================================================

CREATE TABLE IF NOT EXISTS contacts_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    
    -- Relationship context
    relationship_type VARCHAR(100), -- 'colleague', 'client', 'friend', 'family', etc.
    company VARCHAR(255),
    job_title VARCHAR(255),
    
    -- Communication preferences per contact
    tone_override VARCHAR(50) CHECK (tone_override IN ('professional', 'casual', 'formal', 'friendly', 'concise')),
    language_override VARCHAR(5),
    
    -- Trust and automation settings
    trust_level INTEGER DEFAULT 50 CHECK (trust_level >= 0 AND trust_level <= 100),
    trust_reason TEXT,
    auto_reply_enabled BOOLEAN DEFAULT false,
    
    -- Interaction history
    first_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_emails_exchanged INTEGER DEFAULT 0,
    response_time_avg_hours DECIMAL(10,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, contact_email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_profile_user_id ON contacts_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_profile_email ON contacts_profile(contact_email);
CREATE INDEX IF NOT EXISTS idx_contacts_profile_trust ON contacts_profile(trust_level);

-- =====================================================
-- TEMPLATES TABLE
-- Email templates with usage tracking and AI learning
-- =====================================================

CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
    
    -- Template content
    title VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    subject_template VARCHAR(255),
    
    -- Categorization and metadata
    tags TEXT[] DEFAULT '{}',
    intent VARCHAR(100), -- 'reply', 'follow_up', 'schedule', 'thank_you', etc.
    language VARCHAR(5) DEFAULT 'en',
    tone VARCHAR(50),
    
    -- Context and targeting
    recipients TEXT[], -- Suggested recipient patterns
    topics TEXT[], -- Keywords/topics this template is good for
    use_cases TEXT[], -- Specific scenarios where this template fits
    
    -- Usage analytics
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.0, -- Percentage of successful sends
    average_response_time_hours DECIMAL(10,2),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Template effectiveness scoring
    effectiveness_score DECIMAL(5,2) DEFAULT 0.0, -- AI-calculated effectiveness
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    
    -- Sharing and visibility
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    tier_required VARCHAR(20) DEFAULT 'Free' CHECK (tier_required IN ('Free', 'Pro', 'Elite')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_templates_owner_id ON templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_templates_intent ON templates(intent);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON templates(usage_count);
CREATE INDEX IF NOT EXISTS idx_templates_effectiveness ON templates(effectiveness_score);
CREATE INDEX IF NOT EXISTS idx_templates_public ON templates(is_public) WHERE is_public = true;

-- =====================================================
-- EVENTS LOG TABLE
-- Comprehensive system activity and performance logging
-- =====================================================

CREATE TABLE IF NOT EXISTS events_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
    
    -- Event classification
    action VARCHAR(100) NOT NULL, -- 'email_draft', 'template_use', 'calendar_create', etc.
    component VARCHAR(100) NOT NULL, -- 'optimail', 'voice_system', 'calendar_api', etc.
    model VARCHAR(100), -- AI model used (if applicable)
    
    -- Performance metrics
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    latency_ms INTEGER NOT NULL,
    
    -- Result and status
    success BOOLEAN NOT NULL,
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Detailed event data (flexible JSON storage)
    details JSONB DEFAULT '{}',
    
    -- Context
    session_id UUID,
    user_agent TEXT,
    ip_address INET,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics and monitoring
CREATE INDEX IF NOT EXISTS idx_events_log_user_id ON events_log(user_id);
CREATE INDEX IF NOT EXISTS idx_events_log_action ON events_log(action);
CREATE INDEX IF NOT EXISTS idx_events_log_component ON events_log(component);
CREATE INDEX IF NOT EXISTS idx_events_log_created_at ON events_log(created_at);
CREATE INDEX IF NOT EXISTS idx_events_log_success ON events_log(success);
CREATE INDEX IF NOT EXISTS idx_events_log_latency ON events_log(latency_ms);

-- Index for performance analytics
CREATE INDEX IF NOT EXISTS idx_events_log_performance ON events_log(action, success, created_at, latency_ms);

-- =====================================================
-- EMAIL THREADS TABLE
-- Track email conversation context and history
-- =====================================================

CREATE TABLE IF NOT EXISTS email_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
    
    -- Thread identification
    thread_subject VARCHAR(500),
    thread_hash VARCHAR(64) UNIQUE, -- Hash of participants + subject for deduplication
    
    -- Participants
    participants TEXT[] NOT NULL, -- Array of email addresses
    primary_contact VARCHAR(255), -- Main contact in the thread
    
    -- Thread metadata
    total_messages INTEGER DEFAULT 0,
    last_message_at TIMESTAMP WITH TIME ZONE,
    thread_status VARCHAR(50) DEFAULT 'active', -- 'active', 'resolved', 'archived'
    
    -- AI-generated insights
    thread_summary TEXT,
    key_topics TEXT[],
    sentiment VARCHAR(20), -- 'positive', 'neutral', 'negative'
    urgency_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    
    -- Action items and follow-ups
    pending_actions JSONB DEFAULT '[]',
    next_follow_up TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_threads_user_id ON email_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_hash ON email_threads(thread_hash);
CREATE INDEX IF NOT EXISTS idx_email_threads_status ON email_threads(thread_status);
CREATE INDEX IF NOT EXISTS idx_email_threads_urgency ON email_threads(urgency_level);

-- =====================================================
-- CALENDAR INTEGRATION TABLE
-- Google Calendar sync and preferences
-- =====================================================

CREATE TABLE IF NOT EXISTS calendar_integration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
    
    -- OAuth credentials (encrypted)
    google_refresh_token TEXT, -- Encrypted token
    calendar_id VARCHAR(255) DEFAULT 'primary',
    
    -- Sync preferences
    sync_enabled BOOLEAN DEFAULT true,
    auto_create_events BOOLEAN DEFAULT false,
    default_event_duration_minutes INTEGER DEFAULT 60,
    
    -- Meeting preferences
    buffer_time_before_minutes INTEGER DEFAULT 15,
    buffer_time_after_minutes INTEGER DEFAULT 15,
    default_meeting_location VARCHAR(255),
    include_video_call BOOLEAN DEFAULT true,
    
    -- Availability settings
    work_hours_start TIME DEFAULT '09:00:00',
    work_hours_end TIME DEFAULT '17:00:00',
    work_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- 1=Monday, 7=Sunday
    
    -- Integration status
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_errors INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_integration_user_id ON calendar_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integration_active ON calendar_integration(is_active);

-- =====================================================
-- SYSTEM CONFIGURATION TABLE
-- Global system settings and feature flags
-- =====================================================

CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO system_config (key, value, description, category, is_public) VALUES
('ai_models', '{"default_llm": "gpt-4o-mini", "voice_model": "gpt-4o-mini-transcribe", "classification_model": "cohere-command-light"}', 'Default AI models for different tasks', 'ai', false),
('rate_limits', '{"voice": 10, "ai": 5, "general": 30, "admin": 10}', 'API rate limits per minute by category', 'performance', false),
('features', '{"voice_to_action": true, "auto_send": true, "calendar_integration": true, "template_suggestions": true}', 'Feature flags', 'features', true),
('ui_config', '{"typing_speed_cpm": 300, "breathing_cursor": true, "humanized_delays": true}', 'UI animation and behavior settings', 'ui', true)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensure users can only access their own data
-- =====================================================

-- Enable RLS on all user-specific tables
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integration ENABLE ROW LEVEL SECURITY;

-- User profile policies
CREATE POLICY "Users can view own profile" ON user_profile FOR SELECT USING (auth.uid()::TEXT = id::TEXT);
CREATE POLICY "Users can update own profile" ON user_profile FOR UPDATE USING (auth.uid()::TEXT = id::TEXT);
CREATE POLICY "Users can insert own profile" ON user_profile FOR INSERT WITH CHECK (auth.uid()::TEXT = id::TEXT);

-- Contacts profile policies
CREATE POLICY "Users can manage own contacts" ON contacts_profile FOR ALL USING (auth.uid()::TEXT = user_id::TEXT);

-- Templates policies
CREATE POLICY "Users can manage own templates" ON templates FOR ALL USING (auth.uid()::TEXT = owner_id::TEXT);
CREATE POLICY "Users can view public templates" ON templates FOR SELECT USING (is_public = true OR auth.uid()::TEXT = owner_id::TEXT);

-- Events log policies
CREATE POLICY "Users can view own events" ON events_log FOR SELECT USING (auth.uid()::TEXT = user_id::TEXT);
CREATE POLICY "System can insert events" ON events_log FOR INSERT WITH CHECK (true);

-- Email threads policies
CREATE POLICY "Users can manage own threads" ON email_threads FOR ALL USING (auth.uid()::TEXT = user_id::TEXT);

-- Calendar integration policies
CREATE POLICY "Users can manage own calendar settings" ON calendar_integration FOR ALL USING (auth.uid()::TEXT = user_id::TEXT);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- Automated data maintenance and calculations
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_user_profile_updated_at BEFORE UPDATE ON user_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_profile_updated_at BEFORE UPDATE ON contacts_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_threads_updated_at BEFORE UPDATE ON email_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_integration_updated_at BEFORE UPDATE ON calendar_integration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE templates 
    SET usage_count = usage_count + 1, 
        last_used_at = NOW()
    WHERE id = NEW.template_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- ANALYTICS VIEWS
-- Pre-computed views for performance monitoring
-- =====================================================

-- User activity summary view
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.total_emails_processed,
    u.total_templates_created,
    u.total_calendar_events_created,
    u.last_active_at,
    COUNT(DISTINCT c.id) as contact_count,
    COUNT(DISTINCT t.id) as template_count,
    COUNT(DISTINCT e.id) FILTER (WHERE e.created_at >= NOW() - INTERVAL '30 days') as recent_activity_count,
    AVG(e.latency_ms) FILTER (WHERE e.created_at >= NOW() - INTERVAL '7 days') as avg_response_time_7d
FROM user_profile u
LEFT JOIN contacts_profile c ON u.id = c.user_id
LEFT JOIN templates t ON u.id = t.owner_id
LEFT JOIN events_log e ON u.id = e.user_id AND e.success = true
GROUP BY u.id, u.email, u.name, u.total_emails_processed, u.total_templates_created, u.total_calendar_events_created, u.last_active_at;

-- System performance metrics view
CREATE OR REPLACE VIEW system_performance_metrics AS
SELECT 
    action,
    component,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE success = true) as successful_requests,
    ROUND(COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*), 2) as success_rate,
    ROUND(AVG(latency_ms), 2) as avg_latency_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 2) as p95_latency_ms,
    MAX(created_at) as last_request_at
FROM events_log 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY action, component
ORDER BY total_requests DESC;

-- =====================================================
-- DATA SEEDING (Development/Testing)
-- Sample data for development and testing
-- =====================================================

-- Insert sample system user for testing (only in development)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM user_profile WHERE email = 'demo@optigence.com') THEN
        INSERT INTO user_profile (
            id,
            email, 
            name,
            default_tone,
            signature_html,
            time_windows,
            confidence_auto_send,
            auto_send_enabled
        ) VALUES (
            'demo-user-uuid-12345'::UUID,
            'demo@optigence.com',
            'OptiMail Demo User',
            'professional',
            '<p>Best regards,<br>Demo User<br>OptiMail AI Assistant</p>',
            '[{"day": "monday", "start": "09:00", "end": "17:00", "preference": "high"}]'::JSONB,
            75,
            false
        );
    END IF;
END $$;

-- =====================================================
-- SCHEMA VALIDATION AND MAINTENANCE
-- =====================================================

-- Function to validate schema integrity
CREATE OR REPLACE FUNCTION validate_optimail_schema()
RETURNS TABLE (
    table_name TEXT,
    status TEXT,
    row_count BIGINT,
    issues TEXT
) AS $$
BEGIN
    -- Check all required tables exist and have data
    RETURN QUERY
    SELECT 
        'user_profile'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profile') 
             THEN 'OK' ELSE 'MISSING' END,
        (SELECT COUNT(*) FROM user_profile),
        ''::TEXT
    UNION ALL
    SELECT 
        'contacts_profile'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts_profile') 
             THEN 'OK' ELSE 'MISSING' END,
        (SELECT COUNT(*) FROM contacts_profile),
        ''::TEXT
    UNION ALL
    SELECT 
        'templates'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'templates') 
             THEN 'OK' ELSE 'MISSING' END,
        (SELECT COUNT(*) FROM templates),
        ''::TEXT
    UNION ALL
    SELECT 
        'events_log'::TEXT,
        CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events_log') 
             THEN 'OK' ELSE 'MISSING' END,
        (SELECT COUNT(*) FROM events_log),
        ''::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get schema version
CREATE OR REPLACE FUNCTION get_schema_version() RETURNS TEXT AS $$
BEGIN
    RETURN '1.0.0-matrix-level';
END;
$$ LANGUAGE plpgsql;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '🎯 OptiMail Matrix-Level Database Schema deployed successfully!';
    RAISE NOTICE '📊 Schema version: %', get_schema_version();
    RAISE NOTICE '🔐 Row Level Security enabled on all user tables';
    RAISE NOTICE '⚡ Indexes created for optimal performance';
    RAISE NOTICE '🤖 Ready for full agentive OptiMail functionality';
END $$;
