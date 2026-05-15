# ADR-001 — NestJS como Framework Backend

**Status:** Aceito  
**Data:** Março de 2026

## Contexto

Precisamos de um framework backend em Node.js que suporte TypeScript nativo, injeção de dependência, módulos bem definidos, integração fácil com Swagger/OpenAPI e extensibilidade para suportar Guards, Interceptors e Filters (mecanismos críticos para autenticação JWT e isolamento multi-tenant).

## Decisão

Adotamos **NestJS** como framework backend.

## Justificativa

- **TypeScript nativo** com suporte completo a decorators e metadados via `reflect-metadata`.
- **Injeção de dependência** embutida: facilita teste unitário de cada serviço sem instâncias globais.
- **Módulos independentes**: cada domínio (auth, leads, opportunities, audit) é um módulo isolado com seus próprios providers e exports — ideal para a arquitetura orientada a módulos do SalesWeakness.
- **Guards, Interceptors, Filters e Pipes** são primitivos do framework: permitem implementar JWT auth, injeção de tenant_id e validação de entrada sem poluir os controllers.
- **Swagger/OpenAPI** integrado via `@nestjs/swagger` — documentação viva gerada a partir dos decorators.

## Consequências

- Curva de aprendizado para desenvolvedores que vêm de Express puro.
- Dependência do ecossistema NestJS para atualizações de versão.
