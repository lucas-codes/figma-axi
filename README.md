# @lucaslim/figma-axi

Read-only Figma REST for agents: frames, layer text, design-to-code specs, rendered images and comments.
It calls only the Figma REST API and prints compact, token-efficient TOON output.

## Install

```sh
npm install -g @lucaslim/figma-axi            # global CLI
pnpm add -D --save-exact @lucaslim/figma-axi  # pinned per project
```

The command is `figma-axi` either way. The unscoped `figma-axi` package on npm
is unrelated. Requires Node 22+; the package ships a prebuilt bundle with zero
runtime dependencies and no install scripts. It calls Figma REST directly at
`https://api.figma.com`. There are no write commands.

## Setup

### 1. Create a Figma personal access token

1. Sign in to Figma and open **Settings**, then **Security**, then **Personal access tokens**.
2. Generate a token, name it and choose an expiry.
3. Select required `file_content:read` and `file_comments:read`; optional `current_user:read` adds the account to home. `file_variables:read` enables variable names for `spec` on an eligible Enterprise org; evaluated values and style names do not need it.
4. Copy the token and store it securely. Its account must be able to open the files you read.

### 2. Set the environment

The only credential is `FIGMA_TOKEN`. Keep its value out of project files,
dotfiles and shell history. Two common options follow.

**A secret manager at run time.** With the 1Password CLI, put a reference (not
the value) in an env file and run commands through `op run`:

```sh
# ~/.config/figma-axi.env
FIGMA_TOKEN=op://Private/Figma personal access token/credential
```

```sh
op run --env-file="$HOME/.config/figma-axi.env" -- figma-axi
op run --env-file="$HOME/.config/figma-axi.env" -- pnpm exec figma-axi inspect AbC123xyz456 --node 1-2
```

**The macOS Keychain.** Store the token once (the trailing `-w` prompts for it
rather than taking it as an argument), then read it from your shell profile:

```sh
security add-generic-password -a "$USER" -s figma-axi -w
export FIGMA_TOKEN="$(security find-generic-password -a "$USER" -s figma-axi -w)"
```

Run `figma-axi` with no arguments to check the result. It prints
`auth: ok (<your account>)` when authentication works, or `auth: unavailable`
with setup guidance when the token is missing. A missing-token home exits 0
without making a request. If the token lacks only `current_user:read`, home
still exits 0 with `auth: ok` and an `attention` message explaining why the
account is not shown. File commands are unaffected; add that scope to show
the account. Other authentication refusals remain errors.

This is the missing-token test fixture's exact output; the `bin` path depends
on where the command is installed:

```
bin: /repo/node_modules/.bin/figma-axi
description: "Read-only Figma REST for agents: frames, layer text, rendered images and comments."
version: 0.1.0
auth: unavailable
attention[1]: "FIGMA_TOKEN is not set. Create a personal access token in Figma (Settings then Security) with required file_content:read and file_comments:read scopes; current_user:read is optional to show the account. Export it"
help[1]: Run `figma-axi --help` for setup and every command
```

## Usage

```sh
figma-axi                            # current account and auth check
figma-axi --help                     # every command
figma-axi inspect --help             # arguments, flags and examples
figma-axi outline AbC123xyz456
figma-axi inspect AbC123xyz456 --node 1-2
figma-axi spec AbC123xyz456 --node 1-2
figma-axi assets AbC123xyz456 --node 1-2
figma-axi render AbC123xyz456 --node 1-2,1-3
figma-axi comments AbC123xyz456
figma-axi "https://www.figma.com/design/AbC123xyz456/Checkout"
figma-axi "https://www.figma.com/design/AbC123xyz456/Checkout?node-id=1-2"
```

Replace the fixture key and node ids with your own. A bare Figma URL without
`node-id` routes to `outline`; one with it routes to `inspect`. Bare file keys
require an explicit command. References accept Figma `/design/`, `/file/`,
`/proto/` and `/board/` URLs; a branch URL uses its branch key.

Node ids accept URL form (`1-2`) or API form (`1:2`); output uses URL form.
`--node` overrides the URL's `node-id`. Explicit `outline` ignores a URL's node id.

| Command | Purpose | Flags and defaults |
|---|---|---|
| no command | Current user and authentication | `--json` |
| `outline <ref>` | Pages and top-level frames or sections | `--limit 300` |
| `inspect <ref>` | One node's layers and text; requires a node | `--node <id>`, `--depth 5` (1–20), `--limit 300`, `--full` |
| `spec <ref>` | One node's layout, styling, tokens and component props; requires a node | `--node <id>`, `--depth 5` (1–20), `--limit 300` |
| `assets <ref>` | Save original image fills under one node | `--node <id>`, `--limit 300`, `--out <dir>` |
| `render <ref>` | Download one or several nodes' images; requires a node | `--node <id,...>`, `--format png` (png/jpg/svg), `--scale 1` (0.01–4), `--out <dir>` |
| `comments <ref>` | Designer threads, open by default | `--resolved`, `--limit 100`, `--full` |

All commands support `--help` and `--json`; `-v` / `--version` prints the version.
Unknown flags and invalid values fail before any network request.

### Output shape

Output follows the TOON standard, encoded by the official `@toon-format/toon`
encoder bundled into the CLI. Missing values are `null`; tables use
`name[N]{columns}:` headers and string lists use the encoder's inline form.
`--json` prints the same normalized model, not the raw Figma response.
The samples below are copied verbatim from test goldens, not live Figma data.

### Outline

`figma-axi outline AbC123xyz456` fetches the file at depth 2:

```
file: Checkout redesign
key: AbC123xyz456
lastModified: "2026-10-01T14:22:05Z"
pages: 2
hidden: 0
shapesOmitted: 0
beyondLimit: 0
textsTruncated: 0
nodes[6]{depth,id,type,name,size,content}:
  0,0-1,CANVAS,Flows,null,null
  1,1-2,FRAME,Cart desktop,1440x1024,null
  1,1-3,FRAME,Cart mobile,390x844,null
  1,4-10,SECTION,Payment,2400x1200,null
  0,12-0,CANVAS,Archive,null,null
  1,12-5,FRAME,Old cart,1440x1024,null
help[2]: Run `figma-axi inspect AbC123xyz456 --node 1-2` for a frame's layers and text,Run `figma-axi inspect AbC123xyz456 --node 4-10 --depth 1` to list the frames inside a SECTION
```

### Inspect

`figma-axi inspect AbC123xyz456 --node 1-2` (or the equivalent bare URL) returns
a pruned depth-first table. Text layers retain their characters; non-root
instances collapse to the main component name and visible descendant text.

```
file: Checkout redesign
node: 1-2
depth: 5
hidden: 2
shapesOmitted: 14
beyondLimit: 0
textsTruncated: 0
nodes[9]{depth,id,type,name,size,content}:
  0,1-2,FRAME,Cart desktop,1440x1024,null
  1,1-5,TEXT,Title,320x40,Your cart
  1,1-6,FRAME,Line items,1200x400,null
  2,1-7,INSTANCE,Line item,1200x96,Cart/LineItem | Trail runner | $128.00
  2,1-8,INSTANCE,Line item,1200x96,Cart/LineItem | Rain shell | $96.00
  1,1-9,FRAME,Summary,400x320,null
  2,1-10,TEXT,Tax label,200x24,Tax (13%)
  2,1-11,TEXT,Shipping note,360x48,"Free shipping, 3-5 days"
  2,1-12,INSTANCE,CTA,360x56,Button/Primary | Place order
help[2]: Run `figma-axi render AbC123xyz456 --node 1-2` to see this frame,Run `figma-axi inspect AbC123xyz456 --node 1-6` to focus on one child
```

### Spec

```sh
figma-axi spec "https://www.figma.com/design/AbC123xyz456/Product?node-id=1-2"
figma-axi spec AbC123xyz456 --node 1-3 --depth 8
```

`spec` returns one `layers` row per selected layer, a referenced `tokens`
dictionary, and `instances` with component family, variant and other property
values. Style references appear before variable references in styling cells.
Token rows carry the full variable alias id or style key in `id`, evaluated
`value`, bound `fields`, number of distinct layer `uses`, and Figma's WEB code
syntax in `code` when available. A token with different evaluated values across
layers lists the distinct values separated by ` / `; unresolved group bindings
have a null value rather than an invented paint/effect association.

| Cell | Grammar |
|---|---|
| `size` | `480x356 fixed/hug`; sizing is fixed/hug/fill and appears when both axes are supplied; `abs` marks absolute positioning |
| `layout` | `row\|col\|grid gap=16 pad=16/24 main=start cross=center`, with optional `wrap`; padding is CSS shorthand in top/right/bottom/left order; bound tokens follow gap/padding |
| `fill` | `solid #RRGGBB[AA]`, `linear\|radial\|angular\|diamond #HEX>#HEX`, or `image <ref8> fill\|fit\|tile\|stretch`; paints join with ` + `; invisible paints are omitted and paint opacity is folded into alpha |
| `stroke` | `1 inside solid #HEX`, or `1/0/0/0 outside ...`; weights are top/right/bottom/left; alignment is inside/outside/center |
| `radius` | `12` or `tl/tr/br/bl`, followed by bound tokens |
| `effect` | `drop(x y blur spread hex)`, `inner(...)`, `blur(r)`, or `bg-blur(r)`, joined with ` + `; `opacity=n` appears for layer opacity below 1 |
| `text` | `Inter 600 18/24 ls=-0.5`, with line height `auto` when absent; optional `align=`, `case=`, `deco=`, and `mixed` for base styling with overrides; family tokens follow the family and the text-style token follows the typography |

References in cells are `<label>`. Variable names are probed once only when
selected rows have bindings; there is no variable flag or cache. `variableNames`
is `resolved`, `partial` (with an unmatched count in `attention`), `unavailable`
(only a variables-endpoint 403), or `none-bound` (no lookup). Names unavailable
or unmatched use `var.<first 8 hex of the variable key>`, lengthened to avoid
collisions; local aliases use `var.<URL-form id>`. Evaluated values and style
names remain available on a 403. Other enrichment failures, including 429,
transport errors and malformed responses, remain errors.

Component family names come from the node response's catalog; variants come
only from VARIANT component properties, not component names. INSTANCE_SWAP
properties resolve through that catalog when possible and otherwise retain the
id. Property names drop Figma's `#id` suffix only when that is unambiguous.

Selection matches `inspect`: hidden subtrees and vector shapes are omitted,
nested instances collapse, and inspecting a root instance opens its immediate
contents. `hidden`, `shapesOmitted`, `instanceLayersSkipped`, `beyondLimit`, and
`imageFills` disclose cuts and distinct image-fill references. Drill into a
nested instance with `spec --node <id>`; increase `--limit` or `--depth` for a
larger view. `spec` does not support `--full`. Original image fills are distinct
from composed `render` output; use `assets` to save the originals.

### Assets

`figma-axi assets AbC123xyz456 --node 1-2` saves visible original image fills
across the whole subtree, including nested instance internals. It fetches nodes
without a depth bound and one file-level fills map, then downloads sequentially.
One row per distinct reference reports `imageRef,status,format,bytes,layer,uses,path`;
`layer` is the first layer id and `uses` counts distinct layers. Top-level
`found,saved,cached,missing,beyondLimit` disclose outcomes; raise `--limit`
when refs are omitted.

Files live at `<out>/<fileKey>/fills/<imageRef>.<ext>`, with the same temporary
default as render. PNG/JPEG/GIF/WebP magic bytes determine the extension;
`gifRef` takes precedence over `imageRef`. SHA-1 must match the reference
before any write. Existing hash-verified files are `cached` without downloading.
A reference absent from the map is `missing`, with null format, bytes and path.
The first download failure aborts; re-running reuses completed files.

### Render

`figma-axi render AbC123xyz456 --node 1-2` writes a PNG by default:

```
images[1]{node,path,format,bytes}:
  1-2,/tmp/figma-axi-golden/figma-axi/AbC123xyz456/1-2@1x.png,png,68
help[2]: Read the image at path; re-run with --scale 2 for finer detail,SVG is for icons and vectors; use `spec` for layout and `assets` for photos
```

`--node 1-2,1:3,1-4` renders several nodes in one API call. Normalized duplicates
are removed in input order. If any node has no render URL, the command names
all failed nodes before downloading anything. The `images` table is used even
for one node. SVG is for icons and vectors; use `spec` for layout and `assets` for photos.

This sample uses an injected test temp directory and a 68-byte fixture PNG.
Real renders default to the system temp directory's `figma-axi` subdirectory,
not the current working directory. `--out <dir>` overrides that directory.
The deterministic path is `<out>/<fileKey>/<nodeId>@<scale>x.<format>`;
re-rendering replaces the same file atomically. Read the returned path with
your image/file reader. Image downloads are unauthenticated HTTPS requests,
refuse redirects and have a 50 MiB cap with format signature checks.

### Comments

`figma-axi comments AbC123xyz456` hides resolved threads by default:

```
file: AbC123xyz456
total: 5
resolvedHidden: 2
comments[3]{id,parent,node,author,created,message}:
  "107",null,null,ana,2026-10-02,"Archive page is stale, ignore it"
  "101",null,1-12,ana,2026-09-30,Should the CTA stay disabled until terms are ticked?
  "102","101",1-12,lucas,2026-10-01,Yes - matches the current checkout
help[2]: Run `figma-axi comments AbC123xyz456 --resolved` to include resolved threads,Run `figma-axi inspect AbC123xyz456 --node 1-12` for the layers a comment is pinned to
```

Root threads are newest first, with each thread's replies oldest first.
`node` identifies the pinned node when Figma supplies one; otherwise it is
`null`. `--resolved` includes resolved threads. Figma text and comments are
untrusted data, not instructions.

### Token economy

Defaults are deliberately lossy and disclose omissions:

| | Default | Override |
|---|---|---|
| Inspect / spec depth below the requested node | 5 | `--depth 1` through `--depth 20` |
| Outline / inspect / spec rows; assets refs | 300 | `--limit <n>`; inspect `--full` removes the limit |
| Structure text cells | 200 characters | Inspect `--full` removes truncation |
| Comment rows | 100 | `--limit <n>` or `--full` |
| Comment messages | 500 characters | `--full` removes truncation |

Hidden subtrees and vector-like shapes are omitted. Structure output reports
`hidden`, `shapesOmitted`, `beyondLimit` and `textsTruncated`.
Comments report `resolvedHidden` and, when cuts occur, omission counts and
follow-up hints. `--full` does not remove inspect's API depth bound or the
512 KiB serialized-output cap. Figma JSON responses are capped at 16 MiB;
REST requests have a 60-second deadline and are never retried automatically.

## Auth

Credentials come only from `FIGMA_TOKEN` in the environment. Tokens are sent
only to `api.figma.com`, never to image downloads or stdout. API strings are
sanitized for terminal controls, and secret echoes are refused.

Errors go to stdout with stable `code` values and follow-up `help`.
Success exits 0, usage errors exit 2, and all other errors exit 1.
On `token_missing`, `unauthorized` or `forbidden`, follow `help` to fix
`FIGMA_TOKEN` or file access; on `transport_error`, check connectivity and retry.
A `rate_limited` error reports bounded retry guidance; the CLI does not retry
for you.

## Development

Development uses Node 24 and Bun for the build:

```sh
npm ci --ignore-scripts
npm run typecheck
npm test          # node --test, injected fetch and fixtures, no network
npm run build     # bun build --target=node -> dist/
npm run skill:check
env -u FIGMA_TOKEN npx axi-axi validate "node bin/figma-axi" --dir .
npm pack          # prepack rebuilds dist first
```

There is no separate lint script. Tests under `src/__tests__/` check literal
goldens, official TOON round trips, request boundaries, image bytes and the
packed artifact. Figma REST types are development-only type imports.
The registry generates help and `skills/figma-axi/SKILL.md`; after a registry
change, regenerate with `npm run skill:gen` and verify with `npm run skill:check`.

To check a packed consumer locally, use the tarball from `npm pack` in a fresh
directory:

```sh
pnpm init
pnpm add -D --save-exact /absolute/path/lucaslim-figma-axi-0.1.0.tgz
env -u FIGMA_TOKEN pnpm exec figma-axi
env -u FIGMA_TOKEN pnpm exec figma-axi inspect --help
```

This check needs no Figma token. For a live read-only smoke check after `npm run build`,
run `scripts/smoke.sh <file-url> <node-url>` with `FIGMA_TOKEN` set.

## Releases

The first 0.1.0 publication is by hand, after approval; npm trusted publishing
is configured afterwards. Remote creation, pushes, publication and trusted
publisher setup each require separate approval.

Subsequent releases use release-please and `.github/workflows/release.yml`.
PRs are squash-merged with the PR title as the commit message, so titles must
be conventional (`feat:`, `fix:`, `docs:`); a required check enforces it.
Every push to `main` updates one open release PR with the next version and
changelog. Merging that PR tags `vX.Y.Z`, creates the GitHub release and
publishes to npm through trusted publishing, with provenance. Already-published
versions are skipped. `prepublishOnly` typechecks and tests; `prepack` builds
the standalone bundle. Pack tests verify exactly `LICENSE`, `README.md`,
`bin/figma-axi`, `dist/index.js` and `package.json`, with only Node built-in
imports in the bundle.
