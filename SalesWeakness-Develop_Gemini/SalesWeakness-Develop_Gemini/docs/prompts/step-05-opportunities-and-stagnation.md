Continuando o SalesWeakness.

Agora vamos implementar o núcleo do sistema: detecção de leads estagnados.

Regras:
- Se opportunity está OPEN e não atualiza há 48h:
  → gerar audit_log com type = 'Stagnation'

Quero que você:

1. Criar entidades:
   - opportunities
   - stages
   - audit_logs
2. Criar relacionamento completo
3. Criar worker (cron job) que:
   - roda periodicamente
   - detecta oportunidades estagnadas
4. Inserir registros em audit_logs

Extra:
- Código otimizado para grandes volumes

Não implementar webhook ainda.

Próximo passo: relatório de auditoria.