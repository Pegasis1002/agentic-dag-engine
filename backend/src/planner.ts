import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { TaskNode } from '../../shared/tasknode';
import "dotenv/config";

const PLANNER_SYSTEM_PROMPT = `
You are an elite AI Project Manager. 
Your job is to break down a user's request into a sequential array of tasks.
You MUST output ONLY raw, valid JSON. Do not include markdown blocks like \`\`\`json.
Do not include any conversational text.

The output MUST be an array of objects matching this exact structure:
[
  {
    "id": "1",
    "label": "Short UI label",
    "instruction": "Detailed prompt for the execution agent to complete this step",
    "status": "pending"
  }
]
`;

export async function generateTaskTree(userRequest: string): Promise<TaskNode[]> {
    console.log(`[Planner] Sending request to Microsoft Foundry for: "${userRequest}"...`);

    const client = ModelClient(
        process.env.FOUNDRY_ENDPOINT || "", 
        new AzureKeyCredential(process.env.FOUNDRY_API_KEY || "")
    );

    const response = await client.path("/chat/completions").post({
        body: {
            messages: [
                { role: "system", content: PLANNER_SYSTEM_PROMPT },
                { role: "user", content: userRequest }
            ],
            model: process.env.FOUNDRY_MODEL_NAME 
        }
    });

    if (isUnexpected(response)) {
        throw response.body.error;
    }

    const rawJson = response.body.choices[0].message.content;

    try {
        const taskTree: TaskNode[] = JSON.parse(rawJson || "[]");
        console.log("[Planner] Successfully generated and parsed Task Tree from Foundry!");
        return taskTree;
    } catch (error) {
        console.error("[Planner] JSON PARSE ERROR! Raw AI output was:", rawJson);
        throw new Error("AI failed to output clean JSON. Refine system prompt.");
    }
}
