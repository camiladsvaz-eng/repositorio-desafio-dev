import express from "express";
import * as PlantaController from "@controllers/PlantaController";

const routes = express.Router();

routes.get("/", (_req, res) => {
  return res.status(200).json({ message: "API da Folhagem & Cia 🌿" });
});

// Rotas específicas devem vir antes de /plantas/:id.
routes.get("/plantas/estoque/valor-total", PlantaController.readValorTotalEstoque);
routes.get("/plantas/esgotadas", PlantaController.readPlantasEsgotadas);

routes.post("/plantas", PlantaController.createPlanta);
routes.get("/plantas", PlantaController.readAllPlantas);
routes.get("/plantas/:id", PlantaController.readPlantaById);
routes.patch("/plantas/:id", PlantaController.updatePlanta);
routes.delete("/plantas/:id", PlantaController.deletePlanta);
routes.post("/plantas/:id/venda", PlantaController.venderPlanta);

export default routes;
