# Estado Atual do Projeto — SalesWeakness

## Módulos implementados

- [x] Setup inicial (Step 01)
  - [x] Estrutura de pastas profissional (`src/modules`, `src/common`, `src/config`)
  - [x] AppModule conectando ConfigModule, TypeOrmModule e todos os feature modules
  - [x] main.ts com Swagger/OpenAPI, ValidationPipe global e HttpExceptionFilter global
  - [x] Módulos scaffold: auth, tenants, leads, opportunities, audit
  - [x] Entidades TypeORM: `Lead`, `Opportunity`, `AuditLog`, `Tenant`
  - [x] Configurações: PostgreSQL, Redis, aplicação (via `.env`)
  - [x] Infraestrutura comum: guards, interceptors, filters, decorators, interfaces
  - [x] Testes unitários: 25 testes passando (filtros, guards, interceptors, services)
  - [x] docs/decisions/ com 5 ADRs
  - [x] docs/modules/ documentando todos os módulos

- [ ] Step 02 — Autenticação Multi-tenant (login, JWT, entidade User)
- [ ] Step 03 — Row Level Security no PostgreSQL (policies, migrations)
- [ ] Step 04 — Ingestão de Leads (`POST /v1/leads/ingest`)
- [ ] Step 05 — Oportunidades + Worker de detecção de estagnação 48h
- [ ] Step 06 — Relatório de Auditoria (`GET /v1/funnel/audit` + Redis cache)
- [ ] Step 07 — Automação de reativação (fila, consumer, retry logic)
- [ ] Step 08 — Pipeline Kanban (`PATCH /v1/deals/{id}/status`)

## Estrutura de pastas

```
backend/src/
├── app.module.ts               # Módulo raiz com ConfigModule + TypeOrmModule + features
├── main.ts                     # Bootstrap: Swagger, ValidationPipe, ExceptionFilter
├── app.controller.ts           # Health check (GET /)
├── app.service.ts
│
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser() — extrai JwtPayload da request
│   │   ├── roles.decorator.ts          # @Roles('director') — metadata de perfis
│   │   └── tenant.decorator.ts         # @TenantId() — extrai tenant_id da request
│   ├── filters/
│   │   └── http-exception.filter.ts    # Normaliza erros HTTP em shape consistente
│   ├── guards/
│   │   ├── jwt-auth.guard.ts           # Valida JWT via Passport
│   │   └── roles.guard.ts              # Verifica perfil do usuário via @Roles()
│   ├── interceptors/
│   │   └── tenant-context.interceptor.ts  # Injeta tenant_id em req.tenantId
│   └── interfaces/
│       ├── jwt-payload.interface.ts    # Tipagem do payload JWT
│       └── request-with-tenant.interface.ts  # Extensão de Request com tenantId
│
├── config/
│   ├── app.config.ts           # Configurações gerais (PORT, NODE_ENV)
│   ├── database.config.ts      # PostgreSQL (host, port, pool)
│   └── redis.config.ts         # Redis (host, port, TTL)
│
└── modules/
    ├── auth/                   # Stub — Step 02
    │   ├── auth.controller.ts
    │   ├── auth.module.ts
    │   └── auth.service.ts
    ├── tenants/
    │   ├── entities/tenant.entity.ts
    │   ├── tenants.controller.ts
    │   ├── tenants.module.ts
    │   └── tenants.service.ts
    ├── leads/
    │   ├── entities/lead.entity.ts
    │   ├── leads.controller.ts
    │   ├── leads.module.ts
    │   └── leads.service.ts
    ├── opportunities/
    │   ├── entities/opportunity.entity.ts
    │   ├── opportunities.controller.ts
    │   ├── opportunities.module.ts
    │   └── opportunities.service.ts
    └── audit/
        ├── entities/audit-log.entity.ts
        ├── audit.controller.ts
        ├── audit.module.ts
        └── audit.service.ts
```

## Stack Tecnológica

| Categoria | Tecnologia | Versão |
|-----------|-----------|--------|
| Runtime | Node.js + TypeScript | TS ^5.7 |
| Framework | NestJS | ^11.0 |
| ORM | TypeORM | ^0.3 |
| Banco de dados | PostgreSQL + RLS | — |
| Cache | Redis (ioredis) | ^5 |
| Autenticação | JWT via passport-jwt | — |
| Documentação | Swagger/OpenAPI 3.0 | — |
| Testes | Jest + ts-jest | — |
