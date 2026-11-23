// Course content for "Build Your First AI Assistant" (English).
// All example organisations and numbers are fictional and labelled as such.
import type { ChoiceQuestion } from '../engine/quiz.ts';
import type { AssistantConfig, KBEntry } from '../engine/assistant.ts';
import type { TestCase } from '../engine/testing.ts';

export const RIVERSIDE_FACTS = `1. Opening hours: Monday to Friday 9:00 to 17:00; Saturday 10:00 to 14:00; closed on Sunday.
2. Free English conversation club: Wednesdays 18:00 to 19:30 in Room 2. No booking needed.
3. Computer room: free. Book at reception. Maximum 2 hours per person per day.
4. Phone: 020 0000 0000 (example number).
5. Step-free access to the ground floor. No lift to the first floor.`;

export const RIVERSIDE_KB: KBEntry[] = [
  { id: 'hours', question: 'When are you open?', keywords: 'open, opening, hours, close, closed, sunday, saturday, weekend', answer: 'We are open Monday to Friday 9:00 to 17:00 and Saturday 10:00 to 14:00. We are closed on Sunday.', source: 1 },
  { id: 'english', question: 'When is the English club?', keywords: 'english, conversation, club, language', answer: 'The free English conversation club is on Wednesdays from 18:00 to 19:30 in Room 2. No booking needed.', source: 2 },
  { id: 'computer', question: 'Can I use a computer?', keywords: 'computer, computer room, pc, laptop', answer: 'The computer room is free. Book at reception. You can use it for a maximum of 2 hours per person per day.', source: 3 },
  { id: 'phone', question: 'What is your phone number?', keywords: 'phone, call, telephone, number, contact', answer: 'You can call us on 020 0000 0000.', source: 4 },
  { id: 'access', question: 'Is the building accessible?', keywords: 'wheelchair, step-free, lift, stairs, accessible, access, first floor', answer: 'There is step-free access to the ground floor. There is no lift to the first floor.', source: 5 },
];

export const RIVERSIDE_INSTRUCTIONS =
  'You are a friendly helper for visitors of Riverside Community Centre. Answer only from the fact sheet below. ' +
  'If the answer is not in the fact sheet, say "I don\'t know" and never guess. Then suggest calling 020 0000 0000 or asking at reception. ' +
  'Keep every answer short and in simple English, because many visitors are still learning English. Do not answer questions about other topics.';

export const RIVERSIDE: AssistantConfig = {
  name: 'Riverside Helper',
  purpose: 'Answers visitor questions about Riverside Community Centre (fictional example).',
  instructions: RIVERSIDE_INSTRUCTIONS,
  facts: RIVERSIDE_FACTS,
  kb: RIVERSIDE_KB,
  unknownReply: "I don't know. That is not in my information. Please call 020 0000 0000 or ask at reception.",
  outOfScopeTopics: 'weather, football, politics, doctor, medical, lawyer, homework, bitcoin, news',
  outOfScopeReply: 'I can only help with questions about Riverside Community Centre.',
  maxWords: 40,
};

export const RIVERSIDE_TESTS: TestCase[] = [
  { id: 'T1', category: 'normal', input: 'When is the English club?', expectKind: 'answer', mustContain: 'wednesday, 18:00', mustNotContain: '' },
  { id: 'T2', category: 'normal', input: 'How long can I use the computer room?', expectKind: 'answer', mustContain: '2 hours', mustNotContain: 'unlimited' },
  { id: 'T3', category: 'missing', input: 'Is there free Wi-Fi?', expectKind: 'unknown', mustContain: "don't know", mustNotContain: 'yes' },
  { id: 'T4', category: 'wrong_assumption', input: 'What time do you open on Sunday?', expectKind: 'answer', mustContain: 'closed on sunday', mustNotContain: '' },
  { id: 'T5', category: 'out_of_scope', input: 'What will the weather be tomorrow?', expectKind: 'out_of_scope', mustContain: 'only help', mustNotContain: '' },
  { id: 'T6', category: 'unclear', input: 'The club or the computer?', expectKind: 'clarify', mustContain: 'do you mean', mustNotContain: '' },
  { id: 'T7', category: 'normal', input: 'Can I call you?', expectKind: 'answer', mustContain: '020 0000 0000', mustNotContain: '' },
];

/** Module 4: a broken copy of the helper. Four planted faults. */
export function brokenRiverside(): AssistantConfig {
  return {
    ...RIVERSIDE,
    name: 'Riverside Helper (broken copy)',
    kb: [
      { ...RIVERSIDE_KB[0], answer: 'We are open every day from 10:00 to 14:00.' },
      RIVERSIDE_KB[1],
      { ...RIVERSIDE_KB[2], answer: 'The computer room is free and you can stay for unlimited time.' },
      { ...RIVERSIDE_KB[3], keywords: 'phone, telephone, number' },
      RIVERSIDE_KB[4],
    ],
    outOfScopeTopics: '',
  };
}

export type ModuleId = 'm1' | 'm2' | 'm3' | 'm4' | 'm5';
export type Block = { kind: 'p' | 'h' | 'list' | 'example' | 'note'; text: string | string[] };

export interface ModuleDef {
  id: ModuleId;
  number: number;
  title: string;
  minutes: number;
  objectives: string[];
  lesson: Block[];
  quiz: ChoiceQuestion[];
  practiceTitle: string;
  practiceIntro: string;
}

export const MODULES: ModuleDef[] = [
  {
    id: 'm1',
    number: 1,
    title: 'Understand AI assistants',
    minutes: 25,
    objectives: [
      'Explain what an AI assistant is and how it differs from an agent.',
      'Recognise a hallucination: a confident answer with no support in the facts.',
      'Name the three parts of a trustworthy assistant: instructions, knowledge, tests.',
      'Know what must never be pasted into an AI tool.',
    ],
    lesson: [
      { kind: 'p', text: 'A language model writes fluent text by predicting likely words. Fluent is not the same as true. When the model does not know something, it can still produce a confident answer. This is called a hallucination.' },
      { kind: 'h', text: 'Chatbot, assistant, agent' },
      { kind: 'list', text: ['A chatbot replies to messages.', 'An assistant is a chatbot with a job: instructions, a fixed set of facts and rules about what to do when it does not know.', 'An agent can also use tools and take actions, for example send an email or update a file. Actions need more care, because mistakes have effects outside the chat.'] },
      { kind: 'h', text: 'Inputs, instructions, outputs, tools' },
      { kind: 'p', text: 'Every assistant turns an input (the user\'s question) into an output (the reply), following its instructions and using its knowledge. Tools are optional extras. In this course you build an assistant without tools, so you can test every reply.' },
      { kind: 'h', text: 'Three parts of a trustworthy assistant' },
      { kind: 'list', text: ['Instructions: who it helps, what it may talk about, what to do when it does not know.', 'Knowledge: a fixed list of facts. Every answer must come from one of them.', 'Tests: questions with known correct behaviour, run again after every change.'] },
      { kind: 'example', text: 'Example data used in this course (fictional):\n' + RIVERSIDE_FACTS },
      { kind: 'note', text: 'Privacy: never paste passwords, bank details, ID numbers or other people\'s private information into an AI tool. Use fictional data for practice.' },
    ],
    quiz: [
      { id: 'm1q1', prompt: 'What is a hallucination?', options: ['A slow or broken reply', 'A confident answer that is not supported by real facts', 'A reply in the wrong language'], correct: 1, why: 'A hallucination sounds sure but has no support in the facts.' },
      { id: 'm1q2', prompt: 'A question is not covered by the fact sheet. What should the assistant do?', options: ['Give the most likely answer', 'Say it does not know and point to a real contact', 'Answer from the first internet result'], correct: 1, why: 'An unknown stays unknown. A real contact gives the person a safe next step.' },
      { id: 'm1q3', prompt: 'What can an agent do that a simple chatbot cannot?', options: ['Use tools and take actions', 'Write longer replies', 'Nothing, they are the same'], correct: 0, why: 'Agents act through tools, so their mistakes have real effects.' },
      { id: 'm1q4', prompt: 'Why keep test questions with known answers?', options: ['To prove the assistant still behaves correctly after every change', 'To make it answer faster', 'Only big companies need tests'], correct: 0, why: 'A change that fixes one answer can break another. Tests show it at once.' },
      { id: 'm1q5', prompt: 'Which is safe to paste into an AI tool for practice?', options: ['Your bank card number', 'A fictional fact sheet', 'A friend\'s medical details'], correct: 1, why: 'Practise only with fictional or public information.' },
    ],
    practiceTitle: 'Spot the invented answers',
    practiceIntro: 'An untested assistant answered five questions. Compare each answer with the fact sheet and label it.',
  },
  {
    id: 'm2',
    number: 2,
    title: 'Design your assistant',
    minutes: 30,
    objectives: [
      'Write instructions that define role, subject, grounding, unknowns, next step and style.',
      'Avoid instructions that contradict themselves or say nothing.',
      'Understand why keywords alone do not make good instructions.',
    ],
    lesson: [
      { kind: 'p', text: 'Instructions (often called a system prompt) are the first thing the model reads. A good prompt is short, specific and consistent. Every sentence should change how the assistant behaves.' },
      { kind: 'h', text: 'Six things every prompt in this course must cover' },
      { kind: 'list', text: ['Role: "You are a friendly helper for ..."', 'Subject: the exact place or topic.', 'Grounding: "Answer only from the fact sheet."', 'Unknowns: "If it is not in the fact sheet, say I don\'t know. Never guess."', 'Next step: a real phone number, email or desk.', 'Style: short, simple sentences.'] },
      { kind: 'h', text: 'Three common mistakes the checker catches' },
      { kind: 'list', text: ['Contradictions: "Answer only from the facts" and later "if unsure, use your own knowledge". The model cannot follow both.', 'Keyword stuffing: a list of words like "only facts don\'t know phone short" is not an instruction.', 'Nonsense or copy-paste repetition: the same sentence twice, or random letters.'] },
      { kind: 'example', text: 'Weak: "Be helpful and answer questions about the centre."\nStrong: ' + RIVERSIDE_INSTRUCTIONS },
      { kind: 'note', text: 'The checker uses fixed rules, so the same text always gets the same result. It cannot fully understand meaning. That is why Module 4 tests behaviour, not wording.' },
    ],
    quiz: [
      { id: 'm2q1', prompt: 'Which instruction contradicts "Answer only from the fact sheet"?', options: ['"Keep answers short."', '"If you are not sure, use your own general knowledge."', '"Suggest calling reception."'], correct: 1, why: 'Using outside knowledge breaks the "only" rule.' },
      { id: 'm2q2', prompt: 'Why is "only facts don\'t know phone short simple" a bad prompt?', options: ['It is too long', 'It is a list of keywords, not instructions the model can follow', 'It has no capital letters'], correct: 1, why: 'Keywords without sentences leave the behaviour unclear.' },
      { id: 'm2q3', prompt: 'What makes a "next step" useful?', options: ['It is a real contact the person can use', 'It is a joke to end the chat', 'It asks for the user\'s password'], correct: 0, why: 'A real phone, email or desk lets the person get the answer elsewhere.' },
    ],
    practiceTitle: 'Write and check your instructions',
    practiceIntro: 'Write instructions for the Riverside helper (40–220 words). All required and quality checks must pass.',
  },
  {
    id: 'm3',
    number: 3,
    title: 'Build the first version',
    minutes: 35,
    objectives: [
      'Turn facts into knowledge entries: question, keywords, answer, source.',
      'Keep every number in an answer identical to its source fact.',
      'Run a working assistant and read its trace: which entry answered and why.',
    ],
    lesson: [
      { kind: 'p', text: 'In this course your assistant runs offline, inside the page, with no paid AI service. It is a rule-based assistant: it matches the question\'s words with each entry\'s keywords and replies with that entry\'s answer. It never writes new text, so it cannot invent facts. A large language model works differently; Module 4 shows how to test one by hand.' },
      { kind: 'h', text: 'A knowledge entry has four parts' },
      { kind: 'list', text: ['Question: a typical way people ask.', 'Keywords: words that signal this topic, separated by commas.', 'Answer: the reply, written from the fact.', 'Source: the number of the fact it comes from.'] },
      { kind: 'h', text: 'What the validator checks' },
      { kind: 'list', text: ['The source fact exists.', 'Every number or time in the answer appears in that fact. "3 hours" when the fact says 2 is caught.', 'The answer re-uses the fact\'s words (at least 35%), a simple signal that it says the same thing.', 'Two entries do not share a keyword, which would make replies unpredictable.', 'No absolute claim the fact does not make ("every day", "unlimited").', 'A "no / not / closed" in the fact is not lost in the answer ("No lift" must not become "there is a lift").', 'The answer stays within the word limit.'] },
      { kind: 'example', text: 'Fact 2: Free English conversation club: Wednesdays 18:00 to 19:30 in Room 2.\nEntry: keywords "english, conversation, club" → "The free English conversation club is on Wednesdays from 18:00 to 19:30 in Room 2." (source 2)' },
    ],
    quiz: [
      { id: 'm3q1', prompt: 'The fact says "maximum 2 hours". The answer says "up to 3 hours". What does the validator report?', options: ['Nothing, it is close enough', 'An unsupported number: 3', 'A missing keyword'], correct: 1, why: 'Every number in an answer must appear in its source fact.' },
      { id: 'm3q2', prompt: 'Two entries both use the keyword "room". What can happen?', options: ['Nothing', 'Unpredictable replies: the assistant may pick the wrong entry or ask to clarify', 'The assistant becomes faster'], correct: 1, why: 'Shared keywords make the match ambiguous.' },
      { id: 'm3q3', prompt: 'Why does each entry record its source fact number?', options: ['So anyone can check where the answer came from', 'To make the file bigger', 'It is not needed'], correct: 0, why: 'A source makes each answer verifiable.' },
    ],
    practiceTitle: 'Complete the knowledge base and try it',
    practiceIntro: 'Three entries are ready. Add the two missing ones (phone and step-free access), fix every validation issue, then ask the assistant questions.',
  },
  {
    id: 'm4',
    number: 4,
    title: 'Test and improve',
    minutes: 35,
    objectives: [
      'Write tests for five kinds of request: normal, unclear, missing information, wrong assumption, out of scope.',
      'Find faults by running tests, fix them, and re-run until everything passes.',
      'Test a real AI model by hand and grade its replies with the same rules.',
    ],
    lesson: [
      { kind: 'p', text: 'A test is a question plus the behaviour you expect. Expected behaviour is one of: answer, say "I don\'t know", decline (out of scope) or ask to clarify. You can also require words that must or must not appear.' },
      { kind: 'h', text: 'Five kinds of test' },
      { kind: 'list', text: ['Normal: "When is the English club?" → answer with Wednesday 18:00.', 'Unclear: "The club or the computer?" → ask which one.', 'Missing information: "Is there free Wi-Fi?" → "I don\'t know" plus a contact.', 'Wrong assumption: "What time do you open on Sunday?" → correct the assumption: closed on Sunday.', 'Out of scope: "What will the weather be?" → politely decline.'] },
      { kind: 'h', text: 'Regression' },
      { kind: 'p', text: 'After every fix, run all tests again, not only the one that failed. A fix in one place often breaks another.' },
      { kind: 'h', text: 'Testing a real model by hand' },
      { kind: 'p', text: 'This page cannot call an AI model. You can still test one: copy your instructions and facts into Claude, Gemini or ChatGPT, ask a test question there, and paste the reply back here. The same rules grade it. Real models vary between runs, so test each question more than once before you trust a result.' },
    ],
    quiz: [
      { id: 'm4q1', prompt: '"Since you\'re open on Sunday, what time?" is which kind of test?', options: ['Normal', 'Wrong assumption', 'Out of scope'], correct: 1, why: 'The question contains a false belief the assistant must correct.' },
      { id: 'm4q2', prompt: 'You fixed one failing test. What do you do next?', options: ['Run all tests again', 'Delete the other tests', 'Publish immediately'], correct: 0, why: 'Re-running everything catches regressions.' },
      { id: 'm4q3', prompt: 'A real model answered a missing-information test correctly once. Is that proof?', options: ['Yes, one pass is enough', 'No, real models vary; repeat the test several times', 'Only if the answer is long'], correct: 1, why: 'Language models are not deterministic. Repeat before you trust.' },
    ],
    practiceTitle: 'Fix a broken assistant',
    practiceIntro: 'This copy of the Riverside helper has four faults. Run the tests, read why each one fails, fix the configuration and re-run until all tests pass.',
  },
  {
    id: 'm5',
    number: 5,
    title: 'Final project: your own assistant',
    minutes: 60,
    objectives: [
      'Build an assistant on your own subject with your own facts, instructions, knowledge and tests.',
      'Meet every acceptance criterion with evidence from real test runs.',
      'Export a project summary and test report for GitHub, stating its limits honestly.',
    ],
    lesson: [
      { kind: 'p', text: 'The final project is separate from the knowledge score. It is judged only on evidence: whether your assistant passes the tests you wrote, and whether those tests cover the five kinds of request.' },
      { kind: 'h', text: 'Acceptance criteria' },
      { kind: 'list', text: ['Your own subject and facts, not the Riverside example.', 'Name, purpose and subject filled in.', 'At least 4 facts.', 'Instructions pass every required and quality check.', 'At least 4 knowledge entries with no validation issues.', 'Unknown and out-of-scope replies written; the unknown reply gives a real next step.', 'At least 6 tests covering normal (2+), missing information, wrong assumption and out of scope.', 'All tests pass on the offline assistant.', 'Control tests pass: fixed checks you cannot edit (unrelated questions, an attempt to make it ignore the facts, every entry reachable, 75% of facts used).'] },
      { kind: 'note', text: 'Optional evidence: real-model replies you pasted and graded. They are reported separately and never replace the offline tests.' },
      { kind: 'h', text: 'Portfolio honesty' },
      { kind: 'p', text: 'Your export states what was tested, how, and what was not. Write "passed 7 of 7 offline tests; real model tested by hand on 3 questions", never "guaranteed accurate".' },
    ],
    quiz: [
      { id: 'm5q1', prompt: 'Which sentence belongs in your project README?', options: ['"Guaranteed zero hallucinations."', '"Passed 7 of 7 offline tests; not connected to a live AI model."', '"Certified AI expert."'], correct: 1, why: 'Report the evidence you have, nothing more.' },
      { id: 'm5q2', prompt: 'Your knowledge score is 100%. Does that prove your project works?', options: ['Yes', 'No, the project is judged by its own tests', 'Only on Mondays'], correct: 1, why: 'Knowing about testing and having a working, tested project are different things.' },
      { id: 'm5q3', prompt: 'What must the README list besides results?', options: ['Limitations and what was not tested', 'Only successes', 'Your password'], correct: 0, why: 'Limits are part of honest quality reporting.' },
    ],
    practiceTitle: 'Open the project builder',
    practiceIntro: 'Build, test and export your own assistant in the project builder.',
  },
];

export interface SpotItem {
  q: string;
  a: string;
  correct: 'correct' | 'invented' | 'refusal';
  why: string;
}
export const SPOT_ITEMS: SpotItem[] = [
  { q: 'Are you open on Sunday?', a: 'Yes, we are open on Sunday from 10:00 to 14:00.', correct: 'invented', why: 'Fact 1: closed on Sunday. 10:00–14:00 is the Saturday time.' },
  { q: 'When is the English club?', a: 'The free English conversation club is on Wednesdays, 18:00 to 19:30, in Room 2. No booking needed.', correct: 'correct', why: 'Every detail matches fact 2.' },
  { q: 'Is there free Wi-Fi?', a: "I don't know. Wi-Fi is not in my information. Please call 020 0000 0000 or ask at reception.", correct: 'refusal', why: 'Wi-Fi is not in the facts, so declining with a real contact is right.' },
  { q: 'Can I use the computer room all day?', a: 'Yes, the computer room is free and you can stay as long as you like.', correct: 'invented', why: 'Fact 3 limits use to 2 hours per person per day.' },
  { q: 'Can I get to the first floor in a wheelchair?', a: 'There is step-free access to the ground floor, but there is no lift to the first floor.', correct: 'correct', why: 'Matches fact 5.' },
];

export interface Template {
  id: string;
  label: string;
  subject: string;
  facts: string;
}
export const TEMPLATES: Template[] = [
  {
    id: 'library',
    label: 'Local library helper (fictional)',
    subject: 'Oakfield Library',
    facts: `1. Oakfield Library is open Tuesday to Saturday 9:30 to 18:00; closed on Sunday and Monday.
2. Library membership is free. Bring proof of address to join.
3. You can borrow up to 10 books for 3 weeks.
4. Printing costs 10p per black and white page.
5. Email: hello@oakfield-library.example (example address).`,
  },
  {
    id: 'cafe',
    label: 'Small café helper (fictional)',
    subject: 'Willow Café',
    facts: `1. Willow Café is open every day 8:00 to 16:00.
2. All cakes are baked on site. Vegan options are marked with a green label.
3. Dogs are welcome on the terrace, not inside.
4. Table bookings are only for groups of 6 or more.
5. Phone: 020 0000 1111 (example number).`,
  },
  { id: 'blank', label: 'My own subject (start empty)', subject: '', facts: '' },
];
