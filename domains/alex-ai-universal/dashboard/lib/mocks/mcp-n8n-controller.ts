export class McpN8nController {
  static async execute(workflow: string, data: any) {
    console.log('Mock McpN8nController execute:', workflow, data);
    return { success: true, data: {} };
  }
}
