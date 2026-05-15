# ADR-003 — TypeORM como ORM e Estratégia de Migrations

**Status:** Aceito  
**Data:** Março de 2026

## Contexto

Precisamos de um ORM que seja compatível com NestJS, suporte TypeScript nativo, permita controle de migrations e se integre bem com PostgreSQL (incluindo tipos nativos).

## Decisão

Adotamos **TypeORM** como ORM, com as seguintes restrições de configuração:

- `synchronize: false` sempre em produção (controlado via `DB_SYNCHRONIZE` env).
- Migrations gerenciadas via arquivos versionados em `src/database/migrations/`.
- `autoLoadEntities: true` para que cada módulo registre suas entidades via `TypeOrmModule.forFeature()`.

## Justificativa

- **Integração nativa com NestJS** via `@nestjs/typeorm`.
- **Decorators TypeScript** (`@Entity`, `@Column`, `@CreateDateColumn`, `@UpdateDateColumn`) geram código autoexplicativo.
- **Migrations versionadas** garantem controle de schema em todos os ambientes sem risco de perda de dados.
- **Repository pattern** facilita mock em testes unitários via `getRepositoryToken()`.

## Consequências

- `DB_SYNCHRONIZE=true` apenas em desenvolvimento local — nunca em staging ou produção.
- Cada nova tabela requer migration explícita (não confiamos em auto-sync).
- As policies de RLS devem ser criadas dentro das migrations, após `CREATE TABLE`.
