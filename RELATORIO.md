# Relatório do desafio — Folhagem & Cia

## 1. O que foi feito

Foi desenvolvida uma API REST para a loja Folhagem & Cia, utilizando Node.js, Express, TypeScript, Prisma e PostgreSQL.

A API implementa as operações de cadastro, listagem, consulta por ID, atualização parcial e exclusão de plantas. Também foram implementados os filtros por luminosidade e por indicação pet-friendly, que podem ser combinados, além do registro de vendas e da consulta ao valor total do estoque.

As regras de validação exigem os campos de negócio no cadastro e validam individualmente os campos enviados em uma atualização. A API também trata IDs inválidos, registros inexistentes, filtros incorretos e tentativas de venda sem estoque suficiente, retornando os respectivos status HTTP.

Além dos requisitos principais, foram implementados os bônus:
- busca parcial por nome, sem diferenciar letras maiúsculas e minúsculas;
- ordenação por nome ou preço;
- rota para listar plantas com estoque zerado;
- script de seed com cinco plantas de exemplo.

Também foram preparados o README, a documentação detalhada das rotas e exemplos de requisições, uma migration para o modelo Planta e um workflow de integração contínua.

## 2. Como foi feito

A implementação foi organizada em três camadas principais: rotas, controller e repository.

As rotas, em `src/routes.ts`, associam cada método e caminho HTTP à função responsável. As rotas fixas, como `/plantas/esgotadas` e `/plantas/estoque/valor-total`, foram registradas antes da rota dinâmica `/plantas/:id`, para evitar que seus nomes fossem interpretados como identificadores.

O controller, em `src/controllers/PlantaController.ts`, concentra a validação das entradas e a definição das respostas HTTP. Foi utilizada uma validação comum para criação e atualização: no POST, todos os campos de negócio são obrigatórios; no PATCH, somente os campos enviados são validados. Assim, uma atualização pode alterar apenas um atributo sem modificar os demais.

O repository, em `src/repositories/PlantaRepository.ts`, concentra as operações realizadas com o Prisma. O modelo foi definido em `prisma/schema.prisma`, e a migration correspondente cria a tabela Planta, o enum de luminosidade e restrições para preço, estoque e intervalo de rega.

Os preços são armazenados em centavos, como inteiros, evitando imprecisão de ponto flutuante. Para calcular o valor total do estoque, são consultados apenas preço e quantidade de cada planta, e o produto desses valores é somado no código.

Na venda, foi adotada uma atualização condicional e atômica no banco: o estoque só é decrementado quando a quantidade disponível é suficiente. Essa decisão também protege o sistema em vendas simultâneas. Se duas requisições tentarem comprar unidades que não podem ser atendidas em conjunto, apenas a operação que satisfizer a condição de estoque será concluída.

Por fim, foi configurado um workflow no GitHub Actions para validar o schema do Prisma, gerar o cliente, verificar os tipos TypeScript, compilar o projeto, aplicar migrations, executar o seed e realizar testes HTTP automatizados.

## 3. Principais dificuldades e como foram tratadas

Um dos pontos que exigiu atenção foi a validação dos dados recebidos pela API. Como os parâmetros de consulta chegam como texto, foi necessário validar os valores permitidos e converter explicitamente o filtro `petFriendly` para booleano, sem confundir a ausência do filtro com o valor `false`.

Outro cuidado foi diferenciar os casos de erro. Um ID com formato inválido deve retornar 400; um ID válido sem registro correspondente deve retornar 404; e uma entrada válida que não encontra resultados em uma listagem deve retornar 200 com uma lista vazia.

A venda apresentou uma questão adicional: verificar o estoque e depois decrementá-lo em operações separadas poderia permitir que duas vendas simultâneas consumissem a mesma quantidade. Para evitar essa condição de corrida, a verificação e o decremento foram combinados em uma atualização condicional atômica no banco de dados.

Durante a revisão da automação, também foi identificado que era importante testar o comportamento HTTP da aplicação, e não apenas verificar se o projeto compilava. Por isso, foram incluídos testes de integração que exercitam cadastro, filtros, atualização, venda concorrente, resumo do estoque e exclusão.

## 4. Uso de inteligência artificial

Foi utilizada a ferramenta ChatGPT como apoio durante o desenvolvimento. Ela auxiliou na interpretação dos requisitos, na estruturação da implementação, na elaboração e revisão de trechos de código, na documentação e na identificação de pontos que precisavam de testes adicionais.

As sugestões não foram tratadas como garantia de funcionamento. A implementação foi conferida por meio da revisão dos arquivos do projeto e de um workflow automatizado no GitHub Actions, que executa validações do Prisma, verificação de tipos, compilação, migrations, seed e testes HTTP. O cenário de vendas simultâneas também foi incluído nos testes.

O uso da ferramenta serviu como apoio ao desenvolvimento; é importante compreender as decisões e o funcionamento do código entregue para conseguir explicá-los e realizar alterações quando necessário.
