create table if not exists api.dlavie_user_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id text not null check (char_length(user_id) between 4 and 80),
  username text null check (username is null or char_length(username) <= 40),
  rating smallint not null check (rating between 1 and 5),
  topic text null check (topic is null or char_length(topic) <= 80),
  message text null check (message is null or char_length(message) <= 700),
  route text null check (route is null or char_length(route) <= 160),
  source text not null default 'main_menu_popup' check (char_length(source) <= 40),
  created_at timestamptz not null default now()
);
create index if not exists dlavie_user_feedback_created_at_idx on api.dlavie_user_feedback (created_at desc);
create index if not exists dlavie_user_feedback_rating_idx on api.dlavie_user_feedback (rating);
create index if not exists dlavie_user_feedback_topic_idx on api.dlavie_user_feedback (topic);
create index if not exists dlavie_user_feedback_user_idx on api.dlavie_user_feedback (user_id, created_at desc);
alter table api.dlavie_user_feedback enable row level security;
revoke all on table api.dlavie_user_feedback from anon, authenticated, public;
grant all on table api.dlavie_user_feedback to service_role;
