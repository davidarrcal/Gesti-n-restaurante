"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const SCREEN_CONTEXT: Record<string, string> = {
  "/": "Dashboard con métricas, alertas y últimos movimientos",
  "/productos": "Lista de productos del inventario con stock, precios y caducidad",
  "/entradas": "Registro de entradas (compras) de mercancía",
  "/salidas": "Registro de salidas (consumos, mermas, roturas)",
  "/escandallos": "Editor de platos y escandallos con cálculo de costes y márgenes",
  "/informes": "Generación de informes de movimientos, escandallos y caducidades",
};

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMsgs = [...messages, { role: "user" as const, content: text }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    setError(null);

    const contexto = SCREEN_CONTEXT[pathname] ?? "";

    try {
      const res = await api.chat(
        text,
        newMsgs.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        contexto,
      );
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err: any) {
      setError(err.message ?? "Error al comunicarse con el asistente");
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, pathname]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const reset = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-2xl"
          aria-label="Abrir asistente"
        >
          <span className="text-xl">💬</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-[calc(100vw-2rem)] md:w-96 max-w-md h-[60vh] md:h-[500px] flex flex-col bg-white rounded-xl shadow-2xl border border-neutral-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-blue-600 text-white rounded-t-xl">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="font-semibold text-sm">Asistente IA</span>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={reset}
                  className="text-xs px-2 py-1 rounded hover:bg-blue-700 text-blue-100"
                  title="Limpiar conversación"
                >
                  Limpiar
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-xl leading-none hover:bg-blue-700 w-7 h-7 rounded flex items-center justify-center"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-neutral-50"
          >
            {messages.length === 0 && (
              <div className="text-center text-neutral-400 text-sm py-8 space-y-2">
                <p className="text-2xl">🤖</p>
                <p className="font-medium text-neutral-500">
                  Hola {user?.nombre ?? ""}, soy tu asistente.
                </p>
                <p>
                  Pregúntame sobre inventario, alertas, escandallos, informes...
                  También puedo registrar entradas, salidas y crear productos.
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  {[
                    "¿Qué productos tienen stock bajo?",
                    "Dime el valor del inventario",
                    "Lista los platos con su food cost",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setInput(s);
                        inputRef.current?.focus();
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-neutral-200 text-neutral-700"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-400">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce [animation-delay:-0.3s]">•</span>
                    <span className="animate-bounce [animation-delay:-0.15s]">•</span>
                    <span className="animate-bounce">•</span>
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-neutral-200 bg-white rounded-b-xl">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribe tu pregunta..."
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}