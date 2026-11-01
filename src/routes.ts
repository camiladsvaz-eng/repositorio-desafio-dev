import express from "express";
import * as PlantController from "@controllers/PlantController";

const routes = express.Router();

routes.get("/", (_req, res) => {
  return res.status(200).json({ message: "API Folhagem & Cia 🌿" });
});

// A rota específica precisa vir antes de /plantas/:id.
routes.get("/plantas/estoque/valor-total", PlantController.readInventoryTotal);
routes.post("/plantas", PlantController.createPlant);
routes.get("/plantas", PlantController.readAllPlants);
routes.get("/plantas/:id", PlantController.readPlantById);
routes.patch("/plantas/:id", PlantController.updatePlant);
routes.delete("/plantas/:id", PlantController.deletePlant);
routes.post("/plantas/:id/venda", PlantController.sellPlant);

export default routes;
