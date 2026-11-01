# Folhagem & Cia — API de Loja de Plantas

API REST para cadastrar plantas, consultar o catálogo, controlar estoque e registrar vendas.

**Stack:** Node.js 20 · Express · TypeScript · Prisma 5.22 · PostgreSQL 16 · Docker.

## Como executar

Pré-requisitos: Docker Desktop, Node.js 20+ e Yarn.

1. Copie `.env.example` para `.env` (no Windows: `copy .env.example .env`).
2. Instale as dependências: `yarn`.
3. Com Docker Desktop aberto, suba os serviços: `docker compose up -d --build`.
4. Aplique as migrations: `yarn migration`.
5. A API estará em `http://localhost:3001`.

## Comandos úteis

| Comando | Função |
|---|---|
| `yarn dev` | Executa a API em desenvolvimento |
| `yarn migration` | Cria/aplica migrations localmente |
| `yarn migration:deploy` | Aplica migrations commitadas |
| `yarn generate` | Gera Prisma Client |
| `yarn typecheck` | Verifica tipos TypeScript |
| `yarn build` | Compila para `dist/` |
| `yarn seed` | Cadastra plantas de exemplo se o banco estiver vazio |
| `docker compose logs -f server` | Mostra logs da API |

## Organização

```
prisma/schema.prisma
prisma/migrations/
src/controllers/PlantaController.ts
src/repositories/PlantaRepository.ts
src/database/index.ts
src/routes.ts
src/server.ts
DOCUMENTACAO_API.md
```

O fluxo é **rota → controller → repository → Prisma/PostgreSQL**. O controller valida entradas e monta respostas HTTP; o repository concentra consultas e alterações no banco.

## Modelo e rotas

A entidade `Planta` possui: `id`, `nome`, `especie`, `preco` (centavos), `estoque`, `luminosidade`, `petFriendly`, `regaACadaDias`, `createdAt` e `updatedAt`. O enum de luminosidade aceita `SOMBRA`, `MEIA_SOMBRA` e `SOL_PLENO`.

| Método | Rota | Função |
|---|---|---|
| POST | `/plantas` | Cadastra |
| GET | `/plantas` | Lista e filtra |
| GET | `/plantas/:id` | Busca por ID |
| PATCH | `/plantas/:id` | Atualiza parcialmente |
| DELETE | `/plantas/:id` | Exclui |
| POST | `/plantas/:id/venda` | Registra venda |
| GET | `/plantas/estoque/valor-total` | Calcula valor e quantidade do estoque |
| GET | `/plantas/esgotadas` | Lista plantas sem estoque (bônus) |

Os exemplos de requisições, respostas, filtros e erros estão em [DOCUMENTACAO_API.md](DOCUMENTACAO_API.md).

## Decisões

- Preços armazenados em centavos.
- Filtros de luminosidade e pet-friendly podem ser combinados.
- Busca por nome sem diferenciar maiúsculas/minúsculas e ordenação por nome/preço.
- Venda feita com decremento condicional atômico no banco para evitar estoque negativo em vendas simultâneas.
- A migration remove o modelo de usuário do template e cria o modelo Planta.
- O seed opcional inclui cinco plantas de exemplo e não duplica registros se executado novamente. Rode `yarn seed` após aplicar as migrations.
