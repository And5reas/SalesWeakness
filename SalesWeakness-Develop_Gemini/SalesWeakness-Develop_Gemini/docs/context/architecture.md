# SalesWeakness — Documento de Arquitetura

> **Versão:** 1.0 | **Classificação:** Confidencial — Uso Interno
> **Última atualização:** Março de 2026
> **Elaborado por:** Engenharia de Software

---

## Índice

1. [Visão Arquitetural](#1-visão-arquitetural)
2. [Princípios e Decisões de Design](#2-princípios-e-decisões-de-design)
3. [Diagrama de Alto Nível](#3-diagrama-de-alto-nível)
4. [Camadas e Componentes](#4-camadas-e-componentes)
5. [Modelo de Segurança e Multi-tenancy](#5-modelo-de-segurança-e-multi-tenancy)
6. [Modelo de Dados](#6-modelo-de-dados)
7. [APIs e Contratos de Interface](#7-apis-e-contratos-de-interface)
8. [Processamento Assíncrono e Workers](#8-processamento-assíncrono-e-workers)
9. [Estratégia de Cache](#9-estratégia-de-cache)
10. [Mensageria e Webhooks](#10-mensageria-e-webhooks)
11. [Módulos do Sistema](#11-módulos-do-sistema)
12. [Stack Tecnológica](#12-stack-tecnológica)
13. [Requisitos Não-Funcionais e Metas de SLA](#13-requisitos-não-funcionais-e-metas-de-sla)
14. [Estratégia de Observabilidade](#14-estratégia-de-observabilidade)
15. [Infraestrutura e Deploy](#15-infraestrutura-e-deploy)
16. [Escopo Negativo e Restrições Arquiteturais](#16-escopo-negativo-e-restrições-arquiteturais)
17. [Roadmap Arquitetural](#17-roadmap-arquitetural)
18. [Glossário](#18-glossário)

---

## 1. Visão Arquitetural

O SalesWeakness é uma plataforma **SaaS multi-tenant** de CRM e Automação de Marketing cujo diferencial reside no **diagnóstico ativo de performance comercial**. A arquitetura foi desenhada para suportar três capacidades centrais de forma simultânea e sem degradação:

1. **Detecção contínua de fragilidades** no pipeline de vendas (processamento em background de baixa latência).
2. **Consultas analíticas pesadas** respondidas em tempo real para usuários interativos (P95 < 300ms).
3. **Automação de reativação** de leads via integrações com canais externos (e-mail, WhatsApp) de forma resiliente e rastreável.

Essas três capacidades possuem características de carga, latência e consistência distintas. Portanto, a arquitetura as isola em serviços especializados, compartilhando apenas a camada de persistência (PostgreSQL) e a camada de mensageria (RabbitMQ/SQS).

---

## 2. Princípios e Decisões de Design

### 2.1 High Risk First

A priorização de desenvolvimento segue a estratégia **High Risk First (Fail Fast)**. Os componentes com maior complexidade técnica e maior valor de negócio são construídos primeiro: isolamento multi-tenant (UC01), detecção de gargalos (UC06) e relatório de auditoria (UC08). Isso garante que os riscos técnicos mais críticos sejam validados antes do crescimento do sistema.

### 2.2 Isolamento de Dados como Fundação

A plataforma é multi-tenant desde o primeiro dia. O isolamento não é uma camada adicional — é uma restrição de design que permeia cada query, cada endpoint e cada job de background. O mecanismo principal é **Row Level Security (RLS) no PostgreSQL**, complementado por **JWT Scopes** na camada de API.

### 2.3 Separação entre Leitura e Escrita (CQRS Parcial)

O endpoint `GET /v1/funnel/audit` executa queries analíticas complexas com CTEs e médias móveis. Para garantir P95 < 300ms sem comprometer a escrita do pipeline, os agregados de leitura são servidos por um cache Redis com TTL configurável, isolando a carga de analytics do banco transacional.

### 2.4 Ingestão Passiva de Leads

A API `POST /v1/leads/ingest` apenas registra o lead no banco. Não há round robin, atribuição automática de vendedores ou triggers síncronos na ingestão. Decisões de distribuição são responsabilidade de processos externos ou de fases subsequentes do pipeline — mantendo a ingestão simples, resiliente e auditável.

### 2.5 Soft Delete e Rastreabilidade Total

Nenhum dado é deletado fisicamente. Leads inativos recebem a flag `is_inactive = true` (RF03). Oportunidades perdidas exigem preenchimento de `lost_reason` (RF04). Toda mudança de status gera registro imutável em `audit_logs`. Isso garante rastreabilidade completa da origem do lead até o resultado final, preservando o histórico para BI e auditoria.

### 2.6 Resiliência na Automação

Todos os disparos externos (WhatsApp, e-mail, webhooks) são enfileirados em uma Message Queue antes de serem enviados. Isso desacopla a detecção da fragilidade do disparo da automação, permite retry logic com backoff exponencial e garante que falhas em APIs externas não impactem a experiência do usuário.

---

## 3. Diagrama de Alto Nível

```
┌──────────────────────────────────────────────────────────────────────┐
│                      CLIENTES (Frontend Web)                         │
│   Diretor Comercial | Gestor de Marketing | SDR / Vendedor           │
│   /dashboard/director | /dashboard/marketing | /dashboard/sales-rep  │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ HTTPS / WebSocket
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                                  │
│     Validação JWT | Injeção de tenant_id | Rate Limiting             │
│     Roteamento para serviços de negócio                              │
└──────┬──────────────────────┬──────────────────────┬─────────────────┘
       │                      │                      │
       ▼                      ▼                      ▼
┌─────────────┐  ┌────────────────────────┐  ┌──────────────────────┐
│  Serviço    │  │  Serviço de Analytics  │  │  Serviço de          │
│  de CRM     │  │  (Funil / Auditoria)   │  │  Automação (Réguas)  │
│             │  │                        │  │                      │
│ PATCH deals │  │ GET /funnel/audit      │  │ Gestão de réguas     │
│ POST ingest │  │ Cache Redis (P95<300ms)│  │ Disparo WhatsApp/Mail│
│ Kanban API  │  │ CTEs + Agregados       │  │ Retry Logic          │
└──────┬──────┘  └───────────┬────────────┘  └──────────┬───────────┘
       │                     │                           │
       └─────────────────────┼───────────────────────────┘
                             │
       ┌─────────────────────▼───────────────────────────┐
       │                 CAMADA DE DADOS                  │
       │                                                  │
       │  PostgreSQL (RLS ativo) │ Redis (Cache/Filas)   │
       │  Isolamento por tenant  │ TTL configurável       │
       └────────────────────────┬────────────────────────┘
                                │
       ┌────────────────────────▼────────────────────────┐
       │          PROCESSAMENTO EM BACKGROUND             │
       │                                                  │
       │  Worker: Detecção de Estagnação 48h (Cron)      │
       │  Worker: Marcação de Inatividade 180d (Cron)    │
       │  Worker: Consumidor de Fila (Webhooks/Automação)│
       └────────────────────────┬────────────────────────┘
                                │
       ┌────────────────────────▼────────────────────────┐
       │           MESSAGE QUEUE (RabbitMQ / SQS)         │
       │                                                  │
       │  Fila: lead.stagnated                           │
       │  Fila: lead.inactive                            │
       │  Fila: campaign.low_conversion                  │
       │  Fila: outbound.email                           │
       │  Fila: outbound.whatsapp                        │
       └─────────────────────────────────────────────────┘
```

---

## 4. Camadas e Componentes

### 4.1 Frontend Web (Interface Responsiva)

Camada de apresentação 100% web, sem aplicativo mobile no MVP. Responsável por renderizar os dashboards por perfil de usuário e o Kanban de pipeline.

**Requisito técnico crítico:** O dashboard do SDR deve atualizar o Kanban em **tempo real** via WebSocket ou polling curto (< 5s), refletindo leads recém-estagnados sem recarregamento de página. Isso é viabilizado pela conexão direta ao API Gateway via WebSocket, com eventos emitidos pelo Serviço de CRM ao detectar mudanças de estado.

### 4.2 API Gateway

Ponto de entrada centralizado de todas as requisições. Responsabilidades:

- **Validação de JWT:** verifica assinatura, expiração e escopos do token a cada requisição.
- **Injeção de contexto de tenant:** extrai `tenant_id` do JWT e o disponibiliza para todos os serviços downstream, onde o PostgreSQL aplica o RLS automaticamente.
- **Rate Limiting:** proteção contra abuso por tenant ou por endpoint.
- **Roteamento:** direciona requisições para os serviços de negócio correspondentes.

### 4.3 Serviço de CRM

Gerencia o ciclo de vida das oportunidades e leads dentro do pipeline. Principais responsabilidades:

- `POST /v1/leads/ingest`: registro passivo de leads com validação de duplicidade por e-mail dentro do tenant.
- `PATCH /v1/deals/{id}/status`: atualização de estágio, reset do contador de 48h via `updated_at`, validação de `lost_reason` obrigatório ao fechar como `Lost`, e publicação de evento na fila quando relevante.
- Suporte ao Kanban via API de leitura do pipeline por vendedor (isolado por RLS).

### 4.4 Serviço de Analytics

Executa e serve os relatórios de auditoria de funil. É o componente de leitura mais crítico em termos de performance.

- Executa queries com **CTEs** e cálculos de médias móveis sobre PostgreSQL.
- Todas as respostas de `GET /v1/funnel/audit` são cacheadas no Redis com TTL configurável.
- Cache miss: executa a query completa, armazena no Redis e responde.
- Cache hit: resposta direta do Redis em < 50ms.
- Isolamento garantido: o cache é particionado por `tenant_id` e pelo conjunto de filtros aplicados (período, campanha, vendedor).

### 4.5 Serviço de Automação

Responsável por executar as réguas de reativação de leads. Opera de forma puramente assíncrona:

- Consome eventos `lead.stagnated` da fila de mensageria.
- Determina qual régua se aplica ao lead (por estágio, campanha ou configuração do tenant).
- Enfileira disparos na fila de saída (`outbound.email`, `outbound.whatsapp`).
- Registra histórico de cada disparo vinculado ao lead para consulta no Dashboard do SDR.
- Implementa **retry logic com backoff exponencial** (máximo 3 tentativas) em caso de falha da API externa.

### 4.6 Workers de Background

Processos isolados executados periodicamente via Cron Job:

| Worker | Frequência Recomendada | Responsabilidade |
|---|---|---|
| `stagnation-detector` | A cada 15 minutos | Varre `opportunities` com `status = 'Open'` e `NOW() - updated_at >= 48h`. Gera `audit_log` + publica `lead.stagnated` na fila. |
| `inactivity-tagger` | Diariamente (madrugada) | Varre `leads` sem interação por 180+ dias. Atualiza `is_inactive = true` + publica `lead.inactive` na fila. |
| `queue-consumer` | Contínuo | Consome eventos das filas de mensageria e aciona ações correspondentes (automações, webhooks de saída). |

**Cuidado de implementação crítico:** O `stagnation-detector` deve processar oportunidades em lotes com paginação para não travar o banco de dados em grandes volumes. Recomenda-se processar em batches de 500 registros com delay entre batches.

---

## 5. Modelo de Segurança e Multi-tenancy

### 5.1 Arquitetura Multi-tenant com Isolamento Lógico

A plataforma opera em modelo **multi-tenant com isolamento lógico via RLS**. Todos os tenants compartilham a mesma instância de banco de dados, mas o PostgreSQL garante via política de RLS que nenhuma query de um tenant acesse dados de outro.

**Implementação do RLS (exemplo para a tabela `opportunities`):**

```sql
-- Política de isolamento por tenant
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON opportunities
  USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- Immutability de audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_insert_only ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id')::INTEGER);
-- Nenhuma política de UPDATE ou DELETE é criada (registros imutáveis por design)
```

O `tenant_id` é injetado via `SET LOCAL app.current_tenant_id = ?` em cada conexão, logo após a validação do JWT no API Gateway.

### 5.2 JWT e Escopos de Acesso

Cada JWT contém os seguintes claims relevantes:

```json
{
  "sub": "user_id",
  "tenant_id": "tenant_abc123",
  "profile": "director",
  "scopes": ["analytics:read"],
  "exp": 1711929600
}
```

| Perfil | Escopos JWT | Acesso |
|---|---|---|
| `director` | `analytics:read` | Relatórios agregados, auditoria de funil, ROI por campanha |
| `marketing_manager` | `campaigns:read`, `leads:read` | Qualidade de leads, velocidade de contato, exportação CSV |
| `sales_rep` | `deals:read`, `deals:write` | Pipeline individual (RLS por `user_id`), Kanban, automações recebidas |

### 5.3 Feature Flags

Módulos contratados individualmente são liberados via Feature Flags armazenadas em tabela de permissões por tenant. Implementação via biblioteca de Feature Flags ou tabela simples:

```sql
Table tenant_features {
  tenant_id  integer
  feature    varchar  -- Ex: 'automation', 'advanced_analytics'
  enabled    boolean
}
```

O API Gateway verifica a Feature Flag antes de rotear para o serviço correspondente, retornando `403 Feature Not Available` se o módulo não estiver contratado.

---

## 6. Modelo de Dados

### 6.1 Diagrama de Relacionamentos

```
campaigns ──(1:N)──► leads ──(1:1)──► contacts
                      │
                      └──(1:N)──► opportunities ──(N:1)──► stages
                                        │
                                        └──(1:N)──► audit_logs
```

### 6.2 Schema DBML (Consolidado)

```dbml
Table campaigns {
  id          integer    [primary key]
  tenant_id   integer    [not null]        // Partição de tenant para RLS
  name        varchar
  budget      decimal
  status      varchar
  created_at  timestamp
}

Table leads {
  id          integer    [primary key]
  tenant_id   integer    [not null]
  campaign_id integer    [ref: > campaigns.id]
  first_name  varchar
  last_name   varchar
  email       varchar
  source      varchar    // Obrigatório: facebook_leads, landing_page, etc.
  is_inactive boolean    [default: false]  // RF03 — soft delete lógico
  created_at  timestamp
  updated_at  timestamp  // Monitorado pelo Worker de inatividade 180d
}

Table contacts {
  id           integer    [primary key]
  tenant_id    integer    [not null]
  lead_id      integer    [unique, ref: - leads.id]
  phone        varchar
  linkedin_url varchar
}

Table stages {
  id                  integer  [primary key]
  tenant_id           integer  [not null]
  name                varchar  // Prospecção, Qualificação, Negociação, Fechamento
  order_position      integer
  probability_percent integer
}

Table opportunities {
  id                  integer    [primary key]
  tenant_id           integer    [not null]
  lead_id             integer    [ref: > leads.id]
  stage_id            integer    [ref: > stages.id]
  assigned_user_id    integer    // Vendedor responsável (RLS por user_id no dashboard SDR)
  value               decimal
  status              varchar    // Open | Won | Lost
  lost_reason         varchar    // Obrigatório quando status = Lost (RF04)
  expected_close_date date
  updated_at          timestamp  // CRÍTICO: monitorado pelo Worker de estagnação 48h
  created_at          timestamp
}

Table audit_logs {
  id              integer    [primary key]
  tenant_id       integer    [not null]
  opportunity_id  integer    [ref: > opportunities.id]
  weakness_type   varchar    // Stagnation | Low_Conversion
  description     text
  created_at      timestamp  // Imutável — apenas INSERT é permitido via RLS
}
```

### 6.3 Campos Críticos para o Motor de Diagnóstico

| Campo | Entidade | Papel no Motor |
|---|---|---|
| `updated_at` | `opportunities` | Monitorado pelo Worker a cada 15min para detectar estagnação após 48h exatas. |
| `is_inactive` | `leads` | Flag de soft delete lógico para leads sem interação por 180+ dias. |
| `lost_reason` | `opportunities` | Obrigatório para fechar como `Lost`; alimenta o relatório de fragilidades. |
| `weakness_type` | `audit_logs` | Classifica a fragilidade detectada (`Stagnation`, `Low_Conversion`). |
| `source` | `leads` | Rastreabilidade por canal para análise de qualidade no dashboard de Marketing. |
| `campaign_id` | `leads` | Vínculo lead ↔ campanha para cálculo de ROI. |
| `tenant_id` | Todas as tabelas | Coluna de particionamento para RLS — presente em todas as tabelas. |

### 6.4 Índices Recomendados

```sql
-- Consulta central do Worker de estagnação
CREATE INDEX idx_opp_stagnation ON opportunities (tenant_id, status, updated_at)
  WHERE status = 'Open';

-- Consulta analítica de funil por campanha e período
CREATE INDEX idx_leads_campaign ON leads (tenant_id, campaign_id, created_at);

-- Consulta do dashboard do SDR (pipeline individual)
CREATE INDEX idx_opp_user ON opportunities (tenant_id, assigned_user_id, status);

-- Consulta de logs de auditoria por oportunidade
CREATE INDEX idx_audit_opportunity ON audit_logs (tenant_id, opportunity_id, created_at);
```

---

## 7. APIs e Contratos de Interface

### 7.1 Endpoints da API REST v1

#### `POST /v1/leads/ingest`

Ingestão passiva de leads de fontes externas.

**Autenticação:** API Key do tenant (header `X-API-Key`)

**Request body (campos obrigatórios):**
```json
{
  "first_name": "João",
  "last_name": "Silva",
  "email": "joao.silva@email.com",
  "source": "facebook_leads",
  "campaign_id": 42
}
```

**Comportamentos:**
- `201 Created` com `lead_id` gerado — lead novo registrado com sucesso.
- `409 Conflict` com ID do lead existente — duplicata detectada por e-mail dentro do tenant.
- `422 Unprocessable Entity` — campos obrigatórios ausentes (`source`, `campaign_id`, `email`).

---

#### `PATCH /v1/deals/{id}/status`

Atualização de estágio ou status de uma oportunidade.

**Autenticação:** JWT com scope `deals:write`

**Request body (movimentação de etapa):**
```json
{ "stage_id": 3, "status": "Open" }
```

**Request body (fechamento como perdido — `lost_reason` obrigatório):**
```json
{ "status": "Lost", "lost_reason": "Preço" }
```

**Comportamentos:**
- Atualiza `updated_at` (reseta o contador de 48h do Worker de estagnação).
- Publica evento na fila de mensageria quando relevante (ex: transição de estágio).
- `422 Unprocessable Entity` se `status = Lost` sem `lost_reason`.

---

#### `GET /v1/funnel/audit`

Relatório consolidado de diagnóstico de fragilidades do funil.

**Autenticação:** JWT com scope `analytics:read`

**Query params:** `period_start`, `period_end`, `campaign_id` (opcional), `user_id` (opcional)

**Response (estrutura simplificada):**
```json
{
  "period": "2025-01-01/2025-03-31",
  "funnel": [
    { "stage": "Prospecção",   "leads": 1000, "conversion_rate": 0.60 },
    { "stage": "Qualificação", "leads": 600,  "conversion_rate": 0.45 },
    { "stage": "Negociação",   "leads": 270,  "conversion_rate": 0.55 },
    { "stage": "Fechamento",   "leads": 148,  "conversion_rate": null }
  ],
  "bottlenecks": [
    { "stage": "Qualificação", "avg_time_hours": 96, "stagnated_leads": 87 }
  ],
  "loss_reasons": [
    { "reason": "Preço",            "count": 42, "value_lost": 189000.00 },
    { "reason": "Concorrência",     "count": 31, "value_lost": 124500.00 },
    { "reason": "Falta de Contato", "count": 19, "value_lost":  76000.00 }
  ]
}
```

**SLA:** Cache Redis com TTL configurável. P95 < 300ms.

---

### 7.2 Webhooks de Saída

| Evento | Trigger | Consumidores Típicos |
|---|---|---|
| `lead.stagnated` | 48h exatas de inatividade em `opportunities.updated_at` | Réguas de reativação; alertas para gestores |
| `lead.inactive` | 180+ dias sem interação em `leads.updated_at` | Atualização de bases externas; campanhas de reengajamento |
| `campaign.low_conversion` | ROI da campanha abaixo do limiar configurado pelo tenant | Alertas ao Gestor de Marketing |

**Payload padrão:**
```json
{
  "event": "lead.stagnated",
  "timestamp": "2025-03-15T14:32:00Z",
  "tenant_id": "tenant_abc123",
  "data": {
    "lead_id": 789,
    "opportunity_id": 456,
    "stage": "Negociação",
    "stagnated_since": "2025-03-13T14:32:00Z",
    "hours_stagnated": 48
  }
}
```

---

## 8. Processamento Assíncrono e Workers

### 8.1 Worker de Detecção de Estagnação (48h)

**Tipo:** Cron Job em background
**Frequência:** A cada 15 minutos
**Critério de seleção:**

```sql
SELECT o.id, o.lead_id, o.stage_id, o.tenant_id
FROM opportunities o
WHERE o.status = 'Open'
  AND NOW() - o.updated_at >= INTERVAL '48 hours'
  AND NOT EXISTS (
    SELECT 1 FROM audit_logs al
    WHERE al.opportunity_id = o.id
      AND al.weakness_type = 'Stagnation'
      AND al.created_at >= NOW() - INTERVAL '48 hours'
  )
LIMIT 500; -- Processamento em batches para não travar o banco
```

**Ações por oportunidade encontrada:**
1. Insere registro em `audit_logs` com `weakness_type = 'Stagnation'`.
2. Publica evento `lead.stagnated` na fila de mensageria.
3. Registra log de execução do Worker para monitoramento.

### 8.2 Worker de Marcação de Inatividade (180d)

**Tipo:** Cron Job em background
**Frequência:** Diariamente (janela de menor carga, ex: 02h00)
**Critério de seleção:**

```sql
UPDATE leads
SET is_inactive = true, updated_at = NOW()
WHERE is_inactive = false
  AND NOW() - updated_at >= INTERVAL '180 days'
RETURNING id, tenant_id;
```

Para cada lead atualizado, publica `lead.inactive` na fila de mensageria.

### 8.3 Worker Consumidor de Fila (Automações e Webhooks)

**Tipo:** Processo contínuo (long-running consumer)
**Filas consumidas:** `lead.stagnated`, `lead.inactive`, `campaign.low_conversion`

**Fluxo por evento consumido:**
1. Identifica régua de reativação aplicável (por `stage_id`, `campaign_id` ou configuração do tenant).
2. Prepara payload da mensagem (e-mail ou WhatsApp) com dados do lead.
3. Enfileira na fila de saída (`outbound.email` ou `outbound.whatsapp`).
4. Registra histórico do disparo vinculado ao `lead_id` para consulta no Dashboard do SDR.

**Retry logic:**
- Máximo de 3 tentativas com backoff exponencial: 1min → 5min → 15min.
- Após 3 falhas: evento enviado para Dead Letter Queue (DLQ) para análise manual.

---

## 9. Estratégia de Cache

### 9.1 Redis como Cache de Analytics

O Redis é utilizado exclusivamente para cache de leitura dos agregados de funil. Cada chave de cache é composta por:

```
funnel:audit:{tenant_id}:{period_start}:{period_end}:{campaign_id|all}:{user_id|all}
```

**TTL:** Configurável por tenant (padrão sugerido: 5 minutos). Invalida automaticamente quando há atualização de oportunidades via `PATCH /v1/deals/{id}/status` (invalidação por `tenant_id`).

### 9.2 Política de Invalidação

Ao receber um `PATCH /v1/deals/{id}/status`, o Serviço de CRM invalida todas as chaves de cache do tenant correspondente via padrão:

```
DEL funnel:audit:{tenant_id}:*
```

Isso garante que o próximo acesso ao relatório reflita as movimentações recentes.

---

## 10. Mensageria e Webhooks

### 10.1 Topologia de Filas

```
[Workers Internos]
  stagnation-detector ──► fila: lead.stagnated ──► [Worker Consumidor]
  inactivity-tagger   ──► fila: lead.inactive  ──► [Worker Consumidor]

[Serviço de CRM]
  PATCH /deals/:id    ──► fila: deal.updated   ──► [Serviço de Analytics] (invalidação de cache)

[Worker Consumidor]
  (processa lead.stagnated) ──► fila: outbound.email      ──► [Dispatcher de E-mail]
                             ──► fila: outbound.whatsapp  ──► [Dispatcher de WhatsApp]

[Dead Letter Queue]
  outbound.email.dlq      ──► Monitoramento + Alerta
  outbound.whatsapp.dlq   ──► Monitoramento + Alerta
```

### 10.2 Throughput e SLA

- **Meta:** 10.000 webhooks/hora com taxa de erro < 1%.
- **Implementação:** Múltiplas instâncias do Worker Consumidor em paralelo (horizontal scaling via K8s).
- **Monitoramento:** Tamanho das filas e taxa de DLQ monitorados via APM.

---

## 11. Módulos do Sistema

### 11.1 Módulo de CRM (Pipeline)

Núcleo transacional da plataforma. Gerencia leads, oportunidades e estágios.

**Responsabilidades:**
- CRUD de oportunidades com regras de negócio (lost_reason obrigatório, reset de 48h).
- API Kanban para o Dashboard do SDR.
- Ingestão passiva de leads com validação de duplicidade e rastreabilidade de origem.
- Emissão de eventos internos para Workers e invalidação de cache.

### 11.2 Módulo de Diagnóstico e Auditoria

Diferencial competitivo da plataforma. Opera em background e em modo de leitura.

**Responsabilidades:**
- Detecção automática de leads estagnados (48h) e inativos (180d) via Workers.
- Geração de registros imutáveis em `audit_logs`.
- Serviço de auditoria de funil com CTEs otimizadas e cache Redis.

### 11.3 Módulo de Automação (Réguas de Reativação)

Transforma diagnósticos em ações. Opera exclusivamente de forma assíncrona.

**Responsabilidades:**
- Gestão de réguas de disparo configuradas por tenant.
- Envio de e-mails e mensagens WhatsApp via APIs de terceiros (SendGrid/SES, WhatsApp Business API).
- Retry logic e rastreamento de histórico de disparos por lead.

### 11.4 Módulo de Analytics e Dashboards

Apresenta os dados para cada persona com isolamento de acesso.

**Responsabilidades:**
- Dashboard do Diretor: funil de conversão, custo da ineficiência, ROI por campanha, ranking de gargalos.
- Dashboard do Gestor de Marketing: qualidade de leads por fonte, velocidade de primeiro contato, taxa de estagnação por campanha.
- Dashboard do SDR: pipeline Kanban individual, fila de ação imediata, histórico de automações.
- Exportação assíncrona de relatórios CSV.

---

## 12. Stack Tecnológica

| Categoria | Tecnologia | Justificativa |
|---|---|---|
| **Backend** | Node.js (NestJS) | Suporte nativo a TypeScript, injeção de dependência, módulos bem definidos. |
| **Banco de Dados** | PostgreSQL | Único RDBMS com suporte nativo e robusto a Row Level Security (RLS). |
| **Cache** | Redis | Baixíssima latência para cache de agregados; suporte a TTL e invalidação por padrão de chave. |
| **Mensageria** | RabbitMQ ou AWS SQS | Filas duráveis com suporte a Dead Letter Queue, retry e múltiplos consumidores. |
| **Infraestrutura** | Docker + Kubernetes (K8s) | Containerização para paridade de ambientes e escalabilidade horizontal dos Workers. |
| **API Docs** | Swagger / OpenAPI 3.0 | Documentação viva gerada a partir do código; integra com NestJS Decorators. |
| **E-mail Transacional** | SendGrid ou AWS SES | APIs confiáveis com suporte a templates, rastreamento e alta entregabilidade. |
| **WhatsApp** | WhatsApp Business API | Único canal oficial; integrado via webhook de saída do Módulo de Automação. |
| **WebSocket** | Socket.IO ou ws | Atualizações em tempo real do Kanban do SDR sem polling pesado. |
| **Autenticação** | JWT (RS256) | Tokens assimétricos para segurança do multi-tenant; suporte a escopos granulares. |

---

## 13. Requisitos Não-Funcionais e Metas de SLA

| Requisito | Meta | Mecanismo de Implementação |
|---|---|---|
| **Latência Analytics** | P95 < 300ms para `GET /v1/funnel/audit` | Cache Redis + CTEs otimizadas + índices compostos no PostgreSQL. |
| **Latência CRM** | P95 < 200ms para `PATCH /v1/deals/{id}/status` | Operação simples de UPDATE + publicação assíncrona na fila. |
| **Throughput de Webhooks** | 10.000 webhooks/hora, erro < 1% | Múltiplos consumidores de fila em paralelo (K8s autoscaling). |
| **Isolamento de Tenant** | Zero vazamento de dados entre tenants | RLS no PostgreSQL em todas as tabelas + validação de JWT em todo endpoint. |
| **Imutabilidade de Audit Logs** | Registros de auditoria nunca podem ser alterados ou deletados | Política de RLS com apenas INSERT permitido na tabela `audit_logs`. |
| **Escalabilidade** | Suporte a picos de carga (Black Friday) sem degradação | Escalabilidade horizontal de Workers e Consumidores via K8s. |
| **Rastreabilidade** | 100% das mudanças de status de oportunidade geram `audit_log` | Middleware de escrita no Serviço de CRM; validado na DoD. |
| **Detecção de Estagnação** | Máximo 15 minutos de atraso após o limite de 48h | Frequência do Cron Job configurada em 15 minutos. |

---

## 14. Estratégia de Observabilidade

### 14.1 Logs

- Todos os serviços emitem logs estruturados em JSON (nível: `info`, `warn`, `error`).
- Campos obrigatórios: `timestamp`, `tenant_id`, `service`, `trace_id`, `event`, `duration_ms`.
- Logs de auditoria de negócio (mudanças de status) são persistidos no banco (`audit_logs`), não apenas em sistema de log.

### 14.2 Métricas Chave para Monitoramento

| Métrica | Alerta |
|---|---|
| Latência P95 de `GET /v1/funnel/audit` | > 300ms |
| Taxa de erro de webhooks de saída | > 1% |
| Tamanho das filas de mensageria | > 1000 mensagens pendentes |
| Taxa de mensagens na DLQ | Qualquer mensagem na DLQ |
| Tempo de execução do Worker de estagnação | > 5 minutos por ciclo |
| Cobertura de testes no CI/CD | < 80% |

### 14.3 Trace Distribuído

Cada requisição recebe um `trace_id` no API Gateway, propagado via header `X-Trace-ID` para todos os serviços downstream e registrado nos logs. Permite reconstruir o caminho completo de uma requisição entre serviços.

---

## 15. Infraestrutura e Deploy

### 15.1 Ambientes

| Ambiente | Propósito | Configuração |
|---|---|---|
| `development` | Desenvolvimento local | Docker Compose com todos os serviços |
| `staging` | Validação antes do deploy | K8s com dados sintéticos |
| `production` | Ambiente de produção | K8s com autoscaling, backups automáticos |

### 15.2 Pipeline CI/CD (Definition of Done)

Toda entrega deve passar pelo pipeline completo:

```
[Push] → [Lint] → [Testes Unitários (>80% cobertura)] → [Build Docker] → [Deploy Staging] → [Testes de Integração] → [Deploy Produção]
```

**Critérios de bloqueio:**
- Cobertura de testes unitários abaixo de 80%.
- Qualquer query nos testes de integração retornando dados de outro tenant (validação de RLS).
- Endpoints novos sem documentação Swagger correspondente.
- Alterações de status de oportunidade sem geração de `audit_log` correspondente.

### 15.3 Estratégia de Escalabilidade

Os Workers de background e os Consumidores de fila são os componentes que escalam horizontalmente de forma mais direta. O K8s Horizontal Pod Autoscaler (HPA) monitora o tamanho das filas de mensageria como métrica de escalonamento:

- Tamanho de fila > 500: escala para mais réplicas do Worker Consumidor.
- CPU dos serviços de API > 70%: escala réplicas do Serviço de CRM e Analytics.

---

## 16. Escopo Negativo e Restrições Arquiteturais

As seguintes funcionalidades estão **explicitamente fora do MVP** e não devem ser arquitetadas ou iniciadas sem decisão formal de produto:

| Fora do Escopo | Motivo |
|---|---|
| Envio nativo de SMS ou chamadas de voz | A integração com canais externos é via webhook; SMS/voz aumentariam a complexidade de compliance sem valor imediato. |
| Aplicativo mobile nativo (iOS/Android) | Interface web responsiva cobre o caso de uso do MVP. Mobile será pós-v1.0. |
| E-mail bidirecional (leitura de respostas) | O foco é automação de saída; leitura de inbox é produto diferente com complexidade de autenticação distinta. |
| Distribuição automática de leads (Round Robin) | A ingestão é passiva por design; atribuição é responsabilidade de processos externos. |
| LGPD — Anonimização e Right to be Forgotten | Planejado para pós-v1.0; requer design cuidadoso para não comprometer `audit_logs` imutáveis. |
| Scoring preditivo de leads com IA/ML | Evolução pós-v1.0; requer volume de dados histórico para treino. |
| A/B Testing de réguas de automação | Evolução pós-v1.0. |
| Benchmarks de mercado | Requer dados agregados de múltiplos tenants com consentimento explícito. |

---

## 17. Roadmap Arquitetural

### MVP — Componentes Críticos (Fundação)

Resolve os maiores riscos técnicos e entrega o diferencial do produto:

1. **UC01 — Autenticação Multi-tenant com RLS:** fundação de segurança. Sem isso, não há produto SaaS.
2. **UC06 — Worker de Detecção de Estagnação 48h:** coração do sistema. Prova o diferencial competitivo.
3. **UC03 — Ingestão de Leads via API:** dados entram no sistema; sem isso, não há o que auditar.
4. **UC08 — Relatório de Auditoria de Funil:** entrega o valor principal ao Diretor Comercial.

> **Marco estratégico:** com UC01 e UC06 implementados e integrados, o produto possui um MVP demonstrável. A capacidade de identificar fragilidades com rastreabilidade e segurança já diferencia o SalesWeakness de CRMs tradicionais.

### Versão 1.0 — Produto Completo

Adiciona os casos de uso estratégicos e operacionais sobre a fundação do MVP:

- UC09 — Réguas de Reativação (Módulo de Automação completo).
- UC10 — Webhook de baixa performance `campaign.low_conversion`.
- UC04/UC05 — Pipeline Kanban e movimentação de oportunidades.
- UC07 — Classificação obrigatória de motivo de perda.
- UC11/12/13 — Dashboards completos por perfil de usuário.
- UC02 — Feature Flags para provisionamento de módulos por tenant.

### Evoluções Futuras (Pós v1.0)

| Funcionalidade | Impacto Arquitetural |
|---|---|
| Scoring preditivo com IA | Novo serviço de ML; requer pipeline de dados históricos. |
| E-mail bidirecional | Integração OAuth com provedores de e-mail; novo módulo de inbox. |
| Aplicativo Mobile | API Gateway já serve REST; adicionar suporte a push notifications. |
| LGPD — Conformidade Total | Revisão do modelo de `audit_logs` imutáveis para suportar anonimização seletiva. |
| Benchmarks de Mercado | Data warehouse separado com dados agregados e anonimizados de múltiplos tenants. |
| A/B Testing de Réguas | Extensão do Módulo de Automação com controle de variantes e análise estatística. |

---

## 18. Glossário

| Termo | Definição |
|---|---|
| **RLS** | Row Level Security — funcionalidade do PostgreSQL que filtra automaticamente linhas de uma tabela por critérios de segurança, garantindo isolamento multi-tenant em nível de query SQL. |
| **Multi-tenant** | Arquitetura onde um único sistema serve múltiplos clientes (tenants) com isolamento completo de dados. |
| **JWT** | JSON Web Token — padrão de autenticação e autorização baseado em tokens assinados digitalmente. |
| **CTE** | Common Table Expression — subconsulta nomeada e reutilizável em queries SQL complexas de analytics. |
| **P95** | Percentil 95 — valor abaixo do qual 95% das medições se encontram; métrica padrão para latência de API. |
| **Worker** | Processo de background que executa tarefas de forma assíncrona e periódica, sem interação direta do usuário. |
| **Dead Letter Queue (DLQ)** | Fila especial que recebe mensagens que falharam após o número máximo de tentativas de reprocessamento. |
| **Backoff Exponencial** | Estratégia de retry onde o intervalo entre tentativas cresce exponencialmente (ex: 1min, 5min, 15min). |
| **Feature Flag** | Mecanismo para habilitar ou desabilitar funcionalidades sem novo deploy, controlado por configuração em banco. |
| **Soft Delete** | Técnica de exclusão lógica onde o registro não é removido do banco, mas marcado como inativo via flag booleana. |
| **Webhook** | Mecanismo de notificação em tempo real onde um sistema envia dados a outro via HTTP ao ocorrer um evento. |
| **SDR** | Sales Development Representative — profissional responsável pela prospecção e qualificação inicial de leads. |
| **LGPD** | Lei Geral de Proteção de Dados (13.709/2018) — lei brasileira que regulamenta o tratamento de dados pessoais. |
| **Kanban** | Método visual de gestão representado por cards organizados em colunas por etapa do processo. |
| **HPA** | Horizontal Pod Autoscaler — recurso do Kubernetes que escala automaticamente o número de réplicas de um serviço com base em métricas. |
| **TTL** | Time To Live — tempo de expiração de um registro em cache; após o TTL, o dado é invalidado e recalculado. |

---

*Documento gerado a partir da consolidação de: PRD v1, UseCases Expandido, PRD — Revisão Fabrício, PRD — Anotações Juliana, SalesWeakness_Documentacao.md.*
