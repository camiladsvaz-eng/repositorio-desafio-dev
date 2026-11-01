# Documentação da API — Folhagem & Cia

## 1. Visão geral

A API da Folhagem & Cia substitui o controle de plantas e estoque feito em planilhas. Ela permite cadastrar, consultar, atualizar e remover plantas, registrar vendas sem deixar o estoque negativo e consultar o valor total do estoque.

**Tecnologias:** Node.js 20+, Express 4, TypeScript, Prisma 5.22, PostgreSQL 16 e Docker.

## 2. Como executar

Pré-requisitos: Docker Desktop, Node.js 20+ e Yarn.

Na raiz do projeto:

```bash
cp .env.example .env
yarn
docker compose up -d --build
yarn migration
```

No PowerShell, para copiar o arquivo de ambiente, use `copy .env.example .env`.

A API ficará disponível em `http://localhost:3001`. Para verificar se está ativa, acesse a raiz `/`.

Comandos úteis:

- `docker compose logs -f server`: acompanha os logs da API.
- `docker compose down`: encerra os containers.
- `yarn typecheck`: verifica os tipos do TypeScript.
- `yarn studio`: abre o Prisma Studio.

## 3. Modelo de dados

A tabela `Planta` possui os seguintes campos:

| Campo | Tipo | Regra |
|---|---|---|
| `id` | Int | Identificador autoincremental |
| `nome` | String | Nome popular, obrigatório |
| `especie` | String | Nome científico, obrigatório |
| `preco` | Int | Preço em centavos, maior que zero |
| `estoque` | Int | Quantidade de vasos, maior ou igual a zero |
| `luminosidade` | Luminosidade | Um dos valores do enum |
| `petFriendly` | Boolean | Indica se é segura para pets |
| `regaACadaDias` | Int | Intervalo de rega, inteiro maior ou igual a 1 |
| `createdAt` | DateTime | Data de criação automática |
| `updatedAt` | DateTime | Data de atualização automática |

Valores aceitos para `Luminosidade`:

- `SOMBRA`
- `MEIA_SOMBRA`
- `SOL_PLENO`

O campo `preco` é armazenado em centavos para evitar imprecisões de ponto flutuante. Por exemplo, R$ 89,90 deve ser enviado como `8990`.

## 4. Rotas

Todas as rotas usam o prefixo `/plantas`. Os exemplos abaixo consideram a base `http://localhost:3001`.

### 4.1 Cadastrar planta

**POST** `/plantas`

Todos os campos da planta, exceto identificador e datas automáticas, devem ser enviados.

Requisição:

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

Sucesso: **201 Created**, com o objeto da planta cadastrada, incluindo `id`, `createdAt` e `updatedAt`.

### 4.2 Listar plantas

**GET** `/plantas`

Sem parâmetros, retorna todas as plantas. É possível combinar os filtros:

- `luminosidade`: `SOMBRA`, `MEIA_SOMBRA` ou `SOL_PLENO`.
- `petFriendly`: `true` ou `false`.

Exemplos:

- `GET /plantas?luminosidade=MEIA_SOMBRA`
- `GET /plantas?petFriendly=false`
- `GET /plantas?luminosidade=SOL_PLENO&petFriendly=true`

Sucesso: **200 OK**, com uma lista JSON. Se nenhum registro corresponder aos filtros, retorna uma lista vazia.

### 4.3 Buscar planta por identificador

**GET** `/plantas/:id`

Exemplo: `GET /plantas/1`.

Sucesso: **200 OK**, com o objeto da planta.

### 4.4 Atualizar planta

**PATCH** `/plantas/:id`

Atualiza somente os campos enviados. Os campos informados passam pelas mesmas validações do cadastro.

Exemplo: `PATCH /plantas/1`

```json
{
  "preco": 9500,
  "estoque": 8
}
```

Sucesso: **200 OK**, com o objeto atualizado.

### 4.5 Remover planta

**DELETE** `/plantas/:id`

Exemplo: `DELETE /plantas/1`.

Sucesso: **204 No Content**, sem corpo de resposta.

### 4.6 Registrar venda

**POST** `/plantas/:id/venda`

Corpo da requisição:

```json
{
  "quantidade": 2
}
```

A quantidade deve ser um inteiro maior que zero. A operação diminui o estoque e retorna **200 OK** com a planta atualizada.

Se não houver estoque suficiente, retorna **400 Bad Request** e o estoque permanece inalterado.

**Concorrência:** o decremento é feito por uma atualização condicional atômica no banco: o registro só é atualizado se o estoque ainda for maior ou igual à quantidade solicitada. Assim, duas vendas simultâneas não conseguem vender o mesmo último vaso.

### 4.7 Consultar valor total do estoque

**GET** `/plantas/estoque/valor-total`

Retorna o valor financeiro de todo o estoque e a quantidade total de vasos.

Exemplo de resposta (**200 OK**):

```json
{
  "valorTotalEmCentavos": 154300,
  "totalDeVasos": 37
}
```

O valor é calculado pela soma de `preco × estoque` de cada planta. Se não houver plantas cadastradas, os dois totais serão zero.

## 5. Erros e status HTTP

| Status | Quando ocorre |
|---|---|
| `200` | Consulta, atualização, venda ou cálculo concluído |
| `201` | Planta cadastrada |
| `204` | Planta removida com sucesso |
| `400` | Corpo inválido, campo ausente/inválido, filtro inválido, identificador inválido ou estoque insuficiente |
| `404` | Identificador de planta inexistente |
| `500` | Erro inesperado no servidor ou no acesso ao banco |

As respostas de erro usam JSON com a propriedade `message`, contendo uma explicação. Na venda sem estoque suficiente, a resposta também informa `estoqueDisponivel`.

## 6. Organização do código e decisões

A implementação mantém a separação do projeto-base:

- **Routes:** associa método e URL à função responsável.
- **Controller:** valida parâmetros e corpo, chama o repositório e define o status HTTP.
- **Repository:** concentra as operações realizadas com Prisma e PostgreSQL.
- **Schema e migration:** definem o modelo persistido e a criação da tabela.

Outras decisões:

1. O cadastro exige todos os campos de negócio; a atualização parcial valida somente os campos enviados.
2. Campos desconhecidos são rejeitados para evitar que dados não previstos sejam enviados ao banco.
3. Os filtros booleanos aceitam somente os textos `true` e `false`.
4. O estoque pode ser zero, mas nunca negativo.
5. O preço é inteiro em centavos.
6. A venda utiliza decremento condicional atômico para proteger o estoque em operações concorrentes.

## 7. Uso de ferramentas de IA

O desenvolvimento deste código contou com apoio do ChatGPT para estruturar a implementação, revisar validações e documentar as rotas. A pessoa responsável pelo projeto deve revisar, testar e compreender o código entregue antes da apresentação.
