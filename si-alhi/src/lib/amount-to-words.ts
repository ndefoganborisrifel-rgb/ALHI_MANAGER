const UNITS = [
  "", "Un", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit", "Neuf",
  "Dix", "Onze", "Douze", "Treize", "Quatorze", "Quinze", "Seize", "Dix-Sept",
  "Dix-Huit", "Dix-Neuf",
];
const TENS = ["", "", "Vingt", "Trente", "Quarante", "Cinquante", "Soixante", "Soixante-Dix", "Quatre-Vingt", "Quatre-Vingt-Dix"];

function convertBelow1000(n: number): string {
  if (n === 0) return "";
  if (n < 20) return UNITS[n];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    if (ten === 7) return `Soixante-${UNITS[10 + unit]}`;
    if (ten === 9) return `Quatre-Vingt-${UNITS[10 + unit]}`;
    if (unit === 0) return TENS[ten] + (ten === 8 ? "s" : "");
    if (unit === 1 && ten !== 8) return `${TENS[ten]}-et-Un`;
    return `${TENS[ten]}-${UNITS[unit]}`;
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const hundredWord = hundreds === 1 ? "Cent" : `${UNITS[hundreds]} Cent${rest === 0 && hundreds > 1 ? "s" : ""}`;
  return rest === 0 ? hundredWord : `${hundredWord} ${convertBelow1000(rest)}`;
}

export function amountToWords(amount: number): string {
  if (amount === 0) return "Zéro Franc";

  const millions = Math.floor(amount / 1_000_000);
  const thousands = Math.floor((amount % 1_000_000) / 1_000);
  const remainder = amount % 1_000;

  let result = "";

  if (millions > 0) {
    result += millions === 1 ? "Un Million " : `${convertBelow1000(millions)} Millions `;
  }
  if (thousands > 0) {
    result += thousands === 1 ? "Mille " : `${convertBelow1000(thousands)} Mille `;
  }
  if (remainder > 0) {
    result += convertBelow1000(remainder) + " ";
  }

  return result.trim() + " Francs";
}
