import type {IsLayerTrait, ComponentPropertyType, StyleType, LocalVariable} from '@figma/rest-api-spec';
import {AxiError} from './errors.ts';
import type {Brand} from './ref.ts';
import {urlForm} from './ref.ts';
import {sanitize} from './security.ts';
import type {FacetParser, Walk, NodesEntry} from './summarize.ts';
export type StyleId = Brand<string, 'StyleId'>;
export type VariableId = Brand<string, 'VariableId'>;
export type VariableKey = Brand<string, 'VariableKey'>;
export type ImageRef = Brand<string, 'ImageRef'>;
export type Hex = Brand<string, 'Hex'>;
export type TokenField = 'fill' | 'stroke' | 'stroke-weight' | 'radius' | 'effect' | 'font' | 'gap' | 'padding' | 'size' | 'opacity';
export type Column = 'size' | 'layout' | 'fill' | 'stroke' | 'radius' | 'effect' | 'text';
type BoundField = keyof NonNullable<IsLayerTrait['boundVariables']>;
export const FIELD_OF = {
  size: 'size', individualStrokeWeights: 'stroke-weight', characters: null, itemSpacing: 'gap', paddingLeft: 'padding', paddingRight: 'padding', paddingTop: 'padding', paddingBottom: 'padding', visible: null,
  topLeftRadius: 'radius', topRightRadius: 'radius', bottomLeftRadius: 'radius', bottomRightRadius: 'radius', minWidth: 'size', maxWidth: 'size', minHeight: 'size', maxHeight: 'size', counterAxisSpacing: 'gap', opacity: 'opacity',
  fontFamily: 'font', fontSize: 'font', fontStyle: 'font', fontWeight: 'font', letterSpacing: 'font', lineHeight: 'font', paragraphSpacing: 'font', paragraphIndent: 'font', fills: 'fill', strokes: 'stroke', componentProperties: null, textRangeFills: 'fill', effects: 'effect', layoutGrids: null, rectangleCornerRadii: 'radius',
} as const satisfies Record<BoundField, TokenField | null>;
export const COLUMN_OF: Record<TokenField, Column> = {fill: 'fill', stroke: 'stroke', 'stroke-weight': 'stroke', radius: 'radius', effect: 'effect', font: 'text', gap: 'layout', padding: 'layout', size: 'size', opacity: 'effect'};
export type VariableRef = {readonly id: VariableId; readonly key: VariableKey | null};
export type Binding = {readonly field: TokenField; readonly variable: VariableRef; readonly value: string | null; readonly target: string};
export type Paint =
  | {kind: 'solid'; color: Hex}
  | {kind: 'gradient'; shape: 'linear' | 'radial' | 'angular' | 'diamond'; stops: readonly Hex[]}
  | {kind: 'image'; ref: ImageRef; scaleMode: 'fill' | 'fit' | 'tile' | 'stretch'}
  | {kind: 'other'; type: string};
export type Shadow =
  | {kind: 'drop' | 'inner'; x: number; y: number; blur: number; spread: number; color: Hex}
  | {kind: 'blur' | 'bg-blur'; radius: number}
  | {kind: 'other'; type: string};
export type Sizing = 'fixed' | 'hug' | 'fill';
type Quad = readonly [number, number, number, number];
export type AutoLayout = {direction: 'row' | 'col' | 'grid'; gap: number; pad: Quad; main: 'start' | 'center' | 'end' | 'between'; cross: 'start' | 'center' | 'end' | 'baseline' | 'stretch'; wrap: boolean};
export type Typography = {family: string; weight: number; size: number; lineHeightPx: number | null; letterSpacing: number; align: 'left' | 'center' | 'right' | 'justified'; textCase: 'upper' | 'lower' | 'title' | null; decoration: 'underline' | 'strike' | null; mixed: boolean};
export type InstanceProp = {name: string; type: ComponentPropertyType; value: string | boolean};
type StyleSlot = 'fill' | 'stroke' | 'effect' | 'text' | 'grid';
export type StyleFacet = {
  size: {w: number; h: number} | null; sizing: {h: Sizing | null; v: Sizing | null} | null; absolute: boolean;
  layout: AutoLayout | null; fills: readonly Paint[];
  strokes: {paints: readonly Paint[]; weight: number | Quad; align: 'inside' | 'outside' | 'center'} | null;
  radius: number | Quad | null; effects: readonly Shadow[]; opacity: number; text: Typography | null;
  styles: Partial<Record<StyleSlot, StyleId>>; bindings: readonly Binding[];
  instance: {componentId: string; props: readonly InstanceProp[]} | null;
};
export type Catalog = {styles: ReadonlyMap<StyleId, {key: string; name: string; type: StyleType}>; components: ReadonlyMap<string, {name: string; setId: string | null}>; sets: ReadonlyMap<string, string>};
export type VariableName = {name: string; collection: string; code: string | null};
export type Naming = {status: 'resolved'; lookup: (ref: VariableRef) => VariableName | null} | {status: 'unavailable'; figma: string | null} | {status: 'none-bound'};
export type LayerRow = {depth: number; id: string; type: string; name: string} & Record<Column, string | null>;
export type TokenRow = {label: string; source: 'style' | 'variable'; id: string; value: string | null; fields: string; uses: number; code: string | null};
export type InstanceRow = {id: string; component: string; variant: string | null; props: string | null};
export type DesignSpec = {layers: readonly LayerRow[]; tokens: readonly TokenRow[]; instances: readonly InstanceRow[]; imageFills: number};
function bad(): never {throw new AxiError({code: 'bad_response'}, 'Invalid design response', ['Check the Figma API response']);}
function record(raw: unknown): raw is Record<string, unknown> {return raw !== null && typeof raw === 'object' && !Array.isArray(raw);}
function object(raw: unknown): Record<string, unknown> {if (!record(raw)) bad(); return raw;}
function string(raw: unknown): string {if (typeof raw !== 'string') bad(); return sanitize(raw);}
function number(raw: unknown): number {if (typeof raw !== 'number' || !Number.isFinite(raw)) bad(); return raw;}
function numeric(raw: Record<string, unknown>, key: string, fallback = 0): number {return raw[key] === undefined ? fallback : number(raw[key]);}
function boolean(raw: unknown, fallback: boolean): boolean {if (raw === undefined) return fallback; if (typeof raw !== 'boolean') bad(); return raw;}
function array(raw: unknown): unknown[] {if (!Array.isArray(raw)) bad(); return raw;}
function choice<const T extends readonly string[]>(raw: unknown, values: T, fallback: T[number]): T[number] {
  if (raw === undefined) return fallback;
  for (const value of values) if (raw === value) return value;
  return bad();
}
function styleId(raw: unknown): StyleId {const value = string(raw); if (!isStyleId(value)) bad(); return value;}
function isStyleId(value: string): value is StyleId {return value.length > 0;}
function isVariableId(value: string): value is VariableId {return value.length > 0;}
function isKey(value: string): value is VariableKey {return /^[0-9a-f]{40}$/.test(value);}
function isImageRef(value: string): value is ImageRef {return /^[0-9a-f]{40}$/.test(value);}
function isHex(value: string): value is Hex {return /^#[0-9A-F]{6}(?:[0-9A-F]{2})?$/.test(value);}
function variable(raw: unknown): VariableRef {
  const alias = object(raw);
  if (alias.type !== 'VARIABLE_ALIAS') bad();
  const id = string(alias.id);
  if (!isVariableId(id)) bad();
  const part = /^VariableID:([0-9a-f]{40})\//.exec(id)?.[1];
  return {id, key: part !== undefined && isKey(part) ? part : null};
}
function color(raw: unknown, opacity = 1): Hex {
  const c = object(raw);
  const channel = (key: string) => {const n = number(c[key]); if (n < 0 || n > 1) bad(); return n;};
  const r = channel('r'), g = channel('g'), b = channel('b'), a = c.a === undefined ? 1 : channel('a');
  const byte = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0').toUpperCase();
  const alpha = a * opacity;
  const result = '#' + byte(r) + byte(g) + byte(b) + (alpha < 1 ? byte(alpha) : '');
  if (!isHex(result)) bad();
  return result;
}
function quad(raw: unknown): Quad {const q = array(raw); if (q.length !== 4) bad(); return [number(q[0]), number(q[1]), number(q[2]), number(q[3])];}
function compact(q: Quad): string {
  const [t, r, b, l] = q;
  if (t === r && t === b && t === l) return String(t);
  if (t === b && r === l) return t + '/' + r;
  if (r === l) return t + '/' + r + '/' + b;
  return q.join('/');
}
function paintValue(p: Paint): string {
  switch (p.kind) {
    case 'solid': return 'solid ' + p.color;
    case 'gradient': return p.shape + ' ' + p.stops.join('>');
    case 'image': return 'image ' + p.ref.slice(0, 8) + ' ' + p.scaleMode;
    case 'other': return p.type;
    default: {const exhaustive: never = p; return exhaustive;}
  }
}
function effectValue(e: Shadow): string {
  switch (e.kind) {
    case 'drop': case 'inner': return e.kind + '(' + [e.x, e.y, e.blur, e.spread, e.color].join(' ') + ')';
    case 'blur': case 'bg-blur': return e.kind + '(' + e.radius + ')';
    case 'other': return e.type;
    default: {const exhaustive: never = e; return exhaustive;}
  }
}
export const parseStyleFacet: FacetParser<StyleFacet> = (raw, type) => {
  const bindings: Binding[] = [];
  const add = (alias: unknown, field: TokenField, value: string | null, target: string) => {
    const ref = variable(alias);
    if (!bindings.some(b => b.variable.id === ref.id && b.field === field && b.value === value && b.target === target))
      bindings.push({field, variable: ref, value, target});
  };
  const localBindings = (raw: unknown, field: TokenField, target: string, values: Record<string, string | null>) => {
    if (raw === undefined) return;
    for (const [key, alias] of Object.entries(object(raw))) if (key in values) add(alias, field, values[key] ?? null, target);
  };
  const paints = (raw: unknown, field: 'fill' | 'stroke'): Paint[] => {
    if (raw === undefined) return [];
    const result: Paint[] = [];
    for (const item of array(raw)) {
      const p = object(item);
      const visible = boolean(p.visible, true);
      const opacity = numeric(p, 'opacity', 1);
      if (opacity < 0 || opacity > 1) bad();
      const kind = string(p.type);
      let paint: Paint;
      switch (kind) {
        case 'SOLID': paint = {kind: 'solid', color: color(p.color, opacity)}; break;
        case 'GRADIENT_LINEAR': case 'GRADIENT_RADIAL': case 'GRADIENT_ANGULAR': case 'GRADIENT_DIAMOND': {
          const shape = kind === 'GRADIENT_LINEAR' ? 'linear' : kind === 'GRADIENT_RADIAL' ? 'radial' : kind === 'GRADIENT_ANGULAR' ? 'angular' : 'diamond';
          paint = {kind: 'gradient', shape, stops: array(p.gradientStops).map(stop => color(object(stop).color, opacity))}; break;
        }
        case 'IMAGE': {
          const ref = string(p.gifRef === undefined ? p.imageRef : p.gifRef);
          if (!isImageRef(ref)) bad();
          const mode = choice(p.scaleMode, ['FILL', 'FIT', 'TILE', 'STRETCH'], 'FILL');
          paint = {kind: 'image', ref, scaleMode: mode === 'FILL' ? 'fill' : mode === 'FIT' ? 'fit' : mode === 'TILE' ? 'tile' : 'stretch'}; break;
        }
        default: paint = {kind: 'other', type: kind};
      }
      if (!visible) continue;
      const target = field + '.' + result.length;
      localBindings(p.boundVariables, field, target, {color: paint.kind === 'solid' ? paint.color : null});
      result.push(paint);
    }
    return result;
  };
  const fills = paints(raw.fills, 'fill');
  const strokePaints = paints(raw.strokes, 'stroke');
  const weights = raw.individualStrokeWeights === undefined ? null : object(raw.individualStrokeWeights);
  const weight: number | Quad = weights === null ? numeric(raw, 'strokeWeight') : [numeric(weights, 'top'), numeric(weights, 'right'), numeric(weights, 'bottom'), numeric(weights, 'left')];
  const align = choice(raw.strokeAlign, ['INSIDE', 'OUTSIDE', 'CENTER'], 'INSIDE');
  const strokes = strokePaints.length ? {paints: strokePaints, weight, align: align === 'INSIDE' ? 'inside' as const : align === 'OUTSIDE' ? 'outside' as const : 'center' as const} : null;
  const corner = raw.cornerRadius === undefined ? null : number(raw.cornerRadius);
  const radii = raw.rectangleCornerRadii === undefined ? null : quad(raw.rectangleCornerRadii);
  const radius = radii !== null && !radii.every(n => n === radii[0]) ? radii : corner ?? (radii === null ? null : radii[0]);
  const effects: Shadow[] = [];
  if (raw.effects !== undefined) for (const item of array(raw.effects)) {
    const e = object(item);
    const visible = boolean(e.visible, true);
    const kind = string(e.type);
    let effect: Shadow;
    const values: Record<string, string | null> = {};
    if (kind === 'DROP_SHADOW' || kind === 'INNER_SHADOW') {
      const offset = object(e.offset), x = number(offset.x), y = number(offset.y);
      const blur = number(e.radius), spread = numeric(e, 'spread'), hex = color(e.color);
      effect = {kind: kind === 'DROP_SHADOW' ? 'drop' : 'inner', x, y, blur, spread, color: hex};
      Object.assign(values, {color: hex, radius: String(blur), spread: String(spread), offsetX: String(x), offsetY: String(y)});
    } else if (kind === 'LAYER_BLUR' || kind === 'BACKGROUND_BLUR') {
      effect = {kind: kind === 'LAYER_BLUR' ? 'blur' : 'bg-blur', radius: number(e.radius)};
      values.radius = String(effect.radius);
    } else effect = {kind: 'other', type: kind};
    if (!visible) continue;
    localBindings(e.boundVariables, 'effect', 'effect.' + effects.length, values);
    effects.push(effect);
  }
  const opacity = numeric(raw, 'opacity', 1);
  if (opacity < 0 || opacity > 1) bad();
  const sizing = (value: unknown): Sizing | null => {
    if (value === undefined) return null;
    const v = choice(value, ['FIXED', 'HUG', 'FILL'], 'FIXED');
    return v === 'FIXED' ? 'fixed' : v === 'HUG' ? 'hug' : 'fill';
  };
  const h = sizing(raw.layoutSizingHorizontal), v = sizing(raw.layoutSizingVertical);
  const position = choice(raw.layoutPositioning, ['AUTO', 'ABSOLUTE'], 'AUTO');
  const mode = choice(raw.layoutMode, ['NONE', 'HORIZONTAL', 'VERTICAL', 'GRID'], 'NONE');
  const pad: Quad = [numeric(raw, 'paddingTop'), numeric(raw, 'paddingRight'), numeric(raw, 'paddingBottom'), numeric(raw, 'paddingLeft')];
  const gap = numeric(raw, 'itemSpacing');
  const main = choice(raw.primaryAxisAlignItems, ['MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN'], 'MIN');
  const cross = choice(raw.counterAxisAlignItems, ['MIN', 'CENTER', 'MAX', 'BASELINE', 'STRETCH'], 'MIN');
  const wrap = choice(raw.layoutWrap, ['NO_WRAP', 'WRAP'], 'NO_WRAP') === 'WRAP';
  const layout: AutoLayout | null = mode === 'NONE' ? null : {direction: mode === 'HORIZONTAL' ? 'row' : mode === 'VERTICAL' ? 'col' : 'grid', gap, pad, main: main === 'MIN' ? 'start' : main === 'MAX' ? 'end' : main === 'CENTER' ? 'center' : 'between', cross: cross === 'MIN' ? 'start' : cross === 'MAX' ? 'end' : cross === 'CENTER' ? 'center' : cross === 'BASELINE' ? 'baseline' : 'stretch', wrap};
  let size: StyleFacet['size'] = null;
  if (raw.absoluteBoundingBox !== undefined && raw.absoluteBoundingBox !== null) {const b = object(raw.absoluteBoundingBox); size = {w: number(b.width), h: number(b.height)};}
  let text: Typography | null = null;
  const style = raw.style === undefined ? null : object(raw.style);
  if (raw.styleOverrideTable !== undefined) object(raw.styleOverrideTable);
  if (type === 'TEXT' && style !== null) {
    const alignment = choice(style.textAlignHorizontal, ['LEFT', 'CENTER', 'RIGHT', 'JUSTIFIED'], 'LEFT');
    const textCase = choice(style.textCase, ['ORIGINAL', 'UPPER', 'LOWER', 'TITLE', 'SMALL_CAPS', 'SMALL_CAPS_FORCED'], 'ORIGINAL');
    const deco = choice(style.textDecoration, ['NONE', 'UNDERLINE', 'STRIKETHROUGH'], 'NONE');
    text = {family: string(style.fontFamily), weight: number(style.fontWeight), size: number(style.fontSize), lineHeightPx: style.lineHeightPx === undefined ? null : number(style.lineHeightPx), letterSpacing: numeric(style, 'letterSpacing'), align: alignment === 'LEFT' ? 'left' : alignment === 'CENTER' ? 'center' : alignment === 'RIGHT' ? 'right' : 'justified', textCase: textCase === 'UPPER' ? 'upper' : textCase === 'LOWER' ? 'lower' : textCase === 'TITLE' ? 'title' : null, decoration: deco === 'UNDERLINE' ? 'underline' : deco === 'STRIKETHROUGH' ? 'strike' : null, mixed: raw.styleOverrideTable !== undefined && Object.keys(object(raw.styleOverrideTable)).length > 0};
    localBindings(style.boundVariables, 'font', 'text', {fontFamily: text.family, fontSize: String(text.size), fontWeight: String(text.weight), letterSpacing: String(text.letterSpacing), lineHeight: text.lineHeightPx === null ? null : String(text.lineHeightPx), fontStyle: style.fontStyle === undefined ? null : string(style.fontStyle), paragraphSpacing: style.paragraphSpacing === undefined ? null : String(number(style.paragraphSpacing)), paragraphIndent: style.paragraphIndent === undefined ? null : String(number(style.paragraphIndent))});
  }
  const styles: StyleFacet['styles'] = {};
  if (raw.styles !== undefined) {
    const slots = object(raw.styles);
    for (const slot of ['fill', 'stroke', 'effect', 'text', 'grid'] as const) if (slots[slot] !== undefined) styles[slot] = styleId(slots[slot]);
  }
  const scalarValue = (key: string): string | null => {
    const value = raw[key] ?? style?.[key];
    if (value === undefined || value === null) return null;
    return typeof value === 'string' ? string(value) : String(number(value));
  };
  const bound = raw.boundVariables === undefined ? {} : object(raw.boundVariables);
  for (const key of Object.keys(bound)) {
    if (!isBoundField(key)) continue;
    const field = FIELD_OF[key], aliases = bound[key];
    if (field === null || aliases === undefined) continue;
    const target = key === 'itemSpacing' || key === 'counterAxisSpacing' ? 'layout.gap' : key.startsWith('padding') ? 'layout.pad' : COLUMN_OF[field];
    if (key === 'size' || key === 'individualStrokeWeights' || key === 'rectangleCornerRadii') {
      const entries = object(aliases);
      for (const [sub, alias] of Object.entries(entries)) {
        let value: string | null = null;
        if (key === 'size') value = size === null ? null : sub === 'x' ? String(size.w) : sub === 'y' ? String(size.h) : null;
        else if (key === 'individualStrokeWeights') value = weights === null || weights[sub] === undefined ? null : String(number(weights[sub]));
        else {
          const indexes: Record<string, number> = {RECTANGLE_TOP_LEFT_CORNER_RADIUS: 0, RECTANGLE_TOP_RIGHT_CORNER_RADIUS: 1, RECTANGLE_BOTTOM_RIGHT_CORNER_RADIUS: 2, RECTANGLE_BOTTOM_LEFT_CORNER_RADIUS: 3};
          const index = indexes[sub];
          value = radii === null || index === undefined ? corner === null ? null : String(corner) : String(radii[index]);
        }
        add(alias, field, value, target);
      }
    } else {
      const list = Array.isArray(aliases) ? aliases : [aliases];
      for (const alias of list) {
        const ref = variable(alias);
        // Aggregate arrays do not identify paint/effect indices; prefer precise nested bindings.
        if (bindings.some(b => b.field === field && b.variable.id === ref.id)) continue;
        let value: string | null;
        if (key === 'fills' || key === 'strokes' || key === 'textRangeFills') {
          const values = (key === 'strokes' ? strokePaints : fills).filter(p => p.kind === 'solid').map(p => p.color);
          value = values.length === 1 ? values[0] ?? null : null;
        } else if (key === 'effects') value = null;
        else if (key.endsWith('Radius')) value = radius === null ? null : typeof radius === 'number' ? String(radius) : String(radius[key === 'topLeftRadius' ? 0 : key === 'topRightRadius' ? 1 : key === 'bottomRightRadius' ? 2 : 3]);
        else value = scalarValue(key);
        add(alias, field, value, target);
      }
    }
  }
  let instance: StyleFacet['instance'] = null;
  const props: InstanceProp[] = [];
  if (raw.componentProperties !== undefined) for (const [name, item] of Object.entries(object(raw.componentProperties))) {
    const p = object(item);
    const kind = choice(p.type, ['BOOLEAN', 'INSTANCE_SWAP', 'TEXT', 'VARIANT'], 'TEXT');
    if (p.type === undefined) bad();
    const value = kind === 'BOOLEAN' ? boolean(p.value, false) : string(p.value);
    if (p.value === undefined) bad();
    props.push({name: sanitize(name), type: kind, value});
  }
  const cleanName = (name: string) => name.replace(/#[^#]+$/, '');
  const counts = new Map<string, number>();
  for (const p of props) counts.set(cleanName(p.name), (counts.get(cleanName(p.name)) ?? 0) + 1);
  if (type === 'INSTANCE') instance = {componentId: raw.componentId === undefined ? '' : string(raw.componentId), props: props.map(p => ({...p, name: counts.get(cleanName(p.name)) === 1 ? cleanName(p.name) : p.name}))};
  return {size, sizing: h === null && v === null ? null : {h, v}, absolute: position === 'ABSOLUTE', layout, fills, strokes, radius, effects, opacity, text, styles, bindings, instance};
};
function isBoundField(value: string): value is BoundField {return Object.hasOwn(FIELD_OF, value);}
export function parseCatalog(entry: NodesEntry['entry']): Catalog {
  const styles = new Map<StyleId, {key: string; name: string; type: StyleType}>();
  for (const [id, item] of Object.entries(entry.styles === undefined ? {} : object(entry.styles))) {
    const s = object(item);
    const type = choice(s.styleType, ['FILL', 'TEXT', 'EFFECT', 'GRID'], 'FILL');
    if (s.styleType === undefined) bad();
    styles.set(styleId(id), {key: string(s.key), name: string(s.name), type});
  }
  const components = new Map<string, {name: string; setId: string | null}>();
  for (const [id, item] of Object.entries(entry.components === undefined ? {} : object(entry.components))) {
    const c = object(item);
    components.set(sanitize(id), {name: string(c.name), setId: c.componentSetId === undefined ? null : string(c.componentSetId)});
  }
  const sets = new Map<string, string>();
  for (const [id, item] of Object.entries(entry.componentSets === undefined ? {} : object(entry.componentSets))) sets.set(sanitize(id), string(object(item).name));
  return {styles, components, sets};
}
export function boundVariables(walk: Walk<StyleFacet>): readonly VariableRef[] {
  const refs = new Map<VariableId, VariableRef>();
  for (const {node} of walk.visits) for (const b of node.facet.bindings) if (!refs.has(b.variable.id)) refs.set(b.variable.id, b.variable);
  return [...refs.values()];
}
export function parseVariableNames(raw: unknown): Extract<Naming, {status: 'resolved'}> {
  const response = object(raw);
  if (response.error !== false || response.status !== 200) bad();
  const meta = object(response.meta), variables = object(meta.variables), collections = object(meta.variableCollections);
  const collectionNames = new Map<string, string>();
  for (const [id, item] of Object.entries(collections)) collectionNames.set(sanitize(id), string(object(item).name));
  const byId = new Map<string, VariableName>();
  const byKey = new Map<VariableKey, VariableName>();
  const put = (map: Map<string, VariableName>, id: string, name: VariableName) => {
    const existing = map.get(id);
    if (existing !== undefined && (existing.name !== name.name || existing.collection !== name.collection || existing.code !== name.code)) bad();
    map.set(id, name);
  };
  for (const [mapId, item] of Object.entries(variables)) {
    const v = object(item);
    const wire: Pick<LocalVariable, 'id' | 'name' | 'key' | 'variableCollectionId'> = {id: string(v.id), name: string(v.name), key: string(v.key), variableCollectionId: string(v.variableCollectionId)};
    if (!isKey(wire.key)) bad();
    const syntax = v.codeSyntax === undefined ? {} : object(v.codeSyntax);
    const collection = collectionNames.get(wire.variableCollectionId);
    if (collection === undefined) bad();
    const name: VariableName = {name: wire.name, collection, code: syntax.WEB === undefined ? null : string(syntax.WEB)};
    put(byId, sanitize(mapId), name);
    put(byId, wire.id, name);
    const existing = byKey.get(wire.key);
    if (existing !== undefined && (existing.name !== name.name || existing.collection !== name.collection || existing.code !== name.code)) bad();
    byKey.set(wire.key, name);
  }
  return {status: 'resolved', lookup: ref => byId.get(ref.id) ?? (ref.key === null ? null : byKey.get(ref.key)) ?? null};
}
export function buildSpec(walk: Walk<StyleFacet>, catalog: Catalog, naming: Naming): DesignSpec {
  const refs = boundVariables(walk);
  const names = new Map<VariableId, VariableName>();
  switch (naming.status) {
    case 'resolved': for (const ref of refs) {const name = naming.lookup(ref); if (name !== null) names.set(ref.id, name);} break;
    case 'unavailable': case 'none-bound': break;
    default: {const exhaustive: never = naming; return exhaustive;}
  }
  const labels = new Map<VariableId, string>();
  for (const ref of refs) {
    const name = names.get(ref.id);
    if (name !== undefined) {
      const ambiguous = [...names.values()].some(other => other.name === name.name && other.collection !== name.collection);
      labels.set(ref.id, ambiguous ? name.collection + '/' + name.name : name.name);
    } else if (ref.key !== null) {
      let length = 8;
      while (length < 40 && refs.some(other => other.id !== ref.id && other.key !== null && other.key !== ref.key && other.key.slice(0, length) === ref.key?.slice(0, length))) length++;
      labels.set(ref.id, 'var.' + ref.key.slice(0, length));
    } else labels.set(ref.id, 'var.' + ref.id.replaceAll(':', '-'));
  }
  type TokenUse = {row: TokenRow; fields: Set<string>; nodes: Set<string>; values: Set<string>};
  const tokens = new Map<string, TokenUse>();
  const use = (source: 'style' | 'variable', id: string, label: string, value: string | null, field: string, node: string, code: string | null): string => {
    const key = source + ':' + id;
    let token = tokens.get(key);
    if (token === undefined) {
      token = {row: {label, source, id, value, fields: field, uses: 0, code}, fields: new Set(), nodes: new Set(), values: new Set()};
      tokens.set(key, token);
    }
    token.fields.add(field); token.nodes.add(node);
    if (value !== null) token.values.add(value);
    token.row.value = token.values.size ? [...token.values].join(' / ') : null;
    token.row.fields = [...token.fields].join('/'); token.row.uses = token.nodes.size;
    return '<' + label + '>';
  };
  const layers: LayerRow[] = [];
  const instances: InstanceRow[] = [];
  const imageRefs = new Set<ImageRef>();
  for (const {node, depth} of walk.visits) {
    const f = node.facet;
    const used = new Set<Binding>();
    const variableTokens = (target: string): string => {
      const parts: string[] = [];
      const ids = new Set<VariableId>();
      for (const b of f.bindings) if (b.target === target && !used.has(b)) {
        used.add(b);
        const label = labels.get(b.variable.id);
        if (label === undefined) continue;
        const token = use('variable', b.variable.id, label, b.value, b.field, node.id, names.get(b.variable.id)?.code ?? null);
        if (!ids.has(b.variable.id)) {parts.push(token); ids.add(b.variable.id);}
      }
      return parts.length ? ' ' + parts.join(' ') : '';
    };
    const styleToken = (slot: StyleSlot, value: string | null): string => {
      const id = f.styles[slot];
      if (id === undefined) return '';
      const style = catalog.styles.get(id);
      return ' ' + use('style', style?.key ?? id, style?.name ?? id, value, slot, node.id, null);
    };
    const finish = (column: Column, value: string | null): string | null => {
      const extra = variableTokens(column);
      return value === null ? extra.trim() || null : value + extra;
    };
    let size = f.size === null ? null : Math.round(f.size.w) + 'x' + Math.round(f.size.h);
    if (size !== null && f.sizing !== null) size += ' ' + (f.sizing.h ?? '?') + '/' + (f.sizing.v ?? '?');
    if (size !== null && f.absolute) size += ' abs';
    size = finish('size', size);
    let layout: string | null = null;
    if (f.layout !== null) {
      const l = f.layout;
      layout = l.direction + ' gap=' + l.gap + variableTokens('layout.gap') + ' pad=' + compact(l.pad) + variableTokens('layout.pad') + ' main=' + l.main + ' cross=' + l.cross + (l.wrap ? ' wrap' : '');
    }
    layout = finish('layout', layout);
    const formatPaints = (paints: readonly Paint[], slot: 'fill' | 'stroke'): string | null => {
      const base = paints.map(paintValue).join(' + ');
      const value = paints.length === 1 && paints[0]?.kind === 'solid' ? paints[0].color : base || null;
      const style = styleToken(slot, value);
      const parts = paints.map((p, index) => {
        if (p.kind === 'image') imageRefs.add(p.ref);
        return paintValue(p) + (index === 0 ? style : '') + variableTokens(slot + '.' + index);
      });
      return parts.length ? parts.join(' + ') : style.trim() || null;
    };
    const fill = finish('fill', formatPaints(f.fills, 'fill'));
    let stroke: string | null;
    if (f.strokes === null) stroke = formatPaints([], 'stroke');
    else stroke = (typeof f.strokes.weight === 'number' ? String(f.strokes.weight) : f.strokes.weight.join('/')) + ' ' + f.strokes.align + ' ' + formatPaints(f.strokes.paints, 'stroke');
    stroke = finish('stroke', stroke);
    const radius = finish('radius', f.radius === null ? null : typeof f.radius === 'number' ? String(f.radius) : f.radius.join('/'));
    const baseEffect = f.effects.map(effectValue).join(' + ');
    const effectStyle = styleToken('effect', baseEffect || null);
    let effect = f.effects.map((e, index) => effectValue(e) + (index === 0 ? effectStyle : '') + variableTokens('effect.' + index)).join(' + ') || effectStyle.trim() || null;
    if (f.opacity < 1) effect = (effect === null ? '' : effect + ' ') + 'opacity=' + f.opacity;
    effect = finish('effect', effect);
    let text: string | null = null;
    if (f.text !== null) {
      const t = f.text;
      const familyBindings = f.bindings.filter(b => b.field === 'font' && b.value === t.family);
      const familyTokens: string[] = [];
      for (const b of familyBindings) {
        used.add(b);
        const label = labels.get(b.variable.id);
        if (label !== undefined) familyTokens.push(use('variable', b.variable.id, label, b.value, b.field, node.id, names.get(b.variable.id)?.code ?? null));
      }
      const base = t.family + ' ' + t.weight + ' ' + t.size + '/' + (t.lineHeightPx ?? 'auto') + (t.letterSpacing ? ' ls=' + t.letterSpacing : '') + (t.align === 'left' ? '' : ' align=' + t.align) + (t.textCase === null ? '' : ' case=' + t.textCase) + (t.decoration === null ? '' : ' deco=' + t.decoration) + (t.mixed ? ' mixed' : '');
      text = t.family + (familyTokens.length ? ' ' + [...new Set(familyTokens)].join(' ') : '') + base.slice(t.family.length) + styleToken('text', base);
    } else text = styleToken('text', null).trim() || null;
    text = finish('text', text);
    layers.push({depth, id: urlForm(node.id), type: node.type, name: node.name, size, layout, fill, stroke, radius, effect, text});
    if (f.instance !== null) {
      const i = f.instance, c = catalog.components.get(i.componentId);
      const component = c?.setId === null || c?.setId === undefined ? c?.name ?? (i.componentId || node.name) : catalog.sets.get(c.setId) ?? c.name;
      const props = i.props.map(p => ({...p, value: p.type === 'INSTANCE_SWAP' && typeof p.value === 'string' ? catalog.components.get(p.value)?.name ?? p.value : p.value}));
      const join = (variant: boolean) => props.filter(p => (p.type === 'VARIANT') === variant).map(p => p.name + '=' + p.value).join(';') || null;
      instances.push({id: urlForm(node.id), component, variant: join(true), props: join(false)});
    }
  }
  return {layers, tokens: [...tokens.values()].map(t => t.row), instances, imageFills: imageRefs.size};
}
