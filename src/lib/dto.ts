import type {
  Property as PrismaProperty,
  Room as PrismaRoom,
} from "../generated/client.js";
import type { PropertyType } from "../generated/client.js";

export type PropertyDTO = {
  id: string;
  title: string;
  description: string;
  location: string;
  type: "House" | "Villa" | "Apartment" | "Hotel";
  price: string;
  rating: number;
  image: string;
};

const TYPE_LABEL: Record<PropertyType, PropertyDTO["type"]> = {
  HOUSE: "House",
  VILLA: "Villa",
  APARTMENT: "Apartment",
  HOTEL: "Hotel",
};

function compactKilo(n: number): string {
  if (n < 1000) return Math.round(n).toString();
  const k = n / 1000;
  return Number.isInteger(k) ? `${k}K` : `${k.toFixed(1)}K`;
}

export function toPropertyDTO(
  p: PrismaProperty & { rooms?: PrismaRoom[] },
): PropertyDTO {
  const prices = (p.rooms ?? [])
    .map((r) => Number(r.pricePerMonth.toString()))
    .filter((n) => n > 0);

  const minPrice = prices.length ? Math.min(...prices) : null;

  return {
    id: p.id,
    title: p.title,
    description: p.description,
    location: `${p.address}, ${p.city}`,
    type: TYPE_LABEL[p.type],
    price: minPrice !== null ? compactKilo(minPrice) : "-",
    rating: Number(p.rating.toString()),
    image: p.imageUrl,
  };
}

export type RoomDTO = {
  id: string;
  name: string;
  price: string;
  seatsTotal: number;
  seatsFree: number;
  hasAC: boolean;
};

export type PropertyDetailDTO = {
  id: string;
  title: string;
  address: string;
  amenities: string[];
  rating: number;
  seatsAvailable: number;
  minStay: string;
  startingPrice: string;
  image: string;
  rooms: RoomDTO[];
};

function money(n: number): string {
  return Math.round(n).toLocaleString("en-LK");
}

export function toRoomDTO(room: PrismaRoom): RoomDTO {
  return {
    id: room.id,
    name: room.name,
    price: money(Number(room.pricePerMonth.toString())),
    seatsTotal: room.seatCapacity,
    seatsFree: room.seatCapacity,
    hasAC: room.hasAC,
  };
}

export function toPropertyDetailDTO(
  p: PrismaProperty & { rooms: PrismaRoom[] },
): PropertyDetailDTO {
  const prices = p.rooms
    .map((room) => Number(room.pricePerMonth.toString()))
    .filter((price) => price > 0);

  const minPrice = prices.length ? Math.min(...prices) : null;
  const rooms = p.rooms.map(toRoomDTO);
  const seatsAvailable = rooms.reduce((sum, room) => sum + room.seatsFree, 0);

  return {
    id: p.id,
    title: p.title,
    address: `${p.address}, ${p.city}`,
    amenities: [TYPE_LABEL[p.type], ...p.amenities],
    rating: Number(p.rating.toString()),
    seatsAvailable,
    minStay: p.minStay,
    startingPrice: minPrice !== null ? `LKR ${compactKilo(minPrice)}` : "-",
    image: p.imageUrl,
    rooms,
  };
}
