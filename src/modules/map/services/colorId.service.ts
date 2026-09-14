/**
 * Generate a color based on given input string and alpha number
 * @param inputString
 * @param alpha
 * @returns
 */
export function colorHash(inputString: string, alpha: number = 1.0): any {
	let sum: number = 0;

	for (let idx: number = 0; idx < inputString.length; ++idx) {
		sum += inputString.charCodeAt(idx);
	}

	let r: number = ~~(
		parseFloat(
			'0.' +
				Math.sin(sum + 1)
					.toString()
					.substr(6)
		) * 256
	);
	let g: number = ~~(
		parseFloat(
			'0.' +
				Math.sin(sum + 2)
					.toString()
					.substr(6)
		) * 256
	);
	let b: number = ~~(
		parseFloat(
			'0.' +
				Math.sin(sum + 3)
					.toString()
					.substr(6)
		) * 256
	);

	// Ensure colors are brighter by boosting saturation
	let hsl: any = rgb2hsl(r, g, b);
	let rgb: any = hsl2rgb(hsl.h, hsl.s, hsl.l);

	let rgba: string = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';

	let hex: string = '#';

	hex += ('00' + rgb.r.toString(16)).substr(-2, 2).toUpperCase();
	hex += ('00' + rgb.g.toString(16)).substr(-2, 2).toUpperCase();
	hex += ('00' + rgb.b.toString(16)).substr(-2, 2).toUpperCase();

	return {
		r: rgb.r,
		g: rgb.b,
		b: rgb.b,
		a: alpha,
		rgba: rgba,
		hex: hex,
	};
}

// in: r,g,b in [0,1], out: h in [0,360) and s,l in [0,1]
function rgb2hsl(r: number, g: number, b: number): any {
	let v: number = Math.max(r, g, b),
		c = v - Math.min(r, g, b),
		f = 1 - Math.abs(v + v - c - 1);
	let h = c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c);
	let hsl: any = {
		h: 60 * (h < 0 ? h + 6 : h),
		s: f ? c / f : 0,
		l: (v + v - c) / 2,
	};
	return hsl;
}

// input: h as an angle in [0,360] and s,l in [0,1] - output: r,g,b in [0,1]
// If s < 0 then ensures s > 0, and if s < .5, boosts s by .5 making the resulting color brighter
function hsl2rgb(h: number, s: number, l: number): any {
	if (s < 0) s *= -1;
	if (s < 0.5) s += 0.5;
	let a: number = s * Math.min(l, 1 - l);
	let f = (n: number, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
	let rgb: any = {
		r: f(0),
		g: f(8),
		b: f(4),
	};
	return rgb;
}

/** COLOR FOR LEAFLET */
const iconCache = new Map<string, string>();

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();

		// Only needed if loading from another domain
		// img.crossOrigin = 'anonymous';

		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Failed to load image: ${src}`));

		img.src = src;
	});
}

export async function getColoredIconUrl(src: string, color: string): Promise<string> {
	const key = `${src}:${color}`;

	const cached = iconCache.get(key);
	if (cached) return cached;

	const img = await loadImage(src);

	const canvas = document.createElement('canvas');
	canvas.width = img.width;
	canvas.height = img.height;

	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error('Could not create canvas context.');
	}

	// Draw the original image
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(img, 0, 0);

	// Replace the color while preserving transparency
	ctx.globalCompositeOperation = 'source-in';
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const dataUrl = canvas.toDataURL('image/png');

	iconCache.set(key, dataUrl);
	return dataUrl;
}
