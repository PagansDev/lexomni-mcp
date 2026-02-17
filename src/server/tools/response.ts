type ToolResponse = { content: [{ type: 'text'; text: string }] };

export function textContent(obj: unknown): ToolResponse {
  return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] };
}
