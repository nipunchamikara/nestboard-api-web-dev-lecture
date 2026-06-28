-- Create room types from the current room catalog. Each existing room becomes
-- one room type and one physical inventory room so existing booking.room_id
-- references remain valid.

CREATE TABLE "room_types" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price_per_month" DECIMAL(10,2) NOT NULL,
    "seat_capacity" INTEGER NOT NULL,
    "has_ac" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

INSERT INTO "room_types" (
    "id",
    "property_id",
    "name",
    "price_per_month",
    "seat_capacity",
    "has_ac",
    "is_available",
    "created_at"
)
SELECT
    "id",
    "property_id",
    "name",
    "price_per_month",
    "seat_capacity",
    "has_ac",
    true,
    "created_at"
FROM "rooms";

ALTER TABLE "rooms" ADD COLUMN "room_type_id" UUID;
ALTER TABLE "rooms" ADD COLUMN "room_label" TEXT;
ALTER TABLE "rooms" ADD COLUMN "is_available" BOOLEAN NOT NULL DEFAULT true;

UPDATE "rooms"
SET
    "room_type_id" = "id",
    "room_label" = "name";

ALTER TABLE "rooms" ALTER COLUMN "room_type_id" SET NOT NULL;
ALTER TABLE "rooms" ALTER COLUMN "room_label" SET NOT NULL;

ALTER TABLE "rooms" DROP CONSTRAINT "rooms_property_id_fkey";
DROP INDEX "rooms_property_id_idx";

ALTER TABLE "rooms" DROP COLUMN "property_id";
ALTER TABLE "rooms" DROP COLUMN "name";
ALTER TABLE "rooms" DROP COLUMN "price_per_month";
ALTER TABLE "rooms" DROP COLUMN "seat_capacity";
ALTER TABLE "rooms" DROP COLUMN "has_ac";

CREATE INDEX "room_types_property_id_idx" ON "room_types"("property_id");
CREATE INDEX "rooms_room_type_id_idx" ON "rooms"("room_type_id");

ALTER TABLE "room_types" ADD CONSTRAINT "room_types_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
