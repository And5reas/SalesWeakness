# ADR-005 — Redis para Cache de Analytics e Estratégia de Invalidação

**Status:** Aceito  
**Data:** Março de 2026

## Contexto

O endpoint `GET /v1/funnel/audit` executa queries analíticas complexas com CTEs sobre PostgreSQL. O SLA exige P95 < 300ms. Executar essas queries a cada requisição em produção seria inviável com múltiplos tenants simultâneos.

## Decisão

Adotamos **Redis** como cache de leitura para os agregados de funil. Cada resposta do `GET /v1/funnel/audit` é armazenada no Redis com TTL configurável (padrão: 5 minutos).

## Estrutura das Chaves de Cache

```
funnel:audit:{tenant_id}:{period_start}:{period_end}:{campaign_id|all}:{user_id|all}
```

## Política de Invalidação

Ao receber um `PATCH /v1/deals/{id}/status`, o Serviço de CRM invalida todas as chaves do tenant correspondente:

```
DEL funnel:audit:{tenant_id}:*
```

## Justificativa

- **Latência**: cache hit < 50ms vs query analítica que pode levar > 200ms.
- **Isolamento**: chaves particionadas por `tenant_id` — impossível um tenant ler cache de outro.
- **Configurabilidade**: TTL ajustável por tenant via `CACHE_TTL_SECONDS` (env var).
- **Sem dependência externa complexa**: Redis é operacionalmente simples e bem suportado pelo ecossistema NestJS (`@nestjs/cache-manager`).

## Consequências

- Redis é uma dependência de infraestrutura obrigatória (incluído no Docker Compose).
- Invalidação por padrão de chave (`DEL funnel:audit:{tenant_id}:*`) requer Redis com suporte a `KEYS` — usar com cuidado em produção de alto volume (considerar Lua script ou SCAN em evolução futura).
- TTL padrão de 5 minutos significa que dashboards podem exibir dados com até 5 min de atraso — aceitável para o caso de uso analítico.
