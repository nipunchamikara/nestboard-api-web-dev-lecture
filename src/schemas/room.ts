import { z } from "zod";

export const createRoomTypeSchema = z
  .object({
    name: z.string().min(3).max(40),
    pricePerMonth: z.number().min(0),
    seatCapacity: z.number().int().min(1).max(20),
    hasAC: z.boolean(),
    roomLabels: z.array(z.string().min(1).max(20)).min(1),
  })
  .strict();

export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;
