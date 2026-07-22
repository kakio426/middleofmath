create or replace function public.guard_diagnosis_required_enum_values()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(new.content #>> '{manifest,curriculum}', '') <> '2022-revised'
    or coalesce(new.content #>> '{manifest,status}', '') <> 'published' then
    raise exception 'diagnosis manifest schema is invalid';
  end if;

  if exists (
    select 1 from jsonb_array_elements(new.content -> 'judgments') judgment
    where (
      judgment #>> '{visual,kind}' = 'measurement'
      and coalesce(judgment #>> '{visual,unit}', '') not in ('mL', 'L', 'g', 'kg')
    ) or (
      judgment #>> '{visual,kind}' = 'fraction-bar'
      and judgment #> '{visual,unknown}' is not null
      and (
        jsonb_typeof(judgment #> '{visual,unknown}') <> 'string'
        or coalesce(judgment #>> '{visual,unknown}', '') not in ('numerator', 'denominator')
      )
    )
  ) then raise exception 'judgment runtime schema is invalid'; end if;
  return new;
end;
$$;

create trigger diagnosis_sets_required_enum_guard
before insert on public.diagnosis_sets
for each row execute function public.guard_diagnosis_required_enum_values();
