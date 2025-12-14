import { sequelize } from '../config/database';
import { Category } from '../models';

const categories = [
  { name: 'Singing', slug: 'singing', icon: '🎤', description: 'Vocal performances and singing talent', sortOrder: 1 },
  { name: 'Dancing', slug: 'dancing', icon: '💃', description: 'Dance performances and choreography', sortOrder: 2 },
  { name: 'Acting', slug: 'acting', icon: '🎭', description: 'Acting, theater, and dramatic performances', sortOrder: 3 },
  { name: 'Comedy', slug: 'comedy', icon: '😂', description: 'Stand-up comedy and comedic performances', sortOrder: 4 },
  { name: 'Music', slug: 'music', icon: '🎵', description: 'Instrumental performances and music production', sortOrder: 5 },
  { name: 'Modeling', slug: 'modeling', icon: '📸', description: 'Fashion modeling and photoshoots', sortOrder: 6 },
  { name: 'Sports', slug: 'sports', icon: '⚽', description: 'Athletic performances and sports highlights', sortOrder: 7 },
  { name: 'Art', slug: 'art', icon: '🎨', description: 'Visual arts, painting, and creative works', sortOrder: 8 },
  { name: 'Magic', slug: 'magic', icon: '🪄', description: 'Magic tricks and illusion performances', sortOrder: 9 },
  { name: 'Other', slug: 'other', icon: '✨', description: 'Other unique talents and performances', sortOrder: 10 }
];

async function seedCategories() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    for (const cat of categories) {
      const [category, created] = await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: cat
      });

      if (created) {
        console.log(`Created category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${cat.name}`);
      }
    }

    console.log('Categories seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
