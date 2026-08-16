-- Manuelle ordrer (e-post/Instagram/telefon) har ikke alltid telefon og e-post.
-- Nettsiden validerer fortsatt sine egne felt før insert, så dette er trygt.
alter table orders alter column email drop not null;
alter table orders alter column phone drop not null;
