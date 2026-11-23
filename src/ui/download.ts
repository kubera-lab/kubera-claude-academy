/** Save text as a file in the learner's browser. Nothing is uploaded anywhere. */
export function downloadText(name: string, text: string, type = 'text/plain'): boolean {
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return true;
  } catch {
    return false;
  }
}

/** Make a safe file name from user text: letters, digits and dashes only. */
export function safeName(s: string, fallback: string): string {
  const t = s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return t || fallback;
}
