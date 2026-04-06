CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  pathname TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('markdown', 'html')),
  response_status INTEGER,
  response_time_ms INTEGER,
  token_count INTEGER,
  user_agent TEXT,
  ua_category TEXT,
  ua_agent_name TEXT,
  accept_header TEXT,
  referer TEXT,
  ip TEXT,
  ip_hash TEXT NOT NULL,
  device_id TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  continent TEXT,
  timezone TEXT,
  latitude REAL,
  longitude REAL,
  postal_code TEXT,
  asn INTEGER,
  colo TEXT,
  client_tcp_rtt INTEGER,
  tls_version TEXT,
  tls_cipher TEXT,
  http_protocol TEXT,
  accept_language TEXT,
  accept_encoding TEXT
);

CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_format ON events(format);
CREATE INDEX idx_events_pathname ON events(pathname);
CREATE INDEX idx_events_ua_category ON events(ua_category);
CREATE INDEX idx_events_country ON events(country);
