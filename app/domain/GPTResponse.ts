export interface GPTResponse {
  type: 'text' | 'function_call';
  content?: string;
  function?: string;
  arguments?: {
    supplement: string;
    time: string;
    name: string;
    quantity: string;
    unit: string;
  };
}
