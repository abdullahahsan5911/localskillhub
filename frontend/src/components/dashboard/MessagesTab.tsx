import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Send, Loader2, MessageSquare, ArrowUpRight, Trash2, Edit2, Check, X, Paperclip, X as CloseIcon, Download, FileText, File, Image as ImageIcon } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPresence } from "@/hooks/usePresence";
import { formatLastSeen } from "@/utils/presence";
import Avatar from "@/components/Avatar";

interface OtherUser {
  _id: string;
  name: string;
  avatar?: string;
}

interface Conversation {
  _id: string;
  lastMessage?: { content: string; createdAt: string };
  unreadCount: number;
  otherUser?: OtherUser | null;
}

interface Attachment {
  filename: string;
  url: string;
  previewUrl?: string;
  downloadUrl?: string;
  fileType: string;
  fileSize: number;
  uploadedAt?: string;
}

interface Message {
  _id: string;
  senderId: { _id?: string; name?: string; avatar?: string } | string | null | undefined;
  receiverId: { _id?: string; name?: string; avatar?: string } | string | null | undefined;
  content: string;
  createdAt: string;
  editedAt?: string;
  isDeleted?: boolean;
  deletedBy?: string[];
  isRead?: boolean;
  attachments?: Attachment[];
}

interface MessagesTabProps {
  initialTargetUserId?: string;
  onUnreadCount?: (count: number) => void;
}

const getFileIcon = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf': return <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">PDF</span>;
    case 'docx': case 'doc': return <FileText className="w-4 h-4 text-blue-500" />;
    case 'xlsx': case 'xls': return <FileText className="w-4 h-4 text-emerald-500" />;
    case 'jpg': case 'jpeg': case 'png': case 'gif': return <ImageIcon className="w-4 h-4 text-violet-500" />;
    case 'zip': case 'rar': case '7z': return <FileText className="w-4 h-4 text-amber-500" />;
    default: return <File className="w-4 h-4 text-slate-400" />;
  }
};

const isFilePreviewable = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif'].includes(extension || '');
};

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isOnline, lastSeen } = useUserPresence(selectedConv?.otherUser?._id || '');

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
        const rawConvs: Conversation[] = (res.data as any).conversations || [];
        const convs: Conversation[] = rawConvs.map((conv) => {
          const isSelfAsOther = !!currentUserId && conv.otherUser?._id === currentUserId;
          if (isSelfAsOther) {
            return {
              ...conv,
              otherUser: null,
            };
          }
          return conv;
        });
        setConversations(convs);
        const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        onUnreadCount?.(total);

        if (initialTargetUserId && currentUserId) {
          const existing = convs.find(c => c.otherUser?._id === initialTargetUserId);
          if (existing) {
            setSelectedConv(existing);
          } else if (initialTargetUserId !== currentUserId) {
            const starterConv: Conversation = {
              _id: buildConversationId(currentUserId, initialTargetUserId),
              unreadCount: 0,
              otherUser: { _id: initialTargetUserId, name: "New conversation" },
            };
            try {
              const profileRes = await api.getFreelancer(initialTargetUserId);
              const profileUser = (profileRes.data as any)?.freelancer?.userId;
              if (profileUser) {
                starterConv.otherUser = { _id: profileUser._id, name: profileUser.name, avatar: profileUser.avatar };
              }
            } catch {}
            setConversations((prev) => [starterConv, ...prev]);
            setSelectedConv(starterConv);
          }
        } else if (convs.length > 0 && !selectedConv) {
          setSelectedConv(convs[0]);
        }
      }
    } catch {}
    finally { setLoadingConvs(false); }
  }, [initialTargetUserId, onUnreadCount, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMessages = useCallback(async (conv: Conversation) => {
    try {
      setLoadingMsgs(true);
      const res = await api.getMessages(conv._id);
      if (res?.data) {
        const msgs: Message[] = (res.data as any).messages || [];
        setMessages(msgs);
        setTimeout(scrollToBottom, 100);
        if (currentUserId) {
          const toMark = msgs.filter((m) => !m.isRead && getReceiverId(m) === currentUserId);
          if (toMark.length > 0) {
            try {
              await Promise.allSettled(toMark.map((m) => api.markMessageRead(m._id)));
              window.dispatchEvent(new Event("conversationsUpdated"));
            } catch {}
          }
        }
      }
    } catch { setMessages([]); }
    finally { setLoadingMsgs(false); }
  }, [currentUserId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);
  useEffect(() => { if (selectedConv) fetchMessages(selectedConv); }, [selectedConv, fetchMessages]);

  useEffect(() => {
    if (!selectedConv) return;

    let boundSocket: any = null;
    let retryTimer: number | null = null;

    const handleNewMessage = (message: Message) => {
      const incomingSenderId =
        typeof message.senderId === "string"
          ? message.senderId
          : message.senderId?._id || "";

      const selectedOtherId = selectedConv.otherUser?._id || "";
      const currentUserName = (user as any)?.name || "User";
      const currentUserAvatar =
        (user as any)?.avatar ||
        (user as any)?.avatarUrl ||
        (user as any)?.photoURL ||
        "";

      const normalizedMessage: Message = {
        ...message,
        senderId:
          incomingSenderId && incomingSenderId === selectedOtherId
            ? {
                _id: selectedOtherId,
                name: selectedConv.otherUser?.name || "User",
                avatar: selectedConv.otherUser?.avatar,
              }
            : incomingSenderId && currentUserId && incomingSenderId === currentUserId
              ? {
                  _id: currentUserId,
                  name: currentUserName,
                  avatar: currentUserAvatar,
                }
              : message.senderId,
      };

      setMessages((prev) => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, normalizedMessage];
      });
      setConversations((prev) =>
        prev.map(c => c._id === selectedConv._id ? { ...c, lastMessage: { content: message.content, createdAt: message.createdAt } } : c)
      );
      setTimeout(() => scrollToBottom(), 0);
    };

    const handleMessageEdited = (data: { messageId: string; content: string; editedAt: string; senderId: string }) => {
      setMessages((prev) =>
        prev.map(m =>
          m._id === data.messageId
            ? { ...m, content: data.content, editedAt: data.editedAt }
            : m
        )
      );
    };

    const bindSocketListeners = () => {
      const socket = (window as any).__socket;
      if (!socket) {
        retryTimer = window.setTimeout(bindSocketListeners, 300);
        return;
      }

      boundSocket = socket;
      socket.emit('joinConversation', selectedConv._id);
      socket.on('newMessage', handleNewMessage);
      socket.on('messageEdited', handleMessageEdited);
    };

    bindSocketListeners();

    return () => {
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
      if (boundSocket) {
        boundSocket.off('newMessage', handleNewMessage);
        boundSocket.off('messageEdited', handleMessageEdited);
      }
    };
  }, [selectedConv, currentUserId, user]);

  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);
    setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, unreadCount: 0 } : c));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploadingFile(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadedFile = await (api as any).uploadFile(file, 'messages');
        if (uploadedFile && uploadedFile.url) {
          setAttachments((prev) => [...prev, {
            filename: file.name,
            url: uploadedFile.url,
            fileType: file.type,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
          }]);
        }
      }
    } catch (error) {
      console.error("File upload failed:", error);
      alert("Failed to upload file: " + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getDisplayUserName = (name?: string) => {
    const normalized = String(name || "").trim();
    if (!normalized) return "User";
    if (/deleted user|unknown user|not found/i.test(normalized)) return "User";
    return normalized;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSend = async () => {
    if ((!messageText.trim() && attachments.length === 0) || !selectedConv) return;
    const content = messageText.trim();
    const activeConv = selectedConv;
    const activeReceiverId = activeConv.otherUser?._id;
    if (!activeReceiverId) {
      alert("User not found. You can view old messages, but cannot send new ones.");
      return;
    }
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = { _id: optimisticId, senderId: currentUserId || "", receiverId: activeReceiverId, content, createdAt: new Date().toISOString(), attachments };
    setMessages((prev) => [...prev, optimisticMessage]);
    setConversations((prev) => {
      const next = prev.map((c) => c._id === activeConv._id ? { ...c, lastMessage: { content: content || `Sent ${attachments.length} file(s)`, createdAt: optimisticMessage.createdAt } } : c);
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
      const res = await api.sendMessage({ receiverId: activeReceiverId, conversationId: activeConv._id, content, attachments: attachments.length > 0 ? attachments : undefined });
      const savedMessage = (res?.data as any)?.message;
      if (savedMessage?._id) {
        const socket = (window as any).__socket;
        if (socket) { socket.emit('sendMessage', { conversationId: activeConv._id, receiverId: activeReceiverId, senderId: currentUserId, message: savedMessage }); }
        setMessages((prev) => prev.map((m) => (m._id === optimisticId ? savedMessage : m)));
        setConversations((prev) => prev.map((c) => c._id === activeConv._id ? { ...c, lastMessage: { content: savedMessage.content, createdAt: savedMessage.createdAt } } : c));
        setAttachments([]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => prev.filter((m) => m._id !== optimisticId));
      setMessageText(content);
      alert("Failed to send message: " + (error instanceof Error ? error.message : 'Unknown error'));
    } finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.nativeEvent as any).isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await api.deleteMessage(messageId);
      setMessages((prev) => prev.map((m) => m._id === messageId ? { ...m, isDeleted: true } : m));
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    if (!editingText.trim()) return;
    try {
      const res = await api.editMessage(messageId, editingText);
      const updatedMessage = (res?.data as any)?.message;
      if (updatedMessage) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, content: updatedMessage.content, editedAt: updatedMessage.editedAt }
              : m
          )
        );
        const socket = (window as any).__socket;
        if (socket && selectedConv) {
          socket.emit('editMessage', {
            conversationId: selectedConv._id,
            messageId,
            content: updatedMessage.content,
            editedAt: updatedMessage.editedAt,
            senderId: currentUserId
          });
        }
        setEditingId(null);
        setEditingText("");
      }
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const getEntityId = (entity: Message["senderId"] | Message["receiverId"]): string => {
    if (!entity) return "";
    if (typeof entity === "string") return entity;
    return entity._id || "";
  };

  const getEntityName = (entity: Message["senderId"] | Message["receiverId"]): string => {
    if (!entity || typeof entity === "string") return "User";
    return getDisplayUserName(entity.name);
  };

  const getEntityAvatar = (entity: Message["senderId"] | Message["receiverId"]): string => {
    if (!entity || typeof entity === "string") return "";
    return entity.avatar || "";
  };

  const getProfileLinkForId = (entity: any) => {
    const id = entity?._id || entity || "";
    const role = entity?.role || entity?.accountType;
    if (!id) return "#";
    if (role === "freelancer") return `/freelancers/${id}`;
    if (role === "client" || role === "company") return `/clients/${id}`;
    return "";
  };

  const resolveProfilePath = async (entity: any) => {
    const id = entity?._id || entity || "";
    if (!id) return "";

    const directPath = getProfileLinkForId(entity);
    if (directPath) return directPath;

    try {
      const res = await api.getUser(String(id));
      const payload: any = (res as any)?.data || res;
      const resolvedUser = payload?.user || payload?.data?.user || payload?.data || null;
      const resolvedRole = resolvedUser?.role || resolvedUser?.accountType;
      if (resolvedRole === "freelancer") return `/freelancers/${id}`;
      if (resolvedRole === "client" || resolvedRole === "company") return `/clients/${id}`;
    } catch {
      // Ignore lookup errors and fall through to a deterministic fallback.
    }

    // Fallback to client route when role is unavailable; avoids forcing freelancer path.
    return `/clients/${id}`;
  };

  const navigateToProfile = async (entity: any) => {
    const path = await resolveProfilePath(entity);
    if (!path) return;
    navigate(path);
  };

  const getSenderId = (msg: Message): string => getEntityId(msg.senderId);
  const getReceiverId = (msg: Message): string => getEntityId(msg.receiverId);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };

  const formatMsgTime = (ts: string) =>
    new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true });

  const isRecentlyActive = (date: Date | null) => {
    if (!date) return false;
    return Date.now() - new Date(date).getTime() <= 45000;
  };

  const filteredConvs = conversations.filter(c =>
    !searchQuery || c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUserName = getDisplayUserName(selectedConv?.otherUser?.name);
  const selectedUserMissing = !selectedConv?.otherUser?._id;
  const isHeaderOnline = isOnline || isRecentlyActive(lastSeen);

  const getInitial = (name?: string) => (name || "?").charAt(0).toUpperCase();

  // Colour palette for avatar initials (deterministic per name)
  const avatarColors = [
    "bg-indigo-500", "bg-violet-500", "bg-sky-500",
    "bg-teal-500", "bg-rose-500", "bg-amber-500"
  ];
  const getAvatarColor = (name?: string) => {
    const n = (name || "?").charCodeAt(0);
    return avatarColors[n % avatarColors.length];
  };

  const ConversationItem = ({
    conv,
    isActive,
    onSelect,
  }: {
    conv: Conversation;
    isActive: boolean;
    onSelect: (conv: Conversation) => void;
  }) => {
    const { isOnline, lastSeen } = useUserPresence(conv.otherUser?._id || '');
    const displayName = getDisplayUserName(conv.otherUser?.name);
    const isMissingUser = !conv.otherUser?._id;
    const isEffectivelyOnline = isOnline || isRecentlyActive(lastSeen);

    return (
      <button
        type="button"
        onClick={() => onSelect(conv)}
        className={`w-full px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 transition-all duration-150 text-left relative ${
          isActive
            ? "bg-indigo-50 border-r-2 border-r-indigo-500"
            : "hover:bg-slate-50 border-r-2 border-r-transparent"
        }`}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <Avatar
            src={conv.otherUser?.avatar}
            name={displayName}
            size={40}
            className="w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-white shadow-sm"
          />
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full border-2 border-white ${isEffectivelyOnline ? "bg-emerald-400" : "bg-slate-300"}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 hidden sm:block">
          <div className="flex justify-between items-center mb-0.5">
            <span className={`text-xs sm:text-sm font-semibold truncate ${isActive ? "text-indigo-700" : "text-slate-800"}`}>
              {conv.otherUser?._id ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void navigateToProfile(conv.otherUser);
                  }}
                  className="block truncate hover:underline text-left"
                >
                  {displayName}
                </button>
              ) : (
                displayName
              )}
            </span>
            {isMissingUser && (
              <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                Not found
              </span>
            )}
            {conv.lastMessage && (
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 flex-shrink-0 ml-2">
                {formatTime(conv.lastMessage.createdAt)}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 truncate leading-relaxed">
            {conv.lastMessage?.content || "Start a conversation"}
          </p>
        </div>

        {/* Unread badge */}
        {conv.unreadCount > 0 && (
          <span className="flex-shrink-0 bg-indigo-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
          </span>
        )}
      </button>
    );
  };

  const MobileConversationChip = ({
    conv,
    isActive,
    onSelect,
  }: {
    conv: Conversation;
    isActive: boolean;
    onSelect: (conv: Conversation) => void;
  }) => {
    const { isOnline, lastSeen } = useUserPresence(conv.otherUser?._id || '');
    const displayName = getDisplayUserName(conv.otherUser?.name);
    const isEffectivelyOnline = isOnline || isRecentlyActive(lastSeen);

    return (
      <button
        type="button"
        onClick={() => onSelect(conv)}
        className={`snap-start shrink-0 w-[78px] rounded-lg border px-1.5 py-1.5 text-center transition-colors ${
          isActive
            ? "border-indigo-300 bg-indigo-50"
            : "border-slate-200 bg-white hover:bg-slate-50"
        }`}
      >
        <div className="relative mx-auto mb-0.5 w-fit">
          <Avatar
            src={conv.otherUser?.avatar}
            name={displayName}
            size={34}
            className="h-8.5 w-8.5 ring-2 ring-white shadow-sm"
          />
          <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-white ${isEffectivelyOnline ? "bg-emerald-400" : "bg-slate-300"}`} />
        </div>
        <p className={`truncate text-[10px] font-semibold ${isActive ? "text-indigo-700" : "text-slate-700"}`}>
            {conv.otherUser?._id ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void navigateToProfile(conv.otherUser);
              }}
              className="block truncate hover:underline text-left"
            >
              {displayName}
            </button>
          ) : (
            displayName
          )}
        </p>
        {conv.unreadCount > 0 && (
          <span className="mt-0.5 inline-flex min-w-[14px] items-center justify-center rounded-full bg-indigo-500 px-1 text-[8px] font-bold text-white">
            {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-full rounded-lg sm:rounded-2xl overflow-hidden bg-white shadow-lg border border-slate-200/80" style={{ fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className="hidden sm:flex flex-shrink-0 flex-col w-40 md:w-48 lg:w-72 bg-white border-r border-slate-100">

        {/* Sidebar Header */}
        <div className="px-2 sm:px-3 md:px-4 lg:px-5 pt-3 sm:pt-4 md:pt-6 pb-2 sm:pb-3 md:pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
            <h2 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 tracking-tight">Messages</h2>
            <span className="text-[9px] sm:text-[10px] md:text-xs font-semibold text-indigo-600 bg-indigo-50 px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full">
              {conversations.filter(c => c.unreadCount > 0).length > 0
                ? `${conversations.filter(c => c.unreadCount > 0).length} new`
                : "All read"}
            </span>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 sm:left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-7 sm:pl-8 md:pl-9 pr-2 sm:pr-2.5 md:pr-3 py-1.5 sm:py-1.5 md:py-2 text-xs sm:text-xs md:text-sm rounded-lg sm:rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
          {loadingConvs ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin text-indigo-500" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="text-center py-12 md:py-16 px-4">
              <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-2 md:mb-3">
                <MessageSquare className="w-4 sm:w-5 h-4 sm:h-5 text-slate-300" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600">No conversations</p>
              <p className="text-[10px] sm:text-xs mt-0.5 md:mt-1 text-slate-400">Your chats will appear here</p>
            </div>
          ) : (
            <div className="py-1">
              {filteredConvs.map(conv => (
                <ConversationItem
                  key={conv._id}
                  conv={conv}
                  isActive={selectedConv?._id === conv._id}
                  onSelect={handleSelectConv}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Chat Panel ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/40">

        {/* ── Mobile Conversation Carousel ── */}
        <div className="sm:hidden border-b border-slate-100 bg-white px-2 py-2">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <p className="px-1 py-1 text-xs text-slate-400">No conversations</p>
          ) : (
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
            >
              {filteredConvs.map((conv) => (
                <MobileConversationChip
                  key={`mobile-${conv._id}`}
                  conv={conv}
                  isActive={selectedConv?._id === conv._id}
                  onSelect={handleSelectConv}
                />
              ))}
            </div>
          )}
        </div>

        {!selectedConv ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 md:px-8">
            <div className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-2 md:mb-4">
              <MessageSquare className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-slate-300" />
            </div>
            <h3 className="text-xs sm:text-sm md:text-base font-bold text-slate-800 mb-1 md:mb-1.5 tracking-tight">No conversation selected</h3>
            <p className="text-[10px] sm:text-xs md:text-sm text-slate-400 leading-relaxed max-w-[160px] md:max-w-[180px]">Pick a chat from the sidebar to start messaging</p>
          </div>
        ) : (
          <>
            {/* ── Chat Header ── */}
            <header className="px-2 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 md:py-4 flex items-center justify-between flex-shrink-0 bg-white border-b border-slate-100 shadow-sm gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 min-w-0">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={selectedConv.otherUser?.avatar}
                    name={selectedUserName}
                    size={40}
                    className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 ring-2 ring-slate-100 shadow-sm"
                  />
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full border-2 border-white ${isHeaderOnline ? "bg-emerald-400" : "bg-slate-300"}`} />
                </div>
                {/* Name + status */}
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 leading-tight tracking-tight truncate">
                    {selectedUserName}
                  </h3>
                  {isHeaderOnline ? (
                    <span className="flex items-center gap-1 text-[8px] sm:text-[10px] md:text-[11px] font-semibold text-emerald-600">
                      <span className="w-0.5 sm:w-1 md:w-1.5 h-0.5 sm:h-1 md:h-1.5 rounded-full bg-emerald-400 inline-block" />
                      Active now
                    </span>
                  ) : (
                    <span className="text-[8px] sm:text-[10px] md:text-[11px] text-slate-400">
                      Last seen {formatLastSeen(lastSeen)}
                    </span>
                  )}
                </div>
              </div>

              {/* View Profile */}
              {selectedUserMissing ? (
                <span className="text-[10px] sm:text-xs md:text-sm font-semibold px-2 sm:px-2.5 md:px-3.5 py-1 sm:py-1.5 md:py-2 rounded-lg md:rounded-xl text-slate-500 bg-slate-100 border border-slate-200 whitespace-nowrap flex-shrink-0">
                  Not found
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    void navigateToProfile(selectedConv.otherUser);
                  }}
                  className="flex items-center gap-1 text-[10px] sm:text-xs md:text-sm font-semibold px-2 sm:px-2.5 md:px-3.5 py-1 sm:py-1.5 md:py-2 rounded-lg md:rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-100 whitespace-nowrap flex-shrink-0"
                >
                  View profile
                  <ArrowUpRight className="w-2.5 sm:w-3 md:w-3.5 h-2.5 sm:h-3 md:h-3.5 ml-0.5" />
                </button>
              )}
            </header>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-5 space-y-2 sm:space-y-3 md:space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-3">
                    <MessageSquare className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">No messages yet</p>
                  <p className="text-xs mt-1 text-slate-400">Be the first to say hello 👋</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = getSenderId(msg) === currentUserId;
                  const isEditing = editingId === msg._id;
                  return (
                    <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                      <div className={`flex items-end gap-1 sm:gap-2 max-w-[90%] sm:max-w-[80%] md:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>

                        {/* Other user avatar */}
                        {!isMe && (
                          <div className="flex-shrink-0 mb-5">
                            <Avatar
                              src={getEntityAvatar(msg.senderId)}
                              name={getEntityName(msg.senderId)}
                              size={28}
                              className="w-6 h-6 sm:w-7 sm:h-7 shadow-sm"
                            />
                          </div>
                        )}

                        <div className="relative">
                          {/* Action buttons */}
                          {isMe && !msg.isDeleted && !isEditing && (
                            <div className={`absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-all duration-150 flex gap-1 bg-white rounded-lg sm:rounded-xl shadow-lg border border-slate-100 px-1 sm:px-1.5 py-1`}>
                              <button
                                type="button"
                                onClick={() => { setEditingId(msg._id); setEditingText(msg.content); }}
                                className="p-1 rounded-lg hover:bg-slate-50 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-500 hover:text-indigo-500" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg._id)}
                                className="p-1 rounded-lg hover:bg-slate-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-500 hover:text-red-500" />
                              </button>
                            </div>
                          )}

                          {/* Message bubble */}
                          {msg.isDeleted ? (
                            <div className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-slate-100 border border-slate-200">
                              <p className="text-xs sm:text-sm text-slate-400 italic">This message was deleted</p>
                            </div>
                          ) : isEditing ? (
                            <div className="flex gap-2 items-start">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg sm:rounded-2xl border-2 border-indigo-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none w-48 sm:w-64 shadow-sm"
                                rows={2}
                                autoFocus
                              />
                              <div className="flex flex-col gap-1 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditMessage(msg._id)}
                                  className="w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                >
                                  <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-600" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingId(null); setEditingText(""); }}
                                  className="w-7 sm:w-8 h-7 sm:h-8 flex items-center justify-center rounded-lg sm:rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                                >
                                  <X className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-red-500" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm leading-relaxed rounded-lg sm:rounded-2xl break-words whitespace-pre-wrap shadow-sm ${
                                isMe
                                  ? "bg-blue-600 text-white rounded-br-md"
                                  : "bg-blue-600 text-white border border-slate-300 rounded-bl-md"
                              }`}>
                                {msg.content}
                              </div>

                              {/* Attachments */}
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-1 sm:mt-1.5 space-y-1 sm:space-y-1.5">
                                  {msg.attachments.map((att, idx) => {
                                    const previewable = isFilePreviewable(att.filename);
                                    const baseUrl = att.url;
                                    const previewUrl = previewable ? baseUrl : undefined;
                                    const downloadUrl = baseUrl && baseUrl.includes('/upload/')
                                      ? baseUrl.replace('/upload/', '/upload/fl_attachment/')
                                      : baseUrl;

                                    return (
                                      <div
                                        key={idx}
                                        className={`flex items-start gap-3 px-3.5 py-3 rounded-xl border transition-colors ${
                                          isMe
                                            ? "bg-slate-50 border-slate-300 hover:bg-slate-100"
                                            : "bg-slate-50 border-slate-300 hover:bg-slate-100"
                                        }`}
                                      >
                                        <div className="flex-shrink-0 mt-0.5">
                                          {getFileIcon(att.filename)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-xs font-semibold truncate ${isMe ? "text-slate-700" : "text-slate-700"}`}>
                                            {att.filename}
                                          </p>
                                          <p className={`text-[10px] mt-0.5 ${isMe ? "text-slate-700" : "text-slate-400"}`}>
                                            {formatFileSize(att.fileSize)}
                                          </p>
                                          <div className="flex gap-1.5 mt-2">
                                            {previewable && (
                                              <a
                                                href={previewUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                                                  isMe
                                                    ? "bg-white/15 hover:bg-white/25 text-slate-300"
                                                    : "bg-white hover:bg-slate-200 text-slate-600 border border-slate-300"
                                                }`}
                                              >
                                                <span>👁</span> View
                                              </a>
                                            )}
                                            <a
                                              href={downloadUrl}
                                              download={att.filename}
                                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors ${
                                                isMe
                                                  ? "bg-white hover:bg-white text-slate-600"
                                                  : "bg-white hover:bg-slate-200 text-slate-600 border border-slate-300"
                                              }`}
                                            >
                                              <Download className="w-3 h-3" /> Download
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}

                          {/* Timestamp */}
                          <p className={`text-[9px] sm:text-[10px] mt-1 sm:mt-1.5 font-medium text-slate-400 tabular-nums ${isMe ? "text-right" : "text-left"}`}>
                            {formatMsgTime(msg.createdAt)}
                            {msg.editedAt && !msg.isDeleted && (
                              <span className="ml-1 opacity-70">· edited</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input Bar ── */}
            <div className="px-2 sm:px-3 md:px-4 lg:px-5 py-2 sm:py-3 md:py-4 flex-shrink-0 bg-white border-t border-slate-100">

              {/* Attachment previews */}
              {attachments.length > 0 && (
                <div className="mb-1.5 sm:mb-2 md:mb-3 space-y-1 sm:space-y-1.5">
                  <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Attached</p>
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center justify-between px-2 sm:px-2.5 md:px-3.5 py-1.5 sm:py-2 md:py-2.5 bg-slate-50 rounded-lg md:rounded-xl border border-slate-200">
                      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 min-w-0">
                        <Paperclip className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[9px] sm:text-xs md:text-xs font-semibold text-slate-700 truncate">{att.filename}</p>
                          <p className="text-[8px] sm:text-[9px] md:text-[10px] text-slate-400">{formatFileSize(att.fileSize)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors flex-shrink-0 ml-1.5 md:ml-2"
                      >
                        <CloseIcon className="w-2.5 sm:w-3 md:w-3.5 h-2.5 sm:h-3 md:h-3.5 text-slate-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input row */}
              <div className="flex items-end gap-1.5 sm:gap-2 md:gap-2.5 px-2 sm:px-2.5 md:px-3.5 lg:px-4 py-1.5 sm:py-2 md:py-3 rounded-lg md:rounded-2xl bg-slate-50 border-2 border-slate-200 transition-all focus-within:border-indigo-300 focus-within:bg-white focus-within:shadow-sm">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile || sending}
                  className="flex-shrink-0 w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 flex items-center justify-center rounded-lg md:rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                  title="Attach files"
                >
                  {uploadingFile
                    ? <Loader2 className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4 animate-spin text-slate-500" />
                    : <Paperclip className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4 text-slate-500" />
                  }
                </button>

                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  rows={1}
                  className="flex-1 bg-transparent text-xs sm:text-xs md:text-sm resize-none leading-relaxed text-slate-800 placeholder-slate-400 focus:outline-none"
                  style={{ minHeight: "20px", maxHeight: "100px" }}
                  onInput={e => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = "auto";
                    t.style.height = Math.min(t.scrollHeight, 100) + "px";
                  }}
                />

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={(!messageText.trim() && attachments.length === 0) || sending}
                  className={`flex-shrink-0 w-7 sm:w-8 md:w-9 h-7 sm:h-8 md:h-9 flex items-center justify-center rounded-lg md:rounded-xl transition-all font-semibold shadow-sm ${
                    (messageText.trim() || attachments.length > 0) && !sending
                      ? "bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-200"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  } ${sending ? "opacity-70" : ""}`}
                >
                  {sending
                    ? <Loader2 className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4 animate-spin" />
                    : <Send className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4" />
                  }
                </button>
              </div>

              <p className="text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] mt-1 sm:mt-1.5 md:mt-2 px-1 text-slate-400">
                <kbd className="font-semibold text-slate-500">Enter</kbd> to send ·{" "}
                <kbd className="font-semibold text-slate-500">Shift+Enter</kbd> for new line
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default MessagesTab;