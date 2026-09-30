-- Example internship so you can test the full flow immediately.
-- Add more internships (Web Dev, Python, AI, ML...) the same way, or via the admin panel.

insert into public.internships (slug, title, short_description, long_description, duration_days, certificate_fee_paise, pass_mark_percent)
values (
  'iot-embedded-systems',
  '15 Days Online Internship in IoT & Embedded Systems',
  'Learn IoT fundamentals, microcontrollers, sensors, and build a mini project.',
  'A hands-on 15-day internship covering IoT fundamentals, embedded systems, microcontrollers (ESP32), sensors/actuators, and IoT communication protocols, ending in a mini project and assessment quiz.',
  15,
  29900,
  60
)
on conflict (slug) do nothing;

do $$
declare
  v_id uuid;
begin
  select id into v_id from public.internships where slug = 'iot-embedded-systems';

  insert into public.modules (internship_id, order_index, title, description, content) values
    (v_id, 1, 'Introduction to IoT', 'What IoT is and why it matters', 'Content for module 1 goes here.'),
    (v_id, 2, 'Embedded Systems Fundamentals', 'Microcontrollers vs microprocessors', 'Content for module 2 goes here.'),
    (v_id, 3, 'Microcontrollers', 'Architecture and peripherals', 'Content for module 3 goes here.'),
    (v_id, 4, 'Sensors and Actuators', 'Common sensor types and interfacing', 'Content for module 4 goes here.'),
    (v_id, 5, 'ESP32 Programming', 'Getting started with ESP32 + Arduino IDE', 'Content for module 5 goes here.'),
    (v_id, 6, 'IoT Communication', 'MQTT, HTTP, and wireless protocols', 'Content for module 6 goes here.'),
    (v_id, 7, 'Mini Project', 'Build and document a small IoT project', 'Content for module 7 goes here.')
  on conflict (internship_id, order_index) do nothing;

  insert into public.quiz_questions (internship_id, order_index, question, options, correct_option) values
    (v_id, 1, 'What does IoT stand for?', '["Internet of Things","Input Output Technology","Internal Object Transfer","Integrated Online Tools"]', 0),
    (v_id, 2, 'Which protocol is commonly used for lightweight IoT messaging?', '["FTP","MQTT","SMTP","POP3"]', 1),
    (v_id, 3, 'ESP32 is primarily a:', '["Sensor","Microcontroller","Actuator","Power supply"]', 1)
  on conflict (internship_id, order_index) do nothing;
end $$;
