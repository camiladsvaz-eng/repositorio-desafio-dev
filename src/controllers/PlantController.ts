import { Luminosidade, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import * as PlantRepository from "@repositories/PlantRepository";

const plantFields = [
  "nome",
  "especie",
  "preco",
  "estoque",
  "luminosidade",
  "petFriendly",
  "regaACadaDias",
] as const;

type PlantField = (typeof plantFields)[number];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validatePlantData = (
  body: unknown,
  partial = false,
): { data?: Record<string, unknown>; error?: string } => {
  if (!isObject(body)) {
    return { error: "O corpo da requisição deve ser um objeto JSON." };
  }

  const keys = Object.keys(body);
  const unknownFields = keys.filter(
    (key) => !plantFields.includes(key as PlantField),
  );

  if (unknownFields.length > 0) {
    return { error: `Campo(s) não permitido(s): ${unknownFields.join(", ")}.` };
  }

  if (!partial) {
    const missingFields = plantFields.filter(
      (field) => body[field] === undefined,
    );

    if (missingFields.length > 0) {
      return {
        error: `Campos obrigatórios ausentes: ${missingFields.join(", ")}.`,
      };
    }
  } else if (keys.length === 0) {
    return { error: "Informe ao menos um campo para atualizar." };
  }

  if (body.nome !== undefined &&
      (typeof body.nome !== "string" || body.nome.trim().length === 0)) {
    return { error: "O campo nome deve ser um texto não vazio." };
  }

  if (body.especie !== undefined &&
      (typeof body.especie !== "string" || body.especie.trim().length === 0)) {
    return { error: "O campo especie deve ser um texto não vazio." };
  }

  if (body.preco !== undefined &&
      (!Number.isInteger(body.preco) || (body.preco as number) <= 0)) {
    return { error: "O campo preco deve ser um número inteiro maior que zero (em centavos)." };
  }

  if (body.estoque !== undefined &&
      (!Number.isInteger(body.estoque) || (body.estoque as number) < 0)) {
    return { error: "O campo estoque deve ser um número inteiro maior ou igual a zero." };
  }

  if (body.luminosidade !== undefined &&
      !Object.values(Luminosidade).includes(body.luminosidade as Luminosidade)) {
    return { error: "luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO." };
  }

  if (body.petFriendly !== undefined && typeof body.petFriendly !== "boolean") {
    return { error: "O campo petFriendly deve ser true ou false." };
  }

  if (body.regaACadaDias !== undefined &&
      (!Number.isInteger(body.regaACadaDias) || (body.regaACadaDias as number) < 1)) {
    return { error: "O campo regaACadaDias deve ser um número inteiro maior ou igual a 1." };
  }

  return { data: body };
};

const parseId = (rawId: string): number | null => {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const createPlant = async (req: Request, res: Response) => {
  const validation = validatePlantData(req.body);

  if (validation.error || !validation.data) {
    return res.status(400).json({ message: validation.error });
  }

  try {
    const plant = await PlantRepository.createPlant(
      validation.data as Prisma.PlantaCreateInput,
    );
    return res.status(201).json(plant);
  } catch (error) {
    console.error("Erro ao cadastrar planta:", error);
    return res.status(500).json({ message: "Erro interno ao cadastrar planta." });
  }
};

export const readAllPlants = async (req: Request, res: Response) => {
  const { luminosidade, petFriendly } = req.query;

  if (
    luminosidade !== undefined &&
    (typeof luminosidade !== "string" ||
      !Object.values(Luminosidade).includes(luminosidade as Luminosidade))
  ) {
    return res.status(400).json({
      message: "Filtro luminosidade inválido. Use SOMBRA, MEIA_SOMBRA ou SOL_PLENO.",
    });
  }

  let petFriendlyFilter: boolean | undefined;
  if (petFriendly !== undefined) {
    if (petFriendly === "true") {
      petFriendlyFilter = true;
    } else if (petFriendly === "false") {
      petFriendlyFilter = false;
    } else {
      return res.status(400).json({
        message: "Filtro petFriendly inválido. Use true ou false.",
      });
    }
  }

  try {
    const plants = await PlantRepository.findAllPlants({
      luminosidade: luminosidade as Luminosidade | undefined,
      petFriendly: petFriendlyFilter,
    });
    return res.status(200).json(plants);
  } catch (error) {
    console.error("Erro ao listar plantas:", error);
    return res.status(500).json({ message: "Erro interno ao listar plantas." });
  }
};

export const readPlantById = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
  }

  try {
    const plant = await PlantRepository.findPlantById(id);
    if (!plant) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }
    return res.status(200).json(plant);
  } catch (error) {
    console.error("Erro ao buscar planta:", error);
    return res.status(500).json({ message: "Erro interno ao buscar planta." });
  }
};

export const updatePlant = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
  }

  const validation = validatePlantData(req.body, true);
  if (validation.error || !validation.data) {
    return res.status(400).json({ message: validation.error });
  }

  try {
    const existingPlant = await PlantRepository.findPlantById(id);
    if (!existingPlant) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    const updatedPlant = await PlantRepository.updatePlant(
      id,
      validation.data as Prisma.PlantaUpdateInput,
    );
    return res.status(200).json(updatedPlant);
  } catch (error) {
    console.error("Erro ao atualizar planta:", error);
    return res.status(500).json({ message: "Erro interno ao atualizar planta." });
  }
};

export const deletePlant = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
  }

  try {
    const existingPlant = await PlantRepository.findPlantById(id);
    if (!existingPlant) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    await PlantRepository.deletePlant(id);
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao remover planta:", error);
    return res.status(500).json({ message: "Erro interno ao remover planta." });
  }
};

export const sellPlant = async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ message: "O id deve ser um número inteiro positivo." });
  }

  if (!isObject(req.body) ||
      !Number.isInteger(req.body.quantidade) ||
      (req.body.quantidade as number) <= 0) {
    return res.status(400).json({
      message: "O corpo deve conter quantidade como número inteiro maior que zero.",
    });
  }

  const quantity = req.body.quantidade as number;

  try {
    const existingPlant = await PlantRepository.findPlantById(id);
    if (!existingPlant) {
      return res.status(404).json({ message: "Planta não encontrada." });
    }

    const result = await PlantRepository.decreaseStock(id, quantity);
    if (result.count === 0) {
      const plantStillExists = await PlantRepository.findPlantById(id);
      if (!plantStillExists) {
        return res.status(404).json({ message: "Planta não encontrada." });
      }
      return res.status(400).json({
        message: "Estoque insuficiente para realizar a venda.",
        estoqueDisponivel: plantStillExists.estoque,
      });
    }

    const updatedPlant = await PlantRepository.findPlantById(id);
    return res.status(200).json(updatedPlant);
  } catch (error) {
    console.error("Erro ao registrar venda:", error);
    return res.status(500).json({ message: "Erro interno ao registrar venda." });
  }
};

export const readInventoryTotal = async (_req: Request, res: Response) => {
  try {
    const inventory = await PlantRepository.getPlantInventory();

    const totals = inventory.reduce(
      (accumulator, plant) => ({
        valorTotalEmCentavos:
          accumulator.valorTotalEmCentavos + plant.preco * plant.estoque,
        totalDeVasos: accumulator.totalDeVasos + plant.estoque,
      }),
      { valorTotalEmCentavos: 0, totalDeVasos: 0 },
    );

    return res.status(200).json(totals);
  } catch (error) {
    console.error("Erro ao calcular valor do estoque:", error);
    return res.status(500).json({ message: "Erro interno ao calcular o estoque." });
  }
};
