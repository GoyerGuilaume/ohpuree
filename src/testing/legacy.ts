// Utilitaire de test : lit les données du prototype legacy (source de vérité du gameplay).
import legacyHtml from '../../legacy/ohpureeV0.html?raw';

/** Renvoie le littéral `var NAME=…;` du prototype, évalué. */
export function legacyLiteral<T>(name: string): T {
  const start = legacyHtml.indexOf(`var ${name}=`);
  if (start < 0) throw new Error(`var ${name} introuvable dans le legacy`);
  const from = legacyHtml.indexOf('=', start) + 1;
  let i = from;
  let depth = 0;
  let quote: string | null = null;
  for (; i < legacyHtml.length; i++) {
    const c = legacyHtml[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '/' && legacyHtml[i + 1] === '/') {
      i = legacyHtml.indexOf('\n', i);
      continue;
    }
    if (c === "'" || c === '"') quote = c;
    else if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  // Littéral de données venant de notre propre fichier legacy, évalué uniquement en test.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-unsafe-call
  return new Function(`return ${legacyHtml.slice(from, i)}`)() as T;
}

/** Renvoie le nombre d'une déclaration `var NAME=123;` du prototype. */
export function legacyNumber(name: string): number {
  const m = new RegExp(`var ${name}=(\\d+)`).exec(legacyHtml);
  if (!m?.[1]) throw new Error(`var ${name} introuvable dans le legacy`);
  return Number(m[1]);
}

export { legacyHtml };
