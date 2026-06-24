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
      "Backend design for Banking and Transaction web application",
    techStack: [
      "JavaScript",
      "express",
      "mongoose",
      "nodemailer",
    ],
    liveUrl: "https://pipeline.yourdomain.com",
    githubUrl: "https://github.com/siddiqur2002/Backend-Ledger-Banking.git",
    metrics: { lighthouse: 99, latency: "14ms" },
  },
  {
    title: "coinpulse",
    description:
      "Crypto Screener app with a built-in high frequency terminal and dashboard",
    techStack: ["TypeScript","Next.js", "React.js", "Shadcn", "Tailwind CSS"],
    liveUrl: "https://shop.yourdomain.com",
    githubUrl: "https://github.com/siddiqur2002/coinpulse.git",
    metrics: { lighthouse: 100, latency: "42ms" },
  },
  {
    title: "Roll-Base-Backend-Dev-2",
    description:
      "this is a role base backend design project where tow role user and artist is highlighted",
    techStack: ["JavaScript", "Node.js", "Express", "MongoDB", "multer", "express-validator"],
    liveUrl: "https://interview-coach.yourdomain.com",
    githubUrl: "https://github.com/siddiqur2002/Roll-Base-Backend-Dev-2.git",
    metrics: { lighthouse: 94, latency: "35ms" },
  },
  {
    title: "MongoDBdataAssociation",
    description:
      "MongoDB Database operations",
    techStack: ["node.js", "express", "mongoose"],
    liveUrl: "N/A (CLI Tool)",
    githubUrl: "https://github.com/siddiqur2002/MongoDBdataAssociation.git",
    metrics: { executionTime: "2.4ms", safetyCheck: "Passed" },
  },
];

export const MY_PROFILE = {
  name: "MD SIDDIQUR RAHMAN",
  role: "AI Engineer & Full-Stack Web Developer",
  bio: "I am Md Siddiqur Rahman studies in Muhammadpur Kendriya College Department of Computer Science and Engineering(CSE). A Programmer, Developer and Engineer",
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
    portfolio: "https://siddiqurahman-developer-portfolio.hf.space/",
    resumeUrl: "blob:https://mybdjobs.bdjobs.com/e236880a-0fa8-4eca-83d9-ccfc84046830",
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
    
    const MY_RESUME_DATA = {
      summary: "Full Stack Developer focused on MERN Stack and Generative AI applications.",
      experience: "Experienced in building production-ready web apps and AI-powered agents.",
      skills: ["React", "Node.js", "Express", "MongoDB", "Next.js", "LangChain", "Fast API"],
      downloadLink: "/resume.pdf", 
    };

    if (query) {
      const key = query as keyof typeof MY_RESUME_DATA;
      if (MY_RESUME_DATA[key]) {
        return JSON.stringify({
          answer: `Based on my resume, here is the information about my ${query}: ${MY_RESUME_DATA[key]}`,
          downloadLink: MY_RESUME_DATA.downloadLink 
        });
      }
    }

    return JSON.stringify({
      message: "Here is my full resume data and the official PDF document.",
      data: MY_RESUME_DATA,
      showResumeViewer: true, 
      downloadLink: MY_RESUME_DATA.downloadLink
    });
  },
  {
    name: "get_developer_resume",
    description:
      "Use this to answer questions about the developer's experience, skills, summary, or to display/download the official resume PDF file.",
    schema: z.object({
      query: z
        .string()
        .optional()
        .describe(
          "Ask specific things like 'experience', 'skills', or 'summary' to query the text data.",
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
        // finding repository details using GitHub API
        const { data: repo } = await octokit.rest.repos.get({
          owner: "siddiqur2002", 
          repo: projectName.trim(), 
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
      // Transport 
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // email options
      const mailOptions = {
        from: `"${senderName}" <${senderEmail}>`,
        to: process.env.RECEIVER_EMAIL,
        subject: `[Portfolio Contact]: ${subject}`,
        text: `From: ${senderName} (${senderEmail})\n\nMessage:\n${body}`,
      };

      
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
        .describe("The name of the user or recruiter sending the message."), 
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
