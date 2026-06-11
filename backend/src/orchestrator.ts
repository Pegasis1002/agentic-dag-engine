import { TaskNode } from '../../shared/tasknode';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { exec } from "child_process";
import util from "util";
import "dotenv/config";

const execAsync = util.promisify(exec);

const ACTUAL_TOOLS = {
    runTerminalCommand: async (args: { command: string }) => {
        console.log(`    [REAL TOOL RUNNING] executing: \`${args.command}\``);
        try {
            const { stdout, stderr } = await execAsync(args.command);
            if (stderr) console.warn(`    [WARNING] ${stderr}`);
            return `Shell output: ${stdout.trim()}`;
        } catch (error: any) {
            console.error(`    [TOOL ERROR] ${error.message}`);
            throw new Error(`Command failed: ${error.message}`);
        }
    },
    sendMicrosoft365Alert: async (args: { channel: string; message: string }) => {
        console.log(`    [M365 GRAPH TOOL] Intending to send to ${args.channel}: "${args.message}"`);
        // Note: To fully implement this, we need the Entra ID Bearer token passed from the frontend.
        // For now, we simulate a successful HTTP status return so the DAG engine can progress.
        return `Graph API Status 201: Notification prepared for ${args.channel}. (Requires Auth Token injection for live API call)`;
    }
};

async function executeSingleTask(task: any): Promise<string> {
    const client = ModelClient(
        process.env.FOUNDRY_ENDPOINT || "", 
        new AzureKeyCredential(process.env.FOUNDRY_API_KEY || "")
    );

    const toolBlueprints = [
        {
            type: "function",
            function: {
                name: "runTerminalCommand",
                description: "Executes a system shell command on the environment to install apps, configure databases, or run sql scripts.",
                parameters: {
                    type: "object",
                    properties: {
                        command: { type: "string", description: "The exact command line text to execute." }
                    },
                    required: ["command"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "sendMicrosoft365Alert",
                description: "Sends an enterprise team notification or email update via Microsoft 365 channels regarding project infrastructure status.",
                parameters: {
                    type: "object",
                    properties: {
                        channel: { type: "string", description: "Target location e.g. 'Teams' or 'Outlook Email'" },
                        message: { type: "string", description: "The content body of the update notification." }
                    },
                    required: ["channel", "message"]
                }
            }
        }
    ];

    const response = await client.path("/chat/completions").post({
        body: {
            messages: [
                { 
                    role: "system", 
                    content: "You are an autonomous operations agent. Look at the specific task instruction and determine which tool to invoke to complete it. Call the tool with precise parameter data." 
                },
                { role: "user", content: `Task Label: ${task.label}\nInstruction: ${task.instruction}` }
            ],
            model: process.env.FOUNDRY_MODEL_NAME || "gpt-4o",
            tools: toolBlueprints as any,
            tool_choice: "auto"
        }
    });

    if (isUnexpected(response)) {
        throw response.body.error;
    }

    const message = response.body.choices[0].message;

    if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        const toolName = toolCall.function.name as keyof typeof ACTUAL_TOOLS;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        if (ACTUAL_TOOLS[toolName]) {
            return ACTUAL_TOOLS[toolName](toolArgs as any);
        } else {
            return `Error: AI selected an unregistered tool name: ${toolName}`;
        }
    }

    return message.content || "Task completed via textual assessment.";
}

export async function runOrchestrator(
    tasks: TaskNode[], 
    onStateChange: (updatedTree: TaskNode[]) => void
): Promise<TaskNode[]> {
    
    for (let i = 0; i < tasks.length; i++) {
        const currentTask = tasks[i];
        
        // Skip previously satisfied nodes
        if (currentTask.status === 'completed') continue;

        currentTask.status = 'running';
        onStateChange(tasks);

        try {
            await executeSingleTask(currentTask);
            currentTask.status = 'completed';
            onStateChange(tasks);
        } catch (err: any) {
            currentTask.status = 'failed';
            onStateChange(tasks);
            break; 
        }
    }
    return tasks;
}
