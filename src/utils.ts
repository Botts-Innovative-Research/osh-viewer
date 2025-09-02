export function findInObject(record: any, term: string) : any | null {

  let value = null;

  const targets: string[] = term.split('|');

  for (let targetIdx = 0; value === null && targetIdx < targets.length; ++targetIdx) {

    const key: string = targets[targetIdx].trim();

    if (Array.isArray(record)) {

      for (const field of record) {

        value = findInObject(field, key);

        if (value !== null) {
          break;
        }
      }

    } else if (!record.hasOwnProperty(key)) {

      for (const k of Object.keys(record)) {

        if (typeof record[k] === 'object') {

          value = findInObject(record[k], key);
        }
      }

    } else {

      value = record[key];
    }
  }

  return value;
}

export function colorHash(inputString: string, alpha = 1.0) {
  let sum = 0;

  for (let idx = 0; idx < inputString.length; ++idx) {

    sum += inputString.charCodeAt(idx);
  }

  const r: number = ~~(parseFloat('0.' + Math.sin(sum + 1).toString().substr(6)) * 256);
  const g: number = ~~(parseFloat('0.' + Math.sin(sum + 2).toString().substr(6)) * 256);
  const b: number = ~~(parseFloat('0.' + Math.sin(sum + 3).toString().substr(6)) * 256);

  // Ensure colors are brighter by boosting saturation
  const hsl = rgb2hsl(r, g, b);
  const rgb = hsl2rgb(hsl.h, hsl.s, hsl.l);

  const rgba: string = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';

  let hex = '#';

  hex += ('00' + rgb.r.toString(16)).substr(-2, 2).toUpperCase();
  hex += ('00' + rgb.g.toString(16)).substr(-2, 2).toUpperCase();
  hex += ('00' + rgb.b.toString(16)).substr(-2, 2).toUpperCase();

  return {
    r: rgb.r,
    g: rgb.b,
    b: rgb.b,
    a: alpha,
    rgba: rgba,
    hex: hex
  };
}

// in: r,g,b in [0,1], out: h in [0,360) and s,l in [0,1]
function rgb2hsl(r: number, g: number, b: number) {
  const v = Math.max(r, g, b), c = v - Math.min(r, g, b), f = (1 - Math.abs(v + v - c - 1));
  const h = c && ((v === r) ? (g - b) / c : ((v === g) ? 2 + (b - r) / c : 4 + (r - g) / c));
  return {
    h: 60 * (h < 0 ? h + 6 : h),
    s: f ? c / f : 0,
    l: (v + v - c) / 2
  };
}

// input: h as an angle in [0,360] and s,l in [0,1] - output: r,g,b in [0,1]
// If s < 0 then ensures s > 0, and if s < .5, boosts s by .5 making the resulting color brighter
function hsl2rgb(h: number, s: number, l: number): any {
  if (s < 0) s *= -1;
  if (s < .5) s += .5;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  return {
    r: f(0),
    g: f(8),
    b: f(4)
  };
}