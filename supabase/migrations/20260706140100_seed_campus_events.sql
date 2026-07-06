-- Seed campus events for MVP testing (北京某高校)

INSERT INTO public.campus_events (campus_name, title, event_type, starts_on, ends_on, traffic_impact, description, source)
SELECT * FROM (VALUES
  ('北京某高校', '考试周', 'season'::public.campus_event_type, (CURRENT_DATE - 3), (CURRENT_DATE + 10), 'high'::public.traffic_impact, '期末考试期间，晚自习与晚间客流增加', 'seed'::public.event_source),
  ('北京某高校', '校园招聘会', 'career'::public.campus_event_type, (CURRENT_DATE + 2), (CURRENT_DATE + 2), 'high'::public.traffic_impact, '大型校园招聘会，午间及下午客流集中', 'seed'::public.event_source),
  ('北京某高校', '雨天', 'weather'::public.campus_event_type, CURRENT_DATE, CURRENT_DATE, 'normal'::public.traffic_impact, '今日有雨，外卖订单可能增加', 'seed'::public.event_source),
  ('北京某高校', '开学季', 'season'::public.campus_event_type, (CURRENT_DATE - 30), (CURRENT_DATE + 14), 'high'::public.traffic_impact, '新学期开学，新生与返校学生增多', 'seed'::public.event_source)
) AS v(campus_name, title, event_type, starts_on, ends_on, traffic_impact, description, source)
WHERE NOT EXISTS (
  SELECT 1 FROM public.campus_events e
  WHERE e.campus_name = v.campus_name AND e.title = v.title
);
