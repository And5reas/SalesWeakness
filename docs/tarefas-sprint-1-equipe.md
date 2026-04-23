# 🚀 Plano de Ação (Sprint 4 - Motor de Gargalos)
**Duração:** Hoje e amanhã
**Tamanho da Equipe:** 5 Pessoas

Com base na arquitetura e no código atual (que já possui os Casos de Uso e o esqueleto do Worker, porém rodando em memória no `index.js`), aqui está a divisão de tarefas ideal para que vocês consigam entregar o MVP ponta-a-ponta até amanhã.

---

## 🧑‍💻 Pessoa 1: Arquiteto(a) de Dados & Repositórios (O "Fundador")
**Objetivo:** Tirar os dados da memória (RAM) e colocá-los no banco de dados real com segurança.
* **Tarefa 1.1:** Subir um PostgreSQL local (pode usar Docker/Docker Compose).
* **Tarefa 1.2:** Criar o schema inicial de tabelas baseando-se na documentação (Tabelas: `Campaigns`, `Stages`, `Leads`, `AuditLogs`).
* **Tarefa 1.3:** Implementar a fundação do Row Level Security (RLS) no PostgreSQL para garantir o isolamento por `companyId`.
* **Tarefa 1.4:** Substituir os repositórios em memória (ex: `InMemoryLeadRepository`) por implementações reais (ex: `PostgresLeadRepository`) conectando no banco (usando `pg`, Prisma ou TypeORM).

## 🛜 Pessoa 2: Especialista em Backend & API (O "Comunicador")
**Objetivo:** Garantir que o sistema receba dados externos de forma robusta e segura.
* **Tarefa 2.1:** Refatorar o servidor HTTP nativo (`index.js`) para um micro-framework moderno como Express ou Fastify para facilitar roteamento e middlewares.
* **Tarefa 2.2:** Criar o middleware de autenticação (verificar `x-api-key` ou JWT) para proteger o endpoint principal de ingestão (`POST /v1/leads/ingest`).
* **Tarefa 2.3:** Padronizar as respostas da API (sucesso e erros), garantindo que os Status Codes HTTP corretos sejam retornados e adicionar validação de payload (ex: Zod ou Joi).

## ⚙️ Pessoa 3: Engenheiro(a) de Background/Workers (O "Cérebro")
**Objetivo:** Fazer a inteligência artificial/algoritmo rodar continuamente sem travar o servidor.
* **Tarefa 3.1:** Isolar o `StagnationWorker` (que atualmente roda no `index.js`) para rodar em um processo separado (ou usar schedulers como `node-cron` ou `BullMQ`).
* **Tarefa 3.2:** Integrar a lógica do caso de uso `ScanStagnantLeadsUseCase` para buscar leads estagnados através de queries reais e performáticas no banco de dados.
* **Tarefa 3.3:** Implementar um mecanismo para evitar que o worker notifique o mesmo gargalo (o mesmo lead na mesma etapa) mais de uma vez (idempotência).

## 🎨 Pessoa 4: Desenvolvedor(a) Frontend / Dashboard (O "Apresentador")
**Objetivo:** Tornar tangível e visível o "dinheiro perdido" para encantar na apresentação.
* **Tarefa 4.1:** Criar um projeto Frontend básico (React, Vue, ou HTML/JS) para consumir a API.
* **Tarefa 4.2:** Montar uma tela que chame o endpoint `GET /v1/audit/bottlenecks` e exiba uma lista ou tabela com os "Leads Parados / Gargalos".
* **Tarefa 4.3:** Criar um painel de alerta visual utilizando os dados de `GET /v1/audit/conversion-latency` para provar o valor da ferramenta de imediato para a "Persona Diretor Comercial".

## 🛡️ Pessoa 5: QA, DevOps & Integração (O "Protetor")
**Objetivo:** Garantir que o código de todo mundo rode junto perfeitamente e possa ser testado.
* **Tarefa 5.1:** Criar um `docker-compose.yml` que suba o banco de dados e a aplicação com apenas um comando (para facilitar a vida do resto da equipe).
* **Tarefa 5.2:** Configurar um Linter (ESLint + Prettier) para padronizar o código de todo mundo antes dos commits.
* **Tarefa 5.3:** Escrever testes de integração ponta-a-ponta (E2E): Fazer uma chamada na API para ingerir lead (`POST /v1/leads/ingest`), forçar a mudança de tempo no banco de dados e verificar se o Worker captura e salva no log de auditoria.
