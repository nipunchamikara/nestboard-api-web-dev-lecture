import assert from "node:assert/strict";
import { Prisma } from "../generated/client.js";
import { createBookingPending } from "./booking-service.js";

const tenantId = "11111111-1111-4111-8111-111111111111";
const roomId = "22222222-2222-4222-8222-222222222222";

function makeDb(room: unknown) {
  const tx = {
    room: {
      findUnique: async () => room,
    },
    booking: {
      findFirst: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => data,
    },
  };

  return {
    $transaction: async (fn: (txArg: typeof tx) => unknown) => fn(tx),
  };
}

async function testBookingUsesRoomTypeForCapacityAndPrice() {
  const db = makeDb({
    id: roomId,
    isAvailable: true,
    roomType: {
      seatCapacity: 2,
      pricePerMonth: new Prisma.Decimal(22000),
      isAvailable: true,
    },
  });

  const booking = await createBookingPending(
    tenantId,
    {
      roomId,
      seatNumber: 2,
      startMonth: "2026-07",
      durationMonths: 3,
    },
    db as never,
  );

  assert.equal(String(booking.totalAmount), "66000");
}

await testBookingUsesRoomTypeForCapacityAndPrice();
console.log("booking-service tests passed");
