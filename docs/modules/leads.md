# Módulo: Leads

**Status:** Stub (Step 01) — implementação completa no Step 04.

## Responsabilidade

Gerencia a ingestão passiva de leads de fontes externas (formulários, campanhas de marketing, APIs de parceiros).

## Entidade: Lead

| Campo | Tipo | Restrições | Descrição |
|-------|------|-----------|-----------|
| `id` | integer | PK | Identificador único do lead. |
| `tenant_id` | integer | NOT NULL | Partição de tenant para RLS. |
| `campaign_id` | integer | nullable | Vínculo com a campanha de origem. |
| `first_name` | varchar(255) | NOT NULL | Primeiro nome do lead. |
| `last_name` | varchar(255) | NOT NULL | Sobrenome do lead. |
| `email` | varchar(255) | NOT NULL | E-mail (chave de deduplicação por tenant). |
| `source` | varchar(100) | NOT NULL | Canal de origem: `facebook_leads`, `landing_page`, etc. |
| `is_inactive` | boolean | default false | Soft delete — marcado `true` após 180d sem interação (RF03). |
| `created_at` | timestamp | auto | Data de criação. |
| `updated_at` | timestamp | auto | Data da última atualização. Monitorado pelo worker de inatividade. |

## Componentes atuais

| Arquivo | Descrição |
|---------|-----------|
| `leads/entities/lead.entity.ts` | Entidade TypeORM completa. |
| `leads.module.ts` | Módulo NestJS registrado no AppModule. Registra Lead via `forFeature`. |
| `leads.controller.ts` | Stub — endpoint de ingestão será implementado no Step 04. |
| `leads.service.ts` | Stub — lógica de ingestão e deduplicação será implementada no Step 04. |

## Endpoint planejado (Step 04)

### `POST /v1/leads/ingest`

**Autenticação:** API Key do tenant (`X-API-Key` header).

**Request:**
```json
{
  "first_name": "João",
  "last_name": "Silva",
  "email": "joao.silva@email.com",
  "source": "facebook_leads",
  "campaign_id": 42
}
```

**Respostas:**
- `201 Created` — lead novo registrado.
- `409 Conflict` — duplicata detectada por email dentro do tenant.
- `422 Unprocessable Entity` — campos obrigatórios ausentes.

## Regras de negócio

- **Deduplicação por email**: unicidade de `email` por `tenant_id`.
- **Ingestão passiva**: sem atribuição automática de vendedor ou round-robin.
- **Rastreabilidade de origem**: campo `source` obrigatório para análise de qualidade de leads.
