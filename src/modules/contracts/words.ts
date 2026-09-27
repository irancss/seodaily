// Persian number-to-words for amounts written out in contracts,
// e.g. 15000000 → «پانزده میلیون».

const ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
const TEENS = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
const TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
const HUNDREDS = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
const SCALES = ["", "هزار", "میلیون", "میلیارد", "تریلیون", "کوادریلیون"];

/** 1–999 in words. */
function belowThousand(n: number) {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rest = n % 100;
  if (h) parts.push(HUNDREDS[h]);
  if (rest >= 10 && rest < 20) {
    parts.push(TEENS[rest - 10]);
  } else {
    if (rest >= 20) parts.push(TENS[Math.floor(rest / 10)]);
    if (rest % 10) parts.push(ONES[rest % 10]);
  }
  return parts.join(" و ");
}

/** A whole number in Persian words; fractions are dropped. */
export function numberToWords(value: number): string {
  if (!Number.isFinite(value)) return "";
  const n = Math.trunc(Math.abs(value));
  if (n === 0) return "صفر";
  if (n > Number.MAX_SAFE_INTEGER) return "";

  const parts: string[] = [];
  let rest = n;
  for (let scale = 0; rest > 0 && scale < SCALES.length; scale++) {
    const chunk = rest % 1000;
    rest = Math.floor(rest / 1000);
    if (!chunk) continue;
    // «هزار» rather than «یک هزار»; larger scales keep «یک» (یک میلیون).
    const words = scale === 1 && chunk === 1 ? "" : belowThousand(chunk);
    parts.unshift([words, SCALES[scale]].filter(Boolean).join(" "));
  }
  return `${value < 0 ? "منفی " : ""}${parts.join(" و ")}`;
}

export function tomanInWords(value: number) {
  return `${numberToWords(value)} تومان`;
}
