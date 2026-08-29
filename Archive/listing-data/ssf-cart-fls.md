# SSF Cart FLS V1.0

![cover](assets/media/area_render_112.png)

Version: Java
Tags: SSF, Storage, Cart

Sorts carts based on signal strength equivalent fill level.

## Credits
- Porky Minch: Suggesting a Binary Search approach to checking to improve speed

## Features
- Size: 11 x 10 x 21 (2,310)
- No redstone
- Output is not in sequence, due to a combination of keeping it compact and minor directional components some of the outputs are miss ordered eg 1, 3, 2, 4, 5, 7, 6…. These can be rerouted but requires more space.

## Downsides
- **CAN NOT BE ROTATED AT ALL** Check sign in schematic by the input for direction indicator
- Gold heavy
- Can only handle carts in 118gt or more internals, please note this is due to some extremely specific edge cases so if it's not super critical it's perfect or it won't be used for long periods of time it can run at 98gt just note it won't be fully reliable

## Notes
Testing: 30 sorters running in parallel with random inputs of carts 0 - 15 fill level exactly spaced 118gt apart with an external source to verify outputs 1,000,000 carts tested in total with no faults, (ran for 3 - 4 hours straight). Hopper carts must be locked before entering the system.

## Gallery
![](assets/media/area_render_112.png)
![](assets/media/area_render_111_.png)

## Downloads
- [SSF Cart Fill Level Sorter 0 - 15.litematic](assets/downloads/litematic/SSF Cart Fill Level Sorter 0 - 15.litematic)