import type {GetCommentsResponse} from '@figma/rest-api-spec';
import type {DeepPartial, Scenario} from '../harness.ts';
export const comments = {comments: [
  {id: '102', parent_id: '101', client_meta: {node_id: '1:12', node_offset: {x: 0, y: 0}}, user: {handle: 'lucas'}, created_at: '2026-10-01T10:00:00Z', message: 'Yes - matches the current checkout'},
  {id: '105', parent_id: '104', client_meta: {x: 2, y: 3}, user: {handle: 'lucas'}, created_at: '2026-10-04T10:00:00Z', message: 'Done'},
  {id: '101', client_meta: {node_id: '1:12', node_offset: {x: 0, y: 0}}, user: {handle: 'ana'}, created_at: '2026-09-30T10:00:00Z', message: 'Should the CTA stay disabled until terms are ticked?'},
  {id: '104', client_meta: {x: 1, y: 2}, user: {handle: 'ana'}, created_at: '2026-10-03T10:00:00Z', resolved_at: '2026-10-05T10:00:00Z', message: 'Update the title'},
  {id: '107', parent_id: '', client_meta: {x: 1, y: 2}, user: {handle: 'ana'}, created_at: '2026-10-02T10:00:00Z', resolved_at: null, message: 'Archive page is stale, ignore it'},
]} satisfies DeepPartial<GetCommentsResponse>;
export const endpoint = 'https://api.figma.com/v1/files/AbC123xyz456/comments?as_md=true';
export const model = {file: 'AbC123xyz456', total: 5, resolvedHidden: 2, comments: [
  {id: '107', parent: null, node: null, author: 'ana', created: '2026-10-02', message: 'Archive page is stale, ignore it'},
  {id: '101', parent: null, node: '1-12', author: 'ana', created: '2026-09-30', message: 'Should the CTA stay disabled until terms are ticked?'},
  {id: '102', parent: '101', node: '1-12', author: 'lucas', created: '2026-10-01', message: 'Yes - matches the current checkout'},
], help: [
  'Run `figma-axi comments AbC123xyz456 --resolved` to include resolved threads',
  'Run `figma-axi inspect AbC123xyz456 --node 1-12` for the layers a comment is pinned to',
]};
export const goldenCases = {
  comments: {argv: ['comments', 'https://www.figma.com/design/AbC123xyz456/Checkout'], routes: {[endpoint]: {body: comments}}, exit: 0, model},
  'comments-empty': {argv: ['comments', 'AbC123xyz456'], routes: {[endpoint]: {body: {comments: []} satisfies DeepPartial<GetCommentsResponse>}}, exit: 0,
    model: {file: 'AbC123xyz456', total: 0, resolvedHidden: 0, comments: [], help: ['No comments in file AbC123xyz456']}},
} satisfies Record<string, Scenario>;
