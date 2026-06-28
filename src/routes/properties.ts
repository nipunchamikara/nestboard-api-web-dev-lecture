import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  toPropertyDetailDTO,
  toPropertyDTO,
  toRoomTypeDTO,
} from "../lib/dto.js";
import { validateBody } from "../middleware/validate.js";
import {
  createPropertySchema,
} from "../schemas/property.js";
import { Errors } from "../lib/errors.js";
import { requireRole, verifyJwt } from "../middleware/auth.js";
import { Role } from "../generated/enums.js";

export const propertiesRouter: Router = Router();

function parsePositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== "string") return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getPagination(query: Record<string, unknown>) {
  const page = parsePositiveInt(query.page, 1);
  const rawLimit = parsePositiveInt(query.limit, 10);
  const limit = Math.min(rawLimit, 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
}

propertiesRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit, skip, take } = getPagination(req.query);
    const where = { isActive: true };
    const [total, properties] = await prisma.$transaction([
      prisma.property.count({
        where,
      }),
      prisma.property.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          roomTypes: {
            include: { rooms: true },
          },
        },
      }),
    ]);
    const totalPages = Math.ceil(total / limit);
    res.json({
      data: properties.map(toPropertyDTO),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

propertiesRouter.get(
  "/mine",
  verifyJwt,
  requireRole("ADMIN"),
  async (req, res, next) => {
    try {
      const vendorId = req.user?.id;
      if (!vendorId) throw Errors.unauthenticated();
      const properties = await prisma.property.findMany({
        where: { isActive: true, vendorId },
        orderBy: { createdAt: "desc" },
        include: {
          roomTypes: {
            include: { rooms: true },
          },
        },
      });
      res.json(properties.map(toPropertyDTO));
    } catch (err) {
      next(err);
    }
  },
);

propertiesRouter.get("/map-list", async (_req, res, next) => {
  try {
    const properties = await prisma.property.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        city: true,
        latitude: true,
        longitude: true,
        imageUrl: true,
        rating: true,
      },
    });

    res.json(
      properties.map((property) => ({
        id: property.id,
        title: property.title,
        city: property.city,
        lat: property.latitude,
        lng: property.longitude,
        image: property.imageUrl,
        rating: Number(property.rating.toString()),
      })),
    );
  } catch (err) {
    next(err);
  }
});

propertiesRouter.get(
  "/my-favourites",
  verifyJwt,
  requireRole(Role.USER),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw Errors.unauthenticated();

      const favorites = await prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          property: {
            include: {
              roomTypes: {
                include: { rooms: true },
              },
            },
          },
        },
      });

      res.json(favorites.map((favorite) => toPropertyDTO(favorite.property)));
    } catch (err) {
      next(err);
    }
  },
);

propertiesRouter.patch(
  "/:id/toggle-favorite",
  verifyJwt,
  requireRole(Role.USER),
  async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) throw Errors.unauthenticated();
      const requestedPropertyId = String(req.params.id);

      const property = await prisma.property.findFirst({
        where: { id: requestedPropertyId, isActive: true },
        select: { id: true },
      });
      if (!property) throw Errors.notFound("Property");
      const propertyId = property.id;

      const key = { userId_propertyId: { userId, propertyId } };

      const existing = await prisma.favorite.findUnique({ where: key });
      if (existing) {
        await prisma.favorite.delete({ where: key });
        res.json({ propertyId, isFavorite: false });
        return;
      }

      await prisma.favorite.create({
        data: { userId, propertyId },
      });

      res.json({ propertyId, isFavorite: true });
    } catch (err) {
      next(err);
    }
  },
);
propertiesRouter.get("/:id", async (req, res, next) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        roomTypes: {
          include: { rooms: true },
        },
      },
    });
    if (!property) throw Errors.notFound("Property");
    res.json(toPropertyDetailDTO(property));
  } catch (err) {
    next(err);
  }
});

propertiesRouter.post(
  "/",
  verifyJwt,
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

propertiesRouter.delete(
  "/:id",
  verifyJwt,
  requireRole(Role.ADMIN),
  async (req, res, next) => {
    try {
      await prisma.property.delete({
        where: {
          id: String(req.params.id),
        },
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

propertiesRouter.get("/:id/room-types", async (req, res, next) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        roomTypes: {
          where: { isAvailable: true },
          orderBy: { createdAt: "asc" },
          include: { rooms: true },
        },
      },
    });

    if (!property) throw Errors.notFound("Property");

    res.json(property.roomTypes.map((roomType) => toRoomTypeDTO(roomType)));
  } catch (err) {
    next(err);
  }
});

propertiesRouter.get("/:id/room-types/:roomTypeId", async (req, res, next) => {
  try {
    const roomType = await prisma.roomType.findFirst({
      where: {
        id: req.params.roomTypeId,
        propertyId: req.params.id,
      },
      include: {
        rooms: {
          orderBy: { roomLabel: "asc" },
        },
      },
    });

    if (!roomType) throw Errors.notFound("Room type");

    res.json(toRoomTypeDTO(roomType, true));
  } catch (err) {
    next(err);
  }
});
