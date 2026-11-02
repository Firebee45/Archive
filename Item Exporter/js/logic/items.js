(() => {
  const {state: S, add, itemName, containerLabel, getTag, getScalar} = WS;
  const COLORS = ['white','orange','magenta','light_blue','yellow','lime','pink','gray','light_gray','cyan','purple','blue','brown','green','red','black'];
  const MODERN = ['trapped_chest','chest','barrel','hopper','dropper','dispenser','shulker_box', ...COLORS.map(c => `${c}_shulker_box`)];
  const MODERN_RE = new RegExp(`^(minecraft:)?(${MODERN.join('|')})$`, 'i');
  const LEGACY_RE = /^(TrappedChest|Chest|Barrel|Hopper|Dropper|Dispenser)$/i;
  const isContainerId = id => MODERN_RE.test(id) || LEGACY_RE.test(id);
  const itemIdOf = item => getScalar(item, 'id') || getScalar(item, 'Id') || 'unknown:item';
  const itemCountOf = item => Number(getScalar(item, 'Count') ?? getScalar(item, 'count') ?? 1);
  const isShulkerItem = item => /(?:^|:)(?:[a-z_]+_)?shulker_box$/i.test(String(itemIdOf(item)));
  const nestedItemsOf = item => {
    const tag = getTag(item, 'tag') || getTag(item, 'Tag');
    const blockEntityTag = tag && getTag(tag, 'BlockEntityTag');
    const legacyItems = blockEntityTag && getTag(blockEntityTag, 'Items');
    if (legacyItems && Array.isArray(legacyItems.value)) return legacyItems.value;
    const components = getTag(item, 'components');
    const containerComponent = components && (getTag(components, 'minecraft:container') || getTag(components, 'container'));
    if (containerComponent && Array.isArray(containerComponent.value)) return containerComponent.value.map(entry => getTag(entry, 'item') || entry);
    return [];
  };
  const collectItem = (item, map, allowNested, depth=0) => {
    if (!item || depth > 32) return;
    add(map, itemName(itemIdOf(item)), itemCountOf(item));
    if (allowNested && isShulkerItem(item)) for (const child of nestedItemsOf(item)) collectItem(child, map, true, depth+1);
  };
  const nestedLabels = (item, depth, labels) => {
    if (!item || depth > 32 || !isShulkerItem(item)) return;
    const items = nestedItemsOf(item);
    if (items.length) labels.push(itemIdOf(item));
    for (const child of items) nestedLabels(child, depth + 1, labels);
  };
  const STACK_1 = /(?:_sword|_pickaxe|_axe|_shovel|_hoe|_helmet|_chestplate|_leggings|_boots|_bed|_boat|_raft|_minecart|_horse_armor|_harness|_shulker_box|_bundle|_banner_pattern|_spear)$|^(?:shulker_box|bundle|minecart|bow|crossbow|trident|mace|shield|elytra|fishing_rod|flint_and_steel|shears|carrot_on_a_stick|warped_fungus_on_a_stick|brush|spyglass|saddle|totem_of_undying|written_book|writable_book|enchanted_book|knowledge_book|debug_stick|goat_horn|suspicious_stew|mushroom_stew|rabbit_stew|beetroot_soup|milk_bucket|water_bucket|lava_bucket|powder_snow_bucket|cod_bucket|salmon_bucket|pufferfish_bucket|tropical_fish_bucket|axolotl_bucket|tadpole_bucket|cake|potion|splash_potion|lingering_potion|wolf_armor|music_disc_.+)$/;
  const STACK_16 = /^(?:ender_pearl|snowball|egg|blue_egg|brown_egg|bucket|honey_bottle|armor_stand)$|_sign$|_hanging_sign$|_banner$/;
  const maxStackOf = (item, id) => {
    const comps = getTag(item, 'components');
    const override = comps && (getScalar(comps, 'minecraft:max_stack_size') ?? getScalar(comps, 'max_stack_size'));
    if (Number.isFinite(Number(override)) && Number(override) >= 1) return Number(override);
    const bare = String(id).replace(/^minecraft:/, '');
    if (bare.includes(':')) return 64;
    return STACK_1.test(bare) ? 1 : STACK_16.test(bare) ? 16 : 64;
  };
  const isNamed = item => {
    const comps = getTag(item, 'components');
    if (comps && (getTag(comps, 'minecraft:custom_name') || getTag(comps, 'custom_name'))) return true;
    const tag = getTag(item, 'tag') || getTag(item, 'Tag');
    const display = tag && getTag(tag, 'display');
    return !!(display && getTag(display, 'Name'));
  };
  const packContainer = (entityId, items) => {
    const plain = [], loose = [];
    for (const item of items) {
      if (!item || !item.value || typeof item.value !== 'object') continue;
      const slot = Number(getScalar(item, 'Slot'));
      if (isShulkerItem(item)) {
        const whole = Object.assign({}, item.value);
        delete whole.Slot;
        loose.push({bytes: WS.encodeEntries(whole), empty: nestedItemsOf(item).length === 0, named: isNamed(item)});
        continue;
      }
      const rest = Object.assign({}, item.value);
      const old = Object.prototype.hasOwnProperty.call(rest, 'Count');
      delete rest.Slot; delete rest.Count; delete rest.count;
      const id = String(itemIdOf(item));
      // The count is stored apart from the rest of the stack so identical stacks can be merged later.
      plain.push({slot: Number.isFinite(slot) ? slot : plain.length, base: WS.encodeEntries(rest), n: itemCountOf(item), old, id, max: maxStackOf(item, id), named: isNamed(item)});
    }
    if (!plain.length && !loose.length) return null;
    const m = /^(?:minecraft:)?([a-z_]*shulker_box)$/i.exec(entityId);
    return {boxId: m ? 'minecraft:' + m[1].toLowerCase() : 'minecraft:shulker_box', plain, loose, small: /^(?:minecraft:)?(hopper|dropper|dispenser)$/i.test(entityId), dv: S.curDV || 0};
  };
  const readContainer = entity => {
    const id = String(getScalar(entity, 'id') || '');
    if (!isContainerId(id)) return null;
    const itemsTag = getTag(entity, 'Items');
    const items = itemsTag && Array.isArray(itemsTag.value) ? itemsTag.value : [];
    if (!items.length) return null;
    const counts = new Map(), labels = [id];
    for (const item of items) { collectItem(item, counts, true); nestedLabels(item, 0, labels); }
    return {x:Number(getScalar(entity, 'x')), y:Number(getScalar(entity, 'y')), z:Number(getScalar(entity, 'z')), counts, labels, pack: packContainer(id, items)};
  };
  const commit = rec => {
    if (rec.pack) (S.packs || (S.packs = [])).push(rec.pack);
    for (const [name, n] of rec.counts) add(S.direct, name, n);
    for (const id of rec.labels) {
      const type = containerLabel(id);
      S.containerSummary.set(type, (S.containerSummary.get(type) || 0) + 1);
      S.containerCount++;
    }
  };
  const collectChunk = (chunk, dim) => {
    const blockEntities = getTag(chunk, 'block_entities') || getTag(chunk, 'TileEntities') || getTag(chunk, 'tile_entities');
    if (!blockEntities || blockEntities.type !== 9 || !Array.isArray(blockEntities.value)) return;
    for (const entity of blockEntities.value) {
      const rec = readContainer(entity);
      if (!rec) continue;
      if (S.excludeStructures) { rec.dim = dim; S.pending.push(rec); } else commit(rec);
    }
  };
  const flushPending = () => {
    let excluded = 0;
    for (const rec of S.pending) {
      if (S.excludeStructures && WS.structures.contains(rec.dim, rec.x, rec.y, rec.z)) excluded++; else commit(rec);
    }
    S.pending = [];
    return excluded;
  };
  Object.assign(WS, {collectChunk, flushPending, commit});
})();
