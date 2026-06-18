export const categories = [
  'masons',
  'carpenters',
  'tile',
  'plumbers',
  'electricians',
  'painters',
  'landscaping',
  'stones-sand-soil',
  'equipment-repairing',
  'contractors',
  'welding',
  'professionals',
  'ac',
  'concrete-slab',
  'cushion-works',
  'gully-bowser',
  'well',
  'aluminium',
  'ceiling',
  'chair-weavers',
  'rent-tools',
  'cleaners',
  'vehicle-repairs',
  'cctv',
  'solar-panel-fixing',
  'curtains',
  'movers',
  'pest-control',
  'house-demolishers',
  'repairs-others'
];

export function normalizeCategory(category) {
  if (!category) return 'repairs-others';
  const c = category.toLowerCase().trim();
  if (c === 'mason' || c === 'masons') return 'masons';
  if (c === 'carpenter' || c === 'carpenters') return 'carpenters';
  if (c === 'plumber' || c === 'plumbers') return 'plumbers';
  if (c === 'gardener' || c === 'landscaping') return 'landscaping';
  if (c === 'helper') return 'repairs-others';
  
  return c
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
