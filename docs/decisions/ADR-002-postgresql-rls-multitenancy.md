# ADR-002 — PostgreSQL com Row Level Security (RLS) para Multi-tenancy

**Status:** Aceito  
**Data:** Março de 2026

## Contexto

O SalesWeakness é multi-tenant. Precisamos garantir que nenhuma query de um tenant possa acessar dados de outro tenant — zero tolerância a vazamento de dados.

## Decisão

Adotamos **PostgreSQL com Row Level Security (RLS)** como mecanismo de isolamento de dados. Todos os tenants compartilham o mesmo banco de dados, mas o PostgreSQL filtra automaticamente as linhas baseado no `tenant_id` injetado via `SET LOCAL app.current_tenant_id = ?` em cada conexão.

## Justificativa

- **RLS nativo no PostgreSQL**: o único RDBMS amplamente disponível com suporte robusto a RLS em nível de engine.
- **Isolamento como fundação**: o isolamento é aplicado no banco — mesmo se um bug no código ORM gerar uma query sem filtro, o RLS bloqueia o acesso.
- **Sem fragmentação de banco**: manter um único banco simplifica operações, backups e migrações.
- **TTL de sessão**: `SET LOCAL` limita o tenant_id à transação corrente, evitando vazamento entre conexões do pool.

## Implementação

```sql
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON opportunities
  USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);
```

O `tenant_id` é extraído do JWT (claim `tenant_id`) pelo `TenantContextInterceptor` e injetado antes de cada query.

## Consequências

- Toda tabela precisa de coluna `tenant_id NOT NULL` — restrição de design não negociável.
- Migrations precisam incluir criação das RLS policies após criação das tabelas.
- Workers de background precisam setar `app.current_tenant_id` manualmente antes de cada operação.
