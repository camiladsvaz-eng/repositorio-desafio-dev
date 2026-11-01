# Folhagem & Cia — API de Loja de Plantas

API REST para gerenciar o catálogo e o estoque de uma loja de plantas.

**Stack:** Node.js 20 · Express · TypeScript · Prisma 5.22 · PostgreSQL 16 · Docker.

A documentação completa das rotas, exemplos de requisição e resposta, validações e decisões está em [DOCUMENTACAO_API.md](DOCUMENTACAO_API.md). O enunciado original está em [DESAFIO.md](DESAFIO.md).

## Pré-requisitos

- Docker Desktop em execução
- Node.js 20+
- Yarn
- Cliente HTTP para testes (Thunder Client, Insomnia ou Postman)

## Como executar

Na raiz do repositório:

```bash
# Crie o arquivo de variáveis de ambiente
cp .env.example .env
# No PowerShell: copy .env.example .env

# Instale as dependências
yarn

# Suba a API e o PostgreSQL
docker compose up -d --build

# Crie/aplique a migration do modelo Planta
yarn migration
```

A API ficará disponível em `http://localhost:3001`.

## Comandos úteis

| Comando | Ação |
|---|---|
| `docker compose up -d` | Inicia os containers |
| `docker compose down` | Encerra os containers |
| `docker compose logs -f server` | Exibe os logs da API |
| `yarn migration` | Cria/aplica migrations em desenvolvimento |
| `yarn studio` | Abre o Prisma Studio |
| `yarn typecheck` | Verifica os tipos TypeScript |

## Estrutura

```
prisma/
  schema.prisma
  migrations/
src/
  server.ts
  routes.ts
  database/
  controllers/
    PlantController.ts
  repositories/
    PlantRepository.ts
DOCUMENTACAO_API.md
DESAFIO.md
```

## Rotas implementadas

| Método | Rota | Descrição |
|---|---|---|
| POST | `/plantas` | Cadastra uma planta |
| GET | `/plantas` | Lista plantas; filtros `luminosidade` e `petFriendly` |
| GET | `/plantas/:id` | Busca uma planta |
| PATCH | `/plantas/:id` | Atualiza parcialmente uma planta |
| DELETE | `/plantas/:id` | Remove uma planta |
| POST | `/plantas/:id/venda` | Registra venda e decrementa o estoque |
| GET | `/plantas/estoque/valor-total` | Calcula valor e quantidade total do estoque |

Consulte [DOCUMENTACAO_API.md](DOCUMENTACAO_API.md) para os corpos JSON, exemplos de respostas e regras de erro.

## Observações

- Preços são enviados em centavos (por exemplo, R$ 89,90 = `8990`).
- O estoque aceita zero, mas não valores negativos.
- A venda usa decremento condicional atômico no banco para evitar estoque negativo em vendas simultâneas.
- O arquivo `.env` não deve ser versionado; use `.env.example` como modelo.
