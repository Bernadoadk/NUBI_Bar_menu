-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_fr" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'list',
    "subtitle_en" TEXT,
    "subtitle_fr" TEXT,
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subsections" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_fr" TEXT,
    "default_price" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subsections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "subsection_id" TEXT,
    "name_en" TEXT NOT NULL,
    "name_fr" TEXT,
    "description_en" TEXT,
    "description_fr" TEXT,
    "price" TEXT,
    "note_en" TEXT,
    "note_fr" TEXT,
    "prices_array" JSONB,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sections_slug_key" ON "sections"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- AddForeignKey
ALTER TABLE "subsections" ADD CONSTRAINT "subsections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_subsection_id_fkey" FOREIGN KEY ("subsection_id") REFERENCES "subsections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
