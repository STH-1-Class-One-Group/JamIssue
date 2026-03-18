begin;

update public.map
set
  district = U&'\B3D9\AD6C',
  latitude = 36.3338,
  longitude = 127.4360,
  summary = U&'\C624\C528\CE7C\AD6D\C218\C5D0\C11C \B300\C804 \B85C\CEF4 \D55C \B07C\B97C \C990\AE30\AE30 \C88B\C740 \C778\AE30 \B9DB\C9D1\C785\B2C8\B2E4.',
  description = U&'\C624\C528\CE7C\AD6D\C218\B294 \B300\C804\C5ED \C778\ADFC\C5D0\C11C \BB3C\CD1D\C870\AC1C \CE7C\AD6D\C218\B85C \C790\C8FC \C5B8\AE09\B418\B294 \B85C\CEF4 \B9DB\C9D1\C73C\B85C, \D55C \B07C \CF54\C2A4\C5D0 \C790\C5F0\C2A4\B7FD\AC8C \B123\AE30 \C88B\C2B5\B2C8\B2E4.',
  vibe_tags = U&'["\B85C\CEF4\B9DB\C9D1","\CE7C\AD6D\C218","\B300\C804\C5ED"]'::jsonb,
  route_hint = U&'\ADFC\CC98 \C6D0\B3C4\C2EC \C0B0\CC45 \C2A4\D3FF\ACFC \D568\AED8 \BC18\B098\C808 \CF54\C2A4\B85C \BB36\AE30 \C88B\C2B5\B2C8\B2E4.',
  updated_at = now()
where slug = 'ossi-kalguksu';

update public.map
set
  district = U&'\B3D9\AD6C',
  latitude = 36.3310,
  longitude = 127.4328,
  summary = U&'\C2E0\B3C4\CE7C\AD6D\C218\C5D0\C11C \B300\C804 \B85C\CEF4 \D55C \B07C\B97C \C990\AE30\AE30 \C88B\C740 \C778\AE30 \B9DB\C9D1\C785\B2C8\B2E4.',
  description = U&'\C2E0\B3C4\CE7C\AD6D\C218\B294 \B300\C804\C5ED \C778\ADFC\C5D0\C11C \C624\B798\B41C \C804\D1B5\C73C\B85C \C54C\B824\C9C4 \B85C\CEF4 \CE7C\AD6D\C218\C9D1\C73C\B85C, \C6D0\B3C4\C2EC \B3D9\C120\C5D0 \C798 \C5B4\C6B8\B9BD\B2C8\B2E4.',
  vibe_tags = U&'["\B85C\CEF4\B9DB\C9D1","\CE7C\AD6D\C218","\C6D0\B3C4\C2EC"]'::jsonb,
  route_hint = U&'\C6D0\B3C4\C2EC \CE74\D398\B098 \C0B0\CC45 \C2A4\D3FF\ACFC \D568\AED8 \BC18\B098\C808 \CF54\C2A4\B85C \BB36\AE30 \C88B\C2B5\B2C8\B2E4.',
  updated_at = now()
where slug = 'sindo-kalguksu';

update public.map
set
  district = U&'\C911\AD6C',
  latitude = 36.3194,
  longitude = 127.4178,
  summary = U&'\ACF5\C8FC\CE7C\AD6D\C218\C5D0\C11C \B300\C804 \B85C\CEF4 \D55C \B07C\B97C \C990\AE30\AE30 \C88B\C740 \C778\AE30 \B9DB\C9D1\C785\B2C8\B2E4.',
  description = U&'\ACF5\C8FC\CE7C\AD6D\C218\B294 \C911\AD6C \AD8C\C5ED\C5D0\C11C \D3B8\D558\AC8C \B4E4\B974\AE30 \C88B\C740 \CE7C\AD6D\C218\C9D1\C73C\B85C, \B300\C0AC\B3D9\B7B5\BB38\CC3D\B3D9 \B3D9\C120\C5D0 \C790\C5F0\C2A4\B7FD\AC8C \C774\C5B4\C9D1\B2C8\B2E4.',
  vibe_tags = U&'["\B85C\CEF4\B9DB\C9D1","\CE7C\AD6D\C218","\C911\AD6C"]'::jsonb,
  route_hint = U&'\ADFC\CC98 \BB38\D654 \C2A4\D3FF\C774\B098 \CE74\D398\C640 \D568\AED8 \BC18\B098\C808 \CF54\C2A4\B85C \BB36\AE30 \C88B\C2B5\B2C8\B2E4.',
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
  U&'\C704\B300\D55C \C625\C218\CE7C\AD6D\C218',
  U&'\C11C\AD6C',
  'restaurant',
  36.3249,
  127.3817,
  U&'\C704\B300\D55C \C625\C218\CE7C\AD6D\C218\C5D0\C11C \B300\C804 \B85C\CEF4 \D55C \B07C\B97C \C990\AE30\AE30 \C88B\C740 \C778\AE30 \B9DB\C9D1\C785\B2C8\B2E4.',
  U&'\C704\B300\D55C \C625\C218\CE7C\AD6D\C218\B294 \BCC0\B3D9 \AD8C\C5ED\C5D0\C11C \CE7C\AD6D\C218\C640 \B85C\CEF4 \BD84\C704\AE30\B97C \D568\AED8 \C990\AE30\AE30 \C88B\C740 \C2DD\B2F9\C73C\B85C, \C11C\AD6C \B3D9\C120\C5D0 \B123\AE30 \C88B\C2B5\B2C8\B2E4.',
  U&'["\B85C\CEF4\B9DB\C9D1","\CE7C\AD6D\C218","\C11C\AD6C"]'::jsonb,
  U&'30\BD84 - 1\C2DC\AC04',
  U&'\AC08\B9C8\B7B5\C6A9\BB38 \CABD \CE74\D398\B098 \C0B0\CC45 \CF54\C2A4\C640 \D568\AED8 \BB36\AE30 \C88B\C2B5\B2C8\B2E4.',
  U&'\B85C\CEF4 \BBF8\C2DD \C2A4\D0EC\D504',
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
