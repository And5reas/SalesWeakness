# Módulo: Auth

**Status:** Stub (Step 01) — implementação completa no Step 02.

## Responsabilidade

Gerencia autenticação de usuários e emissão de tokens JWT para acesso à plataforma.

## Componentes atuais

| Arquivo | Descrição |
|---------|-----------|
| `auth.module.ts` | Módulo NestJS registrado no AppModule. Exporta AuthService. |
| `auth.controller.ts` | Stub — endpoints de login e refresh token serão implementados no Step 02. |
| `auth.service.ts` | Stub — lógica de login e emissão de JWT será implementada no Step 02. |

## Endpoints planejados (Step 02)

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/v1/auth/login` | Autentica email+senha e retorna JWT + refresh token. |
| `POST` | `/v1/auth/refresh` | Renova o JWT usando um refresh token válido. |

## JWT Payload

```json
{
  "sub": 1,
  "tenant_id": 42,
  "profile": "director",
  "scopes": ["analytics:read"],
  "exp": 1711929600
}
```

## Dependências futuras

- `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` (já instalados).
- Entidade `User` (criada no Step 02).
- Entidade `Tenant` (já existe em `tenants` module).
