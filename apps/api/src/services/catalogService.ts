import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { audit } from "../repositories/auditRepository.js";
import type { AuthUser } from "../types.js";

export const catalogService = {
  users: {
    list: () => prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true } }),
    create: async (input: { name: string; email: string; password: string; role: any }, actor?: AuthUser) => {
      const passwordHash = await bcrypt.hash(input.password, 10);
      const user = await prisma.user.create({ data: { name: input.name, email: input.email, passwordHash, role: input.role } });
      await audit(actor?.id, "USER_CREATED", "User", user.id, { email: user.email, role: user.role });
      return user;
    },
    update: async (id: string, input: any, actor?: AuthUser) => {
      const data = { ...input };
      if (data.password) {
        data.passwordHash = await bcrypt.hash(data.password, 10);
        delete data.password;
      }
      const user = await prisma.user.update({ where: { id }, data });
      await audit(actor?.id, "USER_UPDATED", "User", user.id, input);
      return user;
    }
  },
  stations: {
    list: () => prisma.station.findMany({ include: { pumps: true, tanks: true }, orderBy: { createdAt: "desc" } }),
    create: async (input: any, actor?: AuthUser) => {
      const station = await prisma.station.create({ data: input });
      await audit(actor?.id, "STATION_CREATED", "Station", station.id, input);
      return station;
    },
    update: async (id: string, input: any, actor?: AuthUser) => {
      const station = await prisma.station.update({ where: { id }, data: input });
      await audit(actor?.id, "STATION_UPDATED", "Station", station.id, input);
      return station;
    }
  },
  fuelTypes: {
    list: () => prisma.fuelType.findMany({ orderBy: { name: "asc" } }),
    create: async (input: any, actor?: AuthUser) => {
      const fuel = await prisma.fuelType.create({ data: input });
      await audit(actor?.id, "FUEL_TYPE_CREATED", "FuelType", fuel.id, input);
      return fuel;
    },
    update: async (id: string, input: any, actor?: AuthUser) => {
      const fuel = await prisma.fuelType.update({ where: { id }, data: input });
      await audit(actor?.id, "FUEL_TYPE_UPDATED", "FuelType", fuel.id, input);
      return fuel;
    }
  },
  pumps: {
    list: () => prisma.pump.findMany({ include: { station: true, fuelType: true }, orderBy: { number: "asc" } }),
    create: async (input: any, actor?: AuthUser) => {
      const pump = await prisma.pump.create({ data: input });
      await audit(actor?.id, "PUMP_CREATED", "Pump", pump.id, input);
      return pump;
    },
    update: async (id: string, input: any, actor?: AuthUser) => {
      const pump = await prisma.pump.update({ where: { id }, data: input });
      await audit(actor?.id, "PUMP_UPDATED", "Pump", pump.id, input);
      return pump;
    }
  }
};
