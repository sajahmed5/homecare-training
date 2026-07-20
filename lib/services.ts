import {
  Award,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface Service {
  slug: string;
  name: string;
  /** One-liner for the home-page grid. */
  summary: string;
  /** Opening paragraph on the services page. */
  intro: string;
  /** What's included — rendered as a checklist. */
  includes: string[];
  /** Hex accent, drawn from the same palette as lib/topic-theme.ts. */
  color: string;
  icon: LucideIcon;
}

// Copy is a first draft based on mycareacademy.co.uk plus the services Saj
// described — it needs a business read-through before it goes live.
export const SERVICES: Service[] = [
  {
    slug: "elearning-training",
    name: "eLearning & mandatory training",
    summary:
      "26 CQC-aligned courses with interactive content, assessments and branded certificates.",
    intro:
      "Our training library covers the mandatory subjects a care service is expected to evidence, written for UK adult social care rather than adapted from generic corporate e-learning.",
    includes: [
      "26 courses spanning care fundamentals, safeguarding, health & safety, infection control and governance",
      "Interactive learning — scenarios, flip cards, fill-in-the-blanks and spot-the-hazard exercises",
      "A 20-question assessment per course, marked automatically with an 80% pass mark",
      "Branded certificates issued on completion, each independently verifiable",
      "Renewal dates tracked automatically, with reminders before training expires",
    ],
    color: "#0d9488",
    icon: GraduationCap,
  },
  {
    slug: "mock-cqc-inspections",
    name: "Mock CQC inspections",
    summary:
      "A full mock inspection by an experienced consultant, with an estimated rating and a prioritised action plan.",
    intro:
      "A mock inspection gives you an honest picture of where you stand before the real thing. We agree the format with you in advance, and the visit can be announced or unannounced depending on what you want to test.",
    includes: [
      "A site visit led by a consultant experienced in your type of service",
      "Assessment against the five key questions — safe, effective, caring, responsive and well-led",
      "Coverage of the Fundamental Standards under the Health and Social Care Act 2008 (Regulated Activities) Regulations 2014",
      "A written report, internally quality-checked, delivered within 10 working days",
      "An estimated rating, identified breaches, and a prioritised action plan",
    ],
    color: "#e11d48",
    icon: ClipboardCheck,
  },
  {
    slug: "management-support",
    name: "Management & governance support",
    summary:
      "Hands-on help running the service — quality meetings, governance cycles and the structures inspectors look for.",
    intro:
      "Plenty of providers know what good looks like but have never had the time to build the structures around it. We work alongside your registered manager to put a governance rhythm in place and keep it running.",
    includes: [
      "Setting up and chairing quality and governance meetings, with agendas and minutes that stand as evidence",
      "A governance calendar covering audits, reviews and reporting cycles across the year",
      "Practical support on how to organise and run a care company day to day",
      "Policies, procedures and audit tools reviewed or built from scratch",
      "Preparing evidence and reporting ahead of inspection",
      "Ongoing mentoring for registered managers, whether newly registered or long established",
    ],
    color: "#0284c7",
    icon: Users,
  },
  {
    slug: "iso-standards",
    name: "ISO standards support",
    summary:
      "Guidance towards ISO certification — gap analysis, documentation and preparing for assessment.",
    intro:
      "If you are working towards an ISO standard such as ISO 9001 for quality management, we help you build a management system that fits how your service actually operates rather than a folder that gathers dust.",
    includes: [
      "Gap analysis against the standard you are working towards",
      "Building the management system documentation, mapped to what you already do",
      "Internal audit programmes and management review",
      "Preparing your team and your evidence for the certification assessment",
      "Support maintaining the standard after certification",
    ],
    color: "#7c3aed",
    icon: Award,
  },
  {
    slug: "recruitment-support",
    name: "Recruitment support",
    summary:
      "Track candidates from application through to onboarding, with the compliance documents collected along the way.",
    intro:
      "Safe recruitment is one of the first things an inspector will test. Our recruitment tools keep every candidate, document and decision in one place so the audit trail is there when you need it.",
    includes: [
      "Candidate tracking from first application through to start date",
      "An evaluation matrix so candidates are compared consistently and fairly",
      "Collection of right-to-work, DBS and reference documentation against each candidate",
      "A clean hand-off into induction and mandatory training once someone is appointed",
    ],
    color: "#16a34a",
    icon: UserPlus,
  },
  {
    slug: "staff-management-portal",
    name: "Staff management portal",
    summary:
      "Assign training, watch compliance in red/amber/green, and know who is falling behind before your inspector does.",
    intro:
      "The portal is where managers spend their time. It turns training records from a spreadsheet exercise into a live picture of where the service stands.",
    includes: [
      "Assign individual courses or whole induction pathways to staff or teams",
      "Red/amber/green compliance dashboards across the whole staff group",
      "Automatic renewals, with reminders issued before training lapses",
      "Exportable records and certificates ready to hand to an inspector",
    ],
    color: "#d97706",
    icon: LayoutDashboard,
  },
  {
    slug: "client-satisfaction",
    name: "Client satisfaction & feedback",
    summary:
      "Build your own forms and surveys, gather feedback from people and families, and use it as quality evidence.",
    intro:
      "Gathering feedback is straightforward; doing something visible with it is what demonstrates a well-led service. Our forms tool covers both ends of that.",
    includes: [
      "A form builder with conditional questions, so people only see what applies to them",
      "Satisfaction surveys for the people you support and their families",
      "Responses collected centrally and exportable for analysis",
      "Findings that feed straight into your quality meetings and action plans",
    ],
    color: "#0891b2",
    icon: MessageSquare,
  },
];
