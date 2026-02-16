import { useState, useEffect, useRef } from "react";
import { MessageSquare, Plus, Bot, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: { role: string; content: string }[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;

  while (!done) {
    const { done: readerDone, value } = await reader.read();
    if (readerDone) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // flush remaining
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

const AIView = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hello. I am FactraAI. I can analyze market sentiment, explain quantitative strategies, or summarize news. How can I assist you today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeChat, setActiveChat] = useState(1);

  const chatHistory = [
    { id: 1, title: 'New Conversation', preview: 'Hello. I am FactraAI...', time: 'Now' },
    { id: 2, title: 'NVDA Earnings Analysis', preview: 'Analyze the projected EPS vs consensus...', time: '2h ago' },
    { id: 3, title: 'Crypto Momentum', preview: 'Which altcoins are showing RSI divergence?', time: '1d ago' },
    { id: 4, title: 'Macro Trends Q3', preview: 'Summarize the impact of yield curve...', time: '3d ago' },
    { id: 5, title: 'Tech Sector Rotation', preview: 'Is money flowing out of mega-caps?', time: '1w ago' },
  ];

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    const userMessage: ChatMessage = { role: 'user', content: userMsg };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user" && prev[prev.length - 2]?.content === userMsg) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const apiMessages = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));
      await streamChat({
        messages: apiMessages,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
      });
    } catch (err: any) {
      console.error("Chat error:", err);
      setIsLoading(false);
      toast.error(err.message || "Failed to get response");
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 animate-fade-in-up">
      {/* Left Sidebar: History */}
      <div className="w-[40%] hidden lg:flex flex-col glass-panel rounded-2xl overflow-hidden border border-border">
        <div className="p-4 border-b border-border bg-card flex justify-between items-center shrink-0">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" /> History
          </h3>
          <button
            className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-primary/20 transition-all border border-border hover:border-primary/50"
            onClick={() => {
              setMessages([{ role: 'assistant', content: "Hello. I am FactraAI. How can I assist you today?" }]);
              setActiveChat(1);
            }}
          >
            <Plus size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`p-4 rounded-xl cursor-pointer transition-all border group ${
                activeChat === chat.id
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-secondary/30 border-transparent hover:bg-secondary hover:border-border'
              }`}
            >
              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className={`text-sm font-bold ${activeChat === chat.id ? 'text-primary' : 'text-foreground group-hover:text-foreground/80'}`}>
                  {chat.title}
                </span>
                <span className="text-[10px] text-muted-foreground">{chat.time}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate opacity-80">{chat.preview}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 lg:w-[60%] flex flex-col glass-panel rounded-2xl overflow-hidden border border-border">
        <div className="p-4 border-b border-border bg-card flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-bold text-foreground">FactraAI Assistant</h3>
            <p className="text-xs text-muted-foreground">Powered by Gemini</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-background/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-none shadow-[0_0_15px_hsl(var(--primary)/0.1)]'
                  : 'bg-secondary text-foreground/90 rounded-tl-none border border-border'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="text-sm prose prose-sm prose-invert max-w-none leading-relaxed">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-secondary p-4 rounded-2xl rounded-tl-none flex gap-2 items-center border border-border">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 bg-card border-t border-border flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about market trends or specific stocks..."
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors placeholder-muted-foreground"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-primary text-primary-foreground p-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_hsl(var(--primary)/0.2)]"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIView;
