export function serializeSection(section) {
  return {
    id: section.id,
    slug: section.slug,
    title_en: section.titleEn,
    title_fr: section.titleFr,
    type: section.type,
    subtitle_en: section.subtitleEn,
    subtitle_fr: section.subtitleFr,
    image_url: section.imageUrl,
    sort_order: section.sortOrder
  };
}

export function serializeSubsection(subsection) {
  return {
    id: subsection.id,
    section_id: subsection.sectionId,
    name_en: subsection.nameEn,
    name_fr: subsection.nameFr,
    default_price: subsection.defaultPrice,
    sort_order: subsection.sortOrder
  };
}

export function serializeItem(item) {
  return {
    id: item.id,
    section_id: item.sectionId,
    subsection_id: item.subsectionId,
    name_en: item.nameEn,
    name_fr: item.nameFr,
    description_en: item.descriptionEn,
    description_fr: item.descriptionFr,
    price: item.price,
    note_en: item.noteEn,
    note_fr: item.noteFr,
    prices_array: item.pricesArray,
    is_visible: item.isVisible,
    sort_order: item.sortOrder
  };
}
