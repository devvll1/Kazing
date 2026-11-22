-- Replace the prepared demo content with a 10-question Python Programming quiz.
-- Existing game-session snapshots are preserved; create a new session after running this.

update public.quizzes
set title = 'Kazing! Python Basics',
    description = 'Ten easy Python Programming questions for a live classroom quiz.',
    updated_at = now()
where title = 'Kazing! Space Challenge';

delete from public.questions q
using public.quizzes quiz
where q.quiz_id = quiz.quiz_id
  and quiz.title = 'Kazing! Python Basics';

insert into public.questions (
  quiz_id, question_text, option_a, option_b, option_c, option_d,
  correct_answer, time_limit_seconds, points, position
)
select quiz.quiz_id, item.question_text, item.option_a, item.option_b, item.option_c, item.option_d,
  item.correct_answer::public.answer_option, 20, 100, item.position
from public.quizzes quiz
cross join (
  values
    (1, 'Which symbol starts a comment in Python?', '#', '//', '<!--', '*', 'A'),
    (2, 'Which command displays text on the screen?', 'show()', 'print()', 'write()', 'display()', 'B'),
    (3, 'Which word creates a variable in Python?', 'var', 'let', 'Python uses no special word', 'make', 'C'),
    (4, 'What data type is the value 10?', 'String', 'Integer', 'Boolean', 'List', 'B'),
    (5, 'Which brackets create a Python list?', '()', '[]', '{}', '<>', 'B'),
    (6, 'What is the result of 3 + 2 in Python?', '32', '5', '6', 'Error', 'B'),
    (7, 'Which word begins a conditional statement?', 'when', 'if', 'check', 'then', 'B'),
    (8, 'Which word repeats code while a condition is true?', 'repeat', 'for', 'while', 'again', 'C'),
    (9, 'What does len("cat") return?', '2', '3', '4', 'cat', 'B'),
    (10, 'Which file extension is commonly used for Python files?', '.java', '.py', '.html', '.txt', 'B')
) as item(position, question_text, option_a, option_b, option_c, option_d, correct_answer)
where quiz.title = 'Kazing! Python Basics';

create or replace function public.create_demo_session()
returns table (session_id uuid, game_pin text, quiz_title text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  demo_quiz_id uuid;
  new_session_id uuid;
  next_pin char(6);
  attempts integer := 0;
begin
  if caller_id is null then raise exception 'Authentication is required'; end if;

  select q.quiz_id into demo_quiz_id from public.quizzes q
  where q.user_id = caller_id and q.title = 'Kazing! Python Basics'
  order by q.created_at limit 1;

  if demo_quiz_id is null then
    insert into public.quizzes (user_id, title, description)
    values (caller_id, 'Kazing! Python Basics', 'Ten easy Python Programming questions for a live classroom quiz.')
    returning quiz_id into demo_quiz_id;

    insert into public.questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, time_limit_seconds, points, position)
    values
      (demo_quiz_id, 'Which symbol starts a comment in Python?', '#', '//', '<!--', '*', 'A', 20, 100, 1),
      (demo_quiz_id, 'Which command displays text on the screen?', 'show()', 'print()', 'write()', 'display()', 'B', 20, 100, 2),
      (demo_quiz_id, 'Which word creates a variable in Python?', 'var', 'let', 'Python uses no special word', 'make', 'C', 20, 100, 3),
      (demo_quiz_id, 'What data type is the value 10?', 'String', 'Integer', 'Boolean', 'List', 'B', 20, 100, 4),
      (demo_quiz_id, 'Which brackets create a Python list?', '()', '[]', '{}', '<>', 'B', 20, 100, 5),
      (demo_quiz_id, 'What is the result of 3 + 2 in Python?', '32', '5', '6', 'Error', 'B', 20, 100, 6),
      (demo_quiz_id, 'Which word begins a conditional statement?', 'when', 'if', 'check', 'then', 'B', 20, 100, 7),
      (demo_quiz_id, 'Which word repeats code while a condition is true?', 'repeat', 'for', 'while', 'again', 'C', 20, 100, 8),
      (demo_quiz_id, 'What does len("cat") return?', '2', '3', '4', 'cat', 'B', 20, 100, 9),
      (demo_quiz_id, 'Which file extension is commonly used for Python files?', '.java', '.py', '.html', '.txt', 'B', 20, 100, 10);
  end if;

  loop
    attempts := attempts + 1;
    next_pin := lpad((((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint) & 2147483647) % 1000000)::text, 6, '0');
    begin
      insert into public.game_sessions (quiz_id, host_user_id, game_pin)
      values (demo_quiz_id, caller_id, next_pin)
      returning game_sessions.session_id into new_session_id;
      exit;
    exception when unique_violation then
      if attempts >= 10 then raise exception 'Could not create a unique Game PIN. Please try again.'; end if;
    end;
  end loop;

  insert into public.session_questions (session_id, source_question_id, question_text, option_a, option_b, option_c, option_d, correct_answer, time_limit_seconds, points, position)
  select new_session_id, question_id, question_text, option_a, option_b, option_c, option_d, correct_answer, time_limit_seconds, points, position
  from public.questions where quiz_id = demo_quiz_id order by position;

  return query select new_session_id, next_pin::text, 'Kazing! Python Basics'::text;
end;
$$;
