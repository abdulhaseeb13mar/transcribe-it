-- Remove transcriptions table and related enum
DROP TABLE IF EXISTS transcriptions;
DROP TYPE IF EXISTS "TranscriptionStatus";

-- Remove the transcriptions relation from users table (this is just a Prisma relation, no actual FK to drop)
-- The users table structure remains the same
