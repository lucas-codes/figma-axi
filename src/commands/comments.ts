import type {Comment, FrameOffset, User, Vector} from '@figma/rest-api-spec';
import {AxiError} from '../errors.ts';
import {urlForm, type NodeId} from '../ref.ts';
import type {Handler, CommentsDef} from '../registry.ts';
import {sanitize} from '../security.ts';
type CommentRow = Pick<Comment, 'id' | 'parent_id' | 'created_at' | 'resolved_at' | 'message'> & {
  author: User['handle']; nodeId: NodeId | null;
};
type Thread = {root: CommentRow; replies: CommentRow[]};
function invalid(): never {
  throw new AxiError({code: 'bad_response'}, 'Invalid comments response', ['Check the Figma API response']);
}
function object(raw: unknown): raw is Record<string, unknown> {
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw);
}
function text(raw: unknown): string {
  if (typeof raw !== 'string') return invalid();
  return sanitize(raw);
}
function timestamp(raw: unknown): string {
  const value = text(raw);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) || !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value.slice(0, 10)) return invalid();
  return value;
}
function vector(raw: unknown): raw is Vector {
  return object(raw) && typeof raw.x === 'number' && Number.isFinite(raw.x) && typeof raw.y === 'number' && Number.isFinite(raw.y);
}
function nodeId(value: FrameOffset['node_id']): value is NodeId {
  return /^I?\d+:\d+(;I?\d+:\d+)*$/.test(value);
}
function pin(raw: unknown): NodeId | null {
  if (!object(raw)) return invalid();
  if ('node_id' in raw) {
    const id = text(raw.node_id);
    if (!nodeId(id) || !vector(raw.node_offset)) return invalid();
    return id;
  }
  if (!vector(raw)) return invalid();
  return null;
}
function parseThreads(raw: unknown): {total: number; threads: Thread[]} {
  if (!object(raw) || !Array.isArray(raw.comments)) return invalid();
  const rows: CommentRow[] = raw.comments.map((entry: unknown) => {
    if (!object(entry) || !object(entry.user)) return invalid();
    return {
      id: text(entry.id), parent_id: entry.parent_id === undefined ? undefined : text(entry.parent_id),
      created_at: timestamp(entry.created_at),
      resolved_at: entry.resolved_at == null ? null : timestamp(entry.resolved_at),
      message: text(entry.message), author: text(entry.user.handle), nodeId: pin(entry.client_meta),
    };
  });
  const ids = new Set<string>();
  const roots = new Map<string, Thread>();
  for (const row of rows) {
    if (!row.id || ids.has(row.id)) return invalid();
    ids.add(row.id);
    if (!row.parent_id) roots.set(row.id, {root: row, replies: []});
  }
  for (const row of rows) if (row.parent_id) {
    const thread = roots.get(row.parent_id);
    if (!thread) return invalid();
    thread.replies.push(row);
  }
  const oldest = (a: CommentRow, b: CommentRow) => Date.parse(a.created_at) - Date.parse(b.created_at);
  const threads = [...roots.values()].sort((a, b) => oldest(b.root, a.root));
  for (const thread of threads) thread.replies.sort(oldest);
  return {total: rows.length, threads};
}
export const run: Handler<CommentsDef> = async ({ref, flags}, ctx) => {
  const {total, threads} = parseThreads(await ctx.figma({op: 'getComments', fileKey: ref.fileKey, query: {as_md: true}}));
  let resolvedHidden = 0;
  const visible: CommentRow[] = [];
  for (const {root, replies} of threads) {
    if (!flags.resolved && root.resolved_at) resolvedHidden += 1 + replies.length;
    else visible.push(root, ...replies);
  }
  const selected = flags.full ? visible : visible.slice(0, flags.limit);
  const dropped = visible.length - selected.length;
  let cut = false;
  const comments = selected.map(row => {
    const points = Array.from(row.message);
    if (!flags.full && points.length > 500) cut = true;
    return {id: row.id, parent: row.parent_id || null, node: row.nodeId === null ? null : urlForm(row.nodeId),
      author: row.author, created: row.created_at.slice(0, 10), message: flags.full ? row.message : points.slice(0, 500).join('')};
  });
  const help: string[] = [];
  if (!total) help.push('No comments in file ' + ref.fileKey);
  if (resolvedHidden) help.push('Run `figma-axi comments ' + ref.fileKey + ' --resolved` to include resolved threads');
  const pinned = visible.find(row => row.nodeId !== null);
  if (pinned && pinned.nodeId !== null) help.push('Run `figma-axi inspect ' + ref.fileKey + ' --node ' + urlForm(pinned.nodeId) + '` for the layers a comment is pinned to');
  if (cut || dropped) help.push('Run `figma-axi comments ' + ref.fileKey + ' --full` for uncut messages and all rows (' + dropped + ' rows omitted by --limit)');
  return {file: ref.fileKey, total, resolvedHidden, comments, help};
};
