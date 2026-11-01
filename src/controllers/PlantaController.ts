import { Luminosidade, Prisma } from "@prisma/client";
import { Request, Response } from "express";
import * as PlantaRepository from "@repositories/PlantaRepository";

const campos = ["nome", "especie", "preco", "estoque", "luminosidade", "petFriendly", "regaACadaDias"];

interface DadosPlanta {
  nome?: string;
  especie?: string;
  preco?: number;
  estoque?: number;
  luminosidade?: Luminosidade;
  petFriendly?: boolean;
  regaACadaDias?: number;
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function validarDados(corpo: unknown, parcial: boolean): { dados?: DadosPlanta; erro?: string } {
  if (!ehObjeto(corpo)) return { erro: "O corpo deve ser um objeto JSON." };
  const desconhecidos = Object.keys(corpo).filter((campo) => !campos.includes(campo));
  if (desconhecidos.length) return { erro: `Campo(s) não permitido(s): ${desconhecidos.join(", ")}.` };
  if (parcial && Object.keys(corpo).length === 0) return { erro: "Envie ao menos um campo para atualizar." };

  if (!parcial) {
    const faltantes = campos.filter((campo) => corpo[campo] === undefined);
    if (faltantes.length) return { erro: `Campos obrigatórios ausentes: ${faltantes.join(", ")}.` };
  }

  const dados: DadosPlanta = {};
  if (corpo.nome !== undefined) {
    if (typeof corpo.nome !== "string" || !corpo.nome.trim()) return { erro: "nome deve ser um texto não vazio." };
    dados.nome = corpo.nome.trim();
  }
  if (corpo.especie !== undefined) {
    if (typeof corpo.especie !== "string" || !corpo.especie.trim()) return { erro: "especie deve ser um texto não vazio." };
    dados.especie = corpo.especie.trim();
  }
  if (corpo.preco !== undefined) {
    if (typeof corpo.preco !== "number" || !Number.isInteger(corpo.preco) || corpo.preco <= 0) return { erro: "preco deve ser um inteiro maior que zero, em centavos." };
    dados.preco = corpo.preco;
  }
  if (corpo.estoque !== undefined) {
    if (typeof corpo.estoque !== "number" || !Number.isInteger(corpo.estoque) || corpo.estoque < 0) return { erro: "estoque deve ser um inteiro maior ou igual a zero." };
    dados.estoque = corpo.estoque;
  }
  if (corpo.luminosidade !== undefined) {
    if (typeof corpo.luminosidade !== "string" || !Object.values(Luminosidade).includes(corpo.luminosidade as Luminosidade)) return { erro: "luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO." };
    dados.luminosidade = corpo.luminosidade as Luminosidade;
  }
  if (corpo.petFriendly !== undefined) {
    if (typeof corpo.petFriendly !== "boolean") return { erro: "petFriendly deve ser true ou false." };
    dados.petFriendly = corpo.petFriendly;
  }
  if (corpo.regaACadaDias !== undefined) {
    if (typeof corpo.regaACadaDias !== "number" || !Number.isInteger(corpo.regaACadaDias) || corpo.regaACadaDias < 1) return { erro: "regaACadaDias deve ser um inteiro maior ou igual a um." };
    dados.regaACadaDias = corpo.regaACadaDias;
  }
  return { dados };
}

function lerId(valor: string): number | null {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const createPlanta = async (req: Request, res: Response) => {
  try {
    const validacao = validarDados(req.body, false);
    if (validacao.erro || !validacao.dados) return res.status(400).json({ message: validacao.erro });
    const planta = await PlantaRepository.createPlanta(validacao.dados as Prisma.PlantaCreateInput);
    return res.status(201).json(planta);
  } catch (error) {
    console.error("Erro ao cadastrar planta:", error);
    return res.status(500).json({ message: "Erro interno ao cadastrar planta." });
  }
};

export const readAllPlantas = async (req: Request, res: Response) => {
  try {
    const { luminosidade, petFriendly, nome, ordem } = req.query;
    if (luminosidade !== undefined && (typeof luminosidade !== "string" || !Object.values(Luminosidade).includes(luminosidade as Luminosidade))) {
      return res.status(400).json({ message: "Filtro luminosidade inválido." });
    }
    if (petFriendly !== undefined && petFriendly !== "true" && petFriendly !== "false") {
      return res.status(400).json({ message: "Filtro petFriendly deve ser true ou false." });
    }
    if (nome !== undefined && (typeof nome !== "string" || !nome.trim())) {
      return res.status(400).json({ message: "Filtro nome deve ser um texto não vazio." });
    }
    if (ordem !== undefined && ordem !== "nome" && ordem !== "preco") {
      return res.status(400).json({ message: "Filtro ordem deve ser nome ou preco." });
    }
    const plantas = await PlantaRepository.findAllPlantas({
      luminosidade: luminosidade as Luminosidade | undefined,
      petFriendly: petFriendly === undefined ? undefined : petFriendly === "true",
      nome: typeof nome === "string" ? nome.trim() : undefined,
      ordem: ordem as "nome" | "preco" | undefined,
    });
    return res.status(200).json(plantas);
  } catch (error) {
    console.error("Erro ao listar plantas:", error);
    return res.status(500).json({ message: "Erro interno ao listar plantas." });
  }
};

export const readPlantaById = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) return res.status(400).json({ message: "id deve ser um inteiro positivo." });
    const planta = await PlantaRepository.findPlantaById(id);
    if (!planta) return res.status(404).json({ message: "Planta não encontrada." });
    return res.status(200).json(planta);
  } catch (error) {
    console.error("Erro ao buscar planta:", error);
    return res.status(500).json({ message: "Erro interno ao buscar planta." });
  }
};

export const updatePlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) return res.status(400).json({ message: "id deve ser um inteiro positivo." });
    const existente = await PlantaRepository.findPlantaById(id);
    if (!existente) return res.status(404).json({ message: "Planta não encontrada." });
    const validacao = validarDados(req.body, true);
    if (validacao.erro || !validacao.dados) return res.status(400).json({ message: validacao.erro });
    const atualizada = await PlantaRepository.updatePlanta(id, validacao.dados as Prisma.PlantaUpdateInput);
    return res.status(200).json(atualizada);
  } catch (error) {
    console.error("Erro ao atualizar planta:", error);
    return res.status(500).json({ message: "Erro interno ao atualizar planta." });
  }
};

export const deletePlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) return res.status(400).json({ message: "id deve ser um inteiro positivo." });
    const existente = await PlantaRepository.findPlantaById(id);
    if (!existente) return res.status(404).json({ message: "Planta não encontrada." });
    await PlantaRepository.deletePlanta(id);
    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir planta:", error);
    return res.status(500).json({ message: "Erro interno ao excluir planta." });
  }
};

export const venderPlanta = async (req: Request, res: Response) => {
  try {
    const id = lerId(req.params.id);
    if (id === null) return res.status(400).json({ message: "id deve ser um inteiro positivo." });
    if (!ehObjeto(req.body) || typeof req.body.quantidade !== "number" || !Number.isInteger(req.body.quantidade) || req.body.quantidade <= 0) {
      return res.status(400).json({ message: "quantidade deve ser um inteiro maior que zero." });
    }
    const planta = await PlantaRepository.findPlantaById(id);
    if (!planta) return res.status(404).json({ message: "Planta não encontrada." });
    const alteradas = await PlantaRepository.decrementarEstoque(id, req.body.quantidade);
    if (alteradas === 0) return res.status(400).json({ message: "Estoque insuficiente para realizar a venda." });
    const atualizada = await PlantaRepository.findPlantaById(id);
    return res.status(200).json(atualizada);
  } catch (error) {
    console.error("Erro ao registrar venda:", error);
    return res.status(500).json({ message: "Erro interno ao registrar venda." });
  }
};

export const readValorTotalEstoque = async (_req: Request, res: Response) => {
  try {
    const resumo = await PlantaRepository.calcularValorTotalEstoque();
    return res.status(200).json(resumo);
  } catch (error) {
    console.error("Erro ao calcular estoque:", error);
    return res.status(500).json({ message: "Erro interno ao calcular o estoque." });
  }
};

export const readPlantasEsgotadas = async (_req: Request, res: Response) => {
  try {
    const plantas = await PlantaRepository.findPlantasEsgotadas();
    return res.status(200).json(plantas);
  } catch (error) {
    console.error("Erro ao listar plantas esgotadas:", error);
    return res.status(500).json({ message: "Erro interno ao listar plantas esgotadas." });
  }
};
