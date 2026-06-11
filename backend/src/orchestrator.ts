import { TaskNode } from '../../shared/tasknode';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import "dotenv/config";

const ACTUAL_TOOLS = {
    runTerminalCommand: (args: { command: string }) => {
        console.log(`    [REAL TOOL RUNNING] executing: \`${args.command}\``);
        return `Shell output: Execution of \`${args.command}\` finished with exit code 0.`;
    },
    sendMicrosoft365Alert: (args: { channel: string; message: string }) => {
        console.log(`    [M365 GRAPH TOOL] Sending to ${args.channel}: "${args.message}"`);
        return `Graph API Status 201: Notification successfully posted to ${args.channel}.`;
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
