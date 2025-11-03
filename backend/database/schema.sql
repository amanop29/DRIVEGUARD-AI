-- DriveGuard AI Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(255),
    account_type VARCHAR(50) DEFAULT 'individual', -- 'individual', 'enterprise'
    business_type VARCHAR(50), -- 'insurance', 'fleet-operator', etc.
    car_number VARCHAR(50),
    organization_id UUID,
    affiliated_organization_id UUID,
    affiliated_organization_name VARCHAR(255),
    affiliated_organization_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- 'insurance', 'fleet-operator', etc.
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT,
    duration VARCHAR(20),
    storage_url TEXT, -- Supabase storage URL
    storage_path TEXT, -- Path in storage bucket
    upload_status VARCHAR(20) DEFAULT 'uploaded', -- 'uploaded', 'processing', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video analyses table
CREATE TABLE video_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    analysis_id VARCHAR(50) UNIQUE NOT NULL, -- Original timestamp-based ID
    
    -- Basic info
    car_number VARCHAR(50),
    driver_id VARCHAR(50),
    vehicle_id VARCHAR(50),
    organization_name VARCHAR(255),
    is_from_affiliated_user BOOLEAN DEFAULT false,
    
    -- Scores
    overall_score INTEGER,
    speed_score INTEGER,
    traffic_score INTEGER,
    proximity_score INTEGER,
    
    -- Speed metrics
    avg_speed DECIMAL(10, 2),
    max_speed DECIMAL(10, 2),
    speed_limit DECIMAL(10, 2),
    speeding_duration INTEGER, -- seconds
    speeding_percentage DECIMAL(5, 2),
    
    -- Traffic violations
    red_light_violations INTEGER DEFAULT 0,
    stop_sign_violations INTEGER DEFAULT 0,
    total_traffic_violations INTEGER DEFAULT 0,
    
    -- Proximity metrics
    close_encounters INTEGER DEFAULT 0,
    dangerous_proximities INTEGER DEFAULT 0,
    avg_following_distance DECIMAL(10, 2),
    
    -- Analysis details (JSON)
    speed_data JSONB,
    traffic_data JSONB,
    proximity_data JSONB,
    frame_by_frame_data JSONB,
    
    -- Metadata
    processing_status VARCHAR(20) DEFAULT 'completed', -- 'processing', 'completed', 'failed'
    processing_time INTEGER, -- seconds
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table (for fleet operators)
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    driver_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table (for fleet operators)
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id VARCHAR(50) UNIQUE NOT NULL,
    license_plate VARCHAR(50) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_videos_user ON videos(user_id);
CREATE INDEX idx_videos_created ON videos(created_at DESC);
CREATE INDEX idx_analyses_video ON video_analyses(video_id);
CREATE INDEX idx_analyses_user ON video_analyses(user_id);
CREATE INDEX idx_analyses_created ON video_analyses(created_at DESC);
CREATE INDEX idx_drivers_org ON drivers(organization_id);
CREATE INDEX idx_vehicles_org ON vehicles(organization_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON video_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (users can read their own data)
CREATE POLICY "Users can read own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for videos (users can access their own videos)
CREATE POLICY "Users can read own videos" ON videos
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own videos" ON videos
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own videos" ON videos
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS Policies for analyses (users can access their own analyses)
CREATE POLICY "Users can read own analyses" ON video_analyses
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own analyses" ON video_analyses
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Service role policies (for backend operations)
CREATE POLICY "Service role full access users" ON users
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role full access videos" ON videos
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role full access analyses" ON video_analyses
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');
