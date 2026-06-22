import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { toPropertyDTO } from "../lib/dto.js";
import { validateBody } from "../middleware/validate.js";
import {
  createPropertySchema,
  type CreatePropertyInput,
} from "../schemas/property.js";
import { Errors } from "../lib/errors.js";
import { createRoomSchema, type CreateRoomInput } from "../schemas/room.js";
import { requireRole, verifyJwt } from "../middleware/auth.js";
import { Role } from "../generated/enums.js";

export const propertiesRouter: Router = Router();

propertiesRouter.use(verifyJwt);

propertiesRouter.get("/", async (_req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: { rooms: true },
    });
    res.json(properties.map(toPropertyDTO));
  } catch (err) {
    next(err);
  }
});

propertiesRouter.get("/mine", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const vendorId = req.user?.id;
    if (!vendorId) throw Errors.unauthenticated();
    const properties = await prisma.property.findMany({
      where: { isActive: true, vendorId },
      orderBy: { createdAt: "desc" },
      include: { rooms: true },
    });
    res.json(properties.map(toPropertyDTO));
  } catch (err) {
    next(err);
  }
});

propertiesRouter.get("/:id", async (req, res, next) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: { rooms: true },
    });
    if (!property) throw Errors.notFound("Property");
    res.json(property.rooms);
  } catch (err) {
    next(err);
  }
});

propertiesRouter.post(
  "/",
  requireRole(Role.ADMIN),
  validateBody(createPropertySchema),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw Errors.unauthenticated();
      const property = await prisma.property.create({
        data: {
          ...req.body,
          vendorId: userId,
        },
      });
      res.status(201).location(`${req.baseUrl}/${property.id}`).json(property);
    } catch (err) {
      next(err);
    }
  },
);

propertiesRouter.delete("/:id", async (req, res, next) => {
  try {
    await prisma.property.delete({
      where: {
        id: req.params.id,
      },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

propertiesRouter.get("/:id/rooms", async (req, res, next) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: { rooms: true },
    });

    if (!property) throw Errors.notFound("Property");

    res.json(property.rooms);
  } catch (err) {
    next(err);
  }
});

// propertiesRouter.post('/:id/rooms', validateBody(createRoomSchema), (req, res) => {
//     const newRoom = req.body as CreateRoomInput;
//     const propertyId = req.params.id;
//     if (!propertyId || typeof propertyId === 'object') {
//         throw Errors.validation('Invalid Property ID')
//     }
//     ROOMS.push({
//         propertyId: propertyId,
//         ...newRoom
//     });
//     res
//     .status(201)
//     .location(`${req.baseUrl}/${newRoom.id}`)
//     .json(newRoom);
// })
