-- Word Lists: answers that are also right ("Smart word practice").
--
-- A word is stored with ONE spelling, usually the American one, but a learner
-- can be perfectly right with another: the British spelling taught in school
-- (grey, neighbour, licence) or a plain synonym that fits the sentence and the
-- Arabic hint (flat for apartment, holiday for vacation). Those were marked
-- wrong, cost the learner the long missed-word screen and landed in their weak
-- words. `accepted_answers` lists the extra answers a word accepts; typing one
-- settles the word as correct and says "also correct". Always lower-case; the
-- stored `target_word` itself never needs to be repeated here.
--
-- Additive: an empty array (the default) means exactly the old behaviour, so
-- every existing row keeps working with no backfill, and nothing changes for a
-- learner until the feature is switched on from /admin/features. No grant change
-- is needed: unlike profiles, vocabulary_words has no column-level write allowlist.
--
-- The seed below only fills words that have no list yet (accepted_answers = '{}'),
-- so it never overwrites an edit an admin made in Admin -> Word Lists, and
-- running it again is a no-op. Every synonym was checked against its own sentence
-- (it must fit the blank grammatically) and its Arabic hint (it must mean the
-- same thing); more can be added per word from the editor.
begin;

alter table vocabulary_words
  add column if not exists accepted_answers text[] not null default '{}';

comment on column vocabulary_words.accepted_answers is
  'Extra answers this word accepts besides target_word: British spellings and synonyms that fit the sentence. Lower-case. Empty = only target_word.';

update vocabulary_words set accepted_answers = array['grey'] where id = 'colors-gray' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['neighbour'] where id = 'house-neighbor' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['rumour'] where id = 'media-rumor' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['licence'] where id = 'transportation-license' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['apologise'] where id = 'friendship-apologize' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['misdemeanour'] where id = 'law-misdemeanor' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['check-up'] where id = 'health-checkup' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['well-being'] where id = 'health-wellbeing' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['back-end'] where id = 'technology-backend' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['e-mail'] where id = 'work-email' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['heat wave'] where id = 'weather-heatwave' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['seat belt', 'seat-belt'] where id = 'transportation-seatbelt' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['shopping centre', 'shopping center'] where id = 'shopping-mall' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['flat'] where id = 'house-apartment' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['couch'] where id = 'house-sofa' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['yard'] where id = 'house-garden' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['light'] where id = 'house-lamp' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['curtains'] where id = 'house-curtain' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['staircase'] where id = 'house-stairs' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['holiday'] where id = 'work-vacation' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['lorry'] where id = 'transportation-truck' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['trousers'] where id = 'clothes-pants' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['jumper', 'pullover'] where id = 'clothes-sweater' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['underground', 'metro', 'tube'] where id = 'transportation-subway' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['motorway', 'freeway'] where id = 'transportation-highway' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['chemist', 'drugstore'] where id = 'health-pharmacy' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['bike'] where id = 'transportation-bicycle' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['motorbike'] where id = 'transportation-motorcycle' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['cab'] where id = 'transportation-taxi' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['update'] where id = 'technology-upgrade' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['outdated'] where id = 'technology-obsolete' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['bug'] where id = 'technology-glitch' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['coworker', 'co-worker'] where id = 'work-colleague' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['pay', 'wage'] where id = 'work-salary' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['cv'] where id = 'work-resume' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['employ'] where id = 'work-hire' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['sack', 'dismiss'] where id = 'work-fire' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['shop'] where id = 'shopping-store' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['trolley'] where id = 'shopping-cart' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['voucher'] where id = 'shopping-coupon' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['baggage'] where id = 'travel-luggage' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['trip'] where id = 'travel-journey' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['stopover'] where id = 'travel-layover' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['pudding'] where id = 'food-dessert' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['hen'] where id = 'animals-chicken' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['test'] where id = 'education-exam' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['mark'] where id = 'education-grade' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['term'] where id = 'education-semester' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['reporter'] where id = 'media-journalist' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['belly'] where id = 'body-stomach' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['petrol', 'gas', 'gasoline'] where id = 'transportation-fuel' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['motor'] where id = 'transportation-engine' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['game'] where id = 'sports-match' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['work out'] where id = 'sports-exercise' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['win'] where id = 'sports-victory' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['loss'] where id = 'sports-defeat' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['scared'] where id = 'emotions-afraid' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['thankful'] where id = 'emotions-grateful' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['unhappy'] where id = 'emotions-sad' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['mad'] where id = 'emotions-angry' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['glad', 'pleased'] where id = 'emotions-happy' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['rubbish', 'garbage'] where id = 'environment-waste' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['grandma'] where id = 'family-grandmother' and accepted_answers = '{}';
update vocabulary_words set accepted_answers = array['grandpa'] where id = 'family-grandfather' and accepted_answers = '{}';

commit;
