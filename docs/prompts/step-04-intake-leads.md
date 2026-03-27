Continuando o projeto SalesWeakness com:

- NestJS configurado
- Autenticação JWT
- RLS ativo

Agora vamos implementar ingestão de leads.

Requisitos:
Endpoint: POST /v1/leads/ingest

Payload mínimo:
- email
- source
- campaign_id

Regras:
- Não pode duplicar por email dentro do tenant
- Apenas ingestão (sem distribuição)
- Deve registrar origem e campanha

Quero que você:

1. Criar entidades:
   - leads
   - campaigns
   - contacts
2. Criar endpoint completo
3. Implementar:
   - validação
   - deduplicação
4. Retornar:
   - 201 se criado
   - 409 se duplicado

Não implemente nada além disso.

Próximo passo: oportunidades e detecção de estagnação.