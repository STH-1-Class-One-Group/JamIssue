begin;

update public.map
set
  district = '동구',
  latitude = 36.3338,
  longitude = 127.4360,
  summary = '오씨칼국수에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.',
  description = '오씨칼국수는 대전역 인근에서 물총조개 칼국수로 자주 언급되는 로컬 맛집으로, 한 끼 코스에 자연스럽게 넣기 좋습니다.',
  vibe_tags = '["로컬맛집","칼국수","대전역"]'::jsonb,
  route_hint = '근처 원도심 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.',
  updated_at = now()
where slug = 'ossi-kalguksu';

update public.map
set
  district = '동구',
  latitude = 36.3310,
  longitude = 127.4328,
  summary = '신도칼국수에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.',
  description = '신도칼국수는 대전역 인근에서 오래된 전통으로 알려진 로컬 칼국수집으로, 원도심 동선에 잘 어울립니다.',
  vibe_tags = '["로컬맛집","칼국수","원도심"]'::jsonb,
  route_hint = '원도심 카페나 산책 스폿과 함께 반나절 코스로 묶기 좋습니다.',
  updated_at = now()
where slug = 'sindo-kalguksu';

update public.map
set
  district = '중구',
  latitude = 36.3194,
  longitude = 127.4178,
  summary = '공주칼국수에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.',
  description = '공주칼국수는 중구 권역에서 편하게 들르기 좋은 칼국수집으로, 대사동·문창동 동선에 자연스럽게 이어집니다.',
  vibe_tags = '["로컬맛집","칼국수","중구"]'::jsonb,
  route_hint = '근처 문화 스폿이나 카페와 함께 반나절 코스로 묶기 좋습니다.',
  updated_at = now()
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
  '위대한 옥수칼국수',
  '서구',
  'restaurant',
  36.3249,
  127.3817,
  '위대한 옥수칼국수에서 대전 로컬 한 끼를 즐기기 좋은 인기 맛집입니다.',
  '위대한 옥수칼국수는 변동 권역에서 칼국수와 로컬 분위기를 함께 즐기기 좋은 식당으로, 서구 동선에 넣기 좋습니다.',
  '["로컬맛집","칼국수","서구"]'::jsonb,
  '30분 - 1시간',
  '갈마·용문 쪽 카페나 산책 코스와 함께 묶기 좋습니다.',
  '로컬 미식 스탬프',
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
