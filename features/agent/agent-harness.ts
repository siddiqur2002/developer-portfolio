// features/agent/agent-harness.ts
import { ChatGroq } from "@langchain/groq";
import { ToolMessage, AIMessage } from "@langchain/core/messages";
import { portfolioTools, MY_PROJECTS, MY_PROFILE } from "./tools";
import {
  ROUTER_SYSTEM_PROMPT,
  DATA_SYSTEM_PROMPT,
  REASONING_SYSTEM_PROMPT,
  GREETINGS_SYSTEM_PROMPT,
} from "./prompts";

// =============================================================
// ৩-মডেল ফাইনাল প্রোডাকশন কনফিগারেশন
// =============================================================

const routerModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0.2,
});

const nativeToolModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0.1,
  streaming: false,
  maxRetries: 3,
});

const reasoningModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-120b",
  temperature: 0.4,
  maxRetries: 2,
});

export async function runPortfolioAgent(userMessage: string): Promise<string> {
  try {
    if (!userMessage || userMessage.trim() === "") {
      return "I didn't receive any message. Could you please say or type something?";
    }

    const routeResponse = await routerModel.invoke([
      ["system", ROUTER_SYSTEM_PROMPT],
      ["user", userMessage],
    ]);
    const intent = routeResponse.content.toString().trim().toUpperCase();

    if (intent === "PORTFOLIO_DATA") {
      const modelWithTools = nativeToolModel.bindTools(portfolioTools);
      const response = await modelWithTools.invoke(
        [
          [
            "system",
            `${DATA_SYSTEM_PROMPT} 
              RULES: 
              1. If the user asks about GitHub or specific repositories, MUST use 'github_repository_fetcher'.
              2. If the user asks about projects or skills, use 'get_projects'.
              3. NEVER output <function> tags. Return valid JSON only.`,
          ],
          ["user", userMessage],
        ],
        {
          tool_choice: "auto",
        },
      );

      const toolCalls = response.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        // লুপের ভেতর প্রতিটি টুলকল প্রসেস করা
        const toolMessages = await Promise.all(
          toolCalls.map(async (toolCall) => {
            const tool = portfolioTools.find((t) => t.name === toolCall.name);

            // টুলটির নাম ও আর্গুমেন্ট কনসোলে চেক করার জন্য প্রিন্ট করুন
            console.log(
              `Executing Tool: ${toolCall.name} with args:`,
              toolCall.args,
            );

            const toolResult = tool
              ? await (tool as any).invoke(toolCall.args ?? {})
              : "Tool not found";

            return new ToolMessage({
              content:
                typeof toolResult === "string"
                  ? toolResult
                  : JSON.stringify(toolResult),
              tool_call_id: toolCall.id!,
              name: toolCall.name,
            });
          }),
        );

        const finalResponse = await nativeToolModel.invoke([
          ["system", DATA_SYSTEM_PROMPT],
          ["user", userMessage],
          new AIMessage({ content: "", tool_calls: toolCalls }), // AIMessage ঠিক করা
          ...toolMessages,
        ]);

        return finalResponse.content as string;
      }
      return response.content as string;
    }

    if (intent === "REASONING_DISCUSSION") {
      const response = await reasoningModel.invoke([
        ["system", REASONING_SYSTEM_PROMPT],
        ["user", userMessage],
      ]);

      let finalContent = response.content as string;
      if (finalContent.includes("</think>")) {
        const parts = finalContent.split("</think>");
        finalContent =
          parts[1]?.trim() || parts[0].replace("<think>", "").trim();
      }
      return finalContent;
    }

    const quickGreeting = await routerModel.invoke([
      ["system", GREETINGS_SYSTEM_PROMPT],
      ["user", userMessage],
    ]);

    return quickGreeting.content as string;
  } catch (error) {
    console.error("🔒 Harness Production Error:", error);
    return "Something went wrong. Please check your API keys or network connection.";
  }
}
