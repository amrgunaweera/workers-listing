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
  'housemaid',
  'elder-care',
  'child-care',
  'nursing-home',
  'physiotherapy',
  'swimming-instructor',
  'fitness-instructor',
  'counseling',
  'tuition-master',
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
  if (c === 'housemaid' || c === 'maid' || c === 'maids') return 'housemaid';
  if (c === 'elder care' || c === 'eldercare' || c === 'elder-care') return 'elder-care';
  if (c === 'child care' || c === 'childcare' || c === 'child-care') return 'child-care';
  if (c === 'nursing home' || c === 'nursinghome' || c === 'nursing-home') return 'nursing-home';
  if (c === 'physiotherapy' || c === 'physio') return 'physiotherapy';
  if (c === 'swimming instructor' || c === 'swimming') return 'swimming-instructor';
  if (c === 'fitness instructor' || c === 'gym' || c === 'fitness') return 'fitness-instructor';
  if (c === 'counseling' || c === 'counselling') return 'counseling';
  if (c === 'tuition master' || c === 'tuition' || c === 'teacher') return 'tuition-master';
  
  return c
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
