-- Migration: Add cognito_user_id column to users table
-- Run this SQL script on your database

ALTER TABLE users 
ADD COLUMN cognito_user_id VARCHAR(255) NULL AFTER id;

-- Add unique index to ensure one Cognito user maps to one database user
-- Note: MySQL allows NULL values in unique index (multiple NULLs are allowed)
CREATE UNIQUE INDEX idx_users_cognito_user_id ON users(cognito_user_id);

-- Add regular index for faster lookups (MySQL doesn't support filtered indexes)
CREATE INDEX idx_users_cognito_user_id_lookup ON users(cognito_user_id);

