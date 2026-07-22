create or replace function public.jsonb_is_trimmed_nonempty_string(p_value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    jsonb_typeof(p_value) = 'string'
    and char_length(p_value #>> '{}') > 0
    and not (
      left(p_value #>> '{}', 1) = any(array[
        chr(9), chr(10), chr(11), chr(12), chr(13), chr(32), chr(160), chr(5760),
        chr(8192), chr(8193), chr(8194), chr(8195), chr(8196), chr(8197), chr(8198),
        chr(8199), chr(8200), chr(8201), chr(8202), chr(8232), chr(8233), chr(8239),
        chr(8287), chr(12288), chr(65279)
      ])
      or right(p_value #>> '{}', 1) = any(array[
        chr(9), chr(10), chr(11), chr(12), chr(13), chr(32), chr(160), chr(5760),
        chr(8192), chr(8193), chr(8194), chr(8195), chr(8196), chr(8197), chr(8198),
        chr(8199), chr(8200), chr(8201), chr(8202), chr(8232), chr(8233), chr(8239),
        chr(8287), chr(12288), chr(65279)
      ])
    ),
    false
  );
$$;
