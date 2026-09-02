# None
![cover](assets/media/area_render_25_.png)

Version: java
Tags: SSF, Storage, Cart Tech

An item sorter that sorts items into predefined categories for SSF

## Features
- Easy access to item categories for future modifications
- Stacked cart compatible
- Minimal hopper/cart pre-filling
- Decently fast ¹
- Expandable ²

## Downsides
- Gold heavy
- Static entities
- No hopper locking by default

## Notes
¹ Sorting speed depends on several factors, including the size of the sorter and how far along the line an item needs to travel. In the examples provided, the best-case scenario sorts approximately 8,000 items per hour, while the absolute worst-case scenario sorts 73 items per hour. This is due to the time required for the minecart to complete a full cycle through the sorter. In the best case, a full stack of 64 items is sorted into the first category, with each sort taking 571gt. In the worst case, only a single item is sorted into the final category each cycle, increasing the sorting time to 980gt per sort.
² As mentioned above, sorting speed decreases as the sorter grows longer. While the design is expandable, excessively increasing its length will noticeably reduce throughput.

Two versions are available: player input and playerless input.

## Gallery
![](assets/media/area_render_26_.png)
![](assets/media/area_render_25__1.png)

## Downloads
- [SSF_MIS_-_Player_Input.litematic](assets/downloads/litematic/SSF_MIS_-_Player_Input.litematic)
- [SSF_MIS_-_Playerless_Input.litematic](assets/downloads/litematic/SSF_MIS_-_Playerless_Input.litematic)
