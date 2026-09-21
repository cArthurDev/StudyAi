'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api, ChatMessage, ChatSource, DocumentItem } from '@/lib/api';
import { 
  Send, Bot, User, Sparkles, BookOpen, FileText, 
  ExternalLink, Copy, Check, Info, Loader2 
} from 'lucide-react';

interface ChatInterfaceProps {
  subjectId: string;
  documents?: DocumentItem[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ subjectId, documents = [] }) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<ChatSource | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starterSuggestions = [
    "Resuma essa matéria com os pontos principais",
    "O que é mais importante para prova?",
    "Explique de forma simples com analogias",
    "Crie questões sobre este assunto",
    "O que provavelmente cairia em uma prova?",
    "Me explique como se eu tivesse 12 anos"
  ];

  const loadConversations = async () => {
    try {
      const list = await api.getConversations(subjectId);
      setConversations(list);
      if (list.length > 0 && !activeConvId) {
        setActiveConvId(list[0].id);
        setMessages(list[0].messages || []);
      } else if (list.length === 0) {
        // Create initial conversation
        const newConv = await api.createConversation(subjectId);
        setConversations([newConv]);
        setActiveConvId(newConv.id);
        setMessages([]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadConversations();
  }, [subjectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || !activeConvId || loading) return;

    setInputPrompt('');
    setLoading(true);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      conversation_id: activeConvId,
      sender: 'user',
      content: query,
      sources: [],
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const reply = await api.sendMessage(activeConvId, query, selectedDocId || undefined);
      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, reply]);
      loadConversations(); // refresh title if updated
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        conversation_id: activeConvId,
        sender: 'assistant',
        content: `⚠️ Não foi possível obter resposta: ${err.message || 'Erro ao conectar com Ollama.'}`,
        sources: [],
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[700px] bg-[#0d1117] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Chat header & context filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#161b22]/70 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Tutor de Estudos RAG</h3>
            <p className="text-[11px] text-slate-400">Respostas fundamentadas rigorosamente nos seus documentos</p>
          </div>
        </div>

        {/* Document Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Contexto:</span>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">📚 Todos os materiais da matéria</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                📄 {d.name} ({d.file_type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-8">
            <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-gradient-to-tr from-teal-600/20 to-teal-400/20 text-teal-400 border border-teal-500/30 shadow-lg">
              <Sparkles className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-200">Converse com seus materiais</h4>
            <p className="mt-1 text-xs text-slate-400">
              Faça perguntas sobre fórmulas, conceitos, pegadinhas de prova ou peça resumos diretos.
            </p>

            {/* Quick Prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full text-left">
              {starterSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  className="p-3 text-xs text-slate-300 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/40 rounded-xl transition-all text-left cursor-pointer"
                >
                  💬 {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-400 text-white shrink-0 shadow-md shadow-teal-500/20">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`flex flex-col max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-teal-600 text-white font-medium rounded-br-xs shadow-md shadow-teal-500/10'
                    : 'bg-[#161b22] text-slate-200 rounded-bl-xs border border-slate-800/80 shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Verified Source Citations */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-teal-400 block mb-2">
                      Fontes verificadas nos seus documentos:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((s, sIdx) => {
                        const pageLabel = s.file_type === 'pptx' ? `Slide ${s.page_or_slide}` : `Pág. ${s.page_or_slide}`;
                        return (
                          <button
                            key={sIdx}
                            onClick={() => setPreviewSource(s)}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/50 rounded-lg text-slate-300 transition-colors shadow-xs cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-teal-400" />
                            <span className="font-medium text-slate-200">{s.document_name}</span>
                            <span className="text-slate-400">— {pageLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!isUser && (
                  <div className="flex items-center justify-end gap-2 mt-2 pt-1">
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Copiar resposta"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-800 text-slate-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3.5 justify-start">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-400 text-white shrink-0 animate-pulse">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2.5 px-4 py-3 bg-[#161b22] border border-slate-800 rounded-2xl rounded-bl-xs text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
              <span>Consultando vetores e gerando resposta fundamentada...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-4 bg-[#161b22]/70 border-t border-slate-800/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Pergunte sobre seus materiais de estudo..."
            disabled={loading}
            className="flex-1 px-4 py-3 text-sm bg-slate-900 border border-slate-700/80 focus:border-teal-500 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
          />

          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="flex items-center justify-center w-11 h-11 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>

      {/* Source Citation Preview Modal */}
      {previewSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg p-6 bg-[#161b22] border border-slate-700 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-200">{previewSource.document_name}</h4>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono">
                {previewSource.file_type === 'pptx' ? `Slide ${previewSource.page_or_slide}` : `Página ${previewSource.page_or_slide}`}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-2 font-medium">Trecho extraído do documento original:</p>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed max-h-60 overflow-y-auto">
              {previewSource.snippet}
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setPreviewSource(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
