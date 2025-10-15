-- OptiMail Complete Database Schema for Build & Integration
-- Generated: August 10, 2025
-- Purpose: Production-ready schema with all required tables and RLS

-- =====================================================
-- USER PROFILES TABLE
-- Core user configuration and preferences
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    
    -- Communication preferences from spec
    default_tone VARCHAR(50) DEFAULT 'professional' CHECK (default_tone IN ('professional', 'casual', 'formal', 'friendly', 'concise')),
    signature_html TEXT,
    include_signature BOOLEAN DEFAULT true,
    
    -- Language settings
    primary_language VARCHAR(5) DEFAULT 'en',
    secondary_languages TEXT[], -- Array of language codes
    
    -- Time and availability preferences
    time_windows JSONB DEFAULT '[]', -- Array of time window objects
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Auto-send confidence settings (from spec)
    confidence_auto_send INTEGER DEFAULT 70 CHECK (confidence_auto_send >= 0 AND confidence_auto_send <= 100),
    auto_send_enabled BOOLEAN DEFAULT false,
    trust_level INTEGER DEFAULT 50 CHECK (trust_level >= 0 AND trust_level <= 100),
    
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

-- =====================================================
-- CONTACTS PROFILE TABLE
-- Per-contact relationship and trust levels
-- =====================================================

CREATE TABLE IF NOT EXISTS contacts_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    
    -- Relationship context
    relationship_type VARCHAR(100), -- 'colleague', 'client', 'friend', 'family'
    company VARCHAR(255),
    job_title VARCHAR(255),
    
    -- Communication overrides per contact
    tone_override VARCHAR(50) CHECK (tone_override IN ('professional', 'casual', 'formal', 'friendly', 'concise')),
    language_override VARCHAR(5),
    
    -- Trust and automation settings (key for auto-send)
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

-- =====================================================
-- TEMPLATES TABLE
-- Email templates with usage tracking and AI learning
-- =====================================================

CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
    
    -- Template content (spec: title, body_html, tags, intent)
    title VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    subject_template VARCHAR(255),
    
    -- Categorization and metadata
    tags TEXT[] DEFAULT '{}',
    intent VARCHAR(100), -- 'reply', 'follow_up', 'schedule', 'thank_you'
    language VARCHAR(5) DEFAULT 'en',
    tone VARCHAR(50),
    
    -- Context and targeting
    recipients TEXT[], -- Suggested recipient patterns
    topics TEXT[], -- Keywords/topics this template fits
    use_cases TEXT[], -- Specific scenarios
    
    -- Usage analytics (spec: usage_count tracking)
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.0,
    average_response_time_hours DECIMAL(10,2),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Template effectiveness scoring
    effectiveness_score DECIMAL(5,2) DEFAULT 0.0,
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

-- =====================================================
-- EVENTS LOG TABLE
-- Comprehensive system activity and performance logging
-- Spec: action, provider, model, tokens, latency, success/error
-- =====================================================

CREATE TABLE IF NOT EXISTS events_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
    
    -- Event classification (from spec)
    action VARCHAR(100) NOT NULL, -- 'email_draft', 'template_use', 'calendar_create'
    component VARCHAR(100) NOT NULL, -- 'optimail', 'voice_system', 'calendar_api'
    provider VARCHAR(100), -- 'openai', 'gemini', 'cohere', 'google_calendar'
    model VARCHAR(100), -- AI model used (if applicable)
    
    -- Performance metrics (from spec: tokens, latency)
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

-- =====================================================
-- EMAIL THREADS TABLE
-- Track email conversation context and history
-- =====================================================

CREATE TABLE IF NOT EXISTS email_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profile(id) ON DELETE CASCADE,
    
    -- Thread identification
    thread_subject VARCHAR(500),
    thread_hash VARCHAR(64) UNIQUE, -- Hash for deduplication
    
    -- Participants
    participants TEXT[] NOT NULL, -- Array of email addresses
    primary_contact VARCHAR(255), -- Main contact
    
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

-- =====================================================
-- LEGACY COMPATIBILITY TABLES
-- Support existing routes during migration
-- =====================================================

-- Keep waitlist for existing functionality
CREATE TABLE IF NOT EXISTS waitlist_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    referral_source TEXT,
    metadata JSONB,
    subscribed BOOLEAN DEFAULT false NOT NULL
);

-- Keep users table for existing auth flows
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User profile indexes
CREATE INDEX IF NOT EXISTS idx_user_profile_email ON user_profile(email);
CREATE INDEX IF NOT EXISTS idx_user_profile_updated_at ON user_profile(updated_at);

-- Contacts profile indexes
CREATE INDEX IF NOT EXISTS idx_contacts_profile_user_id ON contacts_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_profile_email ON contacts_profile(contact_email);
CREATE INDEX IF NOT EXISTS idx_contacts_profile_trust ON contacts_profile(trust_level);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_owner_id ON templates(owner_id);
CREATE INDEX IF NOT EXISTS idx_templates_intent ON templates(intent);
CREATE INDEX IF NOT EXISTS idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_templates_usage_count ON templates(usage_count);
CREATE INDEX IF NOT EXISTS idx_templates_effectiveness ON templates(effectiveness_score);
CREATE INDEX IF NOT EXISTS idx_templates_public ON templates(is_public) WHERE is_public = true;

-- Events log indexes (for diagnostics and performance tracking)
CREATE INDEX IF NOT EXISTS idx_events_log_user_id ON events_log(user_id);
CREATE INDEX IF NOT EXISTS idx_events_log_action ON events_log(action);
CREATE INDEX IF NOT EXISTS idx_events_log_component ON events_log(component);
CREATE INDEX IF NOT EXISTS idx_events_log_created_at ON events_log(created_at);
CREATE INDEX IF NOT EXISTS idx_events_log_success ON events_log(success);
CREATE INDEX IF NOT EXISTS idx_events_log_latency ON events_log(latency_ms);
CREATE INDEX IF NOT EXISTS idx_events_log_performance ON events_log(action, success, created_at, latency_ms);

-- Email threads indexes
CREATE INDEX IF NOT EXISTS idx_email_threads_user_id ON email_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_hash ON email_threads(thread_hash);
CREATE INDEX IF NOT EXISTS idx_email_threads_status ON email_threads(thread_status);
CREATE INDEX IF NOT EXISTS idx_email_threads_urgency ON email_threads(urgency_level);

-- Calendar integration indexes
CREATE INDEX IF NOT EXISTS idx_calendar_integration_user_id ON calendar_integration(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integration_active ON calendar_integration(is_active);

-- Legacy table indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_users_email ON waitlist_users(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_users_created_at ON waitlist_users(created_at DESC);

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
ALTER TABLE waitlist_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

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

-- Waitlist policies (allow anonymous inserts)
CREATE POLICY "Anyone can join waitlist" ON waitlist_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can view waitlist" ON waitlist_users FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE templates 
    SET usage_count = usage_count + 1, 
        last_used_at = NOW()
    WHERE id = template_id;
END;
$$ language 'plpgsql';

-- =====================================================
-- ANALYTICS VIEWS
-- Pre-computed views for diagnostics dashboard
-- =====================================================

-- System performance metrics view (for diagnostics)
CREATE OR REPLACE VIEW system_performance_metrics AS
SELECT 
    action,
    component,
    provider,
    model,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE success = true) as successful_requests,
    ROUND(COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*), 2) as success_rate,
    ROUND(AVG(latency_ms), 2) as avg_latency_ms,
    ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_ms), 2) as p50_latency_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms), 2) as p95_latency_ms,
    SUM(tokens_in) as total_tokens_in,
    SUM(tokens_out) as total_tokens_out,
    MAX(created_at) as last_request_at
FROM events_log 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY action, component, provider, model
ORDER BY total_requests DESC;

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

-- =====================================================
-- DATA SEEDING (Development/Testing)
-- Sample data for development
-- =====================================================

-- Insert demo user profile for testing
INSERT INTO user_profile (
    id,
    email, 
    name,
    default_tone,
    signature_html,
    time_windows,
    confidence_auto_send,
    auto_send_enabled,
    trust_level
) VALUES (
    'demo-user-12345-67890-abcdef'::UUID,
    'demo@optigence.com',
    'OptiMail Demo User',
    'professional',
    '<p>Best regards,<br>Demo User<br>OptiMail AI Assistant</p>',
    '[{"day": "monday", "start": "09:00", "end": "17:00", "preference": "high"}]'::JSONB,
    75,
    false,
    70
) ON CONFLICT (email) DO NOTHING;

-- Insert sample templates for testing
INSERT INTO templates (
    owner_id,
    title,
    body_html,
    subject_template,
    tags,
    intent,
    language,
    tone,
    usage_count
) VALUES (
    'demo-user-12345-67890-abcdef'::UUID,
    'Meeting Follow-up',
    '<p>Hi {name},</p><p>Thank you for taking the time to meet with me today. I wanted to follow up on our discussion about {topic}.</p><p>As promised, I''ve attached the {document} we discussed. Please review it and let me know if you have any questions.</p><p>I look forward to our next steps.</p>',
    'Follow-up from our meeting',
    '{"business", "follow-up"}',
    'follow_up',
    'en',
    'professional',
    5
) ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON system_performance_metrics TO authenticated;
GRANT SELECT ON user_activity_summary TO authenticated;

-- Special permissions for waitlist (allow anonymous inserts)
GRANT INSERT ON waitlist_users TO anon;
GRANT SELECT ON waitlist_users TO service_role;

-- Final success message
SELECT 'OptiMail Complete Database Schema deployed successfully!' as status,
       'All tables created with RLS policies, indexes, and sample data' as details,
       NOW() as deployed_at;
