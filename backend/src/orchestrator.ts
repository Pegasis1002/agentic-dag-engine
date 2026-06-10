import { TaskNode } from '../../shared/tasknode';
import { generateTaskTree } from './planner';
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import "dotenv/config";

const ACTUAL_TOOLS = {
    // Tool 1
    runTerminalCommand: (args: { command: string }) => {
        console.log(`    [REAL TOOL RUNNING] executing: \`${args.command}\``);
        // In a real local setup, you could use: require('child_process').execSync(args.command)
        return `Shell output: Execution of \`${args.command}\` finished with exit code 0.`;
    },
    // Tool 2
    sendMicrosoft365Alert: (args: { channel: string; message: string }) => {
        console.log(`    [M365 GRAPH TOOL] Sending to ${args.channel}: "${args.message}"`);
        return `Graph API Status 201: Notification successfully posted to ${args.channel}.`;
    }
};

async function executeSingleTask(task: any): Promise<string> {
    console.log(`\n⚡ [Executor Agent] Deciding how to complete: "${task.label}"`);

    const client = ModelClient(
        process.env.FOUNDRY_ENDPOINT || "", 
        new AzureKeyCredential(process.env.FOUNDRY_API_KEY || "")
    );

    // Define the tool blueprints for the LLM schema
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

    // Call the model asking it to solve the specific task instruction using our tools
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

    // Check if the AI chose to call one of our tools!
    if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        const toolName = toolCall.function.name as keyof typeof ACTUAL_TOOLS;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        console.log(`   └─ 🤖 AI selected tool: [${toolName}]`);

        // Execute the matching JavaScript function dynamically!
        if (ACTUAL_TOOLS[toolName]) {
            const result = ACTUAL_TOOLS[toolName](toolArgs as any);
            return result;
        } else {
            return `Error: AI selected an unregistered tool name: ${toolName}`;
        }
    }

    // Fallback if the AI just explained how to do it instead of using a tool
    return message.content || "Task completed via textual assessment.";
}

export async function runOrchestrator(tasks: TaskNode[]): Promise<TaskNode[]> {
    console.log(`\n⚙️ [Orchestrator] Firing up engine. Processing ${tasks.length} tasks...`);

    for (let i = 0; i < tasks.length; i++) {
        const currentTask = tasks[i];
        currentTask.status = 'running';
        console.log(`\n[State Change] Task ${currentTask.id} (${currentTask.label}) is now RUNNING.`);

        try {
            const executionOutput = await executeSingleTask(currentTask);
            currentTask.status = 'completed';
            console.log(`[State Change] Task ${currentTask.id} completed successfully!`);
        } catch (err: any) {
            currentTask.status = 'failed';
            console.log(`❌ [State Change] Task ${currentTask.id} FAILED! Halting pipeline.`);
            break;
        }
    }

    console.log("\n🏁 [Orchestrator] Pipeline process cycle ended.");
    return tasks;
}

async function runLiveEngineSpeedrun() {
    try {
        const freshTree = await generateTaskTree("Setup a Postgres database and run initialization queries");
        const finalizedTree = await runOrchestrator(freshTree);
        
        console.log("\n📋 [Final State Assessment]:");
        console.log(JSON.stringify(finalizedTree, null, 2));
    } catch (error) {
        console.error("\n❌ [Fatal Engine Crash]:", error);
    }
}

runLiveEngineSpeedrun();
