const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const quantidadeAtual = await prisma.planta.count();

  // Não duplica os dados se o comando for executado novamente.
  if (quantidadeAtual > 0) {
    console.log("Seed ignorado: já existem plantas cadastradas.");
    return;
  }

  await prisma.planta.createMany({
    data: [
      {
        nome: "Costela-de-adão",
        especie: "Monstera deliciosa",
        preco: 8990,
        estoque: 12,
        luminosidade: "MEIA_SOMBRA",
        petFriendly: false,
        regaACadaDias: 3,
      },
      {
        nome: "Jiboia",
        especie: "Epipremnum aureum",
        preco: 3590,
        estoque: 8,
        luminosidade: "MEIA_SOMBRA",
        petFriendly: false,
        regaACadaDias: 4,
      },
      {
        nome: "Suculenta",
        especie: "Echeveria elegans",
        preco: 1990,
        estoque: 0,
        luminosidade: "SOL_PLENO",
        petFriendly: true,
        regaACadaDias: 10,
      },
      {
        nome: "Espada-de-são-jorge",
        especie: "Dracaena trifasciata",
        preco: 4290,
        estoque: 5,
        luminosidade: "MEIA_SOMBRA",
        petFriendly: false,
        regaACadaDias: 7,
      },
      {
        nome: "Samambaia",
        especie: "Nephrolepis exaltata",
        preco: 5490,
        estoque: 4,
        luminosidade: "SOMBRA",
        petFriendly: true,
        regaACadaDias: 2,
      },
    ],
  });

  console.log("Seed concluído: plantas de exemplo cadastradas.");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
