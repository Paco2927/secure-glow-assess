-- Add logo_url and dashboard_background_url to theme_settings table
ALTER TABLE theme_settings
ADD COLUMN logo_url TEXT,
ADD COLUMN dashboard_background_url TEXT;