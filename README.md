
## HOW TO USE

### 画像データ読み込み

```sh
make decode

{
  magic_number: "GIF89a",
  header: {
    pos: { start: 6, end: 781 },
    width: 2365,
    height: 2343,
    globalColorTable: [
      ... more items
    ],
    flags: {
      global_color_table_flag: 1,
      color_resolution: 7,
      sort_flag: 0,
      size_of_global_color_table: 7
    },
    background_color_index: 0,
    pixel_aspect_ratio: 0
  },
  blocks: [
    { block_name: "GraphicControl", pos: { start: 781, end: 789 } },
    {
      block_size: 11,
      app_identifier: "MGK8BIM0",
      app_auth_code: "000",
      application_data_size: 40,
      application_data: [
         56, 66,  73,  77,   4,   4,   0,   0,   0,   0,
          0,  0,  56,  66,  73,  77,   4,  37,   0,   0,
          0,  0,   0,  16, 212,  29, 140, 217, 143,   0,
        178,  4, 233, 128,   9, 152, 236, 248,  66, 126
      ],
      pos: { start: 789, end: 845 },
      block_name: "Application"
    },
    {
      block_name: "Image",
      width: 2365,
      height: 2343,
      left: 0,
      top: 0,
      flags: {
        local_color_table_flag: 0,
        interlace_flag: 0,
        sort_flag: 0,
        size_of_local_color_table: 0
      },
      lzw_min_code_size: 8,
      image_data: [
          0,  91,   8,  28,  72, 176, 160, 193,  25,   8,  19,  42,
         92, 200, 176, 161, 195, 135,  16,  35, 210, 152,  72, 113,
         98, 196, 139,  23,  43, 106, 220, 200, 177, 163, 199, 143,
         32, 107, 136,  28,  41,  82, 135, 201, 147,  40,  83, 170,
         52,  73, 146, 228,  74, 150,  34,  53, 214, 120,  73, 179,
        229,  72, 154,  56, 115, 234, 220, 105,  50, 136, 207, 159,
         64, 131,  10,  29,  74, 180, 232,  79,  33,  72, 147,  10,
         25, 194, 148, 169,  82, 164,  69, 162,  74, 157,  74, 181,
        170, 213, 170,  70,
        ... 769619 more items
      ],
      pos: { start: 845, end: 773595 }
    }
  ]
}
Header: 6 - 781
GraphicControl Block: 781 - 789
Application Block: 789 - 845
Image Block: 845 - 773595
```

### 画像作成

```
make run # => output exceturable.gif
```
