export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface FooterPageSection {
  title: string;
  body: string;
  points?: string[];
}

export interface FooterPageContent {
  path: string;
  title: string;
  eyebrow: string;
  description: string;
  sections: FooterPageSection[];
  ctaLabel: string;
  ctaHref: string;
}

export const footerSections: FooterSection[] = [
  {
    title: "For Freelancers",
    links: [
      { label: "Find Jobs", href: "/jobs" },
      { label: "Create Profile", href: "/signup" },
      { label: "Skill Challenges", href: "/skill-challenges" },
      { label: "Community", href: "/community" },
    ],
  },
  {
    title: "For Clients",
    links: [
      { label: "Post a Job", href: "/post-job" },
      { label: "Browse Talent", href: "/browse" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help-center" },
      { label: "Trust & Safety", href: "/trust-safety" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

export const footerPages: FooterPageContent[] = [
  {
    path: "/skill-challenges",
    title: "Skill Challenges",
    eyebrow: "Build trust with proof of work",
    description: "Take structured challenges that help freelancers demonstrate real capability and help clients shortlist with more confidence.",
    ctaLabel: "Browse Freelancers",
    ctaHref: "/browse",
    sections: [
      {
        title: "How challenges work",
        body: "Challenges are designed around practical local-service scenarios, from design briefs to development fixes and marketing tasks.",
        points: [
          "Timed submissions with clear evaluation criteria",
          "Portfolio-ready deliverables for completed work",
          "Scorecards that help clients compare fairly",
        ],
      },
      {
        title: "Why it matters",
        body: "A challenge result adds another trust layer beyond ratings and profile descriptions, especially for new freelancers building credibility.",
      },
    ],
  },
  {
    path: "/how-it-works",
    title: "How LocalSkillHub Works",
    eyebrow: "Simple local hiring",
    description: "LocalSkillHub connects nearby clients and freelancers through verified profiles, transparent proposals, and community-based trust signals.",
    ctaLabel: "Post a Job",
    ctaHref: "/post-job",
    sections: [
      {
        title: "For clients",
        body: "Post a project, review local talent, compare proposals, and hire based on fit, price, and verification status.",
        points: [
          "Create a job with budget and timeline",
          "Review portfolios and reputation signals",
          "Chat, contract, and manage delivery in one place",
        ],
      },
      {
        title: "For freelancers",
        body: "Build a profile, showcase work, join the community, and receive opportunities that match your skills and location.",
      },
    ],
  },
  {
    path: "/pricing",
    title: "Pricing",
    eyebrow: "Clear and predictable",
    description: "LocalSkillHub keeps pricing simple so both sides understand platform costs before work begins.",
    ctaLabel: "Find Jobs",
    ctaHref: "/jobs",
    sections: [
      {
        title: "For freelancers",
        body: "Creating a profile, joining the community, and browsing opportunities are free. Platform fees can apply when paid contracts are processed through the marketplace.",
      },
      {
        title: "For clients",
        body: "Posting jobs and reviewing local talent is designed to stay lightweight, with optional premium tooling for faster hiring and added verification workflows.",
        points: [
          "No hidden charges during profile discovery",
          "Clear pricing before premium actions",
          "Flexible plans for growing teams",
        ],
      },
    ],
  },
  {
    path: "/about",
    title: "About LocalSkillHub",
    eyebrow: "Built for local economies",
    description: "LocalSkillHub exists to make local hiring more trustworthy, more visible, and more practical for everyday projects.",
    ctaLabel: "Explore Community",
    ctaHref: "/community",
    sections: [
      {
        title: "Our mission",
        body: "We help local freelancers get discovered for real work and help clients hire with stronger context than anonymous marketplaces usually provide.",
      },
      {
        title: "What makes us different",
        body: "Location context, verification layers, and community reputation are treated as first-class product features instead of afterthoughts.",
        points: [
          "Region-aware talent discovery",
          "Trust signals tied to real identities and activity",
          "A marketplace designed around lasting local relationships",
        ],
      },
    ],
  },
  {
    path: "/blog",
    title: "Blog",
    eyebrow: "Ideas, stories, and platform updates",
    description: "Read practical guidance for freelancers and clients, plus product notes about trust, local hiring, and community growth.",
    ctaLabel: "Join Community",
    ctaHref: "/community",
    sections: [
      {
        title: "What you will find here",
        body: "The blog is where LocalSkillHub shares case studies, hiring playbooks, freelancer growth advice, and release announcements.",
        points: [
          "Freelancer portfolio tips",
          "Client hiring checklists",
          "Community stories from local markets",
        ],
      },
      {
        title: "Publishing cadence",
        body: "New content is added as the marketplace expands and new product capabilities are rolled out.",
      },
    ],
  },
  {
    path: "/careers",
    title: "Careers",
    eyebrow: "Help shape trusted local work",
    description: "We are building tools that make freelance work feel more grounded, accountable, and community-connected.",
    ctaLabel: "Contact Us",
    ctaHref: "/contact",
    sections: [
      {
        title: "What we value",
        body: "We care about practical products, respectful collaboration, and systems that improve how people find and deliver work close to home.",
        points: [
          "Strong product thinking",
          "Clear communication",
          "Bias toward useful, shippable solutions",
        ],
      },
      {
        title: "Current hiring",
        body: "Open roles can be shared here as the team grows. For partnership or early hiring conversations, use the contact page.",
      },
    ],
  },
  {
    path: "/contact",
    title: "Contact",
    eyebrow: "Reach the team",
    description: "For partnerships, support questions, hiring conversations, or product feedback, contact the LocalSkillHub team directly.",
    ctaLabel: "Email Support",
    ctaHref: "/help-center",
    sections: [
      {
        title: "General inquiries",
        body: "Use this page as your starting point for account questions, business requests, and feature feedback.",
        points: [
          "Support: support@localskillhub.com",
          "Partnerships: partners@localskillhub.com",
          "Careers: careers@localskillhub.com",
        ],
      },
      {
        title: "Response expectations",
        body: "Most questions can be routed within one business day, with trust and account-related concerns prioritized first.",
      },
    ],
  },
  {
    path: "/help-center",
    title: "Help Center",
    eyebrow: "Support for common issues",
    description: "Find guidance for account setup, job posting, proposals, profile management, contracts, and platform navigation.",
    ctaLabel: "",
    ctaHref: "",
    sections: [
      {
        title: "Popular topics",
        body: "The help center covers the most common workflows for both clients and freelancers.",
        points: [
          "Managing login and profile details",
          "Posting jobs and reviewing proposals",
          "Messaging, contracts, and verification",
        ],
      },
      {
        title: "Need direct support",
        body: "If self-service guidance is not enough, the contact page provides routes for account-specific assistance.",
      },
    ],
  },
  {
    path: "/trust-safety",
    title: "Trust & Safety",
    eyebrow: "Safety is a product feature",
    description: "LocalSkillHub is designed around verified identity, transparent reputation, and better signals for safe local collaboration.",
    ctaLabel: "",
    ctaHref: "",
    sections: [
      {
        title: "Protection layers",
        body: "We use verification, reporting flows, and community reputation indicators to reduce fraud and improve accountability.",
        points: [
          "Identity and profile verification options",
          "Community-based trust signals",
          "Reporting tools for suspicious behavior",
        ],
      },
      {
        title: "Shared responsibility",
        body: "Clients and freelancers should still review profiles carefully, confirm scope clearly, and keep communication documented on-platform whenever possible.",
      },
    ],
  },
  {
    path: "/terms",
    title: "Terms of Service",
    eyebrow: "Platform usage terms",
    description: "These terms describe the general rules for using LocalSkillHub, including account conduct, content responsibility, and marketplace expectations.",
    ctaLabel: "Read Privacy Policy",
    ctaHref: "/privacy",
    sections: [
      {
        title: "Account responsibilities",
        body: "Users are expected to provide accurate information, protect their credentials, and use the platform lawfully and in good faith.",
      },
      {
        title: "Marketplace conduct",
        body: "Jobs, proposals, messages, and portfolio content should be honest, non-infringing, and aligned with applicable laws and platform rules.",
        points: [
          "No deceptive listings or fraudulent claims",
          "No abusive or unlawful platform use",
          "Respect for payment, delivery, and communication standards",
        ],
      },
    ],
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    eyebrow: "How information is handled",
    description: "This policy explains the types of information LocalSkillHub may process to operate the marketplace and improve trust-related features.",
    ctaLabel: "Manage Account",
    ctaHref: "/login",
    sections: [
      {
        title: "Data we use",
        body: "Core account details, profile information, marketplace activity, and verification-related data may be used to deliver the product and support safe operation.",
      },
      {
        title: "Why it is used",
        body: "Information helps power authentication, discovery, reputation signals, communication, and fraud prevention across the marketplace.",
        points: [
          "Operate user accounts and sessions",
          "Improve matching and discovery experiences",
          "Support moderation, security, and trust workflows",
        ],
      },
    ],
  },
];