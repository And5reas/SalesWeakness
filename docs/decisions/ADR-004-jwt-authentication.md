# ADR-004 — Estratégia de Autenticação com JWT (RS256)

**Status:** Aceito  
**Data:** Março de 2026

## Contexto

Precisamos de autenticação stateless, segura e escalável que suporte multi-tenancy (cada token carrega o `tenant_id`) e controle granular de permissões por perfil (director, marketing_manager, sales_rep).

## Decisão

Adotamos **JWT (JSON Web Token) com algoritmo RS256** (assimétrico) como mecanismo de autenticação. Os tokens contêm os seguintes claims:

```json
{
  "sub": "user_id",
  "tenant_id": 1,
  "profile": "director",
  "scopes": ["analytics:read"],
  "exp": 1711929600
}
```

## Justificativa

- **RS256 (assimétrico)**: a chave privada fica apenas no serviço de autenticação; qualquer serviço pode validar com a chave pública sem precisar da chave privada.
- **Stateless**: não requer sessão no servidor — compatível com escalabilidade horizontal.
- **Claims embutidos**: `tenant_id`, `profile` e `scopes` no token eliminam round-trips ao banco para verificar permissões a cada requisição.
- **Integração NestJS**: `@nestjs/passport` + `passport-jwt` implementam a estratégia JWT como um Guard reutilizável (`JwtAuthGuard`).

## Implementação

O fluxo de autenticação opera em três camadas:

1. **JwtAuthGuard**: valida assinatura, expiração e estrutura do token.
2. **TenantContextInterceptor**: extrai `tenant_id` do payload e injeta em `req.tenantId`.
3. **RolesGuard**: verifica se `req.user.profile` está na lista de perfis permitidos.

## Consequências

- JWT_SECRET deve ser um valor forte (≥ 32 chars) armazenado em variável de ambiente.
- Expiração padrão de 1h — clientes precisam implementar refresh token (Step 02).
- Revogação de tokens requer blocklist em Redis (pós-MVP).
