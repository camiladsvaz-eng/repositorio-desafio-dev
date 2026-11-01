import { Luminosidade, Prisma } from "@prisma/client";
import prisma from "@database";

interface FiltrosPlantas {
  luminosidade?: Luminosidade;
  petFriendly?: boolean;
  nome?: string;
  ordem?: "nome" | "preco";
}

export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
  return prisma.planta.create({ data });
};

export const findAllPlantas = async (filtros: FiltrosPlantas = {}) => {
  const where: Prisma.PlantaWhereInput = {};
  if (filtros.luminosidade !== undefined) where.luminosidade = filtros.luminosidade;
  if (filtros.petFriendly !== undefined) where.petFriendly = filtros.petFriendly;
  if (filtros.nome !== undefined) {
    where.nome = { contains: filtros.nome, mode: "insensitive" };
  }

  const orderBy: Prisma.PlantaOrderByWithRelationInput[] =
    filtros.ordem === "nome" ? [{ nome: "asc" }] :
    filtros.ordem === "preco" ? [{ preco: "asc" }] : [{ id: "asc" }];

  return prisma.planta.findMany({ where, orderBy });
};

export const findPlantaById = async (id: number) => {
  return prisma.planta.findUnique({ where: { id } });
};

export const updatePlanta = async (id: number, data: Prisma.PlantaUpdateInput) => {
  return prisma.planta.update({ where: { id }, data });
};

export const deletePlanta = async (id: number) => {
  return prisma.planta.delete({ where: { id } });
};

// Atualização condicional e atômica: duas vendas simultâneas não consomem
// a mesma unidade nem permitem que o estoque fique negativo.
export const decrementarEstoque = async (id: number, quantidade: number) => {
  const resultado = await prisma.planta.updateMany({
    where: { id, estoque: { gte: quantidade } },
    data: { estoque: { decrement: quantidade } },
  });
  return resultado.count;
};

export const calcularValorTotalEstoque = async () => {
  const plantas = await prisma.planta.findMany({
    select: { preco: true, estoque: true },
  });
  let valorTotalEmCentavos = 0;
  let totalDeVasos = 0;
  for (const planta of plantas) {
    valorTotalEmCentavos += planta.preco * planta.estoque;
    totalDeVasos += planta.estoque;
  }
  return { valorTotalEmCentavos, totalDeVasos };
};

export const findPlantasEsgotadas = async () => {
  return prisma.planta.findMany({
    where: { estoque: 0 },
    orderBy: { nome: "asc" },
  });
};
