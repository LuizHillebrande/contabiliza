# Contabiliza — Documentação do Ambiente de Desenvolvimento

Documentação das configurações realizadas para conectar o **backend Django** ao **frontend Next.js** e permitir o início do desenvolvimento.

---

## 1. Visão geral da arquitetura

```
┌─────────────────────────┐         HTTP/JSON          ┌─────────────────────────┐
│  Frontend (Next.js)     │  ───────────────────────►  │  Backend (Django + DRF) │
│  http://localhost:3000  │  ◄───────────────────────  │  http://127.0.0.1:8000  │
└─────────────────────────┘                            └─────────────────────────┘
         │                                                        │
         │  lib/api.ts                                            │  tarefas/views.py
         │  fetch /api/tarefas/                                   │  TarefaViewSet
         │                                                        │  ↓
         │                                                        │  serializers.py
         │                                                        │  ↓
         │                                                        │  models.py → SQLite
```

| Camada | Tecnologia | Porta |
|--------|------------|-------|
| Frontend | Next.js 16 + React 19 + TypeScript | 3000 |
| Backend | Django 5.2 + Django REST Framework | 8000 |
| Banco (dev) | SQLite (`backend/db.sqlite3`) | — |

---

## 2. Estrutura do projeto

```
contabiliza/
├── documentacoes.md          ← este arquivo
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── db.sqlite3
│   ├── contabiliza/          ← configuração do projeto Django
│   │   ├── settings.py
│   │   └── urls.py
│   ├── tarefas/              ← app de tarefas (API funcional)
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── migrations/
│   ├── usuarios/             ← app criado (ainda sem model/API)
│   └── obrigacoes/           ← app criado (ainda sem model/API)
└── frontend/
    ├── .env.local            ← URL da API (não commitar segredos reais)
    ├── .env.example          ← modelo da variável de ambiente
    ├── lib/api.ts            ← cliente HTTP centralizado
    └── app/
        ├── layout.tsx
        └── page.tsx          ← dashboard consumindo a API
```

---

## 3. O que foi corrigido no backend

### 3.1 URLs da API (DRF Router)

**Problema:** `tarefas/urls.py` apontava para views antigas (`index`, `criar_tarefa`) que já não existiam, quebrando o Django.

**Solução:** Registro do `TarefaViewSet` via `DefaultRouter`.

**Arquivo:** `backend/tarefas/urls.py`

```python
router = DefaultRouter()
router.register('tarefas', TarefaViewSet)
```

**Arquivo:** `backend/contabiliza/urls.py`

```python
path('api/', include('tarefas.urls')),
```

**Endpoints disponíveis:**

| Método | URL | Ação |
|--------|-----|------|
| GET | `/api/tarefas/` | Listar tarefas |
| POST | `/api/tarefas/` | Criar tarefa |
| GET | `/api/tarefas/{id}/` | Detalhe |
| PUT/PATCH | `/api/tarefas/{id}/` | Atualizar |
| DELETE | `/api/tarefas/{id}/` | Excluir |

### 3.2 Configurações globais (`settings.py`)

Alterações aplicadas:

- `ALLOWED_HOSTS = ['localhost', '127.0.0.1']`
- `LANGUAGE_CODE = 'pt-br'`
- `TIME_ZONE = 'America/Sao_Paulo'`
- CORS liberado para `localhost:3000` e `127.0.0.1:3000`
- `REST_FRAMEWORK` com paginação (20 itens por página) e permissão `AllowAny` (temporário para desenvolvimento)

> **Nota:** `AllowAny` permite acesso sem login. Quando implementar autenticação, trocar por `IsAuthenticated`.

### 3.3 Model e migrations

- Campo `reponsavel_tarefa` recebeu `default='nao_atribuido'` para permitir migration sem interação manual.
- Migration `0002_tarefas_reponsavel_tarefa.py` criada e aplicada.

### 3.4 Admin

- Model `Tarefas` registrado com listagem, filtros e busca.
- Acesso: http://127.0.0.1:8000/admin/
- Superusuário existente: `admcontabiliza`

### 3.5 Dependências Python

**Arquivo:** `backend/requirements.txt`

```
Django==5.2.14
djangorestframework==3.17.1
django-cors-headers==4.9.0
```

---

## 4. O que foi configurado no frontend

### 4.1 Variável de ambiente

**Arquivo:** `frontend/.env.local`

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

**Arquivo:** `frontend/.env.example` — mesmo conteúdo, para versionar no Git sem expor configurações locais.

### 4.2 Cliente HTTP (`lib/api.ts`)

Centraliza as chamadas ao backend:

- `getTarefas()` — GET `/api/tarefas/`
- `createTarefa()` — POST `/api/tarefas/` (pronto para uso futuro)
- Tipo TypeScript `Tarefa` espelhando o JSON do serializer Django
- Suporte à resposta paginada do DRF (`results`)

### 4.3 Dashboard conectado

**Arquivo:** `frontend/app/page.tsx`

- Busca tarefas do backend via Server Component.
- Exibe lista ou mensagem de erro se o Django não estiver rodando.
- Link para o Django Admin quando não há tarefas.

---

## 5. Como rodar o ambiente

### Pré-requisitos

- Python 3.11+
- Node.js 20+
- venv ativado na raiz do repositório

### Backend

```bash
# Na raiz do repositório (extensao_contabiliza/)
source venv/bin/activate

# Instalar dependências (se necessário)
pip install -r contabiliza/backend/requirements.txt

# Entrar no backend
cd contabiliza/backend

# Aplicar migrations (se houver novas)
python manage.py migrate

# Subir servidor
python manage.py runserver
```

Backend disponível em: **http://127.0.0.1:8000**

### Frontend

```bash
# Em outro terminal
cd contabiliza/frontend

# Instalar dependências (primeira vez)
npm install

# Copiar env de exemplo (primeira vez)
cp .env.example .env.local

# Subir servidor
npm run dev
```

Frontend disponível em: **http://localhost:3000**

---

## 6. Como testar a conexão

### Teste 1 — API direto no navegador ou terminal

```bash
curl http://127.0.0.1:8000/api/tarefas/
```

Resposta esperada (JSON paginado):

```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "nome_tarefa": "Entregar DCTF",
      "prazo_tarefa": "2026-06-30",
      "reponsavel_tarefa": "Maria Silva",
      "observacoes": "Cliente ABC Ltda",
      "status_tarefa": "PENDENTE"
    }
  ]
}
```

### Teste 2 — Dashboard Next.js

1. Backend rodando na porta 8000
2. Frontend rodando na porta 3000
3. Acesse http://localhost:3000
4. A seção **Tarefas** deve listar os registros do banco

### Teste 3 — Criar tarefa pelo Admin

1. Acesse http://127.0.0.1:8000/admin/
2. Login com `admcontabiliza`
3. Cadastre uma tarefa em **Tarefas**
4. Recarregue o dashboard — a tarefa aparece no front

---

## 7. Fluxo de uma requisição (exemplo)

```
1. Usuário abre http://localhost:3000
2. Next.js executa app/page.tsx (Server Component)
3. page.tsx chama getTarefas() em lib/api.ts
4. fetch → GET http://127.0.0.1:8000/api/tarefas/
5. Django recebe em contabiliza/urls.py → tarefas/urls.py
6. TarefaViewSet.list() consulta Tarefas.objects.all()
7. TarefaSerializer converte para JSON
8. Resposta volta ao Next.js e renderiza a lista
```

---

## 8. Mapeamento Django ↔ Spring (referência)

| Django | Spring |
|--------|--------|
| `models.py` | `@Entity` |
| `serializers.py` | DTO + Mapper |
| `views.py` (ViewSet) | `@RestController` |
| `urls.py` | `@RequestMapping` |
| `settings.py` | `application.yml` |
| `admin.py` | Painel customizado |
| `migrations/` | Flyway/Liquibase |

---

## 9. Dados de exemplo

Foram inseridas 2 tarefas de exemplo para validar a integração:

| Tarefa | Responsável | Status |
|--------|-------------|--------|
| Entregar DCTF | Maria Silva | Pendente |
| Conferir folha de pagamento | João Santos | Em andamento |

---

## 10. Próximos passos sugeridos

1. **Autenticação** — JWT ou session auth com Django REST Framework + Spring Security equivalente
2. **App usuarios** — model de colaborador com perfis (admin, encarregado, colaborador)
3. **ForeignKey** — substituir `reponsavel_tarefa` (CharField) por relação com usuário
4. **PostgreSQL** — trocar SQLite em produção
5. **Páginas CRUD no front** — formulários para criar/editar tarefas
6. **App obrigacoes** — model, serializer, viewset e tela no front

---

## 11. Problemas comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| `ModuleNotFoundError: No module named 'api'` | App inexistente no `INSTALLED_APPS` | Remover `'api'` do settings |
| Front mostra erro de conexão | Backend parado | `python manage.py runserver` |
| CORS error no browser | Backend sem corsheaders | Verificar middleware e `CORS_ALLOWED_ORIGINS` |
| `AttributeError: views.index` | URLs antigas | Usar router DRF (já corrigido) |
| Lista vazia no front | Banco sem dados | Cadastrar pelo Admin ou POST na API |

---

## 12. Arquivos modificados nesta configuração

### Backend
- `contabiliza/settings.py`
- `contabiliza/urls.py`
- `tarefas/models.py`
- `tarefas/views.py`
- `tarefas/serializers.py`
- `tarefas/urls.py`
- `tarefas/admin.py`
- `tarefas/migrations/0002_tarefas_reponsavel_tarefa.py` (criada)
- `requirements.txt` (criado)

### Frontend
- `lib/api.ts` (criado)
- `app/page.tsx`
- `.env.local` (criado)
- `.env.example` (criado)

---

*Documentação gerada em 19/06/2026 — ambiente pronto para desenvolvimento.*
