# Estado Atual do Projeto — SalesWeakness

## Módulos Implementados
- [x] **Setup inicial (Step 01)**
  - Scaffold de projeto NestJS (`backend/`)
  - Configurações por ambiente usando `@nestjs/config` e namespaces (`app`, `database`, `redis`).
  - Camada `common`: Guards (`JwtAuthGuard`, `RolesGuard`), `TenantContextInterceptor` para extração de contexto RLS e Global `HttpExceptionFilter`.
  - Módulos (com entidade, controller stub, service stub e unit tests):
    - `auth`
    - `tenants`
    - `leads`
    - `opportunities`
    - `audit`
  - Swagger configurado em `/api/docs`.
  - Configuração de Docker (`Dockerfile` multi-stage, `docker-compose.yml`, `.dockerignore`).
  - Cobertura de testes unitários mínima de 80% estabelecida e validada.
  - Duas ADRs geradas (Arquitetura modular de domínio do NestJS e isolamento por PostgreSQL RLS).

## Próximos Passos (Step 02)
- Implementar as migrações iniciais do banco de dados (TypeORM + PostgreSQL RLS policies).
- Implementar o módulo `Auth` com estratégia Local e JWT.
- Integrar os stubs com lógica de negócios inicial.