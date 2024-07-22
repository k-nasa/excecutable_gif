// GIF header内の39を40に置換する

import { decode } from "./main.ts";

if (Deno.args.length < 1) {
  throw new Error("Please specify a filename");
}

const filename = Deno.args[0];

const gif_byte = await Deno.readFile(filename);
const res = decode(gif_byte);

const end_header = res.header.pos.end;

const ruby_program = `';puts "Hello, World!"
t = <<EOS
`;

const comment_body = new TextEncoder().encode(ruby_program);
const comment_block_buffer = new Uint8Array([
  0x21, // Extension Introducer
  0xfe, // Comment Label
  comment_body.length, // Comment Length
  ...comment_body,
  0, // Block Terminator
]);

const ruby_program2 = `EOS #`;
const comment_body2 = new TextEncoder().encode(ruby_program2);
const comment_block_buffer2 = new Uint8Array([
  0x21, // Extension Introducer
  0xfe, // Comment Label
  comment_body2.length, // Comment Length
  ...comment_body2,
  0, // Block Terminator
]);

const new_gif = [
  ...gif_byte.slice(0, end_header),
  ...comment_block_buffer,
  ...gif_byte.slice(end_header),
  ...comment_block_buffer2,
];

// Write new gif
await Deno.writeFile("inserted_comment.gif", new Uint8Array(new_gif));
