-- Stories content-quality fix (Feature 3 of the Stories upgrade: better
-- endings/payoff) — rewrites "The Right Person" (story id
-- stories-3d5f4e74)'s final sentence from a stated conclusion that just
-- restates the story's own title ("She smiled, because she had finally
-- found the right person.") into a concrete closing action, matching the
-- rest of the library's existing endings (a small action/reveal rather
-- than a summary line).
--
-- Isolated and independently reversible: touches exactly one sentence row.
-- To revert, restore the original en/ar/word_translations below:
--   en: 'She smiled, because she had finally found the right person.'
--   ar: 'ابتسمت مايا، لأنها وجدت أخيرًا الشخص المناسب.'
--   word_translations: null
begin;

update sentences
set
  en = 'The next morning, she texted him first, just to say good morning.',
  ar = 'في الصباح التالي، راسلته أولاً لتقول له صباح الخير فقط.',
  word_translations = '[{"en":"The","ar":"الـ"},{"en":"next","ar":"التالي"},{"en":"morning,","ar":"صباح،"},{"en":"she","ar":"هي"},{"en":"texted","ar":"راسلت"},{"en":"him","ar":"ه"},{"en":"first,","ar":"أولاً،"},{"en":"just","ar":"فقط"},{"en":"to","ar":"لـ"},{"en":"say","ar":"تقول"},{"en":"good","ar":"صباح"},{"en":"morning.","ar":"الخير"}]'::jsonb,
  updated_at = now()
where id = 'stories-3d5f4e74-s10';

commit;
