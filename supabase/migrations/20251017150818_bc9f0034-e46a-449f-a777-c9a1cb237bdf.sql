-- Add conformity status enum type
CREATE TYPE conformity_status AS ENUM ('conforme', 'no_conformidad', 'no_conformidad_menor', 'punto_de_mejora');

-- Add new columns to assessment_results table
ALTER TABLE assessment_results
ADD COLUMN comments text,
ADD COLUMN proof_image_url text,
ADD COLUMN conformity_status conformity_status NOT NULL DEFAULT 'conforme';