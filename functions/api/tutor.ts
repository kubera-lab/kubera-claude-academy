// Cloudflare Pages Function: server interface for a future AI tutor.
// Status: NOT CONFIGURED. It never calls a model and never stores keys in the browser.
// Contract (for a future implementation):
//   POST /api/tutor  { lessonId: string, question: string, lang: "en" | "ru" }
//   → 200 { reply: string, model: string }  — explanations only; never reveals answer keys
//   → 501 { error: "not_configured" }        — current behaviour
// Grading stays in the browser engine; the tutor must not change scores.
interface TutorRequest { lessonId?: unknown; question?: unknown; lang?: unknown }

export const onRequestPost = async (ctx: { request: Request }): Promise<Response> => {
  let body: TutorRequest = {};
  try { body = (await ctx.request.json()) as TutorRequest; } catch { /* ignore */ }
  const valid = typeof body.lessonId === 'string' && typeof body.question === 'string' && body.question.length <= 1000;
  return new Response(JSON.stringify({ error: valid ? 'not_configured' : 'bad_request' }), {
    status: valid ? 501 : 400,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
};

export const onRequestGet = async (): Promise<Response> =>
  new Response(JSON.stringify({ connected: false, reason: 'not_configured' }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
