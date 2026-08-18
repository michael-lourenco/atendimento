# ⚠️ Solução Temporária: Detecção de Status de Conexão

## 🔍 Problema Identificado

O servidor na AWS está rodando uma versão antiga que:
- ❌ Não retorna o campo `connected` no endpoint `/health`
- ❌ Não limpa `qrAvailable` corretamente quando conecta (continua `true`)
- ❌ Não tem o endpoint `/api/status`

**Resultado**: O frontend não consegue detectar que está conectado.

## ✅ Solução Temporária Implementada

### Lógica de Inferência Ajustada

Como a versão antiga não limpa `qrAvailable` corretamente, a lógica foi ajustada para:

**Se `status === 'ok'`, assume que está conectado**

```typescript
// Se status é ok, assume conectado
inferredConnected = oldResponse.data.status === 'ok';
```

### Por que isso funciona?

- Quando o servidor está funcionando normalmente, `status` é sempre `'ok'`
- Quando conectado, o servidor continua retornando `status: 'ok'`
- É uma inferência conservadora que pode dar falso positivo, mas é melhor que falso negativo

### Limitações

⚠️ **Esta é uma solução temporária!**

- Pode mostrar "conectado" mesmo quando não está (falso positivo)
- Não é 100% preciso
- A solução definitiva é fazer deploy da versão nova do servidor

## 🚀 Solução Definitiva

Fazer deploy da versão nova do servidor que:
- ✅ Retorna `connected: true/false` no endpoint `/health`
- ✅ Limpa `qrAvailable` corretamente quando conecta
- ✅ Tem o endpoint `/api/status` com informações completas

## 📊 Status Atual

- ✅ Solução temporária implementada
- ⏳ Aguardando deploy da versão nova do servidor
- ⚠️ Detecção pode ter falsos positivos

---

**Data**: 2025-12-21
**Status**: ⚠️ Solução Temporária Ativa


