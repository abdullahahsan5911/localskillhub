import { useState, useEffect } from "react";
import { FiSearch, FiSend, FiPaperclip, FiMoreVertical, FiLoader } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    avatar?: string;
  }>;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
}

interface Message {
  _id: string;
  sender: string;
  content: string;
  createdAt: string;
}

const Messages = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await api.getConversations();
        if (response.data) {
          const convos = (response.data as any).conversations || [];
          setConversations(convos);
          if (convos.length > 0) {
            setSelectedChat(convos[0]._id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      try {
        const response = await api.getMessages(selectedChat);
        if (response.data) {
          setMessages((response.data as any).messages || []);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, [selectedChat]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;

    try {
      setSendingMessage(true);
      await api.sendMessage({
        conversationId: selectedChat,
        content: messageText,
      });
      setMessageText("");
      
      // Refresh messages
      const response = await api.getMessages(selectedChat);
      if (response.data) {
        setMessages((response.data as any).messages || []);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p._id !== (user as any)?._id) || conversation.participants[0];
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <Layout>
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>
          
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden" style={{ height: "70vh" }}>
            <div className="grid grid-cols-12 h-full">
              {/* Sidebar */}
              <div className="col-span-4 border-r border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search messages..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl outline-none text-sm"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto" style={{ height: "calc(70vh - 73px)" }}>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <FiLoader className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <p className="text-gray-500">No conversations yet</p>
                      <p className="text-sm text-gray-400 mt-2">Start chatting with freelancers!</p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const otherUser = getOtherParticipant(conv);
                      return (
                        <button
                          key={conv._id}
                          onClick={() => setSelectedChat(conv._id)}
                          className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                            selectedChat === conv._id ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {otherUser.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex justify-between items-center mb-1">
                              <h3 className="font-semibold text-gray-900 text-sm">{otherUser.name || 'User'}</h3>
                              <span className="text-xs text-gray-500">
                                {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : 'New'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conv.lastMessage?.content || 'Start a conversation'}
                            </p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">
                              {conv.unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat Area */}
              <div className="col-span-8 flex flex-col">
                {!selectedChat || conversations.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <p>Select a conversation to start messaging</p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const conv = conversations.find(c => c._id === selectedChat);
                          const otherUser = conv ? getOtherParticipant(conv) : null;
                          return (
                            <>
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{otherUser?.name || 'User'}</h3>
                                <p className="text-xs text-gray-500">Click to view profile</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <FiMoreVertical className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: "calc(70vh - 200px)" }}>
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isMe = msg.sender === (user as any)?._id;
                          return (
                            <div key={msg._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-md px-4 py-3 rounded-2xl ${
                                isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                              }`}>
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 ${isMe ? "text-blue-100" : "text-gray-500"}`}>
                                  {formatMessageTime(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <FiPaperclip className="h-5 w-5 text-gray-600" />
                        </button>
                        <input
                          type="text"
                          placeholder="Type a message..."
                          className="flex-1 px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button 
                          className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-6"
                          onClick={handleSendMessage}
                          disabled={sendingMessage || !messageText.trim()}
                        >
                          {sendingMessage ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSend className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Messages;
