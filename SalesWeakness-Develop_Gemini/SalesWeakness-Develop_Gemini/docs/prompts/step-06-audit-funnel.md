Continuando o SalesWeakness com detecção de estagnação pronta.

Agora vamos implementar o relatório principal:

GET /v1/funnel/audit

Requisitos:
- Taxa de conversão por etapa
- Gargalos
- Motivos de perda
- ROI por campanha

Quero que você:

1. Criar queries SQL usando CTE
2. Implementar serviço de agregação
3. Integrar Redis para cache
4. Criar endpoint

Foco:
- Performance (P95 < 300ms)
- Código limpo e escalável

Não implementar frontend.

Próximo passo: automação (réguas).