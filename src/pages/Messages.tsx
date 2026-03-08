import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Send, Paperclip, MoreVertical, Phone, Video,
  CheckCircle, Clock, Star, Image, FileText, Smile, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const conversations = [
  {
    id: 1, name: "Amit Kumar", avatar: "A", role: "Client", project: "E-commerce Redesign",
    lastMessage: "Looks great! Can we discuss the payment milestone?", time: "2 min ago",
    unread: 2, online: true
  },
  {
    id: 2, name: "TechStart Solutions", avatar: "T", role: "Client", project: "Mobile App UI",
    lastMessage: "I've attached the updated wireframes", time: "1 hour ago",
    unread: 0, online: true
  },
  {
    id: 3, name: "Ruchi Agarwal", avatar: "R", role: "Client", project: "Brand Identity",
    lastMessage: "Can you share the proposal template?", time: "3 hours ago",
    unread: 1, online: false
  },
  {
    id: 4, name: "GreenLeaf Co.", avatar: "G", role: "Client", project: "Marketing Campaign",
    lastMessage: "Thanks for the quick turnaround!", time: "1 day ago",
    unread: 0, online: false
  },
  {
    id: 5, name: "CloudSync Tech", avatar: "C", role: "Client", project: "SaaS Dashboard",
    lastMessage: "Let me review the counter offer", time: "2 days ago",
    unread: 0, online: true
  },
];

const messages = [
  { id: 1, sender: "them", text: "Hi Priya! I wanted to discuss the website redesign project.", time: "10:30 AM" },
  { id: 2, sender: "me", text: "Hi Amit! Sure, I'd love to discuss. I've reviewed the requirements you sent.", time: "10:32 AM" },
  { id: 3, sender: "them", text: "Great! What's your estimated timeline for the first mockup?", time: "10:33 AM" },
  { id: 4, sender: "me", text: "I can have the initial mockups ready within 5 business days. I'll start with the homepage and product pages.", time: "10:35 AM" },
  { id: 5, sender: "them", text: "Perfect. I've also attached our brand guidelines for reference.", time: "10:36 AM", attachment: { name: "Brand_Guidelines_v2.pdf", size: "2.4 MB" } },
  { id: 6, sender: "me", text: "Thanks! I'll review these thoroughly. Shall we set up the first milestone for the mockup delivery?", time: "10:38 AM" },
  { id: 7, sender: "them", text: "Yes, let's do that. I was thinking ₹15,000 for the first milestone covering homepage + 2 inner pages.", time: "10:40 AM" },
  { id: 8, sender: "me", text: "That works for me. I'll create the milestone in the contract. Should I also include a revision round?", time: "10:42 AM" },
  { id: 9, sender: "them", text: "Looks great! Can we discuss the payment milestone?", time: "10:45 AM" },
];

const proposalTemplates = [
  "I'd be happy to help with this project. Here's my proposal...",
  "Based on your requirements, I estimate this will take...",
  "I can offer a competitive rate of ₹X for this project...",
];

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState(conversations[0]);
  const [messageText, setMessageText] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Layout>
      <div className="container py-4 md:py-6">
        <div className="glass-card overflow-hidden" style={{ height: "calc(100vh - 140px)" }}>
          <div className="flex h-full">
            {/* Conversation List */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-border/30 flex flex-col ${showMobileChat ? "hidden md:flex" : "flex"}`}>
              {/* Search */}
              <div className="p-4 border-b border-border/30">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-secondary/50">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => { setSelectedChat(conv); setShowMobileChat(true); }}
                    className={`w-full flex items-start gap-3 p-4 text-left hover:bg-secondary/30 transition-colors border-b border-border/10 ${
                      selectedChat.id === conv.id ? "bg-secondary/40 border-l-2 border-l-primary" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-lg gradient-brand flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {conv.avatar}
                      </div>
                      {conv.online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-trust-green border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground truncate">{conv.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{conv.time}</span>
                      </div>
                      <span className="text-[10px] text-primary font-medium">{conv.project}</span>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                    {conv.unread > 0 && (
                      <span className="h-5 min-w-[20px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${!showMobileChat ? "hidden md:flex" : "flex"}`}>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {selectedChat.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{selectedChat.name}</span>
                      {selectedChat.online && <span className="w-2 h-2 rounded-full bg-trust-green" />}
                    </div>
                    <span className="text-[10px] text-primary">{selectedChat.project}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] ${
                      msg.sender === "me"
                        ? "bg-primary/20 border border-primary/20"
                        : "bg-secondary/60 border border-border/30"
                    } rounded-2xl px-4 py-3`}>
                      <p className="text-sm text-foreground leading-relaxed">{msg.text}</p>
                      {msg.attachment && (
                        <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-secondary/40 border border-border/20">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-foreground block truncate">{msg.attachment.name}</span>
                            <span className="text-[10px] text-muted-foreground">{msg.attachment.size}</span>
                          </div>
                        </div>
                      )}
                      <div className={`flex items-center gap-1 mt-1 ${msg.sender === "me" ? "justify-end" : ""}`}>
                        <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                        {msg.sender === "me" && <CheckCircle className="h-3 w-3 text-trust-green" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border/30">
                <div className="flex items-end gap-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-9 w-9">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-9 w-9">
                      <Image className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/30 focus-within:border-primary/40 transition-colors">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="bg-transparent w-full text-foreground placeholder:text-muted-foreground outline-none text-sm"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                    />
                    <Smile className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                  </div>
                  <Button className="gradient-brand text-primary-foreground h-10 w-10 p-0 glow-sm shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;
