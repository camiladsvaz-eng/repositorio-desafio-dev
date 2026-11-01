-- Remove o modelo de exemplo do template e cria o modelo exigido pelo desafio.
DROP TABLE "User";
DROP TYPE "Conta";

CREATE TYPE "Luminosidade" AS ENUM ('SOMBRA', 'MEIA_SOMBRA', 'SOL_PLENO');

CREATE TABLE "Planta" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "preco" INTEGER NOT NULL,
    "estoque" INTEGER NOT NULL,
    "luminosidade" "Luminosidade" NOT NULL,
    "petFriendly" BOOLEAN NOT NULL,
    "regaACadaDias" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Planta_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Planta_preco_check" CHECK ("preco" > 0),
    CONSTRAINT "Planta_estoque_check" CHECK ("estoque" >= 0),
    CONSTRAINT "Planta_regaACadaDias_check" CHECK ("regaACadaDias" >= 1)
);
