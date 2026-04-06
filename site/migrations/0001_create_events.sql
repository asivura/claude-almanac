CREATE TABLE events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  pathname TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('markdown', 'html')),
  user_agent TEXT,
  referer TEXT,
  ip TEXT,
  ip_hash TEXT NOT NULL,
  country TEXT,
  city TEXT,
  asn INTEGER,
  tls_version TEXT,
  http_protocol TEXT,
  device_id TEXT
);

CREATE INDEX idx_events_timestamp ON events(timestamp);
CREATE INDEX idx_events_format ON events(format);
CREATE INDEX idx_events_pathname ON events(pathname);
