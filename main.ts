const GIF_MAGIC_NUMBER = "GIF89a";

const GIF_EXTENSION = 0x21;
const GIF_IMAGE = 0x2c;
const GIF_TRAILER = 0x3b;
const GIF_GRAPHIC_CONTROL_EXTENSION = 0xf9;
const GIF_COMMENT_EXTENSION = 0xfe;
const GIF_PLAIN_TEXT_EXTENSION = 0x01;
const GIF_APPLICATION_EXTENSION = 0xff;

type Gif = {
  magic_number: string;
  header: GifHeader;
  blocks?: GifBlock[];
};

type Position = {
  start: number;
  end: number;
};

type GifHeader = {
  width: number;
  height: number;
  globalColorTable: Color[] | null;

  flags: {
    global_color_table_flag: number;
    color_resolution: number;
    sort_flag: number;
    size_of_global_color_table: number;
  };
  background_color_index: number;
  pixel_aspect_ratio: number;

  pos: Position;
};

type GifBlock = null | ExtensionBlock | ImageBlock;

type ExtensionBlock =
  | CommentExtension
  | GraphicControlExtension
  | PlainTextExtension
  | ApplicationExtension;
type CommentExtension = {
  comment_blocks: number[];

  pos: Position;
};
type GraphicControlExtension = {
  pos: Position;
};
type PlainTextExtension = {
  pos: Position;
};
type ApplicationExtension = {
  pos: Position;
  block_size: number;
  app_identifier: string;
  app_auth_code: string;
  application_data_size: number;
  application_data: number[];
};

type ImageBlock = {
  pos: Position;
  left: number;
  top: number;
  width: number;
  height: number;

  flags: {
    local_color_table_flag: number;
    interlace_flag: number;
    sort_flag: number;
    size_of_local_color_table: number;
  };

  lzw_min_code_size: number;
  image_data: number[];
};

export class GifDecoder {
  buffer: Uint8Array;
  pos: number;

  constructor(buffer: Uint8Array) {
    this.buffer = buffer;
    this.pos = 0;
  }

  readByte() {
    return this.buffer[this.pos++];
  }

  readBytes(n: number) {
    const ret: number[] = [];
    for (let i = 0; i < n; i++) {
      ret.push(this.buffer[this.pos++]);
    }
    return ret;
  }

  readString(n: number) {
    return new TextDecoder().decode(Uint8Array.from(this.readBytes(n)));
  }

  // リトルエンディアンで読み込む
  readBytesLe(n: number) {
    const ret: number[] = [];
    for (let i = 0; i < n; i++) {
      ret.push(this.buffer[this.pos++]);
    }
    return ret.reverse();
  }

  readInt16(): number {
    const byte = this.readBytes(2);
    return this.byteToInt(byte);
  }

  readInt16Le(): number {
    const byte = this.readBytesLe(2);
    return this.byteToInt(byte);
  }

  byteToInt(byte: number[]): number {
    return byte.reverse().reduce((acc, cur, i) => (acc += cur << (8 * i)));
  }
}

export const main = async () => {
  const gif_byte = await Deno.readFile("nasa.gif");

  const gif = decode(gif_byte);

  console.log(gif);
};

type Color = {
  r: number;
  g: number;
  b: number;
};

export const decode = (gif_byte: Uint8Array): Gif => {
  const decoder = new GifDecoder(gif_byte);
  const magic_number = decoder.readString(6);

  if (magic_number !== GIF_MAGIC_NUMBER) {
    console.error("This is not a gif file");
    Deno.exit(1);
  }

  const header = decodeHeader(decoder);

  const blocks = [];
  while (true) {
    const block = decodeBlock(decoder);

    if (block === undefined) {
      break;
    }

    blocks.push(block);
  }

  return {
    magic_number,
    header,
    blocks,
  };
};

const decodeHeader = (decoder: GifDecoder): GifHeader => {
  const start_pos = decoder.pos;

  const width = decoder.readInt16Le();
  const height = decoder.readInt16Le();

  const flags = decoder.readBytes(1)[0];

  // グローバルカラーテーブルの有無
  const global_color_table_flag = flags & (0b10000000 >> 7);
  // この値に1を足した数が、画像1ドットを表わすのに必要なビット数となる
  const color_resolution = (flags & 0b01110000) >> 4;
  // Global Color Tableがソートされている場合は1、ソートされていない場合は0。
  const sort_flag = (flags & 0b00001000) >> 3;

  // この値(0～7)に1を足した値をnとして、2のn乗がGlobal Color Tableの個数となる。
  const size_of_global_color_table = flags & 0b00000111;

  const background_color_index = decoder.readByte();
  const pixel_aspect_ratio = decoder.readByte();

  const globalColorTable = [];

  if (global_color_table_flag) {
    const tableSize = Math.pow(2, size_of_global_color_table + 1);

    for (let i = 0; i < tableSize; i++) {
      const r = decoder.readByte();
      const g = decoder.readByte();
      const b = decoder.readByte();

      globalColorTable.push({ r: r, g: g, b: b });
    }
  }

  return {
    pos: {
      start: start_pos,
      end: decoder.pos,
    },

    width,
    height,
    globalColorTable,
    flags: {
      global_color_table_flag,
      color_resolution,
      sort_flag,
      size_of_global_color_table,
    },

    background_color_index,
    pixel_aspect_ratio,
  };
};

const decodeBlock = (decoder: GifDecoder) => {
  const block_type = decoder.readByte();

  switch (block_type) {
    case GIF_EXTENSION:
      return decodeExtension(decoder);
    case GIF_IMAGE:
      return decodeImage(decoder);
    case GIF_TRAILER:
      return;
    default:
      throw new Error(`Unknown block type. ${block_type.toString(16)}`);
  }
};

const decodeExtension = (decoder: GifDecoder): ExtensionBlock => {
  const extension_type = decoder.readByte();

  switch (extension_type) {
    case GIF_GRAPHIC_CONTROL_EXTENSION:
      console.warn("Found graphic control extension. Skipping block");
      return { pos: skipBlock(decoder) };
    case GIF_COMMENT_EXTENSION:
      return decodeComment(decoder);
    case GIF_PLAIN_TEXT_EXTENSION:
      throw new Error("Not implemented");
    case GIF_APPLICATION_EXTENSION:
      return decodeApplicationExtension(decoder);
    default:
      throw new Error(`Unknown extension type. ${extension_type.toString(16)}`);
  }
};

const decodeApplicationExtension = (
  decoder: GifDecoder
): ApplicationExtension => {
  console.info("Found application extension. Skipping block");

  const start_pos = decoder.pos;

  const block_size = decoder.readByte();
  const app_identifier = decoder.readString(8);
  const app_auth_code = decoder.readString(3);

  const application_data_size = decoder.readByte();

  const res = {
    block_size,
    app_identifier,
    app_auth_code,
    application_data_size,
    application_data: [],
    pos: {
      start: start_pos,
      end: decoder.pos,
    },
  };

  if (application_data_size === 0) {
    // application_data_sizeはterminatorの場合もある
    // 0の場合はterminatorがあるので、そのまま終了
    return res;
  }

  console.log(`Application data size: ${application_data_size}`);

  const application_data = decoder.readBytes(application_data_size);

  const terminator = decoder.readByte();
  if (terminator !== 0x00) {
    console.error(`Invalid terminator. ${terminator.toString(16)}`);
    Deno.exit(1);
  }

  return {
    ...res,
    application_data,
    pos: {
      start: start_pos,
      end: decoder.pos,
    },
  };
};

// ブロックの終わりまで読み飛ばす
const skipBlock = (decoder: GifDecoder): Position => {
  const start_pos = decoder.pos;
  const block_size = decoder.readByte();

  console.info(`Skipping block size: ${block_size}`);

  decoder.readBytes(block_size);

  // ブロックの終わりを示す0x00を読み飛ばす
  decoder.readByte();

  return {
    start: start_pos,
    end: decoder.pos,
  };
};

const decodeImage = (decoder: GifDecoder): ImageBlock => {
  console.info("Found image block");

  const start_pos = decoder.pos;

  const left = decoder.readInt16Le();
  const top = decoder.readInt16Le();

  const width = decoder.readInt16Le();
  const height = decoder.readInt16Le();

  const flags = decoder.readByte();

  // Local Color Tableの有無
  const local_color_table_flag = flags & (0b10000000 >> 7);
  // Local Color Tableのインターレースフラグ
  const interlace_flag = flags & (0b01000000 >> 6);
  // Local Color Tableのソートフラグ
  const sort_flag = flags & (0b00100000 >> 5);
  // Local Color Tableのビット数
  const size_of_local_color_table = flags & 0b00000111;

  const localColorTable = [];

  if (local_color_table_flag === 1) {
    const tableSize = Math.pow(2, size_of_local_color_table + 1);

    for (let i = 0; i < tableSize; i++) {
      const r = decoder.readByte();
      const g = decoder.readByte();
      const b = decoder.readByte();

      localColorTable.push({ r: r, g: g, b: b });
    }
  }

  const lzw_min_code_size = decoder.readByte();

  const image_data = [];
  while (true) {
    const block_size = decoder.readByte();
    if (block_size === 0) {
      return {
        width,
        height,
        left,
        top,

        flags: {
          local_color_table_flag,
          interlace_flag,
          sort_flag,
          size_of_local_color_table,
        },

        lzw_min_code_size,
        image_data: image_data.flat(),

        pos: {
          start: start_pos,
          end: decoder.pos,
        },
      };
    }

    image_data.push(decoder.readBytes(block_size));
  }
};

const decodeComment = (decoder: GifDecoder): CommentExtension => {
  console.info("Found comment extension");

  const start_pos = decoder.pos;
  const comment_blocks = [];

  while (true) {
    const block_size = decoder.readByte();
    if (block_size === 0) {
      return {
        comment_blocks: comment_blocks.flat(),
        pos: {
          start: start_pos,
          end: decoder.pos,
        },
      };
    }

    comment_blocks.push(decoder.readBytes(block_size));
  }
};

if (import.meta.main) {
  main();
}
