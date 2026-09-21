# StudyMind AI — Plataforma de Estudos com IA Local

> **StudyMind AI** é uma plataforma completa e moderna de estudos que potencializa o aprendizado dos estudantes através de **Inteligência Artificial 100% local**, sem envio de dados para provedores em nuvem pagos, sem custos de API e **sem obrigatoriedade de Docker**!

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript & React 19
- **Estilização**: Tailwind CSS v4 (Tema Dark SaaS moderno)
- **Ícones**: Lucide React
- **Efeitos e UI**: Canvas-Confetti, Árvore de Conceitos Interativa & Mermaid

### Backend
- **Framework**: Python 3.11+ com FastAPI
- **Servidor ASGI**: Uvicorn
- **ORM & Banco**: SQLAlchemy 2.0 (Async) com suporte automático tanto a **SQLite Local (Zero Docker)** com busca vetorial via NumPy, quanto a **PostgreSQL 16 + pgvector**.
- **Validação de Schemas**: Pydantic v2 & Pydantic Settings
- **Processamento de Documentos**:
  - `PyMuPDF` (`fitz`) para extração de PDFs com numeração de páginas e metadados
  - `python-pptx` para extração de slides do PowerPoint
  - Suporte nativo com detecção de encoding para arquivos `.txt`
- **Segurança**: JWT com `python-jose` e hash `bcrypt`

### Inteligência Artificial Local (Ollama)
- **LLM Principal**: `qwen3:8b` (geração de resumos, chat RAG, questões, flashcards e análises pedagógicas)
- **Modelo de Embeddings**: `qwen3-embedding:0.6b` (vetorização semântica e busca por similaridade de cosseno em 1024 dimensões)
- **Camada Centralizada**: `app/ai/ollama_client.py` com fallback amigável caso a IA esteja offline.

---

## 🌟 Funcionalidades Principais

1. **Autenticação & Isolamento Multi-usuário**: Cadastro, Login e JWT seguro.
2. **Dashboard Inteligente**:
   - Saudação personalizada
   - Cards de métricas (Matérias, Horas estudadas, Questões resolvidas, Taxa de acertos)
   - Próximas provas com contagem regressiva
   - Plano de estudos do dia com marcação interativa
   - Matérias recentes e gráfico de desempenho semanal
   - "Pontos Fracos" e assuntos em estado crítico
3. **Minhas Matérias (CRUD Completo)**:
   - Cores personalizadas e ícones
   - Hub com 8 abas dedicadas (Visão Geral, Materiais, Chat RAG, Resumos, Flashcards, Questões, Simulados, Mapa Mental)
4. **Upload com Processamento Hierárquico em Background**:
   - Drag and drop para PDF, PPTX e TXT
   - Barra de progresso em tempo real: `Extraindo (35%)` ➔ `Analisando com IA (55%)` ➔ `Criando índice vetorial (80%)` ➔ `Pronto (100%)`
5. **Chat com Documentos (RAG Grounding)**:
   - Perguntas respondidas rigorosamente com base nos documentos enviados
   - Citações exatas de fontes com nome do arquivo, página/slide e trecho extraído
   - Sugestões rápidas de comandos didáticos
6. **Gerador de Resumos com IA (5 Formatos)**:
   - Resumo Rápido (3 minutos)
   - Resumo Completo e estruturado
   - Resumo para Prova (foco no que cai e pegadinhas)
   - Resumo em Tópicos
   - Resumo Simplificado ("como se eu tivesse 12 anos")
7. **Flashcards com Repetição Espaçada (Algoritmo SM-2)**:
   - Modo estudo interativo com efeito 3D de virar carta
   - Avaliações: `Errei` (0d), `Difícil` (1d), `Bom` (3d), `Fácil` (6d)
8. **Banco de Questões**:
   - Múltipla Escolha, Verdadeiro/Falso e Discursivas
   - Níveis Fácil, Médio, Difícil e Misturado
   - Correção instantânea com gabarito, explicação pedagógica e citação da fonte
9. **Simulados Cronometrados**:
   - Prova com cronômetro regressivo ativo
   - Gabarito e respostas travadas até a finalização
   - Scorecard com nota final e porcentagem de acertos detalhada por assunto
10. **Sistema de Domínio Determinístico (0 a 100)**:
    - Cálculo de maestria baseado no histórico de questões, flashcards e simulados
    - Classificações: `DOMINADO (≥80%)`, `EM PROGRESSO (60-79%)`, `PRECISA REVISAR (40-59%)` e `CRÍTICO (<40%)`
11. **🚨 "Tenho Prova Amanhã" (Modo Intensivo de Choque)**:
    - Algoritmo de prioridade: combina dificuldade, baixo domínio, importância e probabilidade de cair na prova
    - Cronograma detalhado bloco a bloco para o tempo disponível (ex: 3 horas)
    - Seção *"Não perca tempo agora com:"* listando tópicos que o aluno já domina para não desperdiçar horas preciosas
12. **Mapa Mental Interativo**:
    - Visualização hierárquica por capítulos e tópicos expansíveis
    - Painel inspetor de conceitos, fórmulas e definições-chave

---

## 🛠️ Como Executar Sem Docker (Modo Direto)

### 1. Iniciar o Ollama com os Modelos
No seu terminal:
```bash
ollama pull qwen3:8b
ollama pull qwen3-embedding:0.6b
ollama serve
```

### 2. Iniciar o Backend (FastAPI)
Abra um terminal na pasta do projeto:
```bash
cd backend
.\venv\Scripts\uvicorn main:app --reload --port 8000
```
> O backend inicializará automaticamente o banco de dados SQLite local `studymind.db` e utilizará busca vetorial ultrarrápida via NumPy (Zero Docker!).
> A documentação Swagger estará em `http://localhost:8000/docs`.

### 3. Iniciar o Frontend (Next.js)
Em outro terminal:
```bash
cd frontend
npm run dev
```
Abra o navegador em: **`http://localhost:3000`**

---

## 🧪 Testes Automatizados

Para rodar os testes unitários do backend:
```bash
cd backend
.\venv\Scripts\pytest -v
```
