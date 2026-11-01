import { Luminosidade, Prisma } from "@prisma/client";
import prisma from "@database";

export type PlantFilters = {
  luminosidade?: Luminosidade;
  petFriendly?: boolean;
};

export const createPlant = async (data: Prisma.PlantaCreateInput) => {
  return prisma.planta.create({ data });
};

export const findAllPlants = async (filters: PlantFilters = {}) => {
  const where: Prisma.PlantaWhereInput = {};

  if (filters.luminosidade !== undefined) {
    where.luminosidade = filters.luminosidade;
  }

  if (filters.petFriendly !== undefined) {
    where.petFriendly = filters.petFriendly;
  }

  return prisma.planta.findMany({ where, orderBy: { id: "asc" } });
};

export const findPlantById = async (id: number) => {
  return prisma.planta.findUnique({ where: { id } });
};

export const updatePlant = async (
  id: number,
  data: Prisma.PlantaUpdateInput,
) => {
  return prisma.planta.update({ where: { id }, data });
};

export const deletePlant = async (id: number) => {
  return prisma.planta.delete({ where: { id } });
};

/**
 * Decremento condicional e atômico: duas vendas simultâneas não conseguem
 * vender o mesmo último vaso, pois o banco só atualiza se ainda houver saldo.
 */
export const decreaseStock = async (id: number, quantity: number) => {
  return prisma.planta.updateMany({
    where: { id, estoque: { gte: quantity } },
    data: { estoque: { decrement: quantity } },
  });
};

export const getPlantInventory = async () => {
  return prisma.planta.findMany({
    select: { preco: true, estoque: true },
  });
};
