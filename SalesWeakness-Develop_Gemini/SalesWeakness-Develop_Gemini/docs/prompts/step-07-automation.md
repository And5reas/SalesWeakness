Continuando o SalesWeakness com analytics implementado.

Agora vamos implementar automação de reativação.

Requisitos:
- Consumir evento "lead.stagnated"
- Enviar mensagem via webhook
- Retry (até 3 tentativas)

Quero que você:

1. Configurar fila (RabbitMQ ou equivalente)
2. Criar producer (evento de estagnação)
3. Criar consumer (worker)
4. Implementar retry logic com backoff

Não integrar serviços externos reais ainda.

Próximo passo: pipeline e regras de negócio.