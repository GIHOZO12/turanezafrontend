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
    q: "Who can join a housing project through the TURANEZA App?",
    a: "Landowners, individuals, families, and investors can participate. Whether you want to contribute land, own a home near your daily activities, or invest in housing, you must meet the project's requirements and agree to the platform rules and group agreements.",
  },
  {
    q: "What is the RWF 100,000 commitment fee?",
    a: "The RWF 100,000 commitment fee demonstrates your intention to participate in a housing project and forms part of the onboarding process. Before paying, you should review the terms explaining how the fee is used, whether it counts toward your project contribution, and any refund conditions.",
  },
  {
    q: "How are payments handled and verified on the platform?",
    a: "Members make payments through the approved payment channels and upload proof of payment to the platform. The responsible administration team reviews and verifies each payment before updating the member's contribution records and participation status. The committee formed by group members oversees financial reporting to support transparency and accountability.",
  },
  {
    q: "Who designs and constructs the houses?",
    a: "Urban Evolution Group coordinates architects, engineers, and qualified construction partners throughout the project, from design to delivery. Designs consider the land, applicable building standards, and the group's agreed needs. Construction follows the approved plans, with professional supervision and progress updates for members.",
  },
  {
    q: "Can people invest together as a group?",
    a: "Yes. TURANEZA brings people together in structured investment groups to pool resources for shared housing projects. Members contribute according to their agreements and form a committee to represent the group, monitor progress, and oversee the use of funds. Urban Evolution Group coordinates the project from planning to delivery.",
  },
  {
    q: "How does TURANEZA support transparency and accountability?",
    a: "Each group forms a committee of its members to represent their interests and help oversee the project and its funds. Clear contribution records, documented decisions, financial reports, and regular progress updates help members understand how their money is used. Open communication between the committee, members, and Urban Evolution Group builds trust and helps resolve concerns early.",
  },
];

const quizQuestions = [
  {
    question: "What is the main purpose of the TURANEZA App?",
    options: [
      "To sell single-family houses directly to buyers",
      "To help people invest together in multi-family housing & community housing projects and improve community infrastructure",
      "To provide short-term loans to individuals",
      "To manage only rental payments for existing apartments",
    ],
    correctIndex: 1,
  },
  {
    question: "Who can create a new investment group on the platform?",
    options: [
      "Any registered user, especially a landowner",
      "Only the Super Admin, based on an approved plot and with the landowner's agreement",
      "Only investors who have reached the Platinum tier",
      "Only external construction companies",
    ],
    correctIndex: 1,
  },
  {
    question: "Who is mainly responsible for attracting and onboarding group members?",
    options: [
      "Group Admin",
      "Super Admin",
      "External Auditor",
      "Guest User",
    ],
    correctIndex: 1,
  },
  {
    question: "What is the main role of the Super Admin?",
    options: [
      "To manage only one group",
      "To approve plots, onboarding members or investors, oversee all groups, and manage activities across the platform",
      "To design house plans only",
      "To collect cash payments directly from members",
    ],
    correctIndex: 1,
  },
  {
    question: "Why must an investor submit proof of payment, such as a bank deposit slip?",
    options: [
      "To unlock a public profile picture",
      "To allow the Super Admin to verify the payment and approve the investor's status or tier",
      "To allow members to change their passwords",
      "To generate a random discount code",
    ],
    correctIndex: 1,
  },
  {
    question: "How do investors move to a higher tier on the platform?",
    options: [
      "An automated system assigns tiers without any review",
      "Investors move to a higher tier only after the Super Admin reviews and verifies their proof of payment",
      "Tiers change daily based on how much time investors spend using the app",
      "Investors choose their own tiers without meeting any requirements",
    ],
    correctIndex: 1,
  },
  {
    question: "What is the correct order of investor tiers, from lowest to highest?",
    options: [
      "Platinum → Diamond → Golden → Silver → Aspiring",
      "Aspiring → Silver → Golden → Diamond → Platinum",
      "Silver → Aspiring → Golden → Platinum → Diamond",
      "Golden → Silver → Platinum → Aspiring → Diamond",
    ],
    correctIndex: 1,
  },
  {
    question: "What are the main requirements for joining a group?",
    options: [
      "Having a lot of money in your bank account",
      "Having a clear interest in the group's purpose, accepting its rules and terms, and paying the RWF 100,000 commitment fee which is refundable.",
      "Being personally known by the Super Admin",
      "Being a friend of the Group Admin",
    ],
    correctIndex: 1,
  },
  {
    question: "Which practice is most important for successful group investment that leads to home ownership?",
    options: [
      "Only chatting frequently about group activities and receiving daily updates",
      "Being ready to invest, communicating clearly and honestly with group members, and following the group's contribution plan and rules",
      "Having money in your bank account and being ready to invest",
      "Making sure all group members are your friends and trusting them without any proof or agreement",
    ],
    correctIndex: 1,
  },
  {
    question: "Why are honesty and transparency important in group investment?",
    options: [
      "Groups depend on trust and shared goals. Dishonesty can cause conflicts, damage trust, and put the entire investment at risk",
      "Group members are co-investors who may later become neighbors. Honesty supports both a successful investment and a strong community",
      "Dishonesty can lead to serious penalties under the platform's rules and terms",
      "All of the above",
    ],
    correctIndex: 3,
  },
  {
    question: "What should the investors' committee be responsible for?",
    options: [
      "Promoting accountability and transparency in the use of funds, in line with the company's rules and regulations",
      "Creating a group, inviting members, and managing group updates",
      "Changing platform-wide rules for all groups",
      "Approving or suspending any user across the platform",
    ],
    correctIndex: 0,
  },
  {
    question: "Which actions should be reserved for the Super Admin?",
    options: [
      "Viewing all groups on the platform",
      "Verifying payment proofs and approving tier promotions",
      "Approving or suspending users across the platform",
      "All of the above",
    ],
    correctIndex: 3,
  },
  {
    question: "What is the correct starting process for creating an investment group?",
    options: [
      "Uploading proof of payment immediately",
      "Defining the group's name, purpose, and basic rules, such as contribution requirements",
      "The Super Admin lists registered and approved plots, then creates and lists the groups so housing investors can join under the applicable rules and regulations",
      "Skipping the group description to save time",
    ],
    correctIndex: 2,
  },
  {
    question: "What information helps members trust a group?",
    options: [
      "A clear group mission, the plot's location, a contribution plan, and a shared understanding among group members",
      "Only a group nickname",
      "No group description",
      "Only memes and stickers",
    ],
    correctIndex: 0,
  },
  {
    question: "What is the main benefit of investing as a group instead of investing alone?",
    options: [
      "Groups remove the need for budgeting",
      "Pooling resources can make multi-family housing and community housing projects achievable while using land more efficiently",
      "Groups always guarantee a profit",
      "Groups completely remove the need for legal paperwork",
    ],
    correctIndex: 1,
  },
  {
    question: "What should a member consider when choosing a group?",
    options: [
      "Whether their friends are in the group, more than the purpose of their investment",
      "Whether they can become the Group Admin",
      "The rental income they could earn from their apartment in the future",
      "Whether the group matches their investment plan",
    ],
    correctIndex: 3,
  },
  {
    question: 'What does "onboarding" usually include for a new member?',
    options: [
      "Learning the group rules, understanding how contributions work, and knowing where to find updates and records",
      "Learning how to hack the platform",
      "Refusing to read any terms",
      "Only changing the app's theme color",
    ],
    correctIndex: 0,
  },
  {
    question: "Why should the platform keep clear records of contributions and approvals?",
    options: [
      "To confuse members",
      "To hide financial information from everyone",
      "To improve transparency, help resolve disputes, and support reporting",
      "To reduce security",
    ],
    correctIndex: 2,
  },
  {
    question: "What are the best ways to understand how the platform works?",
    options: [
      "Asking the Group Admin for information",
      "Visiting Urban Evolution Group's office, attending meetings there, and following its social media pages",
      "Watching walkthrough videos and reading the platform documentation on the Help page",
      "All of the above",
    ],
    correctIndex: 3,
  },
  {
    question: "What should happen if proof of payment is unclear or suspicious?",
    options: [
      "Approve it anyway to avoid delays",
      "Ask for clarification or a new upload, then verify the payment with the relevant officials or bank if needed",
      "Immediately delete the investor's account without an explanation",
      "Post the proof publicly to ask others for help",
    ],
    correctIndex: 1,
  },
  {
    question: "Which platform feature best supports transparency for group members?",
    options: [
      "A dashboard showing project progress, contributions, and approved milestones",
      "A hidden page that only the Group Admin can view",
      "A random number generator",
      "A page that changes figures without keeping records",
    ],
    correctIndex: 0,
  },
  {
    question: 'What does the "Aspiring" investor status mean?',
    options: [
      "The investor has completed all payments and has been verified",
      "The investor is a Group Admin",
      "The investor has registered and paid the commitment fee but has not yet paid the first installment required to move to the next tier",
      "The investor can approve other investors",
    ],
    correctIndex: 2,
  },
  {
    question: "Why should housing investors form a committee?",
    options: [
      "To give Group Admins the power to suspend other investors",
      "To make other investors happy",
      "To help the group stay organized, promote transparency and accountability, and follow the rules needed for a successful housing project",
      "To make the Group Admin happy",
    ],
    correctIndex: 2,
  },
  {
    question: "Are investors allowed to leave a group?",
    options: [
      "Yes. Investors have the right to leave, but the commitment fee may no longer be refundable at certain project stages. Investors should join only when they are serious and ready to stay committed to the project and the group",
      "No. Investors must remain committed and stay in the group",
    ],
    correctIndex: 0,
  },
  {
    question: "What should happen when the Super Admin suspends a user across the platform?",
    options: [
      "The user should still be able to approve payments",
      "The user's access should be blocked or limited according to the suspension policy",
      "The user's account should automatically post advertisements",
      "The user should receive more permissions",
    ],
    correctIndex: 1,
  },
  {
    question: "What is the best approach to communication on the platform?",
    options: [
      "Members should rely on every comment made by fellow investors",
      "Updates should be deleted after 24 hours",
      "Admins should communicate only by calling each investor individually",
      "Groups should share and follow daily or weekly updates through official channels, such as announcements on the group details page, group chats, or notifications",
    ],
    correctIndex: 3,
  },
  {
    question: "Why should the platform keep an audit log of important actions, such as approvals, tier promotions, and suspensions?",
    options: [
      "To prove that the platform works and to have fun with numbers",
      "To support accountability and allow investors to trace changes, actions, and decisions",
      "To allow anonymous actions without tracking them",
      "To reduce the Super Admin's workload",
    ],
    correctIndex: 1,
  },
  {
    question: "Which statements describe Urban Evolution Group's mission?",
    options: [
      "To make a profit",
      "To support the government's NST2 Goal 11 on Urbanization and Settlements by helping create sustainable, inclusive, and resilient cities and communities",
      "To help people invest together in multi-family housing projects and improve community infrastructure",
      "Both the second and third answers",
    ],
    correctIndex: 3,
  },
  {
    question: "Can group members see each other's contributions and payment proofs?",
    options: [
      "Yes, to promote transparency and trust within the group",
      "No. Contributions and payment proofs are private and visible only to the Group Admin, who reports payment updates to fellow investors. The Super Admin oversees all activities",
      "Either arrangement can apply, depending on the group's internal agreement and with the Super Admin's knowledge, to promote transparency and trust",
    ],
    correctIndex: 2,
  },
  {
    question: 'What is a "milestone" in an investment project?',
    options: [
      "A random decision made by group members",
      "A password reset",
      "A planned project stage, such as land acquisition, design approval, or a construction phase, that can be tracked and approved",
      "A type of investor tier",
    ],
    correctIndex: 2,
  },
  {
    question: "Which approach best reduces disputes about money within a group?",
    options: [
      "Relying only on trust without keeping records",
      "Having clear rules, transparent contribution records, documented approvals, stored payment proofs, and collaboration between Urban Evolution Group Ltd and the investors' committee",
      "Allowing each member to keep separate, secret records",
      "Changing the rules every week without notice",
    ],
    correctIndex: 1,
  },
  {
    question: "Why must members accept the group's rules and terms when joining?",
    options: [
      "To allow admins to change the rules secretly later",
      "To make shared expectations and responsibilities clear, build trust, and help members work together",
      "To remove the need for communication",
      "To make Urban Evolution Group's work easier without considering members' interests",
    ],
    correctIndex: 1,
  },
  {
    question: "What is the safest way for members and investors to protect their login details?",
    options: [
      "Use strong passwords, verify their email addresses or phone numbers, and never share their login details",
      "Store passwords in a publicly shared spreadsheet",
      "Use the same password for every user",
      "Never log out",
    ],
    correctIndex: 0,
  },
  {
    question: "What should the platform provide if a Group Admin forgets their password?",
    options: [
      "A secure password reset process using email or phone verification, without exposing the password",
      "The old password sent back as plain text",
      "Instructions to create a new account and lose all previous data",
      "No assistance",
    ],
    correctIndex: 0,
  },
  {
    question: "Who will construct the houses in the investment projects?",
    options: [
      "Urban Evolution Group's engineers",
      "Group membership details, contribution history, project milestones, and relevant announcements",
      "Established external construction companies hired by Urban Evolution Group in collaboration with the group's investors. Urban Evolution Group's engineers will supervise the work, check progress against the plans and schedule, and report to investors",
      "Other members' sensitive bank details",
    ],
    correctIndex: 2,
  },
  {
    question: "What is the full requirement for moving an investor to the next tier?",
    options: [
      "The investor has sent many messages in the group chat",
      "The investor has uploaded valid proof of payment, and the transfer has been verified",
      "The investor has changed their profile photo",
      "The investor has paid the required percentage of their total contribution and submitted proof of payment to the Group Admin and Super Admin for approval",
    ],
    correctIndex: 3,
  },
  {
    question: 'What does "platform approval" mean?',
    options: [
      "The Super Admin approves sensitive actions on the platform",
      "Guests approve actions on the platform",
      "Approval does not require anyone to log in",
      "There is no difference between approved and unapproved actions",
    ],
    correctIndex: 0,
  },
  {
    question: "Why is it important for Urban Evolution Group and the TURANEZA App to work with government officials?",
    options: [
      "To support the government's NST2 Goal 11 on Urbanization and Settlements by helping create sustainable, inclusive, and resilient cities and communities",
      "To follow city master plans and ensure that projects meet legal and regulatory requirements",
      "To build investors' trust by showing that the projects operate legally",
      "All of the above",
    ],
    correctIndex: 3,
  },
  {
    question: "Who prepares the house plans for the investment projects?",
    options: [
      "Urban Evolution Group's architects and engineers, working with investors and considering local regulations, building standards, and the characteristics of the land",
      "An AI system that generates suggested plans",
      "External architects hired by investors without any supervision",
      "Any architect chosen by an investor, without guidance or required standards",
    ],
    correctIndex: 0,
  },
  {
    question: "Are training sessions and learning materials available to help investors understand and use the platform?",
    options: [
      "Yes. Agents in selected areas across the country provide in-person training and onboarding",
      "Yes. Online training materials, videos, and documentation are available on the platform",
      "Yes. Urban Evolution Group holds a training session at its office one day each week to help investors understand and use the platform",
      "All of the above",
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
