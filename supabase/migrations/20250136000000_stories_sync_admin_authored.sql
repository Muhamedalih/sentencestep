-- Syncs two stories into version control that were authored directly
-- through the admin CMS (story-67 "At the Pharmacy", story-68 "The Right
-- Person") after the last full stories.ts -> migration sync. Idempotent
-- upsert, so this is a no-op against the live project (the rows already
-- exist there) but lets a fresh database — a new dev environment, a CI
-- run, a project reset — end up with the same 62-story library. Isolated
-- from the rest of the Stories upgrade: reversible on its own by deleting
-- these two lesson ids (which cascades to their sentences) without
-- affecting any other story, translation, audio, or progress row.
--
-- "The Right Person"'s final sentence here is its original admin-authored
-- text ("She smiled, because she had finally found the right person.") —
-- the content-quality rewrite of that ending is a separate, independently
-- reversible change; see 20250137000000_story_right_person_ending.sql.
begin;

insert into lessons (id, mode, level_id, order_index, title, title_ar, description, description_ar, is_free, status, updated_at)
values (
  'stories-8249d07a', 'stories', (select id from levels where mode = 'stories' and index = 2), 67,
  'At the Pharmacy', 'في الصيدلية',
  'Maya visits the pharmacy with a headache and a prescription, and learns how to safely take her new medicine.',
  'تزور مايا الصيدلية بسبب صداع ووصفة طبية، وتتعلم كيفية تناول دوائها الجديد بأمان.',
  true, 'published', now()
)
on conflict (id) do update set
  level_id = excluded.level_id, order_index = excluded.order_index, title = excluded.title,
  title_ar = excluded.title_ar, description = excluded.description, description_ar = excluded.description_ar,
  is_free = excluded.is_free, status = excluded.status, updated_at = now();

insert into lessons (id, mode, level_id, order_index, title, title_ar, description, description_ar, is_free, status, updated_at)
values (
  'stories-3d5f4e74', 'stories', (select id from levels where mode = 'stories' and index = 1), 68,
  'The Right Person', 'الشخص المناسب',
  'Maya meets a kind man, and learns what really makes someone the right person.',
  'تلتقي مايا برجل طيب، وتتعلم ما الذي يجعل الشخص هو الشخص المناسب حقًا.',
  true, 'published', now()
)
on conflict (id) do update set
  level_id = excluded.level_id, order_index = excluded.order_index, title = excluded.title,
  title_ar = excluded.title_ar, description = excluded.description, description_ar = excluded.description_ar,
  is_free = excluded.is_free, status = excluded.status, updated_at = now();

insert into sentences (id, lesson_id, order_index, en, ar, speaker, word_translations, updated_at) values
  ('stories-8249d07a-s1', 'stories-8249d07a', 0, 'Maya woke up with a terrible headache.', 'استيقظت مايا بصداع شديد.', null, '[{"en":"Maya","ar":"مايا"},{"en":"woke","ar":"استيقظت"},{"en":"up","ar":"تمامًا"},{"en":"with","ar":"مع"},{"en":"a","ar":"واحد"},{"en":"terrible","ar":"فظيع"},{"en":"headache.","ar":"صداع"}]'::jsonb, now()),
  ('stories-8249d07a-s2', 'stories-8249d07a', 1, 'She decided to walk to the pharmacy near her apartment.', 'قررت أن تمشي إلى الصيدلية القريبة من شقتها.', null, '[{"en":"She","ar":"هي"},{"en":"decided","ar":"قررت"},{"en":"to","ar":"أن"},{"en":"walk","ar":"تمشي"},{"en":"to","ar":"إلى"},{"en":"the","ar":"الـ"},{"en":"pharmacy","ar":"الصيدلية"},{"en":"near","ar":"بالقرب من"},{"en":"her","ar":"لها"},{"en":"apartment.","ar":"شقة"}]'::jsonb, now()),
  ('stories-8249d07a-s3', 'stories-8249d07a', 2, 'The pharmacist asked her to describe the pain.', 'طلب منها الصيدلي أن تصف الألم.', null, '[{"en":"The","ar":"الـ"},{"en":"pharmacist","ar":"الصيدلي"},{"en":"asked","ar":"سأل"},{"en":"her","ar":"ها"},{"en":"to","ar":"أن"},{"en":"describe","ar":"تصف"},{"en":"the","ar":"الـ"},{"en":"pain.","ar":"الألم"}]'::jsonb, now()),
  ('stories-8249d07a-s4', 'stories-8249d07a', 3, '"It started this morning, right behind my eyes," she said.', 'قالت: "بدأ هذا الصباح، خلف عيني تمامًا."', null, '[{"en":"\"It","ar":"\"إنه"},{"en":"started","ar":"بدأ"},{"en":"this","ar":"هذا"},{"en":"morning,","ar":"الصباح،"},{"en":"right","ar":"تمامًا"},{"en":"behind","ar":"خلف"},{"en":"my","ar":"عيني"},{"en":"eyes,\"","ar":"عيني\""},{"en":"she","ar":"هي"},{"en":"said.","ar":"قالت"}]'::jsonb, now()),
  ('stories-8249d07a-s5', 'stories-8249d07a', 4, 'He recommended a mild pain reliever, then asked if she took any other medicine.', 'أوصى بمسكن خفيف للألم، ثم سألها إن كانت تتناول أي دواء آخر.', null, '[{"en":"He","ar":"هو"},{"en":"recommended","ar":"أوصى"},{"en":"a","ar":"بـ"},{"en":"mild","ar":"خفيف"},{"en":"pain","ar":"للألم"},{"en":"reliever,","ar":"مسكن،"},{"en":"then","ar":"ثم"},{"en":"asked","ar":"سأل"},{"en":"if","ar":"إن"},{"en":"she","ar":"كانت"},{"en":"took","ar":"تتناول"},{"en":"any","ar":"أي"},{"en":"other","ar":"آخر"},{"en":"medicine.","ar":"دواء"}]'::jsonb, now()),
  ('stories-8249d07a-s6', 'stories-8249d07a', 5, 'Maya mentioned she was already taking cold medicine from her doctor.', 'ذكرت مايا أنها تتناول بالفعل دواء للزكام وصفه لها طبيبها.', null, '[{"en":"Maya","ar":"مايا"},{"en":"mentioned","ar":"ذكرت"},{"en":"she","ar":"أنها"},{"en":"was","ar":"كانت"},{"en":"already","ar":"بالفعل"},{"en":"taking","ar":"تتناول"},{"en":"cold","ar":"للزكام"},{"en":"medicine","ar":"دواء"},{"en":"from","ar":"من"},{"en":"her","ar":"لها"},{"en":"doctor.","ar":"طبيبها"}]'::jsonb, now()),
  ('stories-8249d07a-s7', 'stories-8249d07a', 6, 'The pharmacist checked that the two medicines were safe to take together.', 'تحقق الصيدلي من أن الدواءين آمنان لتناولهما معًا.', null, '[{"en":"The","ar":"الـ"},{"en":"pharmacist","ar":"الصيدلي"},{"en":"checked","ar":"تحقق"},{"en":"that","ar":"أن"},{"en":"the","ar":"الـ"},{"en":"two","ar":"الاثنين"},{"en":"medicines","ar":"الدواءين"},{"en":"were","ar":"كانا"},{"en":"safe","ar":"آمنين"},{"en":"to","ar":"لـ"},{"en":"take","ar":"تناول"},{"en":"together.","ar":"معًا"}]'::jsonb, now()),
  ('stories-8249d07a-s8', 'stories-8249d07a', 7, 'He explained the correct dosage and warned her about mild drowsiness.', 'شرح لها الجرعة الصحيحة وحذرها من نعاس خفيف.', null, '[{"en":"He","ar":"هو"},{"en":"explained","ar":"شرح"},{"en":"the","ar":"الـ"},{"en":"correct","ar":"الصحيحة"},{"en":"dosage","ar":"الجرعة"},{"en":"and","ar":"و"},{"en":"warned","ar":"حذر"},{"en":"her","ar":"ها"},{"en":"about","ar":"من"},{"en":"mild","ar":"خفيف"},{"en":"drowsiness.","ar":"نعاس"}]'::jsonb, now()),
  ('stories-8249d07a-s9', 'stories-8249d07a', 8, 'Maya thanked him and walked home, already feeling a little better.', 'شكرته مايا وعادت إلى المنزل سيرًا، وقد شعرت بتحسن طفيف بالفعل.', null, '[{"en":"Maya","ar":"مايا"},{"en":"thanked","ar":"شكرت"},{"en":"him","ar":"ه"},{"en":"and","ar":"و"},{"en":"walked","ar":"عادت"},{"en":"home,","ar":"للمنزل،"},{"en":"already","ar":"بالفعل"},{"en":"feeling","ar":"شعرت"},{"en":"a","ar":"بـ"},{"en":"little","ar":"قليل"},{"en":"better.","ar":"تحسن"}]'::jsonb, now())
on conflict (id) do update set
  order_index = excluded.order_index, en = excluded.en, ar = excluded.ar, speaker = excluded.speaker,
  word_translations = excluded.word_translations, updated_at = now();

insert into sentences (id, lesson_id, order_index, en, ar, speaker, word_translations, updated_at) values
  ('stories-3d5f4e74-s1', 'stories-3d5f4e74', 0, 'Maya lived in a small, friendly town.', 'عاشت مايا في بلدة صغيرة وودودة.', null, '[{"en":"Maya","ar":"مايا"},{"en":"lived","ar":"عاشت"},{"en":"in","ar":"في"},{"en":"a","ar":"واحدة"},{"en":"small,","ar":"صغيرة،"},{"en":"friendly","ar":"ودودة"},{"en":"town.","ar":"بلدة"}]'::jsonb, now()),
  ('stories-3d5f4e74-s2', 'stories-3d5f4e74', 1, 'One day, a kind man named Adam moved to her town.', 'في أحد الأيام، انتقل رجل طيب اسمه آدم إلى بلدتها.', null, '[{"en":"One","ar":"في"},{"en":"day,","ar":"يوم،"},{"en":"a","ar":"واحد"},{"en":"kind","ar":"طيب"},{"en":"man","ar":"رجل"},{"en":"named","ar":"اسمه"},{"en":"Adam","ar":"آدم"},{"en":"moved","ar":"انتقل"},{"en":"to","ar":"إلى"},{"en":"her","ar":"لها"},{"en":"town.","ar":"بلدتها"}]'::jsonb, now()),
  ('stories-3d5f4e74-s3', 'stories-3d5f4e74', 2, 'They first met at a small coffee shop near the park.', 'التقيا لأول مرة في مقهى صغير قرب الحديقة.', null, '[{"en":"They","ar":"هما"},{"en":"first","ar":"لأول مرة"},{"en":"met","ar":"التقيا"},{"en":"at","ar":"في"},{"en":"a","ar":"واحد"},{"en":"small","ar":"صغير"},{"en":"coffee","ar":"قهوة"},{"en":"shop","ar":"مقهى"},{"en":"near","ar":"قرب"},{"en":"the","ar":"الـ"},{"en":"park.","ar":"الحديقة"}]'::jsonb, now()),
  ('stories-3d5f4e74-s4', 'stories-3d5f4e74', 3, 'They talked for hours and laughed together.', 'تحدثا لساعات وضحكا معًا.', null, '[{"en":"They","ar":"هما"},{"en":"talked","ar":"تحدثا"},{"en":"for","ar":"لـ"},{"en":"hours","ar":"ساعات"},{"en":"and","ar":"و"},{"en":"laughed","ar":"ضحكا"},{"en":"together.","ar":"معًا"}]'::jsonb, now()),
  ('stories-3d5f4e74-s5', 'stories-3d5f4e74', 4, 'Soon, they started meeting every week.', 'سرعان ما بدآ يلتقيان كل أسبوع.', null, '[{"en":"Soon,","ar":"سرعان ما،"},{"en":"they","ar":"بدآ"},{"en":"started","ar":"بدأوا"},{"en":"meeting","ar":"يلتقيان"},{"en":"every","ar":"كل"},{"en":"week.","ar":"أسبوع"}]'::jsonb, now()),
  ('stories-3d5f4e74-s6', 'stories-3d5f4e74', 5, 'One evening, Maya felt sad and quiet.', 'في أحد الأمسيات، شعرت مايا بالحزن والهدوء.', null, '[{"en":"One","ar":"ذات"},{"en":"evening,","ar":"مساء،"},{"en":"Maya","ar":"مايا"},{"en":"felt","ar":"شعرت"},{"en":"sad","ar":"بالحزن"},{"en":"and","ar":"و"},{"en":"quiet.","ar":"بالهدوء"}]'::jsonb, now()),
  ('stories-3d5f4e74-s7', 'stories-3d5f4e74', 6, 'Adam noticed and asked what was wrong.', 'لاحظ آدم ذلك وسألها عمّا يزعجها.', null, '[{"en":"Adam","ar":"آدم"},{"en":"noticed","ar":"لاحظ"},{"en":"and","ar":"و"},{"en":"asked","ar":"سألها"},{"en":"what","ar":"ماذا"},{"en":"was","ar":"كان"},{"en":"wrong.","ar":"يزعجها"}]'::jsonb, now()),
  ('stories-3d5f4e74-s8', 'stories-3d5f4e74', 7, 'He listened for a long time and didn''t interrupt once.', 'استمع إليها طويلاً ولم يقاطعها ولو مرة واحدة.', null, '[{"en":"He","ar":"هو"},{"en":"listened","ar":"استمع"},{"en":"for","ar":"لـ"},{"en":"a","ar":"لـ"},{"en":"long","ar":"طويل"},{"en":"time","ar":"وقت"},{"en":"and","ar":"و"},{"en":"didn''t","ar":"لم"},{"en":"interrupt","ar":"يقاطعها"},{"en":"once.","ar":"ولو مرة"}]'::jsonb, now()),
  ('stories-3d5f4e74-s9', 'stories-3d5f4e74', 8, 'Maya felt truly heard for the first time in years.', 'شعرت مايا، لأول مرة منذ سنوات، أن أحدًا يصغي إليها حقًا.', null, '[{"en":"Maya","ar":"مايا"},{"en":"felt","ar":"شعرت"},{"en":"truly","ar":"حقًا"},{"en":"heard","ar":"مسموعة"},{"en":"for","ar":"لـ"},{"en":"the","ar":"الـ"},{"en":"first","ar":"أول"},{"en":"time","ar":"مرة"},{"en":"in","ar":"منذ"},{"en":"years.","ar":"سنوات"}]'::jsonb, now()),
  ('stories-3d5f4e74-s10', 'stories-3d5f4e74', 9, 'She smiled, because she had finally found the right person.', 'ابتسمت مايا، لأنها وجدت أخيرًا الشخص المناسب.', null, null, now())
on conflict (id) do update set
  order_index = excluded.order_index, en = excluded.en, ar = excluded.ar, speaker = excluded.speaker,
  word_translations = excluded.word_translations, updated_at = now();

commit;
