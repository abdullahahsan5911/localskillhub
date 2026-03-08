import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, CheckCircle, Clock, DollarSign, Shield, AlertCircle,
  Download, ChevronRight, Calendar, Users, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

const contracts = [
  {
    id: 1, title: "E-commerce Website Redesign", client: "TechStart Solutions",
    total: "₹60,000", paid: "₹30,000", status: "active",
    milestones: [
      { name: "Wireframes & Research", amount: "₹10,000", status: "completed" },
      { name: "Homepage Design", amount: "₹20,000", status: "completed" },
      { name: "Inner Pages", amount: "₹15,000", status: "in_progress" },
      { name: "Final Handoff", amount: "₹15,000", status: "pending" },
    ],
    startDate: "Feb 15, 2026", endDate: "Mar 30, 2026"
  },
  {
    id: 2, title: "Portfolio Website", client: "Raj Photography",
    total: "₹20,000", paid: "₹8,000", status: "active",
    milestones: [
      { name: "Design Mockups", amount: "₹8,000", status: "completed" },
      { name: "Development", amount: "₹8,000", status: "in_progress" },
      { name: "Launch", amount: "₹4,000", status: "pending" },
    ],
    startDate: "Mar 1, 2026", endDate: "Mar 22, 2026"
  },
  {
    id: 3, title: "Brand Identity Package", client: "GreenLeaf Co.",
    total: "₹25,000", paid: "₹25,000", status: "completed",
    milestones: [
      { name: "Research & Concepts", amount: "₹8,000", status: "completed" },
      { name: "Logo & Colors", amount: "₹10,000", status: "completed" },
      { name: "Brand Guidelines", amount: "₹7,000", status: "completed" },
    ],
    startDate: "Jan 10, 2026", endDate: "Feb 5, 2026"
  },
];

const milestoneStatusConfig: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  completed: { color: "text-trust-green bg-trust-green/10", icon: CheckCircle, label: "Completed" },
  in_progress: { color: "text-primary bg-primary/10", icon: Clock, label: "In Progress" },
  pending: { color: "text-muted-foreground bg-secondary", icon: AlertCircle, label: "Pending" },
};

const contractStatusConfig: Record<string, string> = {
  active: "bg-trust-green/10 text-trust-green",
  completed: "bg-primary/10 text-primary",
  disputed: "bg-destructive/10 text-destructive",
};

const Contracts = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedContract, setExpandedContract] = useState<number | null>(1);

  const filtered = activeFilter === "all" ? contracts : contracts.filter(c => c.status === activeFilter);

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Contracts & Payments</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage milestones, escrow, and invoices</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-border text-foreground gap-2 transition-colors duration-200">
              <Download className="h-4 w-4" /> Export Invoices
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Contracts", value: "2", icon: FileText, color: "text-primary" },
            { label: "In Escrow", value: "₹30,000", icon: Shield, color: "text-trust-gold" },
            { label: "Total Earned", value: "₹5,47,500", icon: DollarSign, color: "text-trust-green" },
            { label: "Completed", value: "8", icon: CheckCircle, color: "text-brand-glow" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5 hover:border-primary/20 transition-all duration-300"
            >
              <stat.icon className={`h-5 w-5 ${stat.color} mb-3`} />
              <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-6 p-1 glass-card w-fit">
          {["all", "active", "completed"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                activeFilter === filter
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Contracts */}
        <div className="space-y-4">
          {filtered.map((contract) => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => setExpandedContract(expandedContract === contract.id ? null : contract.id)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-secondary/20 transition-colors duration-200"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                    {contract.client.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-foreground truncate">{contract.title}</h3>
                    <p className="text-xs text-muted-foreground">{contract.client} • {contract.startDate} → {contract.endDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-primary">{contract.total}</div>
                    <div className="text-[10px] text-muted-foreground">{contract.paid} paid</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${contractStatusConfig[contract.status]}`}>
                    {contract.status}
                  </span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedContract === contract.id ? "rotate-90" : ""}`} />
                </div>
              </button>

              {/* Expanded Milestones */}
              {expandedContract === contract.id && (
                <div className="px-6 pb-6 border-t border-border/30 pt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Milestones</h4>
                  <div className="space-y-3">
                    {contract.milestones.map((m) => {
                      const config = milestoneStatusConfig[m.status];
                      return (
                        <div key={m.name} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 border border-border/20 hover:border-primary/20 transition-colors duration-200">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                            <config.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground">{m.name}</span>
                            <span className={`text-[10px] block ${config.color.split(" ")[0]}`}>{config.label}</span>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{m.amount}</span>
                          {m.status === "in_progress" && (
                            <Button size="sm" className="h-7 text-[10px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200">
                              Request Release
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" size="sm" className="border-border text-foreground gap-2 transition-colors duration-200">
                      <Download className="h-3.5 w-3.5" /> Download Invoice
                    </Button>
                    <Button variant="outline" size="sm" className="border-border text-foreground gap-2 transition-colors duration-200">
                      <FileText className="h-3.5 w-3.5" /> View Contract
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Contracts;
