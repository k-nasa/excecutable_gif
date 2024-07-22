// GIF header内の39を40に置換する

import { decode } from "./main.ts";

if (Deno.args.length < 1) {
  throw new Error("Please specify a filename");
}

const filename = Deno.args[0];

const gif_byte = await Deno.readFile(filename);
const res = decode(gif_byte);

const new_gif = [...gif_byte];

// width, headerは意図して39を含めているのでreplace範囲から除外する
const start = res.header.pos.start + 4;
const end = res.header.pos.end;

for (let i = start; i < end; i++) {
  if (new_gif[i] === "'".charCodeAt(0)) {
    console.log(`39 found in header. Position: ${i}`);
    new_gif[i] = 40;
  }

  if (new_gif[i] === "\n".charCodeAt(0)) {
    new_gif[i] = "\n".charCodeAt(0) + 1;
  }
}

const new_header = new_gif.slice(res.header.pos.start, res.header.pos.end);
for (let i = 0; i < new_header.length; i++) {
  if (new_header[i] === 39) {
    console.log(`39 found in new header. Position: ${i}`);
  }
}

// Write new gif
await Deno.writeFile("replace_single.gif", new Uint8Array(new_gif));
