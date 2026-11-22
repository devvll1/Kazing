# Spec: Kazing!

## Problem
Classroom instructors lose time and momentum when they run a quiz through paper, basic forms, or spreadsheets. Those workarounds require manual score calculation and do not provide a synchronized, fair live game for the class.

## Solution
Kazing! lets an instructor host a prepared multiple-choice quiz from a laptop. Students join the live Session from a browser with a Game PIN and display name, answer before a shared Question deadline, and see the Final leaderboard.

## The user
The primary user is a classroom Instructor running a short live quiz. Students are participants in the Instructor's live Session.

## User stories
1. As an Instructor, I want to sign in so that only I can host my quiz.
2. As an Instructor, I want to start a prepared quiz and receive a six-digit Game PIN so that students can join it.
3. As a Student, I want to join with a Game PIN and display name so that I can participate without creating an account.
4. As an Instructor, I want to see students in the lobby and start the game so that I control its pace.
5. As a Student, I want to receive each Question with a visible shared deadline so that I know when to answer.
6. As a Student, I want to submit one answer per Question so that my answer is recorded fairly.
7. As an Instructor, I want to finish the quiz and show a Final leaderboard so that the class can see the outcome.

## Screens
- **Instructor login:** Email-and-password sign-in with loading and error feedback.
- **Host setup:** The signed-in Instructor selects the prepared demo quiz and starts a Session.
- **Host lobby:** Shows the Game PIN, Session title, joined Students, and a start control.
- **Student join:** Accepts a six-digit Game PIN and a display name, with clear validation errors.
- **Student waiting lobby:** Confirms the Session and display name while waiting for the Instructor.
- **Live question:** Shows the current Question, four answer choices, and countdown to the server-provided Question deadline; submitted answers become locked.
- **Host results:** Lets the Instructor advance the prepared questions and finish the Session.
- **Final leaderboard:** Shows ranked student display names and scores for the completed Session.

## Data
- **profiles:** `id`, `full_name`, timestamps. The Instructor may read and update only their own profile.
- **quizzes:** `quiz_id`, `user_id`, `title`, `description`, timestamps. The owning Instructor may read and manage their quiz.
- **questions:** `question_id`, `quiz_id`, `question_text`, `option_a` through `option_d`, `correct_answer`, `time_limit_seconds`, `points`, `position`. Only the owning Instructor may read or manage rows; Students never receive `correct_answer`.
- **game_sessions:** `session_id`, `quiz_id`, `host_user_id`, `game_pin`, `status`, `current_question_id`, `question_started_at`, `question_deadline`, timestamps. The host controls state transitions; Students receive only authorized, safe Session state.
- **session_questions:** `session_question_id`, `session_id`, snapshot question and answer fields, `position`. Trusted server operations access answer fields; Student payloads omit `correct_answer`.
- **players:** `player_id`, `session_id`, `player_name`, reconnect-token hash, `total_score`, timestamps. The host reads their Session roster; a Student accesses only their own player identity.
- **player_answers:** `answer_id`, `player_id`, `session_question_id`, `selected_answer`, `is_correct`, `points_earned`, `submitted_at`. A trusted server operation writes one row per Student and Question; Students cannot read other Students' answers.

## Login
Instructors use Supabase Auth with email and password. Students do not create accounts; their temporary session identity uses a secure reconnect credential held only by their browser and stored hashed in the database.

## Done for the demo
- [ ] The live Vercel URL opens on a phone.
- [ ] An Instructor can sign in and start the prepared demo quiz.
- [ ] The host receives a unique six-digit Game PIN.
- [ ] Multiple Students join with the PIN and distinct display names.
- [ ] The host sees the lobby update and starts the Session.
- [ ] Students receive the same Question and deadline, and may submit one answer.
- [ ] Late, duplicate, and out-of-session answers are rejected server-side.
- [ ] The Final leaderboard appears with persisted scores.

## Out of scope
- Quiz and question authoring screens for the demo slice.
- QR-code joining.
- Advanced speed-based scoring.
- Per-question feedback screens.
- Student reconnection user interface and recovery testing.
- Quiz history and analytics.
