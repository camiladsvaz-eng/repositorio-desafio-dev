const assert = require("node:assert/strict");

const baseUrl = process.env.API_URL || "http://localhost:3001";

async function requisicao(path, options = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

async function main() {
  const raiz = await requisicao("/");
  assert.equal(raiz.status, 200, "GET / deve retornar 200");

  const lista = await requisicao("/plantas");
  assert.equal(lista.status, 200, "GET /plantas deve retornar 200");
  assert.ok(Array.isArray(await lista.json()), "GET /plantas deve retornar uma lista");

  const filtroInvalido = await requisicao("/plantas?petFriendly=talvez");
  assert.equal(filtroInvalido.status, 400, "Filtro inválido deve retornar 400");

  const cadastroInvalido = await requisicao("/plantas", {
    method: "POST",
    body: JSON.stringify({
      nome: "Planta inválida",
      especie: "Planta testis",
      preco: 0,
      estoque: 1,
      luminosidade: "SOMBRA",
      petFriendly: true,
      regaACadaDias: 2,
    }),
  });
  assert.equal(cadastroInvalido.status, 400, "Preço zero deve ser rejeitado");

  const nomeUnico = `Planta de teste ${Date.now()}`;
  const cadastro = await requisicao("/plantas", {
    method: "POST",
    body: JSON.stringify({
      nome: nomeUnico,
      especie: "Planta testis",
      preco: 2500,
      estoque: 2,
      luminosidade: "MEIA_SOMBRA",
      petFriendly: true,
      regaACadaDias: 5,
    }),
  });
  assert.equal(cadastro.status, 201, "Cadastro válido deve retornar 201");
  const planta = await cadastro.json();
  assert.ok(Number.isInteger(planta.id), "Resposta do cadastro deve conter id");

  const buscaNome = await requisicao(`/plantas?nome=${encodeURIComponent(nomeUnico.toLowerCase())}`);
  assert.equal(buscaNome.status, 200);
  const encontradas = await buscaNome.json();
  assert.ok(encontradas.some((item) => item.id === planta.id), "Busca por nome deve ignorar maiúsculas");

  const atualizacao = await requisicao(`/plantas/${planta.id}`, {
    method: "PATCH",
    body: JSON.stringify({ estoque: 3 }),
  });
  assert.equal(atualizacao.status, 200, "PATCH deve retornar 200");
  assert.equal((await atualizacao.json()).estoque, 3, "PATCH deve atualizar estoque");

  const vendasSimultaneas = await Promise.all([
    requisicao(`/plantas/${planta.id}/venda`, {
      method: "POST",
      body: JSON.stringify({ quantidade: 2 }),
    }),
    requisicao(`/plantas/${planta.id}/venda`, {
      method: "POST",
      body: JSON.stringify({ quantidade: 2 }),
    }),
  ]);
  const statusVendas = vendasSimultaneas.map((resposta) => resposta.status).sort();
  assert.deepEqual(statusVendas, [200, 400], "De duas vendas simultâneas de 2 vasos com estoque 3, apenas uma deve ser aceita");

  const consultaAposConcorrencia = await requisicao(`/plantas/${planta.id}`);
  assert.equal((await consultaAposConcorrencia.json()).estoque, 1, "Vendas simultâneas não podem deixar estoque negativo");

  const vendaSemEstoque = await requisicao(`/plantas/${planta.id}/venda`, {
    method: "POST",
    body: JSON.stringify({ quantidade: 2 }),
  });
  assert.equal(vendaSemEstoque.status, 400, "Venda sem estoque deve retornar 400");

  const consultaAposFalha = await requisicao(`/plantas/${planta.id}`);
  assert.equal((await consultaAposFalha.json()).estoque, 1, "Venda recusada não pode alterar estoque");

  const resumo = await requisicao("/plantas/estoque/valor-total");
  assert.equal(resumo.status, 200, "Resumo do estoque deve retornar 200");
  const valores = await resumo.json();
  assert.ok(Number.isInteger(valores.valorTotalEmCentavos));
  assert.ok(Number.isInteger(valores.totalDeVasos));

  const esgotadas = await requisicao("/plantas/esgotadas");
  assert.equal(esgotadas.status, 200);
  assert.ok(Array.isArray(await esgotadas.json()));

  const exclusao = await requisicao(`/plantas/${planta.id}`, { method: "DELETE" });
  assert.equal(exclusao.status, 204, "DELETE deve retornar 204");

  const buscaExcluida = await requisicao(`/plantas/${planta.id}`);
  assert.equal(buscaExcluida.status, 404, "Planta excluída deve retornar 404");

  console.log("Smoke tests concluídos com sucesso.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
