# Módulo: Opportunities

**Status:** Stub (Step 01) — implementação completa nos Steps 05 e 08.

## Responsabilidade

Gerencia o ciclo de vida das oportunidades de venda dentro do pipeline. É o núcleo transacional da plataforma e o ponto central de rastreabilidade.

## Entidade: Opportunity

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | integer | PK | Identificador único da oportunidade. |
| `tenant_id` | integer | NOT NULL | Partição de tenant para RLS. |
| `lead_id` | integer | NOT NULL, FK → leads | Lead vinculado. |
| `stage_id` | integer | NOT NULL, FK → stages | Etapa atual no pipeline. |
| `assigned_user_id` | integer | nullable | Vendedor responsável (RLS por user_id no Kanban do SDR). |
| `value` | decimal(15,2) | nullable | Valor estimado da oportunidade. |
| `status` | varchar(20) | default 'Open' | Status: `Open` \| `Won` \| `Lost`. |
| `lost_reason` | varchar(255) | nullable | Obrigatório quando `status = 'Lost'` (RF04). |
| `expected_close_date` | date | nullable | Data prevista de fechamento. |
| `updated_at` | timestamp | auto | **CRÍTICO**: monitorado pelo worker de estagnação (48h). |
| `created_at` | timestamp | auto | Data de criação. |

## Componentes atuais

| Arquivo | Descrição |
|---------|-----------|
| `opportunities/entities/opportunity.entity.ts` | Entidade TypeORM completa. |
| `opportunities.module.ts` | Módulo NestJS registrado no AppModule. |
| `opportunities.controller.ts` | Stub — endpoint de atualização de status será implementado no Step 08. |
| `opportunities.service.ts` | Stub — lógica de negócio será implementada nos Steps 05 e 08. |

## Endpoints planejados

### `PATCH /v1/deals/{id}/status` (Step 08)

**Autenticação:** JWT com scope `deals:write`.

**Request (movimentação de etapa):**
```json
{ "stage_id": 3, "status": "Open" }
```

**Request (fechamento como perdido):**
```json
{ "status": "Lost", "lost_reason": "Preço" }
```

**Comportamentos:**
- Atualiza `updated_at` — reseta o contador de 48h do worker de estagnação.
- `422` se `status = 'Lost'` sem `lost_reason`.

## Regras de negócio críticas

- **`lost_reason` obrigatório** ao fechar como `Lost` (RF04).
- **`updated_at` é o relógio do worker**: qualquer PATCH legítimo reseta o contador de 48h.
- **Soft delete**: oportunidades nunca são deletadas — apenas têm status atualizado.
