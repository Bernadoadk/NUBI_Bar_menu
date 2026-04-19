/**
 * Migration Helper Script
 * Copy this content and paste it into the browser console while on your localhost index.html page
 * to migrate your local menu_data.js to Supabase.
 */

async function migrate() {
    console.log("🚀 Starting migration...");
    
    // Check if Supabase client is available
    if (typeof supabase === 'undefined') {
        console.error("❌ Supabase client not found. Make sure to include the script tag first!");
        return;
    }

    const sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

    for (const section of menuData) {
        console.log(`📦 Migrating section: ${section.title.en}`);
        
        // 1. Insert Section
        const { data: sectionData, error: sectionError } = await sb
            .from('sections')
            .insert([{
                slug: section.id,
                title_en: section.title.en,
                title_fr: section.title.fr,
                type: section.type,
                subtitle_en: section.subtitle ? section.subtitle.en : null,
                subtitle_fr: section.subtitle ? section.subtitle.fr : null,
                image_url: sectionImages[section.id] || null
            }])
            .select();

        if (sectionError) {
            console.error(`❌ Error inserting section ${section.id}:`, sectionError);
            continue;
        }

        const sectionDbId = sectionData[0].id;

        // 2. Handle Subsections or Items
        if (section.subsections) {
            for (const sub of section.subsections) {
                console.log(`  🔹 Sub-section: ${sub.name.en}`);
                const { data: subData, error: subError } = await sb
                    .from('subsections')
                    .insert([{
                        section_id: sectionDbId,
                        name_en: sub.name.en,
                        name_fr: sub.name.fr,
                        default_price: sub.defaultPrice || null
                    }])
                    .select();

                if (subError) {
                    console.error(`❌ Error inserting sub ${sub.name.en}:`, subError);
                    continue;
                }

                const subDbId = subData[0].id;

                // Insert items for this sub
                for (const item of sub.items) {
                    await insertItem(sb, item, sectionDbId, subDbId);
                }
            }
        } 
        else if (section.categories) { // For spirits
            for (const cat of section.categories) {
                console.log(`  🔸 Category: ${cat.name.en}`);
                const { data: subData, error: subError } = await sb
                    .from('subsections')
                    .insert([{
                        section_id: sectionDbId,
                        name_en: cat.name.en,
                        name_fr: cat.name.fr
                    }])
                    .select();

                const subDbId = subData[0].id;

                for (const item of cat.items) {
                    await insertItem(sb, item, sectionDbId, subDbId);
                }
            }
        }
        else if (section.items) { // Directly under section
            for (const item of section.items) {
                await insertItem(sb, item, sectionDbId, null);
            }
        }
    }

    console.log("✅ Migration finished!");
}

async function insertItem(sb, item, sectionId, subsectionId) {
    const name_en = typeof item.name === 'object' ? item.name.en : item.name;
    const name_fr = typeof item.name === 'object' ? item.name.fr : null;
    
    const desc_en = item.description ? (typeof item.description === 'object' ? item.description.en : item.description) : null;
    const desc_fr = item.description ? (typeof item.description === 'object' ? item.description.fr : null) : null;

    const note_en = item.note ? (typeof item.note === 'object' ? item.note.en : item.note) : null;
    const note_fr = item.note ? (typeof item.note === 'object' ? item.note.fr : null) : null;

    const { error } = await sb.from('items').insert([{
        section_id: sectionId,
        subsection_id: subsectionId,
        name_en,
        name_fr,
        description_en: desc_en,
        description_fr: desc_fr,
        price: item.price || null,
        note_en,
        note_fr,
        prices_array: item.prices || null
    }]);

    if (error) console.error(`❌ Error inserting item ${name_en}:`, error);
}

// migrate(); // Uncomment to run automatically
