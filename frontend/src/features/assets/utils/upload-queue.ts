/**
 * Module-level upload queue so sequential drag-and-drops survive React remounts
 * (Fast Refresh, auth/permission re-renders, layout remounts).
 */

export type UploadQueueListener = (files: File[]) => void;

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${file.type}`;
}

let queuedFiles: File[] = [];
const listeners = new Set<UploadQueueListener>();

function emit(): void {
  const snapshot = queuedFiles.slice();
  for (const listener of listeners) {
    listener(snapshot);
  }
}

export function getUploadQueue(): File[] {
  return queuedFiles.slice();
}

export function subscribeUploadQueue(listener: UploadQueueListener): () => void {
  listeners.add(listener);
  listener(queuedFiles.slice());
  return () => {
    listeners.delete(listener);
  };
}

export function addToUploadQueue(incoming: File[]): File[] {
  if (incoming.length === 0) {
    return queuedFiles.slice();
  }

  const existing = new Set(queuedFiles.map(fileKey));
  const next = incoming.filter((file) => !existing.has(fileKey(file)));
  if (next.length > 0) {
    queuedFiles = [...queuedFiles, ...next];
    emit();
  }
  return queuedFiles.slice();
}

export function removeFromUploadQueue(key: string): File[] {
  queuedFiles = queuedFiles.filter((file) => fileKey(file) !== key);
  emit();
  return queuedFiles.slice();
}

/** Replace a queued file (e.g. after cropping) while keeping queue order. */
export function replaceInUploadQueue(oldKey: string, nextFile: File): File[] {
  const index = queuedFiles.findIndex((file) => fileKey(file) === oldKey);
  if (index < 0) {
    return addToUploadQueue([nextFile]);
  }

  const nextKey = fileKey(nextFile);
  const duplicate = queuedFiles.some(
    (file, i) => i !== index && fileKey(file) === nextKey,
  );
  if (duplicate) {
    queuedFiles = queuedFiles.filter((_, i) => i !== index);
    emit();
    return queuedFiles.slice();
  }

  queuedFiles = [
    ...queuedFiles.slice(0, index),
    nextFile,
    ...queuedFiles.slice(index + 1),
  ];
  emit();
  return queuedFiles.slice();
}

export function clearUploadQueue(): void {
  if (queuedFiles.length === 0) {
    return;
  }
  queuedFiles = [];
  emit();
}

export { fileKey as uploadQueueFileKey };
