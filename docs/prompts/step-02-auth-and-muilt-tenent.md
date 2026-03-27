Continuando o projeto SalesWeakness que já tem a estrutura base em NestJS.

Agora precisamos implementar autenticação e isolamento multi-tenant.

Requisitos:
- JWT contendo:
  - user_id
  - tenant_id
  - scopes
- Middleware/Guard de autenticação
- Criação das entidades:
  - users
  - tenants
- Relacionamento:
  - user pertence a um tenant
- Preparar base para RLS no PostgreSQL

Quero que você:

1. Crie:
   - entidades
   - migrations
2. Implemente:
   - login
   - geração de JWT
3. Middleware que injeta tenant no contexto da request
4. Estruture código pensando em RLS (sem implementar ainda)

Não avance para outros módulos.

No próximo passo vamos aplicar RLS no banco.