export type ShareOutcome = 'shared' | 'downloaded' | 'copied' | 'cancelled';

function isAbort(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}

// Call from a click handler with a blob that is already rendered.
// Safari rejects navigator.share() if the page awaits other work first.
export async function shareImage(blob: Blob, fileName: string, title: string): Promise<ShareOutcome> {
  const file = new File([blob], fileName, { type: 'image/png' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (isAbort(e)) return 'cancelled';
      throw e;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

export async function shareLink(url: string, title: string): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url });
      return 'shared';
    } catch (e) {
      if (isAbort(e)) return 'cancelled';
      // Some desktop browsers expose share() but fail. Copy the link instead.
    }
  }
  await navigator.clipboard.writeText(url);
  return 'copied';
}
