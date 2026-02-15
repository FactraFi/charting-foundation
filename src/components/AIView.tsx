import { useState, useEffect, useRef } from "react";
import { MessageSquare, Plus, Bot, Send, Loader2 } from "lucide-react";

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const AIView = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: "Hello. I am FactraAI. I can analyze market sentiment, explain quantitative strategies, or summarize news. How can I assist you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeChat, setActiveChat] = useState(1);

  const chatHistory = [
    { id: 1, title: 'New Conversation', preview: 'Hello. I am FactraAI...', time: 'Now' },
    { id: 2, title: 'NVDA Earnings Analysis', preview: 'Analyze the projected EPS vs consensus...', time: '2h ago' },
    { id: 3, title: 'Crypto Momentum', preview: 'Which altcoins are showing RSI divergence?', time: '1d ago' },
    { id: 4, title: 'Macro Trends Q3', preview: 'Summarize the impact of yield curve...', time: '3d ago' },
    { id: 5, title: 'Tech Sector Rotation', preview: 'Is money flowing out of mega-caps?', time: '1w ago' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    // Mock AI response (will be replaced with real Lovable AI integration)
    setTimeout(() => {
      const responses = [
        `Based on current market data, here's my analysis of "${userMsg}":\n\n**Key Points:**\n- Market sentiment is currently leaning bullish with VIX at historic lows\n- Institutional flows show accumulation in tech and AI sectors\n- RSI indicators suggest some overbought conditions in mega-caps\n\nWould you like me to dive deeper into any specific aspect?`,
        `Great question about "${userMsg}". Let me break this down:\n\n1. **Fundamental Analysis**: The underlying financials remain strong with improving margins\n2. **Technical Outlook**: Price action is constructive above key moving averages\n3. **Risk Assessment**: Moderate risk with defined support levels\n\nI'd recommend monitoring the 50-day MA for potential entry signals.`,
        `Analyzing "${userMsg}" through FactraFi's multi-factor lens:\n\n📊 **Momentum**: Positive trend with accelerating volume\n💰 **Valuation**: Trading at a slight premium to sector peers\n⚡ **Sentiment**: Analyst consensus is bullish (4.2/5 average rating)\n🛡️ **Risk**: Beta of 1.15 suggests slightly above-market volatility\n\nOverall FactraScore: **78/100** - Signal: BUY`,
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
      setLoading(false);
    }, 1500);
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
              setMessages([{ role: 'assistant', text: "Hello. I am FactraAI. How can I assist you today?" }]);
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
            <p className="text-xs text-muted-foreground">Powered by Gemini 2.5</p>
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
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
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
            disabled={loading || !input.trim()}
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
