export interface RuntimeShapeRule {
  field: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required?: boolean;
}

export function scanSOCTypeStrictness(source: string) {
  const explicitAny = (source.match(/:\s*any\b/g) ?? []).length;
  const implicitAnyRisk = (source.match(/Record<string, any>|Array<any>/g) ?? []).length;
  return { valid: explicitAny === 0 && implicitAnyRisk === 0, warnings: { explicitAny, implicitAnyRisk } };
}

export function validateRuntimeShape(payload: Record<string, unknown>, rules: RuntimeShapeRule[]) {
  const warnings: string[] = [];
  for (const rule of rules) {
    const value = payload[rule.field];
    if (value === undefined) { if (rule.required) warnings.push(rule.field + " missing"); continue; }
    const valid = rule.type === "array" ? Array.isArray(value) : rule.type === "object" ? typeof value === "object" && value !== null && !Array.isArray(value) : typeof value === rule.type;
    if (!valid) warnings.push(rule.field + " expected " + rule.type);
  }
  return { valid: warnings.length === 0, warnings };
}
