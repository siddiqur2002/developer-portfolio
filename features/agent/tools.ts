// features/agent/tools.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Octokit } from "@octokit/rest";
import nodemailer from "nodemailer";

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

export const MY_PROJECTS = [
  {
    title: "Backend-Ledger-Banking",
    description:
      "An enterprise-grade dashboard monitoring LLM latencies, token consumption, and trace analytics in real-time.",
    techStack: [
      "Next.js 16.2",
      "LangChain JS",
      "Tailwind CSS v4.3",
      "TypeScript",
    ],
    liveUrl: "https://pipeline.yourdomain.com",
    githubUrl: "https://github.com/yourusername/pipeline-monitor",
    metrics: { lighthouse: 99, latency: "14ms" },
  },
  {
    title: "Decentralized E-Commerce Engine",
    description:
      "A highly resilient, multi-tenant storefront with automated webhooks and edge-cached inventory system.",
    techStack: ["Next.js", "Supabase", "PostgreSQL", "Tailwind CSS"],
    liveUrl: "https://shop.yourdomain.com",
    githubUrl: "https://github.com/yourusername/core-shop",
    metrics: { lighthouse: 100, latency: "42ms" },
  },
  {
    title: "Gen AI Full-Stack App & Interview Coach",
    description:
      "An interactive 플랫폼 that generates customized learning roadmaps and conducts AI-driven mock technical interviews with real-time feedback.",
    techStack: ["React", "Node.js", "Express", "MongoDB", "Gemini API"],
    liveUrl: "https://interview-coach.yourdomain.com",
    githubUrl: "https://github.com/yourusername/Gen_Ai_Full_Stack_App",
    metrics: { lighthouse: 94, latency: "35ms" },
  },
  {
    title: "Backend Ledger Banking Engine",
    description:
      "A high-concurrency banking ledger system implementing strict ACID transactions and Banker's Algorithm for deadlock avoidance.",
    techStack: ["C", "POSIX Threads", "Shell Scripting"],
    liveUrl: "N/A (CLI Tool)",
    githubUrl: "https://github.com/yourusername/Backend-Ledger-Banking",
    metrics: { executionTime: "2.4ms", safetyCheck: "Passed" },
  },
];

export const MY_PROFILE = {
  name: "MD SIDDIQUR RAHMAN",
  role: "AI Engineer & Full-Stack Web Developer",
  bio: "Specializing in multi-agent orchestration, streaming server actions, and extreme high-performance web systems using Next.js 16+ and Tailwind v4.",
  skills: {
    frontend: [
      "Next.js (App Router)",
      "React JS",
      "TypeScript",
      "Tailwind CSS ",
      "JavaScript(ES6)",
    ],
    ai_engineering: [
      "LangChain JS",
      "LangGraph",
      "AI Model uses",
      "Prompt Engineering",
    ],
    backend: [
      "Node.js",
      "Express.js",
      "Fast API (python)",
      "MongoDB",
      "MERN Stack",
      "MySQL",
      "Postgres SQL",
    ],
  },
  socials: {
    linkedin: "https://www.linkedin.com/in/md-siddiqur-rahman-a217b13ab/",
    github: "https://github.com/siddiqur2002",
    portfolio: "https://yourportfolio.com",
    resumeUrl: "https://yourportfolio.com/resume.pdf",
  },
};

/**
 * Tool 1: Get Projects
 */
export const getProjectsTool = tool(
  async ({ category }) => {
    if (category) {
      const normalizedCategory = category.toLowerCase();
      const filtered = MY_PROJECTS.filter(
        (p) =>
          p.techStack.some((tech) =>
            tech.toLowerCase().includes(normalizedCategory),
          ) ||
          p.title.toLowerCase().includes(normalizedCategory) ||
          p.description.toLowerCase().includes(normalizedCategory), // Increased search surface area
      );
      return JSON.stringify(filtered);
    }
    return JSON.stringify(MY_PROJECTS);
  },
  {
    name: "get_developer_projects",
    description:
      "Retrieves a list of technical projects built by the developer, including tech stacks, github links, and performance metrics. Can be filtered by technology, project name, or keywords.",
    schema: z.object({
      category: z
        .string()
        .optional()
        .describe(
          "Filter by technology or keyword like 'Next.js', 'AI', 'Banking'",
        ),
    }),
  },
);

/**
 * Tool 2: Get Profile Info
 */
export const getProfileInfoTool = tool(async () => JSON.stringify(MY_PROFILE), {
  name: "get_developer_profile",
  description:
    "Retrieves core developer biography, technical skills matrix, and specialization details.",
  schema: z.object({}),
});

/**
 * Tool 4: Get Resume / CV Link
 */
export const getResumeTool = tool(
  async ({ query }) => {
    // রেজুমের মূল তথ্য এখানে JSON হিসেবে রাখুন (এটিই এজেন্টকে "পড়তে" সাহায্য করবে)
    const MY_RESUME_DATA = {
      summary: "AI Engineer with 3+ years in MERN and GenAI...",
      experience: "Senior Dev at X, Junior Dev at Y...",
      skills: ["React", "Node.js", "LangChain", "C"],
      downloadLink: "https://yourportfolio.com/resume.pdf",
    };

    if (query) {
      // যদি ইউজার নির্দিষ্ট কিছু জানতে চায় (যেমন: "আমার এক্সপেরিয়েন্স কি?")
      return JSON.stringify({
        answer:
          "Based on my resume: " +
          MY_RESUME_DATA[query as keyof typeof MY_RESUME_DATA],
      });
    }

    return JSON.stringify({
      message: "Here is my resume data.",
      data: MY_RESUME_DATA,
    });
  },
  {
    name: "get_developer_resume",
    description:
      "Use this to answer questions about the developer's experience, skills, or to get the resume download link.",
    schema: z.object({
      query: z
        .string()
        .optional()
        .describe(
          "Ask specific things like 'experience', 'skills', or 'summary'",
        ),
    }),
  },
);

/**
 * Tool 5: GitHub Repository Fetcher
 */
export const getGitHubRepoTool = tool(
  async ({ projectName }) => {
    try {
      if (projectName) {
        // নির্দিষ্ট রেপোজিটরির ডাটা খোঁজা
        const { data: repo } = await octokit.rest.repos.get({
          owner: "siddiqur2002", // আপনার গিটহাব ইউজারনেম
          repo: projectName.trim(), // কোনো এক্সট্রা স্পেস থাকলে ট্রিম করে নেওয়া ভালো
        });

        return JSON.stringify({
          success: true,
          projectName: repo.name,
          description: repo.description,
          stars: repo.stargazers_count,
          language: repo.language,
          htmlUrl: repo.html_url,
          message: `Found the repository for ${repo.name}.`,
        });
      }
      return JSON.stringify({
        message:
          "Please provide a valid GitHub repository name to fetch details.",
      });
    } catch (error: any) {
      console.error("GitHub API Error:", error);
      return JSON.stringify({
        success: false,
        message: `Repository '${projectName}' not found or inaccessible under user 'siddiqur2002'. Please ensure the repository name is exactly correct and is public.`,
      });
    }
  },
  {
    name: "github_repository_fetcher",
    description:
      "Fetches live details of a specific GitHub repository owned by 'siddiqur2002'. Use this ONLY when you have the exact repository slug from the project list.",
    schema: z.object({
      projectName: z
        .string()
        .describe(
          "The exact GitHub repository name/slug (e.g., 'developer-portfolio'). Do NOT guess the name.",
        ),
    }),
  },
);

/**
 * Tool 6: Send Email / Contact Tool (via Nodemailer)
 */
export const sendEmailTool = tool(
  async ({ senderEmail, senderName, subject, body }) => {
    try {
      // ট্রান্সপোর্টার তৈরি
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // ইমেইল অপশনস
      const mailOptions = {
        from: `"${senderName}" <${senderEmail}>`,
        to: process.env.RECEIVER_EMAIL,
        subject: `[Portfolio Contact]: ${subject}`,
        text: `From: ${senderName} (${senderEmail})\n\nMessage:\n${body}`,
      };

      // মেইল পাঠানো
      await transporter.sendMail(mailOptions);

      return JSON.stringify({
        success: true,
        message: "Email sent successfully to Siddiqur!",
      });
    } catch (error) {
      console.error("Nodemailer Error:", error);
      return JSON.stringify({
        success: false,
        message: "Failed to send email. Please check server logs.",
      });
    }
  },
  {
    name: "send_email_to_developer",
    description: "Sends an email to the developer. Use this when a recruiter or user wants to contact you directly.",
    schema: z.object({
      senderEmail: z
        .string()
        .describe("The email of the user/recruiter sending the message."),
      senderName: z
        .string()
        .describe("The name of the user or recruiter sending the message."), // স্কিমাতে নাম যোগ করা হলো
      subject: z
        .string()
        .describe("A suitable corporate professional subject line for the email."),
      body: z
        .string()
        .describe("The exact message, content, or text provided by the user that they want to mail.")
    }),
  },
);

export const portfolioTools = [
  getProjectsTool,
  getProfileInfoTool,
  getResumeTool,
  getGitHubRepoTool,
  sendEmailTool,
];
