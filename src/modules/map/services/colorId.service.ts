/**
 * Generate a bright, high-visibility color based on an input string.
 * Optimized for map displays over both dark water and terrain.
 * Favors light, vibrant colors (cyan, yellow, light green, bright blue, coral red, orange, magenta).
 * Eliminates dark, muddy tones (black, dark green, dark brown, navy, dark red).
 *
 * @param inputString
 * @param alpha
 * @returns
 */
export function colorHash(inputString: string, alpha: number = 1.0): any {
	const str = String(inputString ?? '').trim();
	if (!str) {
		return {
			r: 255,
			g: 204,
			b: 0,
			a: alpha,
			rgba: `rgba(255, 204, 0, ${alpha})`,
			hex: '#FFCC00',
		};
	}

	let sum: number = 0;
	for (let idx: number = 0; idx < str.length; ++idx) {
		sum = (sum * 31 + str.charCodeAt(idx)) | 0;
	}
	sum = Math.abs(sum);

	// Golden angle distribution ensures sequential / similar IDs get widely distinct hues
	const h = (sum * 137.508) % 360;
	const s = 0.95; // High saturation for vividness

	// Tune lightness by hue so every color stands out cleanly against dark satellite/ocean
	let l = 0.6;
	if (h >= 220 && h <= 285) {
		// Blues, indigos, and purples need high lightness (70%) to avoid looking like dark navy on water
		l = 0.7;
	} else if (h >= 45 && h <= 70) {
		// Yellows are naturally luminous and bright around 53%
		l = 0.53;
	} else if (h >= 75 && h <= 160) {
		// Greens/limes are bright and vivid at 56% without looking like dark forest/olive
		l = 0.56;
	} else if (h >= 165 && h <= 215) {
		// Cyans and light blues: bright and electric at 62%
		l = 0.62;
	} else {
		// Reds, oranges, magentas, pinks: bright and punchy at 62%
		l = 0.62;
	}

	const rgb = hsl2rgb(h, s, l);
	const rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

	let hex = '#';
	hex += ('00' + rgb.r.toString(16)).slice(-2).toUpperCase();
	hex += ('00' + rgb.g.toString(16)).slice(-2).toUpperCase();
	hex += ('00' + rgb.b.toString(16)).slice(-2).toUpperCase();

	return {
		r: rgb.r,
		g: rgb.g,
		b: rgb.b,
		a: alpha,
		rgba: rgba,
		hex: hex,
	};
}

// Convert HSL (h in [0, 360), s in [0, 1], l in [0, 1]) to RGB [0, 255]
function hsl2rgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	let r = 0,
		g = 0,
		b = 0;
	if (0 <= h && h < 60) {
		r = c;
		g = x;
		b = 0;
	} else if (60 <= h && h < 120) {
		r = x;
		g = c;
		b = 0;
	} else if (120 <= h && h < 180) {
		r = 0;
		g = c;
		b = x;
	} else if (180 <= h && h < 240) {
		r = 0;
		g = x;
		b = c;
	} else if (240 <= h && h < 300) {
		r = x;
		g = 0;
		b = c;
	} else if (300 <= h && h < 360) {
		r = c;
		g = 0;
		b = x;
	}
	return {
		r: Math.round((r + m) * 255),
		g: Math.round((g + m) * 255),
		b: Math.round((b + m) * 255),
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
