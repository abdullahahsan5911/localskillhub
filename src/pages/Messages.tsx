import { useState } from "react";
import { FiSearch, FiSend, FiPaperclip, FiMoreVertical } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import avatar1 from "@/assets/avatars/avatar-1.jpg";
import avatar2 from "@/assets/avatars/avatar-2.jpg";

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState(1);
  const [messageText, setMessageText] = useState("");

  const chats = [
    { id: 1, name: "Priya Sharma", lastMessage: "Thanks! I'll send the designs by tomorrow", time: "2m ago", unread: 0, avatar: avatar1 },
    { id: 2, name: "Arjun Patel", lastMessage: "Can we schedule a call?", time: "1h ago", unread: 2, avatar: avatar2 },
  ];

  const messages = [
    { id: 1, sender: "them", text: "Hi! I saw your job posting", time: "10:30 AM" },
    { id: 2, sender: "me", text: "Great! Can you share your portfolio?", time: "10:32 AM" },
    { id: 3, sender: "them", text: "Sure, here's the link: portfolio.com", time: "10:35 AM" },
  ];

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
                  {chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChat(chat.id)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        selectedChat === chat.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover" />
                      <div className="flex-1 text-left">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{chat.name}</h3>
                          <span className="text-xs text-gray-500">{chat.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      </div>
                      {chat.unread > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1">{chat.unread}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="col-span-8 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={avatar1} alt="Priya" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Priya Sharma</h3>
                      <p className="text-xs text-green-600">Online</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <FiMoreVertical className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ height: "calc(70vh - 200px)" }}>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-md px-4 py-3 rounded-2xl ${
                        msg.sender === "me" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === "me" ? "text-blue-100" : "text-gray-500"}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))}
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
                    />
                    <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-6">
                      <FiSend className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Messages;
