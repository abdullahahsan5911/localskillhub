import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Send, Loader2, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface OtherUser {
  _id: string;
  name: string;
  avatar?: string;
}

interface Conversation {
  _id: string; // conversationId string
  lastMessage?: { content: string; createdAt: string };
  unreadCount: number;
  otherUser: OtherUser;
}

interface Message {
  _id: string;
  senderId: { _id: string; name: string; avatar?: string } | string;
  receiverId: { _id: string; name: string; avatar?: string } | string;
  content: string;
  createdAt: string;
  isRead?: boolean;
}

interface MessagesTabProps {
  /** If provided, auto-opens this user's conversation on mount */
  initialTargetUserId?: string;
  /** Called with total unread count after conversations load */
  onUnreadCount?: (count: number) => void;
}

const MessagesTab = ({ initialTargetUserId, onUnreadCount }: MessagesTabProps) => {
  const { user } = useAuth();
  const currentUserId = (user as any)?._id;
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const buildConversationId = (userA: string, userB: string) =>
    [userA, userB].sort().join("_");

  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConvs(true);
      const res = await api.getConversations();
      if (res?.data) {
        const convs: Conversation[] = (res.data as any).conversations || [];
        setConversations(convs);
        const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        onUnreadCount?.(total);

        // Auto-select if initialTargetUserId provided
        if (initialTargetUserId && currentUserId) {
          const existing = convs.find(c => c.otherUser?._id === initialTargetUserId);
          if (existing) {
            setSelectedConv(existing);
          } else if (initialTargetUserId !== currentUserId) {
            const starterConv: Conversation = {
              _id: buildConversationId(currentUserId, initialTargetUserId),
              unreadCount: 0,
              otherUser: {
                _id: initialTargetUserId,
                name: "New conversation",
              },
            };

            try {
              const profileRes = await api.getFreelancer(initialTargetUserId);
              const profileUser = (profileRes.data as any)?.freelancer?.userId;
              if (profileUser) {
                starterConv.otherUser = {
                  _id: profileUser._id,
                  name: profileUser.name,
                  avatar: profileUser.avatar,
                };
              }
            } catch {
              // Keep fallback name if profile fetch fails.
            }

            setConversations((prev) => [starterConv, ...prev]);
            setSelectedConv(starterConv);
          }
        } else if (convs.length > 0 && !selectedConv) {
          setSelectedConv(convs[0]);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoadingConvs(false);
    }
  }, [initialTargetUserId, onUnreadCount, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMessages = useCallback(async (conv: Conversation) => {
    try {
      setLoadingMsgs(true);
      const res = await api.getMessages(conv._id);
      if (res?.data) {
        const msgs: Message[] = (res.data as any).messages || [];
        setMessages(msgs);
        setTimeout(scrollToBottom, 100);

        // Mark unread messages in this conversation as read for current user
        if (currentUserId) {
          const toMark = msgs.filter(
            (m) => !m.isRead && getReceiverId(m) === currentUserId
          );
          if (toMark.length > 0) {
            try {
              await Promise.allSettled(
                toMark.map((m) => api.markMessageRead(m._id))
              );
              // Let other UI (like navbar) know to refresh conversations
              window.dispatchEvent(new Event("conversationsUpdated"));
            } catch {
              // ignore mark-as-read errors in UI
            }
          }
        }
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingMsgs(false);
    }
  }, [currentUserId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (selectedConv) fetchMessages(selectedConv);
  }, [selectedConv, fetchMessages]);

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);
    // Mark locally as read
    setConversations(prev =>
      prev.map(c => c._id === conv._id ? { ...c, unreadCount: 0 } : c)
    );
  };

  const handleSend = async () => {
    if (!messageText.trim() || !selectedConv) return;
    const content = messageText.trim();
    const activeConv = selectedConv;
    const optimisticId = `temp-${Date.now()}`;

    const optimisticMessage: Message = {
      _id: optimisticId,
      senderId: currentUserId || "",
      receiverId: activeConv.otherUser._id,
      content,
      createdAt: new Date().toISOString(),
    };

    // Instant local append for smooth WhatsApp-like UX.
    setMessages((prev) => [...prev, optimisticMessage]);

    // Keep recent conversation preview in sync immediately.
    setConversations((prev) => {
      const next = prev.map((c) =>
        c._id === activeConv._id
          ? {
            ...c,
            lastMessage: {
              content,
              createdAt: optimisticMessage.createdAt,
            },
          }
          : c
      );

      const idx = next.findIndex((c) => c._id === activeConv._id);
      if (idx <= 0) return next;
      const [moved] = next.splice(idx, 1);
      next.unshift(moved);
      return next;
    });

    setMessageText("");
    setTimeout(scrollToBottom, 0);
    setSending(true);

    try {
      const res = await api.sendMessage({
        receiverId: activeConv.otherUser._id,
        conversationId: activeConv._id,
        content,
      });

      const savedMessage = (res?.data as any)?.message;
      if (savedMessage?._id) {
        setMessages((prev) =>
          prev.map((m) => (m._id === optimisticId ? savedMessage : m))
        );

        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConv._id
              ? {
                ...c,
                lastMessage: {
                  content: savedMessage.content,
                  createdAt: savedMessage.createdAt,
                },
              }
              : c
          )
        );
      }
    } catch {
      // Roll back optimistic update if API fails.
      setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
      setMessageText(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Avoid accidental submit/send while using IME composition.
    if ((e.nativeEvent as any).isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getSenderId = (msg: Message): string => {
    if (typeof msg.senderId === "object") return msg.senderId._id;
    return msg.senderId;
  };

  const getReceiverId = (msg: Message): string => {
    if (typeof msg.receiverId === "object") return msg.receiverId._id;
    return msg.receiverId;
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const formatMsgTime = (ts: string) =>
    new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const filteredConvs = conversations.filter(c =>
    !searchQuery || c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitial = (name?: string) => (name || "?").charAt(0).toUpperCase();

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[500px] rounded-2xl border border-gray-200 overflow-hidden bg-white">
      {/* Sidebar – Conversation list */}
      <div className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          {/* <h2 className="font-semibold text-gray-900 mb-3">Messages</h2> */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-200 border border-transparent focus:border-blue-300 transition"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Your chats will appear here</p>
            </div>
          ) : (
            filteredConvs.map(conv => {
              const isActive = selectedConv?._id === conv._id;
              return (
                <button
                  type="button"
                  key={conv._id}
                  onClick={() => handleSelectConv(conv)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 text-left ${isActive ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
                    }`}
                >
                  <div className="relative flex-shrink-0">
                    {conv.otherUser?.avatar ? (
                      <img
                        src={conv.otherUser.avatar}
                        alt={conv.otherUser.name}
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                        {getInitial(conv.otherUser?.name)}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`text-sm font-semibold truncate ${isActive ? "text-blue-700" : "text-gray-900"}`}>
                        {conv.otherUser?.name || "User"}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.lastMessage?.content || "Start a conversation"}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="flex-shrink-0 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selectedConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-sm text-gray-500">Choose a chat from the sidebar to start messaging</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3 bg-white flex-shrink-0">
              {selectedConv.otherUser?.avatar ? (
                <img
                  src={selectedConv.otherUser.avatar}
                  alt={selectedConv.otherUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                  {getInitial(selectedConv.otherUser?.name)}
                </div>
              )}
              <div className="flex flex-col">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {selectedConv.otherUser?.name || "User"}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-green-500 font-medium">Online</p>
                  {selectedConv.otherUser?._id && (
                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${selectedConv.otherUser!._id}`)}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      View profile
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-sm text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1">Say hello!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = getSenderId(msg) === currentUserId;
                  return (
                    <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        {!isMe && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 mb-1">
                            {getInitial(
                              typeof msg.senderId === "object" ? msg.senderId.name : undefined
                            )}
                          </div>
                        )}
                        <div>
                          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-gray-100 text-gray-900 rounded-bl-sm"
                            }`}>
                            {msg.content}
                          </div>
                          <p className={`text-xs text-gray-400 mt-1 ${isMe ? "text-right" : "text-left"}`}>
                            {formatMsgTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                    rows={1}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-200 border border-transparent focus:border-blue-300 transition resize-none"
                    style={{ minHeight: "44px", maxHeight: "120px" }}
                    onInput={e => {
                      const t = e.target as HTMLTextAreaElement;
                      t.style.height = "auto";
                      t.style.height = Math.min(t.scrollHeight, 120) + "px";
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!messageText.trim() || sending}
                  className="w-11 h-11 flex-shrink-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl transition"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              {/* <p className="text-xs text-gray-400 mt-1.5 px-1">Enter to send · Shift+Enter for new line</p> */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
