import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Link, useNavigate } from "react-router-dom";
import { fetchCurrentUser } from "../api/users";
import { navigationLinks } from "../data/landingContent";

const topicLinks = [
  { id: "getting-started", label: "Getting started" },
  { id: "investor-journey", label: "Investor journey" },
  { id: "groups", label: "Groups & collaboration" },
  { id: "investments", label: "Investments & returns" },
  { id: "security", label: "Security & compliance" },
  { id: "faqs", label: "FAQs" },
  { id: "video", label: "Watch the walkthrough" },
  { id: "quiz", label: "Admin Quiz" },
];

const qaItems = [
  {
    q: "Who can join Urban Evolution Group through the TURANEZA App?",
    a: "Anyone who creates an account, verifies their email, and is ready to follow the platform rules can join. People with a clear investment purpose, including plot or land owners, can also create or lead a group.",
  },
  {
    q: "What is the $100 engagement or commitment fee?",
    a: "It is a commitment deposit that shows the investor is serious about joining the process. It helps activate investor participation, supports onboarding discipline, and is treated as a controlled platform requirement rather than a hidden charge.",
  },
  {
    q: "How are payments handled and approved on the platform?",
    a: "Investors make their payment using the approved channel, then upload proof of payment. The proof is reviewed by the responsible admin team so the investor status, records, and tier progression can be validated correctly.",
  },
  {
    q: "Who designs and constructs the houses?",
    a: "Urban Evolution Group works with architects, engineers, and regulated construction partners. Designs are prepared in line with local standards, land characteristics, and the agreed direction of the investors, while licensed builders execute the work.",
  },
  {
    q: "Can people really invest together as a group?",
    a: "Yes. That is one of the main ideas of the TURANEZA App. Members can create or join a group, coordinate contributions, follow common rules, and work together toward shared housing and community investment goals.",
  },
  {
    q: "Why are transparency and communication so important in a group?",
    a: "Because group members are co-investors and may later become neighbors in the same community. Clear communication, honest records, and visible approvals protect trust and reduce future disputes.",
  },
];

const quizQuestions = [
  {
    question: "What is the main purpose of the TURANEZA App platform?",
    options: [
      "To sell single-family houses directly to buyers",
      "To help people invest together in multi-family housing projects and strengthen community infrastructure",
      "To provide short-term loans to individuals",
      "To manage only rental payments for existing apartments",
    ],
    correctIndex: 1,
  },
  {
    question: "Who can create a new investment group on the platform?",
    options: [
      "Any registered user can create a group, especially land/plot owners",
      "Only the Super Admin",
      "Only investors who are already Platinum",
      "Only external construction companies",
    ],
    correctIndex: 0,
  },
  {
    question:
      "Which role is primarily responsible for attracting and onboarding members into a group?",
    options: ["Group Admin", "Super Admin", "External Auditor", "Guest User"],
    correctIndex: 0,
  },
  {
    question: "What is the best description of the Super Admin's job?",
    options: [
      "Manage one group only",
      "Approve and suspend members and investors, oversee all groups, and control platform-wide activities",
      "Design house plans only",
      "Collect payments directly from members in cash",
    ],
    correctIndex: 1,
  },
  {
    question:
      "Why is proof of payment (e.g., bank deposit slip) uploaded by an investor?",
    options: [
      "To unlock a public profile picture",
      "To let the Super Admin verify the transfer and approve the investor’s status/tier",
      "To allow members to change their passwords",
      "To generate a random discount code",
    ],
    correctIndex: 1,
  },
  {
    question:
      "Which statement best matches how investor tiers work on the platform?",
    options: [
      "Tiers are assigned automatically by an Automated system without review",
      "Tiers are promoted only after payment proof is reviewed and verified by Super-Admin",
      "Tiers change daily based on app usage time",
      "Tiers are chosen by the investor without any requirements",
    ],
    correctIndex: 1,
  },
  {
    question:
      "Which tier order matches the typical progression mentioned for investors?",
    options: [
      "Platinum → Diamond → Golden → Silver → Aspiring",
      "Aspiring → Silver → Golden → Diamond → Platinum",
      "Silver → Aspiring → Golden → Platinum → Diamond",
      "Golden → Silver → Platinum → Aspiring → Diamond",
    ],
    correctIndex: 1,
  },
  {
    question: "What is the primary condition for joining a group?",
    options: [
      "Having a lot of money on your bank account",
      "Have a clear ambition or interest in the group’s purpose and agree to the group rules and terms, then pay 100$ as commitment fee.",
      "Being known by Super-admin",
      "Being a friend with group admin",
    ],
    correctIndex: 1,
  },
  {
    question:
      "Which practice is most important for successful group-based investment that leads to house ownership?",
    options: [
      "Only Chatting frequently about group activities and get dialy updates",
      "Being ready to invest, communicate clearly and honeslty with group members, and following the group’s contribution plan and rules",
      "Having a money on your bank account and ready to invest",
      "Being sure that group members are your friends and you can trust them without any proof or agreement",
    ],
    correctIndex: 1,
  },
  {
    question:
      "In group-based investment, why is it important to be honest and transparent?",
    options: [
      "Groups are based on trust and shared goals; dishonesty can lead to conflicts, loss of trust, and jeopardize the entire investment",
      "Group members are now co-investors, in the future they will be your neighbors, and they will be the ones you will live with, so honesty is not important only for the success of the investment but also for building a good community",
      "If you are dishonest, it can lead you to get severe penalities according to the platform rules and conditions",
      "All the above answers are correct",
    ],
    correctIndex: 3,
  },
  {
    question: "Which action should a Group Admin typically be able to do?",
    options: [
      "Promote an investor to Platinum after bank verification",
      "Create a group, invite members, and manage group-level updates",
      "Change platform-wide rules for all groups",
      "Approve or suspend any user across the entire platform",
    ],
    correctIndex: 1,
  },
  {
    question: "Which action should be restricted to the Super Admin?",
    options: [
      "View all groups on the platform",
      "Verify payment proofs and approve tier promotions",
      "Approve or suspend users platform-wide",
      "All of the above",
    ],
    correctIndex: 3,
  },
  {
    question: "What is the best first step when creating a new group?",
    options: [
      "Upload a payment proof immediately",
      "Define the group name, purpose, and basic rules (e.g., contribution expectations)",
      "Delete your user account",
      "Skip the group description to save time",
    ],
    correctIndex: 1,
  },
  {
    question: "Which items help members trust the group?",
    options: [
      "Group mission, a defined location of a plot/land, contribution plan, common understanding",
      "Only a group nickname",
      "No description at all",
      "Only memes and stickers",
    ],
    correctIndex: 0,
  },
  {
    question:
      "What is the main benefit of investing in a group rather than alone (according to the platform idea)?",
    options: [
      "Groups remove the need for budgeting",
      "Pooling resources can make large projects like multi-family houses achievable and promote space conservation",
      "Groups always guarantee profit",
      "Groups eliminate legal paperwork completely",
    ],
    correctIndex: 1,
  },
  {
    question:
      "A member wants to join a group. What should they consider when choosing a group?",
    options: [
      "They should consider more friends than their investment purpose",
      "They should assure themselves that the group aligns well their investment plan",
      "They should consider to be group admin",
      "They should consider rent profits from their unit apartment in the future",
    ],
    correctIndex: 1,
  },
  {
    question: 'What does "onboarding" for a new member usually include?',
    options: [
      "Learning group rules, how contributions work, and where to see updates and records",
      "Learning how to hack the platform",
      "Refusing to read any terms",
      "Only changing the app theme color",
    ],
    correctIndex: 0,
  },
  {
    question:
      "Why should the platform keep a clear record of contributions and approvals?",
    options: [
      "To confuse members",
      "To improve transparency, resolve disputes, and support reporting",
      "To hide financial information from everyone",
      "To reduce security",
    ],
    correctIndex: 1,
  },
  {
    question: "What is the best way to understand how the platform works well?",
    options: [
      "Get information from group admin",
      "Consult Urban Evolution Group's agents accross the country, attend meetings to the office and follow on its social media.",
      "Watch the walkthrough videos, read and understand well the documentation of the platform on help page",
      "all the above response are correct",
    ],
    correctIndex: 3,
  },
  {
    question:
      "If a payment proof is unclear or suspicious, what is the best next step?",
    options: [
      "Approve it anyway to avoid delays",
      "Request clarification or re-upload, then verify with officials/bank confirmation as required",
      "Delete the investor’s account immediately without explanation",
      "Post it publicly to ask others",
    ],
    correctIndex: 1,
  },
  {
    question:
      'Which platform feature best supports "transparency" for group members?',
    options: [
      "A dashboard showing group progress, contributions, and approved milestones",
      "A hidden page that only the group admin can see",
      "A random number generator",
      "A page that changes numbers without records",
    ],
    correctIndex: 0,
  },
  {
    question: 'What does it mean if an investor status is "Aspiring"?',
    options: [
      "The investor has completed all payments and is verified",
      "The investor is interested, registered, has paid commitment fee but not yet paid the first installment to get promoted to the following higher tier",
      "The investor is a group Admin",
      "The investor can approve other investors",
    ],
    correctIndex: 1,
  },
  {
    question:
      'Which is a good reason to separate "Group Admin" and "other investor" permissions?',
    options: [
      "So group admins can have power of suspending other investors",
      "To make happy other investors",
      "So groups can have clear organization, accountability, and follow rules that lead to success of projects",
      "To make happy a group admin",
    ],
    correctIndex: 2,
  },
  {
    question:
      "A group admin wants to remove a disruptive member from their group. What is the best policy approach?",
    options: [
      "Remove them instantly with no record",
      "Follow a documented process: warning, reason logged, and (if needed) escalation to Super Admin",
      "Ignore the issue forever",
      "Share the member’s private data publicly",
    ],
    correctIndex: 1,
  },
  {
    question:
      "What should happen when a user is suspended platform-wide by the Super Admin?",
    options: [
      "They should still be able to approve payments",
      "They should lose access according to the suspension policy (e.g., login blocked or limited access)",
      "Their account should automatically post advertisements",
      "They should gain more permissions",
    ],
    correctIndex: 1,
  },
  {
    question: "Which statement about communication on the platform is best?",
    options: [
      "Members should rely to every comments among fellow investors",
      "Updates should be deleted after 24 hours",
      "Admins should communicate verbally calling one on one investor",
      "Groups should have and follow daily, weekly updates on their official update pages (announcements their respective group detail page, chat, or notifications)",
    ],
    correctIndex: 3,
  },
  {
    question:
      "Why should the platform include an audit log for important actions (approvals, promotions, suspensions)?",
    options: [
      "To proove that the platform is working and to have fun with numbers",
      "To provide accountability and let investors trace changes for their actions and decisions",
      "To allow anonymous actions without tracking",
      "To prevent Super Admin from doing a lot of job",
    ],
    correctIndex: 1,
  },
  {
    question: "Which is a reasonable mission of Urban Evolution Group?",
    options: [
      "To make a profit",
      "Assist the governement to NST2 Goal 11: Urbanization and Settlements to create sustainable, inclusive, and resilient cities and communities.",
      "To help people invest together in multi-family housing projects and strengthen community infrastructure",
      "Answer 2 and 3 are correct",
    ],
    correctIndex: 3,
  },
  {
    question:
      "Will group members be able to see each other's contributions and payment proofs?",
    options: [
      "Yes, to promote transparency and trust within the group",
      "No, all contributions and payments proofs are private and only visible to Group Admin, this one will report to their fellow investors who already paid. Then, Super admin will control all activities.",
      "All answers are correct according to the internal agreement of investors in the group, with awareness with the super admin, all to promote transparency and trust within the group.",
    ],
    correctIndex: 2,
  },
  {
    question:
      'What is the best definition of "milestone" in an investment project flow?',
    options: [
      "A random decision of group members",
      "A password reset",
      "A planned stage (e.g., land acquisition, design approval, construction phase) that can be tracked and approved",
      "A type of investment tier",
    ],
    correctIndex: 2,
  },
  {
    question: "Which approach best reduces disputes about money in a group?",
    options: [
      "No records, only trust",
      "Clear rules + transparent contribution tracking + approvals + receipts/proof storage",
      "Let each member keep their own separate secret records",
      "Change rules every week without notice",
    ],
    correctIndex: 1,
  },
  {
    question:
      "When members join a group, why should they accept group rules/terms?",
    options: [
      "So admins can change rules secretly later",
      "To make sure shared expectations and responsibilities are clear, which promotes trust and group cohesion",
      "To remove the need for communication",
      "To make Urban Evolution Group’s job easier without caring about members",
    ],
    correctIndex: 1,
  },
  {
    question: "Which is the safest way to handle login for admins and members?",
    options: [
      "Use strong passwords, verifying emails/phones, and never share credentials",
      "Store passwords in a spreadsheet shared publicly",
      "Use the same password for every user",
      "Never log out",
    ],
    correctIndex: 0,
  },
  {
    question:
      "If a group admin forgets their password, what should the platform provide?",
    options: [
      "A secure password reset flow (email/phone verification) without exposing passwords",
      "Send the old password back in plain text",
      "Tell them to create a new account and lose all data",
      "Ignore them",
    ],
    correctIndex: 0,
  },
  {
    question: "Who will construct the houses in the investment projects?",
    options: [
      "Urban Evolution Group Engineers",
      "Group membership, contribution history, project milestones, and announcements relevant to them",
      "Well established external construction companies hired by Urban Evolution Group in partnership with respective group members (investors). Urban Evolution Group Engineers will do all supervision and follow up to make sure that the construction process is going well according to the plan and schedule then report to investors.",
      "Other members’ sensitive bank details",
    ],
    correctIndex: 2,
  },
  {
    question: "Which is an appropriate reason to promote an investor's tier?",
    options: [
      "They sent many messages in chat",
      "They uploaded valid payment proof and the transfer was verified",
      "They changed their profile photo",
      "They have paid the amount of money that matches the percentage of their total contribution. Then submit the proof of payment to their group admin and super admin to get promoted to the following tier",
    ],
    correctIndex: 3,
  },
  {
    question:
      'What is a key difference between "group-level approval" and "platform-level approval"?',
    options: [
      "Group approval is done by members; platform approval is done by Super Admin for sensitive actions",
      "Platform approval is done by guests",
      "Group approval requires no login",
      "There is no difference",
    ],
    correctIndex: 0,
  },
  {
    question:
      "Why must Urban Evolution Group and TURANEZA App work with government officials, and why is that important?",
    options: [
      "To assist the governement to NST2 Goal 11: Urbanization and Settlements to create sustainable, inclusive, and resilient cities and communities.",
      "To facilitate the well use of general master plan of cities and to make sure that the projects are legal and follow the regulations",
      "To make trust from investors that we are working in a legal way to serve them.",
      "All the above answers are correct",
    ],
    correctIndex: 3,
  },
  {
    question: "Who draws the house plans for the investment projects?",
    options: [
      "Urban Evolution Group Architects and Engineers in collaboration with investors, according to the local regulations and standards. They must consider also land characteristics.",
      "Using a structured AI suggestion system for generating plans",
      "External architects hired by investors without any supervision",
      "Allowing any investor to hire any architect from their choice without any guidance or standards",
    ],
    correctIndex: 0,
  },
  {
    question:
      "Are there training and education sessions for investors to understand how the platform works and how to use it in the best way?",
    options: [
      "yes, by providing agents in specific areas around the country to do in-person training and onboarding.",
      "yes, by providing online training materials, videos, and documentation on the platform",
      "Yes, at Urban Evolution Group Office, one day in a week, every week, there are a training session for investors to understand well how the platform works and how to use it in the best way",
      "All the above answers are correct",
    ],
    correctIndex: 3,
  },
];

const HelpPage = () => {
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [answers, setAnswers] = useState(
    Array(quizQuestions.length).fill(null),
  );
  const [submitted, setSubmitted] = useState(false);
  const [page, setPage] = useState(0);
  const [certName, setCertName] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [dashboardNotice, setDashboardNotice] = useState("");
  const [quizNotice, setQuizNotice] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const pageSize = Math.ceil(quizQuestions.length / 5);
  const totalPages = Math.ceil(quizQuestions.length / pageSize);
  const pageQuestions = useMemo(
    () => quizQuestions.slice(page * pageSize, page * pageSize + pageSize),
    [page, pageSize],
  );
  const score = useMemo(() => {
    if (!submitted) return 0;
    return answers.reduce(
      (acc, val, idx) =>
        val === quizQuestions[idx].correctIndex ? acc + 1 : acc,
      0,
    );
  }, [answers, submitted]);
  const scorePercent = Math.round((score / quizQuestions.length) * 100);
  const passedQuiz = submitted && scorePercent >= 80;
  const currentPageComplete = pageQuestions.every(
    (_, localIndex) => answers[page * pageSize + localIndex] !== null,
  );
  const hasQuizName = certName.trim().length >= 2;

  const escapeCertificateText = (value) =>
    String(value)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\r?\n/g, " ");

  const handleSelect = (qIndex, optIndex) => {
    if (submitted) return;
    setQuizNotice("");
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optIndex;
      return next;
    });
  };

  const handleSubmit = () => {
    if (!hasQuizName) {
      setQuizNotice("Enter your name before submitting the quiz.");
      return;
    }
    if (!currentPageComplete) {
      setQuizNotice("Answer every question on this slide before submitting.");
      return;
    }
    setSubmitted(true);
    setQuizNotice("");
  };

  const handleReset = () => {
    setAnswers(Array(quizQuestions.length).fill(null));
    setSubmitted(false);
    setPage(0);
    setQuizNotice("");
  };

  const buildCertificatePdfBlob = () => {
    const date = new Date().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const nameSafe = escapeCertificateText(certName.trim() || "Participant");
    const dateSafe = escapeCertificateText(date);
    const stream = [
      "0.96 0.97 0.99 rg 0 0 842 595 re f",
      "1 1 1 rg 24 24 794 547 re f",
      "0.11 0.31 0.85 rg 58 500 64 64 re f",
      "1 1 1 rg BT /F2 18 Tf 74 536 Td (UEG) Tj ET",
      "0.11 0.31 0.85 RG 4 w 24 24 794 547 re S",
      "0.80 0.84 0.89 RG 1 w 42 42 758 511 re S",
      "0.15 0.39 0.92 rg BT /F2 18 Tf 250 535 Td (URBAN EVOLUTION GROUP) Tj ET",
      "0.06 0.09 0.16 rg BT /F3 32 Tf 210 482 Td (Certificate of Completion) Tj ET",
      "0.28 0.34 0.41 rg BT /F1 16 Tf 284 450 Td (Issued by Urban Evolution Group) Tj ET",
      "0.39 0.45 0.54 rg BT /F1 15 Tf 270 392 Td (This certificate is proudly presented to) Tj ET",
      `0.06 0.09 0.16 rg BT /F3 28 Tf 220 340 Td (${nameSafe}) Tj ET`,
      "0.12 0.16 0.23 rg BT /F1 16 Tf 110 282 Td (You have demonstrated a strong understanding of how the TURANEZA App functions.) Tj ET",
      "0.12 0.16 0.23 rg BT /F1 16 Tf 142 252 Td (You are able to create and run a group responsibly as a Group Admin.) Tj ET",
      `0.28 0.34 0.41 rg BT /F1 14 Tf 315 192 Td (Issued on ${dateSafe}) Tj ET`,
      "0.58 0.64 0.72 RG 1 w 110 110 m 310 110 l S",
      "0.58 0.64 0.72 RG 1 w 532 110 m 732 110 l S",
      "0.28 0.34 0.41 rg BT /F1 12 Tf 145 92 Td (Urban Evolution Group) Tj ET",
      "0.28 0.34 0.41 rg BT /F1 12 Tf 575 92 Td (Platform Recognition) Tj ET",
    ].join("\n");
    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>\nendobj",
      "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
      "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj",
      "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>\nendobj",
      `7 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`,
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object) => {
      offsets.push(pdf.length);
      pdf += `${object}\n`;
    });
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    return new Blob([pdf], { type: "application/pdf" });
  };

  const handleCertificatePreview = () => {
    if (!passedQuiz || !hasQuizName) return;
    const url = URL.createObjectURL(buildCertificatePdfBlob());
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const handleCertificateDownload = () => {
    if (!passedQuiz || !hasQuizName) return;
    const url = URL.createObjectURL(buildCertificatePdfBlob());
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(certName.trim() || "urban-evolution-group-certificate")
      .replace(/\s+/g, "-")
      .toLowerCase()}-certificate.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await fetchCurrentUser();
        if (me) {
          setCurrentUser(me);
          setCertName(me.full_name || me.email || "");
        }
      } catch (error) {
        // unauthenticated visitors can still take the quiz
      }
    };
    loadUser();
  }, []);

  const handleDashboardClick = () => {
    if (currentUser) {
      setDashboardNotice("");
      navigate("/dashboard");
      return;
    }
    setDashboardNotice("You must log in first before accessing the dashboard.");
  };

  const handleNextPage = () => {
    if (!currentPageComplete) {
      setQuizNotice(
        "Complete all questions on this slide before moving to the next one.",
      );
      return;
    }
    setQuizNotice("");
    setPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  const handlePreviousPage = () => {
    setQuizNotice("");
    setPage((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen bg-porcelain text-slate-900">
      <header className="sticky top-0 z-40 bg-white/80 shadow-sm backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/urban_evolution_group_logo.png"
              alt="Urban Evolution Group"
              className="h-12 w-12 rounded-2xl object-contain shadow-card"
            />
            <div>
              <p className="text-lg font-semibold text-slate-900">
                Urban Evolution Group
              </p>
              <p className="text-sm text-slate-500">Turaneza App</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-700 lg:flex">
            {navigationLinks.map((item) => {
              const isRoute = item.href.startsWith("/");
              const linkHref = isRoute ? item.href : `/${item.href}`;
              return isRoute ? (
                <Link
                  key={item.name}
                  to={linkHref}
                  className="rounded-pill px-3 py-2 transition duration-cozy ease-cozy hover:bg-primary/10 hover:text-primary"
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={linkHref}
                  className="rounded-pill px-3 py-2 transition duration-cozy ease-cozy hover:bg-primary/10 hover:text-primary"
                >
                  {item.name}
                </a>
              );
            })}
          </nav>
          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/auth?mode=login"
              className="rounded-pill border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:border-primary/60 hover:text-primary"
            >
              Login
            </Link>
            <button
              type="button"
              onClick={handleDashboardClick}
              className="rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white shadow-card transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-primary/90"
            >
              Go to dashboard
            </button>
          </div>
          <button
            type="button"
            className="inline-flex items-center rounded-pill border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:border-primary/60 hover:text-primary lg:hidden"
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
          >
            Menu
          </button>
        </div>
        <div
          className={clsx(
            isMobileNavOpen ? "block" : "hidden",
            "border-t border-slate-100 bg-white lg:hidden",
          )}
        >
          <nav className="mx-auto grid max-w-7xl gap-2 px-4 py-4 font-semibold sm:px-6">
            {navigationLinks.map((item) => {
              const isRoute = item.href.startsWith("/");
              const linkHref = isRoute ? item.href : `/${item.href}`;
              const commonClass =
                "rounded-lg px-4 py-3 text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:bg-primary/10 hover:text-primary";
              return isRoute ? (
                <Link
                  key={item.name}
                  to={linkHref}
                  className={commonClass}
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={linkHref}
                  className={commonClass}
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  {item.name}
                </a>
              );
            })}
            <Link
              to="/auth?mode=login"
              className="rounded-lg px-4 py-3 text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:bg-primary/10 hover:text-primary"
              onClick={() => setIsMobileNavOpen(false)}
            >
              Login
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsMobileNavOpen(false);
                handleDashboardClick();
              }}
              className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow-card"
            >
              Go to dashboard
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_left,_#ffffff_0%,_#f7f9fc_48%,_#eef4ff_100%)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,_#1d74d8_0%,_#2387eb_52%,_#3ca2ff_100%)] px-7 py-8 text-white shadow-[0_30px_80px_rgba(29,116,216,0.22)] sm:px-10 sm:py-10 lg:px-12 lg:py-12">
              <div
                className="absolute -left-10 bottom-[-4.5rem] h-36 w-36 rounded-full bg-white/16 blur-2xl"
                aria-hidden="true"
              />
              <div
                className="absolute right-[-2rem] top-[-1.5rem] h-28 w-28 rounded-full border-4 border-white/25"
                aria-hidden="true"
              />
              <div className="grid gap-8 lg:grid-cols-[1.05fr,0.7fr] lg:items-start">
                <div className="space-y-6">
                  <span className="inline-flex rounded-pill bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/90 ring-1 ring-white/20">
                    Help Center
                  </span>
                  <div className="space-y-4">
                    <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                      Documentation for Urban Evolution Group
                    </h1>
                    <p className="max-w-3xl text-base leading-8 text-white/85 sm:text-lg">
                      Learn how to onboard, create groups, co-invest, and track
                      returns. This guide covers the navigation, permissions,
                      and best practices that keep your TURANEZA experience
                      smooth, transparent, and secure.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="#getting-started"
                      className="rounded-pill bg-white px-5 py-3 text-sm font-semibold text-primary shadow-card transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-slate-50"
                    >
                      Start reading
                    </a>
                    <a
                      href="#video"
                      className="rounded-pill border border-white/35 px-5 py-3 text-sm font-semibold text-white transition duration-cozy ease-cozy hover:bg-white/10"
                    >
                      Watch walkthrough
                    </a>
                  </div>
                  {dashboardNotice && (
                    <div className="max-w-2xl rounded-2xl border border-white/20 bg-white/12 px-4 py-3 text-sm text-white/90 backdrop-blur-sm">
                      {dashboardNotice}
                    </div>
                  )}
                </div>
                <div className="rounded-[1.75rem] border border-white/12 bg-white/10 p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#f6d670]">
                    At a glance
                  </p>
                  <div className="mt-5 space-y-4 text-sm leading-7 text-white/90 sm:text-base">
                    <p>
                      <span className="font-semibold text-white">
                        Dashboard:
                      </span>{" "}
                      portfolio, groups, payouts
                    </p>
                    <p>
                      <span className="font-semibold text-white">Groups:</span>{" "}
                      create, invite, chat, documents
                    </p>
                    <p>
                      <span className="font-semibold text-white">
                        Investments:
                      </span>{" "}
                      commitments, schedules, returns
                    </p>
                    <p>
                      <span className="font-semibold text-white">
                        Security:
                      </span>{" "}
                      verified identity, compliant flows, guided approvals
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr,1.2fr]">
            <aside className="space-y-3 rounded-3xl bg-white p-6 shadow-card h-fit lg:sticky lg:top-28">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                Topics
              </p>
              {topicLinks.map((topic) => (
                <a
                  key={topic.id}
                  href={`#${topic.id}`}
                  className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:bg-primary/10 hover:text-primary"
                >
                  {topic.label}
                </a>
              ))}
            </aside>

            <div className="space-y-8">
              <article
                id="getting-started"
                className="rounded-3xl bg-white p-8 shadow-card"
              >
                <h2 className="text-2xl font-semibold text-slate-900">
                  Getting started
                </h2>
                <p className="mt-4 text-slate-600">
                  Start by creating your account, verifying your email, and
                  understanding the rules of participation. After onboarding,
                  you can review groups, choose an investment direction, and
                  follow your records from the dashboard.
                </p>
              </article>

              <article
                id="investor-journey"
                className="rounded-3xl bg-white p-8 shadow-card"
              >
                <h2 className="text-2xl font-semibold text-slate-900">
                  Investor journey
                </h2>
                <p className="mt-4 text-slate-600">
                  The investor journey begins with account setup and group
                  discovery, then moves into commitment, payment proof
                  submission, approval, and progress tracking. Each stage is
                  designed to make participation clear and accountable.
                </p>
              </article>

              <article
                id="groups"
                className="rounded-3xl bg-white p-8 shadow-card"
              >
                <h2 className="text-2xl font-semibold text-slate-900">
                  Groups and collaboration
                </h2>
                <p className="mt-4 text-slate-600">
                  Group Admins organise members, communicate the common purpose,
                  track contributions, and keep the group moving according to
                  agreed rules. Super Admins supervise approvals, platform-wide
                  controls, and sensitive verification actions.
                </p>
              </article>

              <article
                id="investments"
                className="rounded-3xl bg-white p-8 shadow-card"
              >
                <h2 className="text-2xl font-semibold text-slate-900">
                  Investments and returns
                </h2>
                <p className="mt-4 text-slate-600">
                  Investors use the platform to contribute toward housing
                  development in a structured group model. Payments, proof
                  uploads, approvals, and updates are recorded so the investment
                  process stays visible and organised.
                </p>
              </article>

              <article
                id="security"
                className="rounded-3xl bg-white p-8 shadow-card"
              >
                <h2 className="text-2xl font-semibold text-slate-900">
                  Security and compliance
                </h2>
                <p className="mt-4 text-slate-600">
                  Compliance on the platform is not cosmetic. Urban Evolution
                  Group checks investor status, project order, legal alignment,
                  and documentation so that members can participate with
                  stronger confidence and accountability.
                </p>
              </article>

              <article
                id="faqs"
                className="rounded-3xl bg-white p-8 shadow-card"
              >
                <h2 className="text-2xl font-semibold text-slate-900">
                  Frequently asked questions
                </h2>
                <div className="mt-6 space-y-4">
                  {qaItems.map((item, index) => {
                    const isOpen = openFaq === index;
                    return (
                      <div
                        key={item.q}
                        className="overflow-hidden rounded-2xl border border-slate-200"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFaq((prev) =>
                              prev === index ? null : index,
                            )
                          }
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition duration-cozy ease-cozy hover:bg-primary/5"
                        >
                          <span className="text-base font-semibold text-slate-900">
                            {item.q}
                          </span>
                          <span
                            className={clsx(
                              "text-lg font-semibold text-primary transition duration-cozy ease-cozy",
                              isOpen && "rotate-45",
                            )}
                          >
                            +
                          </span>
                        </button>
                        {isOpen && (
                          <div className="border-t border-slate-200 px-5 py-4">
                            <p className="text-sm leading-7 text-slate-600">
                              {item.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </article>

              <article
                id="video"
                className="rounded-3xl bg-white p-8 shadow-card"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                      Video guide
                    </p>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      Watch the TURANEZA App navigation walkthrough
                    </h2>
                  </div>
                  <p className="max-w-xl text-sm text-slate-500">
                    This video shows how people navigate the app, understand the
                    flow, and use the main features with confidence.
                  </p>
                </div>
                <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-black shadow-card">
                  <div className="aspect-video w-full">
                    <iframe
                      className="h-full w-full"
                      src="https://www.youtube.com/embed/nf4IHf9kbTg"
                      title="TURANEZA App Demonstration step by step. EVERYTHING IS CLEAR, YOUR INVESTMENTS ARE SECURE."
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                </div>
              </article>

              <article
                id="quiz"
                className="rounded-3xl bg-white p-8 shadow-card"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                      Admin quiz
                    </p>
                    <h2 className="text-2xl font-semibold text-slate-900">
                      TURANEZA App Group Admin readiness quiz
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                      Enter your full name before starting and make sure the
                      same name is the one you want on your certificate. The
                      score appears only after submission. You need at least 80%
                      to qualify for the certificate.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-porcelain px-4 py-3 text-sm font-semibold text-slate-700">
                    Slide {page + 1} of {totalPages}
                  </div>
                </div>

                <div className="mt-8 rounded-3xl border border-slate-200 bg-porcelain p-5">
                  <label
                    htmlFor="certificateName"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Full name for the quiz and certificate
                  </label>
                  <input
                    id="certificateName"
                    type="text"
                    value={certName}
                    onChange={(event) => setCertName(event.target.value)}
                    placeholder="Enter your full name"
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition duration-cozy ease-cozy focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div className="mt-8 space-y-5">
                  {pageQuestions.map((item, localIndex) => {
                    const absoluteIndex = page * pageSize + localIndex;
                    const selectedIndex = answers[absoluteIndex];
                    const isCorrect =
                      submitted && selectedIndex === item.correctIndex;
                    const isWrong =
                      submitted &&
                      selectedIndex !== null &&
                      selectedIndex !== item.correctIndex;
                    return (
                      <div
                        key={absoluteIndex}
                        className="rounded-3xl border border-slate-200 p-6"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-base font-semibold leading-7 text-slate-900">
                            {absoluteIndex + 1}. {item.question}
                          </h3>
                          {submitted && (
                            <span
                              className={clsx(
                                "rounded-pill px-3 py-1 text-xs font-semibold",
                                isCorrect && "bg-mint/15 text-mint",
                                isWrong && "bg-red-50 text-red-600",
                              )}
                            >
                              {isCorrect
                                ? "Correct"
                                : isWrong
                                  ? "Incorrect"
                                  : "Not answered"}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 grid gap-3">
                          {item.options.map((option, optionIndex) => {
                            const selected = selectedIndex === optionIndex;
                            const showCorrect =
                              submitted && optionIndex === item.correctIndex;
                            const showWrong =
                              submitted &&
                              selected &&
                              optionIndex !== item.correctIndex;
                            return (
                              <button
                                key={option}
                                type="button"
                                disabled={submitted}
                                onClick={() =>
                                  handleSelect(absoluteIndex, optionIndex)
                                }
                                className={clsx(
                                  "rounded-2xl border px-4 py-4 text-left text-sm transition duration-cozy ease-cozy",
                                  selected
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-slate-200 text-slate-700 hover:border-primary/40 hover:bg-primary/5",
                                  showCorrect &&
                                    "border-mint/40 bg-mint/10 text-mint",
                                  showWrong &&
                                    "border-red-200 bg-red-50 text-red-600",
                                  submitted && "cursor-default",
                                )}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {quizNotice && (
                  <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    {quizNotice}
                  </div>
                )}

                <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePreviousPage}
                      disabled={page === 0}
                      className="rounded-pill border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={page === totalPages - 1}
                      className="rounded-pill border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition duration-cozy ease-cozy hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    {!submitted && page === totalPages - 1 && (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white shadow-card transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-primary/90"
                      >
                        Submit quiz
                      </button>
                    )}
                    {submitted && !passedQuiz && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-pill bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-card transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-slate-800"
                      >
                        Restart quiz
                      </button>
                    )}
                  </div>
                </div>

                {submitted && (
                  <div className="mt-8 rounded-3xl border border-slate-200 bg-porcelain p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          Quiz results
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                          You scored {score} out of {quizQuestions.length}{" "}
                          questions, which is {scorePercent}%.
                        </p>
                      </div>
                      <span
                        className={clsx(
                          "rounded-pill px-4 py-2 text-sm font-semibold",
                          passedQuiz
                            ? "bg-mint/15 text-mint"
                            : "bg-red-50 text-red-600",
                        )}
                      >
                        {passedQuiz ? "Passed" : "Below 80%"}
                      </span>
                    </div>

                    {passedQuiz ? (
                      <div className="mt-6 rounded-3xl border border-primary/20 bg-white p-6">
                        <div className="flex items-center gap-4">
                          <img
                            src="/urban_evolution_group_logo.png"
                            alt="Urban Evolution Group logo"
                            className="h-16 w-16 rounded-2xl object-contain shadow-card"
                          />
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
                              Certificate ready
                            </p>
                            <h4 className="text-xl font-semibold text-slate-900">
                              Download your completion certificate as a PDF
                            </h4>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-7 text-slate-600">
                          The certificate is issued by Urban Evolution Group in
                          recognition that you understand how the TURANEZA App
                          works and that you are able to create and run a group
                          responsibly as a Group Admin.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleCertificatePreview}
                            className="rounded-pill border border-primary/30 px-5 py-2 text-sm font-semibold text-primary transition duration-cozy ease-cozy hover:border-primary hover:bg-primary/5"
                          >
                            View certificate PDF
                          </button>
                          <button
                            type="button"
                            onClick={handleCertificateDownload}
                            className="rounded-pill bg-primary px-5 py-2 text-sm font-semibold text-white shadow-card transition duration-cozy ease-cozy hover:-translate-y-0.5 hover:bg-primary/90"
                          >
                            Download certificate PDF
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-6 text-sm leading-7 text-slate-600">
                        A minimum score of 80% is required to receive the
                        certificate. Review the incorrect answers above and
                        restart the quiz.
                      </p>
                    )}
                  </div>
                )}
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HelpPage;
