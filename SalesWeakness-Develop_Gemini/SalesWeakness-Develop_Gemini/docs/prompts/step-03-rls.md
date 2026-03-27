Continuando o projeto SalesWeakness com autenticação já implementada.

Agora precisamos implementar isolamento multi-tenant real usando PostgreSQL Row Level Security (RLS).

Requisitos:
- Todas as tabelas devem ter tenant_id
- Usuário só acessa dados do seu tenant
- RLS ativo em nível de banco

Quero que você:

1. Ajuste as entidades para incluir tenant_id
2. Gere SQL para:
   - ativar RLS
   - criar policies
3. Explique como o tenant_id do JWT será usado no PostgreSQL
4. Sugira abordagem segura para setar o tenant no contexto da conexão

Importante:
- Segurança é prioridade máxima
- Nenhum dado pode vazar entre tenants

No próximo passo vamos implementar ingestão de leads.