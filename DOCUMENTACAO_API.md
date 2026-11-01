# Documentação da API — Folhagem & Cia

## 1. Visão geral

API REST para substituir a planilha de controle da loja Folhagem & Cia. Permite cadastrar e consultar plantas, atualizar dados, controlar estoque, registrar vendas e calcular o valor total do inventário.

**Tecnologias:** Node.js 20, Express, TypeScript, Prisma 5.22, PostgreSQL 16 e Docker.

## 2. Como executar

1. Instale Docker Desktop, Node.js 20+ e Yarn.
2. Copie `.env.example` para `.env` na raiz do projeto.
3. Execute `yarn` para instalar as dependências.
4. Com o Docker Desktop aberto, execute `docker compose up -d --build`.
5. Execute `yarn migration` para aplicar as migrations.
6. A API estará disponível em `http://localhost:3001`.

A rota raiz `GET /` responde `{ "message": "API da Folhagem & Cia 🌿" }`.

## 3. Modelo de dados

| Campo | Tipo | Regra/descrição |
|---|---|---|
| id | Int | Identificador autoincremental |
| nome | String | Nome popular |
| especie | String | Nome científico |
| preco | Int | Preço em centavos, maior que zero |
| estoque | Int | Vasos disponíveis, zero ou mais |
| luminosidade | Luminosidade | SOMBRA, MEIA_SOMBRA ou SOL_PLENO |
| petFriendly | Boolean | Indica se é segura para pets |
| regaACadaDias | Int | Intervalo de rega, pelo menos 1 |
| createdAt | DateTime | Data de criação automática |
| updatedAt | DateTime | Data de atualização automática |

Todos os campos de negócio são obrigatórios no POST. No PATCH, são opcionais, mas cada campo enviado precisa respeitar seu tipo e regra.

## 4. Rotas

### POST /plantas — cadastrar

Exemplo de corpo:

```json
{
  "nome": "Costela-de-adão",
  "especie": "Monstera deliciosa",
  "preco": 8990,
  "estoque": 12,
  "luminosidade": "MEIA_SOMBRA",
  "petFriendly": false,
  "regaACadaDias": 3
}
```

Retorna **201** com o registro criado e os campos automáticos.

### GET /plantas — listar

Retorna **200** com uma lista (inclusive `[]`, caso vazia). Filtros opcionais combináveis:

- `luminosidade=SOMBRA|MEIA_SOMBRA|SOL_PLENO`
- `petFriendly=true|false`
- Bônus: `nome=costela` (busca parcial sem diferenciar maiúsculas/minúsculas)
- Bônus: `ordem=nome|preco` (ordem crescente)

Exemplo: `GET /plantas?luminosidade=MEIA_SOMBRA&petFriendly=false&ordem=preco`.

### GET /plantas/:id — buscar por ID

Exemplo: `GET /plantas/1`. Retorna **200** e o registro encontrado.

### PATCH /plantas/:id — atualizar

Envie somente os campos que deseja alterar. Exemplo:

```json
{ "estoque": 15, "preco": 9500 }
```

Retorna **200** com o registro atualizado. Corpo vazio ou campos inválidos retornam **400**.

### DELETE /plantas/:id — excluir

Retorna **204**, sem corpo, quando a planta é excluída.

### POST /plantas/:id/venda — registrar venda

Corpo:

```json
{ "quantidade": 2 }
```

A quantidade deve ser um inteiro positivo. Retorna **200** com o registro e o estoque atualizado. Se não houver estoque suficiente, retorna **400** e não altera o estoque.

### GET /plantas/estoque/valor-total — resumo do inventário

Retorna **200**:

```json
{
  "valorTotalEmCentavos": 154300,
  "totalDeVasos": 37
}
```

O valor é a soma de `preco × estoque` e a quantidade é a soma de todos os estoques. Sem registros, ambos são zero.

### GET /plantas/esgotadas — bônus

Retorna **200** com as plantas cujo estoque é zero.

## 5. Erros e status HTTP

| Status | Situação |
|---|---|
| 200 | Consulta, atualização, venda ou cálculo concluído |
| 201 | Planta cadastrada |
| 204 | Planta excluída |
| 400 | JSON/campo inválido, campo obrigatório ausente, filtro inválido, ID inválido ou estoque insuficiente |
| 404 | Planta não encontrada ou rota inexistente |
| 500 | Erro inesperado no servidor ou banco |

Erros retornam JSON com a propriedade `message`, por exemplo:

```json
{ "message": "Estoque insuficiente para realizar a venda." }
```

## 6. Seed de exemplo

O projeto inclui um seed opcional com cinco plantas. Após aplicar as migrations, execute `yarn seed`. O script só insere os exemplos quando a tabela está vazia, evitando duplicação em execuções repetidas.

## 7. Decisões e bônus

- Preços são inteiros em centavos para evitar imprecisão de ponto flutuante.
- Controller valida os dados e define status HTTP; repository concentra as operações Prisma.
- A venda usa decremento condicional atômico no PostgreSQL: a operação só ocorre se o estoque for suficiente. Isso impede que vendas simultâneas vendam a mesma unidade e deixem estoque negativo.
- Bônus implementados: busca parcial por nome sem diferenciar caixa, ordenação por nome/preço e listagem de plantas esgotadas.
- Seed incluído como funcionalidade opcional: cinco plantas de exemplo são inseridas somente se a tabela estiver vazia.
