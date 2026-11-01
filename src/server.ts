import "dotenv/config";
import express, { ErrorRequestHandler } from "express";
import routes from "./routes";

const app = express();

app.use(express.json());
app.use(routes);

app.use((_req, res) => {
  res.status(404).json({ message: "Rota não encontrada." });
});

// Respostas JSON também para corpos malformados e erros inesperados do Express.
const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ message: "O corpo da requisição contém JSON inválido." });
    return;
  }

  console.error("Erro não tratado:", error);
  res.status(500).json({ message: "Erro interno do servidor." });
};

app.use(errorHandler);

const port = process.env.SERVER_PORT || 3001;

app.listen(port, () => {
  console.log(`🌿 API da Folhagem & Cia executando na porta ${port}`);
});
