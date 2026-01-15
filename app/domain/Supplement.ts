export interface Supplement {
  id: string; // Unique identifier for the supplement
  name: string; // Name of the supplement
  quantity: string; // Quantity of the supplement
  unit: string; // Unit of the supplement (e.g., mg, IU, g)
  description?: string; // Optional human-readable description or differentiator
}
