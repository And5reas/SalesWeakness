# Módulo: Audit

**Status:** Stub (Step 01) — implementação completa nos Steps 05 e 06.

## Responsabilidade

Registra e serve os diagnósticos de fragilidade do pipeline de vendas. É o diferencial competitivo da plataforma.

## Entidade: AuditLog

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | integer | PK | Identificador único do registro. |
| `tenant_id` | integer | NOT NULL | Partição de tenant para RLS. |
| `opportunity_id` | integer | NOT NULL, FK → opportunities | Oportunidade auditada. |
| `weakness_type` | varchar(50) | NOT NULL | Tipo de fragilidade: `Stagnation` \| `Low_Conversion`. |
| `description` | text | nullable | Detalhamento opcional da fragilidade. |
| `created_at` | timestamp | auto | Data de criação — **imutável**. |

> **Imutabilidade**: a tabela `audit_logs` só permite INSERT via política de RLS. Nenhuma política de UPDATE ou DELETE é criada — registros são permanentes por design.

## Componentes atuais

| Arquivo | Descrição |
|---------|-----------|
| `audit/entities/audit-log.entity.ts` | Entidade TypeORM completa. |
| `audit.module.ts` | Módulo NestJS registrado no AppModule. |
| `audit.controller.ts` | Stub — endpoint de auditoria será implementado no Step 06. |
| `audit.service.ts` | Stub — worker de estagnação e queries analíticas serão implementados nos Steps 05 e 06. |

## Workers planejados (Step 05)

### Worker de Detecção de Estagnação (48h)

- **Frequência**: a cada 15 minutos.
- **Critério**: `opportunities.status = 'Open'` e `NOW() - updated_at >= 48h`.
- **Ação**: insere `audit_logs` com `weakness_type = 'Stagnation'` + publica evento na fila.
- **Otimização**: processa em batches de 500 registros para não travar o banco.

### Worker de Inatividade (180d)

- **Frequência**: diariamente às 02h00.
- **Critério**: `leads.is_inactive = false` e `NOW() - updated_at >= 180 dias`.
- **Ação**: atualiza `leads.is_inactive = true` + publica evento na fila.

## Endpoint planejado (Step 06)

### `GET /v1/funnel/audit`

**Autenticação:** JWT com scope `analytics:read`.

**Query params:** `period_start`, `period_end`, `campaign_id` (opcional), `user_id` (opcional).

**SLA:** P95 < 300ms via cache Redis (TTL configurável, padrão 5 minutos).

**Response:**
```json
{
  "period": "2025-01-01/2025-03-31",
  "funnel": [{ "stage": "Prospecção", "leads": 1000, "conversion_rate": 0.60 }],
  "bottlenecks": [{ "stage": "Qualificação", "avg_time_hours": 96, "stagnated_leads": 87 }],
  "loss_reasons": [{ "reason": "Preço", "count": 42, "value_lost": 189000.00 }]
}
```
