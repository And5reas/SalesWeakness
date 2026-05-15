# Módulo: Automation

**Status:** Não iniciado — implementação no Step 07.

## Responsabilidade

Transforma diagnósticos de fragilidade em ações de reativação. Opera exclusivamente de forma assíncrona, consumindo eventos da fila de mensageria.

## Fluxo

```
lead.stagnated (fila)
  → Consumer Worker
  → Identifica régua aplicável (por stage, campaign ou tenant config)
  → Enfileira disparo (outbound.email / outbound.whatsapp)
  → Registra histórico do disparo vinculado ao lead_id
```

## Componentes planejados (Step 07)

| Componente | Descrição |
|-----------|-----------|
| `automation.module.ts` | Módulo NestJS com consumer de fila. |
| `automation.service.ts` | Lógica de seleção de régua e disparo. |
| `reactivation-rule.entity.ts` | Entidade para configuração de réguas por tenant. |
| `dispatch-history.entity.ts` | Histórico de disparos por lead. |

## Retry Logic

- Máximo de 3 tentativas com backoff exponencial: 1min → 5min → 15min.
- Após 3 falhas: evento enviado para Dead Letter Queue (DLQ).

## Canais de saída

- **E-mail**: via SendGrid ou AWS SES (fila `outbound.email`).
- **WhatsApp**: via WhatsApp Business API (fila `outbound.whatsapp`).

> **Nota**: integrações reais com APIs externas não são implementadas no MVP — apenas os dispatchers são configurados. Nos testes, os dispatchers são mockados.
