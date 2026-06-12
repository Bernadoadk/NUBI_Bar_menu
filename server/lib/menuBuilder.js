function mapItem(item) {
  return {
    id: item.id,
    name: { en: item.nameEn, fr: item.nameFr || item.nameEn },
    price: item.price,
    description: (item.descriptionEn || item.descriptionFr)
      ? { en: item.descriptionEn, fr: item.descriptionFr }
      : null,
    note: (item.noteEn || item.noteFr)
      ? { en: item.noteEn, fr: item.noteFr }
      : null,
    prices: item.pricesArray
  };
}

export function buildMenuData(sections, subsections, items) {
  return sections.map((sec) => {
    const secSubs = subsections.filter((s) => s.sectionId === sec.id);
    const secItems = items.filter((i) => i.sectionId === sec.id && !i.subsectionId);

    const data = {
      id: sec.slug,
      title: { en: sec.titleEn, fr: sec.titleFr },
      type: sec.type || 'list',
      subtitle: (sec.subtitleEn || sec.subtitleFr)
        ? { en: sec.subtitleEn, fr: sec.subtitleFr }
        : null,
      items: secItems.map(mapItem)
    };

    if (sec.type === 'spirits') {
      data.categories = secSubs.map((sub) => ({
        id: sub.id,
        name: { en: sub.nameEn, fr: sub.nameFr },
        items: items
          .filter((i) => i.subsectionId === sub.id)
          .map(mapItem)
      }));
    } else {
      data.subsections = secSubs.map((sub) => ({
        id: sub.id,
        name: { en: sub.nameEn, fr: sub.nameFr },
        defaultPrice: sub.defaultPrice,
        items: items
          .filter((i) => i.subsectionId === sub.id)
          .map(mapItem)
      }));
    }

    return data;
  });
}
