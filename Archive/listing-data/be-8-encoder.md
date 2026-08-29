# 8 Bit Item to Binary Encoder V2.0

![cover](assets/media/area_render_127_.png)

Version: Bedrock
Tags: Storage, Encoded

Encodes an item into a set 8 bit code

## Features
- Size = 29 x 9 x 8 (Volume 2088)
- Bit groups [ 2, 3, 3 ]
- FHL (no global)
- Safety features, if any of these trigger the input locks itself
  - Dry fire protection and warning
  - Cart not returned
  - Chests not reset
  - Cart blocker items not returned
  - Box not broken
- Entityless when not running
- Auto and manual code clear (auto clears at the start of the next box to be encoded)
- “Ready to encode” signal / light
- Clean UI

## Notes
When loading the structure the sorter will break in many places. Please ensure it's chunk aligned and fixed according to the world download.

## Gallery
![](assets/media/area_render_127_.png)

## Downloads
- [8bit Item to Binary V2.mcstructure](assets/downloads/structure/8bit Item to Binary V2.mcstructure)

