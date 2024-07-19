import { assertEquals } from "jsr:@std/assert";
import { decode } from "./main.ts";

const gif_byte = await Deno.readFile("nasa.gif");

Deno.test(function gif_magic_number() {
  const { magic_number } = decode(gif_byte);

  assertEquals(magic_number, "GIF89a");
});

Deno.test(function gif_header() {
  const {
    header: { width, height, flags },
  } = decode(gif_byte);

  assertEquals(width, 2365);
  assertEquals(height, 2400);

  assertEquals(flags.global_color_table_flag, 1);
  assertEquals(flags.color_resolution, 7);
  assertEquals(flags.sort_flag, 0);

  assertEquals(flags.size_of_global_color_table, 7);
});
