# World Item Exporter | FireBee Tools

## Hero

hero-category: Minecraft · World analysis
hero-title: Find every item stored in your world
hero-intro: Scan a world ZIP for stored items, and export the results. Your world stays in your browser.
choose-world: Choose world ZIP
how-link: How it works

## Scan panel

scan-heading: Scan
scan-notice: The bigger the world, the longer the scan takes, so trimmed worlds work best.
drop-title: Drop a world ZIP here
drop-hint: or click to browse. The archive should contain the region folders.
progress-title: Waiting for a world
scan-status: Choose a ZIP file to begin.
progress-label: Scan progress
scan-button: Scan world

## Scan options

dimensions-label: Choose dimensions to scan
dimensions-title: Dimensions to scan
dimension-overworld: Overworld
dimension-nether: Nether
dimension-end: The End
options-title: Options
structure-option: Ignore containers inside structures
structure-hint: Skipping dimensions makes the scan faster. The structure option uses the bounding boxes saved in the world, so player builds inside a village or similar are ignored too.

## Export menu

export-button: Export items
export-options: Export options
minimum-label: Ignore items under
excel-button: Excel (.xlsx)
csv-button: CSV

### Litematic export

litematic-title: Litematic barrels
compact-label: Compact into fewest boxes
compact-hint: Merge identical stacks up to their max stack size and pack them into as few boxes as possible
keep-named-label: Keep named items
keep-named-hint: Named items are never merged or removed by the filters
keep-empty-label: Keep empty shulker boxes
keep-empty-hint: Empty shulker boxes found inside containers
unstackable-label: Remove unstackable items
unstackable-hint: Remove every item that stacks to 1, such as tools, armour and potions
max-barrels-label: Max barrels per file
litematic-button: Litematic (.litematic)
litematic-hint: Each container becomes a shulker box inside a barrel, and small containers like hoppers are pooled. The minimum quantity above applies here too.

## Summary

summary-label: Summary
breakdown-label: Breakdown
distribution-title: Item distribution
distribution-note: Scan a world ZIP to see each item's share of the total.
chart-label: Top 50 items bar chart
chart-list-label: Top 50 items by percentage of total
unique-items-label: Unique item types
total-items-label: Total items counted
nonempty-containers-label: Non-empty containers

## Results

results-label: Results
results-title: Items and containers
results-intro: Totals across every readable container, including the contents of shulker boxes, alongside a count of containers by type.
items-title: Items
items-description: Sorted by quantity, largest first.
filter-placeholder: Filter items, for example diamond
filter-label: Filter items
items-empty: Item totals will appear here.

### Container results

containers-title: Containers
containers-description: Non-empty containers by type. Shulker boxes of every colour are counted together.
containers-empty: Container totals will appear here.

## How it works

method-label: Method
method-title: How it works
method-intro:
step-one-title: Add your world
step-one-description: Zip up your world folder and drop it in. The tool finds the parts of the world you picked: the Overworld, the Nether and the End.
step-two-title: Look through the world
step-two-description: Minecraft saves the world in many small pieces. The tool goes through them one by one and only looks at the places that can hold items.
step-three-title: Find the storage
step-three-description: It finds every chest, barrel, hopper, dropper, dispenser and shulker box, and ignores everything else to stay fast.
step-four-title: Add it all up
step-four-description: Every item inside is counted, including items packed inside shulker boxes, even boxes inside other containers. You get one total per item, ready to search or download.
limits-label: Not counted:
limits-description: player inventories, ender chests, dropped items, item frames and storage minecarts. Results depend on the world format and the files present in the ZIP.

## Call to action

cta-title: Scan another world
cta-description: Drop in a new ZIP and get fresh totals in a few seconds.
