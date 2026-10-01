-- Tribely is a community app, not just a sports app: add non-sport hangout
-- categories so people can host coffee meetups and general socials too.
alter type public.activity_category add value if not exists 'coffee';
alter type public.activity_category add value if not exists 'social';
