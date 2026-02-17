import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
  last_message?: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

const WELCOME_MESSAGE = "Hello. I am FactraAI. I can analyze market sentiment, explain quantitative strategies, or summarize news. How can I assist you today?";

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (data && data.length > 0) {
      // Get last message for each conversation
      const convIds = data.map((c: any) => c.id);
      const { data: lastMsgs } = await supabase
        .from("chat_messages")
        .select("conversation_id, content, role")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

      const lastMsgMap = new Map<string, string>();
      if (lastMsgs) {
        for (const m of lastMsgs as any[]) {
          if (!lastMsgMap.has(m.conversation_id)) {
            lastMsgMap.set(m.conversation_id, m.content);
          }
        }
      }

      const convs: Conversation[] = data.map((c: any) => ({
        id: c.id,
        title: c.title,
        updated_at: c.updated_at,
        last_message: lastMsgMap.get(c.id) || WELCOME_MESSAGE,
      }));
      setConversations(convs);
      return convs;
    } else {
      setConversations([]);
      return [];
    }
  }, [user]);

  // Load messages for a conversation
  const selectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    setLoadingMessages(true);
    const { data } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      setMessages(data as ChatMessage[]);
    } else {
      // New conversation — show welcome
      setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
    }
    setLoadingMessages(false);
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: "New Conversation" })
      .select("id, title, updated_at")
      .single();

    if (error || !data) return null;
    const conv: Conversation = { ...(data as any), last_message: WELCOME_MESSAGE };
    setConversations((prev) => [conv, ...prev]);
    setActiveConversationId(conv.id);
    setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
    return conv.id;
  }, [user]);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [activeConversationId]);

  // Save a message to DB
  const saveMessage = useCallback(async (conversationId: string, role: "user" | "assistant", content: string) => {
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });
    // Bump updated_at
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }, []);

  // Update conversation title
  const updateTitle = useCallback(async (conversationId: string, title: string) => {
    const truncated = title.length > 40 ? title.slice(0, 40) + "…" : title;
    await supabase.from("conversations").update({ title: truncated }).eq("id", conversationId);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, title: truncated } : c))
    );
  }, []);

  // Set messages externally (for streaming updates)
  const setMessagesExternal = setMessages;

  // Initial load
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
      setLoadingConversations(false);
      return;
    }

    (async () => {
      setLoadingConversations(true);
      const convs = await fetchConversations();
      if (convs && convs.length > 0) {
        await selectConversation(convs[0].id);
      } else {
        // Auto-create first conversation
        const newId = await createConversation();
        if (newId) await selectConversation(newId);
      }
      setLoadingConversations(false);
    })();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    conversations,
    activeConversationId,
    messages,
    loadingConversations,
    loadingMessages,
    selectConversation,
    createConversation,
    deleteConversation,
    saveMessage,
    updateTitle,
    setMessages: setMessagesExternal,
    fetchConversations,
  };
}
