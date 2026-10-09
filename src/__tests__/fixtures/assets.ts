import type {GetImageFillsResponse, GetFileNodesResponse} from '@figma/rest-api-spec';
import {mkdir, rm, writeFile} from 'node:fs/promises';
import type {DeepPartial, Scenario} from '../harness.ts';
import {png} from './images.ts';
const imageRef = '8b6a9fadc5780b1bf5600acd10e4c09e4fdad9c1';
const url = 'https://fills.example.test/photo';
const nodes = {name: 'Photos', nodes: {'1:2': {components: {}, document: {id: '1:2', type: 'FRAME', name: 'Hero', children: [
  {id: '1:3', type: 'RECTANGLE', name: 'Photo', fills: [{type: 'IMAGE', imageRef, scaleMode: 'FILL'}]},
]}}}} satisfies DeepPartial<GetFileNodesResponse>;
const fills = {error: false, status: 200, meta: {images: {[imageRef]: url}}} satisfies GetImageFillsResponse;
const help = ['Read each image at path; files are named by imageRef, so a re-run reuses them', 'Run `figma-axi render AbC123xyz456 --node <id> --format svg` for icons and vectors, which are not image fills'];
function scenario(status: 'saved' | 'cached' | 'missing'): Scenario {
  const dir = '/tmp/figma-axi-golden/assets-' + status;
  const out = dir + '/AbC123xyz456/fills';
  const path = out + '/' + imageRef + '.png';
  return {
    argv: ['assets', 'AbC123xyz456', '--node', '1-2', '--out', dir],
    prepare: async () => {
      await rm(dir, {recursive: true, force: true});
      if (status === 'cached') {await mkdir(out, {recursive: true}); await writeFile(path, png);}
    },
    routes: {
      'https://api.figma.com/v1/files/AbC123xyz456/nodes?ids=1%3A2': {body: nodes},
      'https://api.figma.com/v1/files/AbC123xyz456/images': {body: status === 'missing' ? {...fills, meta: {images: {}}} : fills},
      ...(status === 'saved' ? {[url]: {bytes: png, contentType: 'image/png'}} : {}),
    },
    exit: 0,
    model: {file: 'Photos', node: '1-2', out, found: 1, saved: status === 'saved' ? 1 : 0, cached: status === 'cached' ? 1 : 0, missing: status === 'missing' ? 1 : 0, beyondLimit: 0,
      images: [{imageRef, status, format: status === 'missing' ? null : 'png', bytes: status === 'missing' ? null : 68, layer: '1-3', uses: 1, path: status === 'missing' ? null : path}], help},
  };
}
export const goldenCases = {assets_saved: scenario('saved'), assets_cached: scenario('cached'), assets_missing: scenario('missing')};
