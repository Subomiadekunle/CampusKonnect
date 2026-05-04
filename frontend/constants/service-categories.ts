export const SERVICE_CATEGORIES = [
  'Nails',
  'Photography',
  'Headshots',
  'Hair Braiding',
  'Makeup',
  'Tutoring',
  'Graphic Design',
  'Video Editing',
  'Music Production',
  'DJing',
  'Personal Training',
  'Catering',
  'Cleaning',
  'Fashion / Alterations',
  'Tech Support',
  'Baking & Sweets',
  'Event Planning',
  'Locs & Twists',
  'Jewelry Making',
  'Painting & Art',
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
