import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { menuData } from '../menu_data.js';

const prisma = new PrismaClient();

const sectionImages = {
  'drinks-of-the-week': 'https://images.unsplash.com/photo-1772311698901-fe3fa07141be?fm=jpg&q=60&w=3000&auto=format&fit=crop',
  'wine-menu': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80',
  'champagnes': 'https://plus.unsplash.com/premium_photo-1661508738591-ce22ac766586?fm=jpg&q=60&w=3000&auto=format&fit=crop',
  'spirits': 'https://punchdrink.com/wp-content/uploads/2024/02/Article-High-End-Spirits-Cocktails.jpg?w=1024',
  'food': 'https://thumbs.dreamstime.com/b/three-pizzas-dark-background-overhead-view-441929329.jpg',
  'desserts': 'https://thumbs.dreamstime.com/b/three-creamy-delicious-milkshake-variations-elegant-glasses-three-milkshakes-whipped-cream-chocolate-drizzle-displayed-362520258.jpg'
};

function getName(item) {
  if (typeof item.name === 'object') {
    return { en: item.name.en, fr: item.name.fr || item.name.en };
  }
  return { en: item.name, fr: item.name };
}

function getDescription(item) {
  if (!item.description) return { en: null, fr: null };
  if (typeof item.description === 'object') {
    return { en: item.description.en, fr: item.description.fr || null };
  }
  return { en: item.description, fr: null };
}

function getNote(item) {
  if (!item.note) return { en: null, fr: null };
  if (typeof item.note === 'object') {
    return { en: item.note.en, fr: item.note.fr || null };
  }
  return { en: item.note, fr: null };
}

async function createItem(sectionId, subsectionId, item, sortOrder) {
  const name = getName(item);
  const description = getDescription(item);
  const note = getNote(item);

  await prisma.item.create({
    data: {
      sectionId,
      subsectionId,
      nameEn: name.en,
      nameFr: name.fr,
      descriptionEn: description.en,
      descriptionFr: description.fr,
      noteEn: note.en,
      noteFr: note.fr,
      price: item.price || null,
      pricesArray: item.prices || null,
      sortOrder
    }
  });
}

async function main() {
  console.log('Seeding database...');

  await prisma.item.deleteMany();
  await prisma.subsection.deleteMany();
  await prisma.section.deleteMany();
  await prisma.admin.deleteMany();

  for (let sectionIndex = 0; sectionIndex < menuData.length; sectionIndex++) {
    const section = menuData[sectionIndex];
    const createdSection = await prisma.section.create({
      data: {
        slug: section.id,
        titleEn: section.title.en,
        titleFr: section.title.fr,
        type: section.type,
        subtitleEn: section.subtitle?.en || null,
        subtitleFr: section.subtitle?.fr || null,
        imageUrl: sectionImages[section.id] || null,
        sortOrder: sectionIndex
      }
    });

    if (section.subsections) {
      for (let subIndex = 0; subIndex < section.subsections.length; subIndex++) {
        const sub = section.subsections[subIndex];
        const createdSub = await prisma.subsection.create({
          data: {
            sectionId: createdSection.id,
            nameEn: sub.name.en,
            nameFr: sub.name.fr || null,
            defaultPrice: sub.defaultPrice || null,
            sortOrder: subIndex
          }
        });

        for (let itemIndex = 0; itemIndex < sub.items.length; itemIndex++) {
          await createItem(createdSection.id, createdSub.id, sub.items[itemIndex], itemIndex);
        }
      }
    } else if (section.categories) {
      for (let catIndex = 0; catIndex < section.categories.length; catIndex++) {
        const cat = section.categories[catIndex];
        const createdSub = await prisma.subsection.create({
          data: {
            sectionId: createdSection.id,
            nameEn: cat.name.en,
            nameFr: cat.name.fr || null,
            sortOrder: catIndex
          }
        });

        for (let itemIndex = 0; itemIndex < cat.items.length; itemIndex++) {
          await createItem(createdSection.id, createdSub.id, cat.items[itemIndex], itemIndex);
        }
      }
    } else if (section.items) {
      for (let itemIndex = 0; itemIndex < section.items.length; itemIndex++) {
        await createItem(createdSection.id, null, section.items[itemIndex], itemIndex);
      }
    }
  }

  const email = process.env.ADMIN_EMAIL || 'admin@nubi.bar';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.admin.create({
    data: { email, passwordHash }
  });

  console.log(`Admin created: ${email}`);
  console.log('Seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
