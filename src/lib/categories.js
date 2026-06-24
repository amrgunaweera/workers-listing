export const categories = [
  'Masons',
  'Carpenters',
  'Tile',
  'Plumbers',
  'Electricians',
  'Painters',
  'Landscaping',
  'Stones Sand Soil',
  'Equipment Repairing',
  'Contractors',
  'Welding',
  'Professionals',
  'AC',
  'Concrete Slab',
  'Cushion Works',
  'Gully Bowser',
  'Well',
  'Aluminium',
  'Ceiling',
  'Chair Weavers',
  'Rent Tools',
  'Cleaners',
  'Vehicle Repairs',
  'CCTV',
  'Solar Panel Fixing',
  'Curtains',
  'Movers',
  'Pest Control',
  'House Demolishers',
  'Housemaid',
  'Elder Care',
  'Child Care',
  'Nursing Home',
  'Physiotherapy',
  'Swimming Instructor',
  'Fitness Instructor',
  'Counseling',
  'Tuition Master',
  'Repairs Others'
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
  if (c === 'repairs others' || c === 'repairs-others') return 'repairs-others';
  
  return c
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
