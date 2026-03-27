Continuando o SalesWeakness.

Agora vamos implementar movimentação de oportunidades.

Endpoint:
PATCH /v1/deals/{id}/status

Regras:
- Atualizar stage
- Atualizar updated_at
- Se status = Lost:
  → lost_reason obrigatório

Quero que você:

1. Criar endpoint
2. Implementar validações
3. Garantir consistência com regras de negócio
4. Atualizar timestamps corretamente

Próximo passo: dashboards.