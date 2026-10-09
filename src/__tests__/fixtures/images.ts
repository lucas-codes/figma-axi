import type {GetImagesResponse} from '@figma/rest-api-spec';
import type {DeepPartial, Scenario} from '../harness.ts';
export const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN3sAAAAASUVORK5CYII=', 'base64');
export const jpg = Uint8Array.of(0xff, 0xd8, 0xff, 0xe0);
export const svg = Buffer.from(' \n<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"/>');
export const images = {err: null, images: {'1:2': 'https://images.example.test/frame.png'}} satisfies DeepPartial<GetImagesResponse>;
export const imageApi = 'https://api.figma.com/v1/images/AbC123xyz456?ids=1%3A2&format=png&scale=1';
export const goldenCases = {
  render: {
    argv: ['render', 'https://www.figma.com/design/AbC123xyz456/Checkout?node-id=1-2'],
    tmpdir: '/tmp/figma-axi-golden',
    routes: {
      [imageApi]: {body: images},
      'https://images.example.test/frame.png': {bytes: png, contentType: 'image/png'},
    },
    exit: 0,
    model: {
      images: [{node: '1-2', path: '/tmp/figma-axi-golden/figma-axi/AbC123xyz456/1-2@1x.png',
        format: 'png', bytes: 68}],
      help: ['Read the image at path; re-run with --scale 2 for finer detail', 'SVG is for icons and vectors; use `spec` for layout and `assets` for photos'],
    },
  },
} satisfies Record<string, Scenario>;
