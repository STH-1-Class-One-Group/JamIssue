begin;

update public.map
set latitude = 36.3338, longitude = 127.4360, updated_at = now()
where slug = 'ossi-kalguksu';

update public.map
set latitude = 36.3310, longitude = 127.4328, updated_at = now()
where slug = 'sindo-kalguksu';

update public.map
set latitude = 36.3194, longitude = 127.4178, updated_at = now()
where slug = 'gongju-kalguksu';

insert into public.map (
  slug,
  name,
  district,
  category,
  latitude,
  longitude,
  summary,
  description,
  vibe_tags,
  visit_time,
  route_hint,
  stamp_reward,
  hero_label,
  jam_color,
  accent_color,
  is_active
) values (
  'great-oksu-kalguksu',
  U&'\C704\B300\D55C \C625\C218\CE7C\AD6D\C218',
  U&'\C11C\AD6C',
  'restaurant',
  36.3249,
  127.3817,
  'Daejeon local kalguksu spot for map testing.',
  'Useful western Daejeon restaurant marker for seed and UI testing.',
  '["restaurant","kalguksu","seo-gu"]'::jsonb,
  '30m - 1h',
  'Works well with nearby cafe and walk routes.',
  'Local Bite Stamp',
  'Local Bite',
  '#ff8d63',
  '#ffcf69',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  district = excluded.district,
  category = excluded.category,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  summary = excluded.summary,
  description = excluded.description,
  vibe_tags = excluded.vibe_tags,
  visit_time = excluded.visit_time,
  route_hint = excluded.route_hint,
  stamp_reward = excluded.stamp_reward,
  hero_label = excluded.hero_label,
  jam_color = excluded.jam_color,
  accent_color = excluded.accent_color,
  is_active = excluded.is_active,
  updated_at = now();

commit;
