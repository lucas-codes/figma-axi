#!/bin/sh

if [ -z "${FIGMA_TOKEN:-}" ]; then
  printf '%s\n' 'FIGMA_TOKEN is required' >&2
  exit 2
fi
if [ "$#" -ne 2 ]; then
  printf '%s\n' 'Usage: scripts/smoke.sh <file-url> <node-url>' >&2
  exit 2
fi

# Keep rendered files outside the checkout and remove them on exit.
work=$(mktemp -d /tmp/figma-smoke.XXXXXX) || exit 1
trap 'rm -rf "$work"' 0
trap 'exit 1' HUP INT TERM
failed=0

step() {
  name=$1
  shift
  output=$(node bin/figma-axi "$@" 2>&1)
  code=$?
  printf '%s: exit %s\n' "$name" "$code"
  printf '%s\n' "$output" | head -n 5
  if [ "$code" -ne 0 ]; then failed=1; fi
}

step home
if ! printf '%s\n' "$output" | grep -q '^auth: ok'; then failed=1; fi
step outline outline "$1"
step inspect "$2"
step spec spec "$2" --json
if [ "$code" -eq 0 ]; then
  nodes=$(printf '%s\n' "$output" | node --input-type=module -e '
    import {readFileSync} from "node:fs";
    const {node, layers} = JSON.parse(readFileSync(0, "utf8"));
    const child = layers.find(layer => layer.depth === 1);
    if (!child) throw new Error("Smoke node needs a visible child for batch render");
    process.stdout.write(node + "," + child.id);
  ' 2>&1)
  if [ "$?" -eq 0 ]; then
    step render render "$2" --node "$nodes" --json --out "$work"
    if [ "$code" -eq 0 ]; then
      signature=$(printf '%s\n' "$output" | node --input-type=module -e '
        import {readFileSync} from "node:fs";
        const {images} = JSON.parse(readFileSync(0, "utf8"));
        const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
        process.stdout.write(images.length === 2 && images.every(image =>
          readFileSync(image.path).subarray(0, 8).equals(png)) ? "ok" : "invalid");
      ' 2>&1)
      if [ "$signature" != ok ]; then
        printf '%s\n' 'render: batch PNG signature check failed'
        failed=1
      fi
    fi
  else
    printf '%s\n' 'render: could not derive two node ids from spec'
    failed=1
  fi
fi
step assets assets "$2" --json --out "$work"
if [ "$code" -eq 0 ]; then
  integrity=$(printf '%s\n' "$output" | node --input-type=module -e '
    import {readFileSync} from "node:fs";
    import {createHash} from "node:crypto";
    const {images} = JSON.parse(readFileSync(0, "utf8"));
    process.stdout.write(images.length > 0 && images.every(image =>
      image.status !== "missing" && createHash("sha1").update(readFileSync(image.path)).digest("hex") === image.imageRef) ? "ok" : "invalid");
  ' 2>&1)
  if [ "$integrity" != ok ]; then
    printf '%s\n' 'assets: missing rows or SHA-1 check failed'
    failed=1
  fi
fi
step comments comments "$1"
step comments-resolved comments "$1" --resolved
exit "$failed"
