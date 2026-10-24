-- Portable MySQL schema for a future MySQL production deployment.
-- This sandbox runs PostgreSQL via Drizzle because MySQL is not provisioned here.
-- Required to switch: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
-- and a MySQL driver in the data-access layer.

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  country CHAR(2) NOT NULL DEFAULT 'US',
  place VARCHAR(120) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  role VARCHAR(16) NOT NULL DEFAULT 'user',
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING_APPROVAL',
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
  terms_accepted_at DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
