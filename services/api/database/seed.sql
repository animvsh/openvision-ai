-- Demo Organization
INSERT INTO organizations (id, name, settings_json)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Demo School',
  '{"timezone": "America/New_York", "features": ["ai_summaries", "real_time_alerts"]}'
);

-- Demo Users (admin, teacher, proctor)
INSERT INTO users (id, organization_id, email, name, role)
VALUES
  ('b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@demo.com', 'Admin User', 'admin'),
  ('c2ggde99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'teacher@demo.com', 'Teacher User', 'teacher'),
  ('d3hhef99-9c0b-4ef8-bb6d-6bb9bd380a44', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'proctor@demo.com', 'Proctor User', 'proctor');

-- Demo Locations
INSERT INTO locations (id, organization_id, name, type, address)
VALUES
  ('e4iifa99-9c0b-4ef8-bb6d-6bb9bd380a55', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Classroom A', 'classroom', 'Building 1, Floor 2'),
  ('f5jjgf99-9c0b-4ef8-bb6d-6bb9bd380a66', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Main Entrance', 'security', 'Building 1, Ground Floor');

-- Demo Cameras
INSERT INTO cameras (id, organization_id, location_id, name, stream_type, status, mode)
VALUES
  ('c1a1a1a1-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4iifa99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Classroom A - Front', 's3', 'online', 'classroom'),
  ('c2b2b2b2-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4iifa99-9c0b-4ef8-bb6d-6bb9bd380a55', 'Classroom A - Back', 's3', 'online', 'classroom'),
  ('c3c3c3c3-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5jjgf99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Main Entrance - Left', 's3', 'online', 'security'),
  ('c4d4d4d4-9c0b-4ef8-bb6d-6bb9bd380a04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5jjgf99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Main Entrance - Right', 's3', 'online', 'security');

-- Pre-defined Rules for Classroom Mode
INSERT INTO rules (organization_id, mode, name, condition_json, severity, cooldown_seconds)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'classroom', 'Cell Phone Detection', '{"object_detect": "cell_phone", "min_confidence": 0.7}', 'medium', 60),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'classroom', 'Multiple People', '{"people_count": {"operator": ">", "value": 5}, "duration_seconds": 30}', 'low', 120),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'classroom', 'Proctoring Alert', '{"face_detect": false, "duration_seconds": 300}', 'high', 300);

-- Pre-defined Rules for Security Mode
INSERT INTO rules (organization_id, mode, name, condition_json, severity, cooldown_seconds)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'security', 'Fall Detection', '{"action_detect": "fall", "min_confidence": 0.75}', 'critical', 30),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'security', 'Unauthorized Access', '{"face_detect": true, "unknown_face": true, "duration_seconds": 10}', 'high', 60),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'security', 'Crowd Detection', '{"people_count": {"operator": ">", "value": 15}, "duration_seconds": 60}', 'medium', 120);

-- Pre-defined Rules for Exam Mode
INSERT INTO rules (organization_id, mode, name, condition_json, severity, cooldown_seconds)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'exam', 'Prohibited Items', '{"object_detect": ["cell_phone", "laptop", "book"], "min_confidence": 0.8}', 'critical', 30),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'exam', 'Face Not Visible', '{"face_detect": false, "duration_seconds": 60}', 'high', 60),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'exam', 'Multiple People', '{"people_count": {"operator": ">", "value": 1}, "duration_seconds": 10}', 'critical', 30);