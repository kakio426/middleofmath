-- 후속 런타임 스키마 래퍼에서도 fraction-bar의 알려진 키 제한을
-- 유지한다. answer 같은 필드가 학생에게 숨겨진 정답 통로가 되지 않게 한다.

alter function public.assert_diagnosis_runtime_schema(jsonb)
  rename to assert_runtime_before_fraction_key_guard;

create function public.assert_diagnosis_runtime_schema(p_content jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_runtime_before_fraction_key_guard(
    p_content
  );

  if jsonb_typeof(p_content -> 'judgments') = 'array'
    and exists (
      select 1
      from jsonb_array_elements(p_content -> 'judgments') judgment
      where judgment #>> '{visual,kind}' = 'fraction-bar'
        and not public.jsonb_object_has_only_keys(
          judgment -> 'visual',
          array['kind', 'numerator', 'denominator', 'unknown']
        )
    ) then
    raise exception 'judgment runtime schema is invalid';
  end if;
end;
$$;

revoke all on function public.assert_diagnosis_runtime_schema(jsonb)
  from public;
