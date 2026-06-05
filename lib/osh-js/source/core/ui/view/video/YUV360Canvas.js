import YUVCanvas from './YUVCanvas';

class YUV360Canvas extends YUVCanvas {

	constructor(parOptions) {
		parOptions = parOptions || {};
		super(parOptions); // calls this.init() via the parent constructor

		// Camera state — set after super() because init() already ran.
		// Draw functions capture `this` by reference, so they read the
		// current values at call time, not at init time.
		this.yaw    = parOptions.initialYaw   != null ? parOptions.initialYaw   : 0;
		this.pitch  = parOptions.initialPitch != null ? parOptions.initialPitch : 0;
		this.fovDeg = parOptions.fov          != null ? parOptions.fov          : 75;

		this._initCameraControls();
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Core init overrides
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Override init() so the parent constructor calls our sphere pipeline
	 * instead of the flat-quad one. Structure mirrors the parent exactly —
	 * initContextGL → initProgram → initBuffers → initTextures — but the
	 * draw function assigned at the end targets sphere geometry.
	 */
	init() {
		this.initContextGL();

		if (this.contextGL) {
			this.initProgram();
			this.initBuffers();
			this.initTextures();
		}

		if (this.type === 'yuv420') {
			this.drawNextOutputPictureGL = (par) => this._drawYUV420(par);
		} else if (this.type === 'yuv422') {
			this.drawNextOutputPictureGL = (par) => this._drawYUV422(par);
		}
	}

	/**
	 * Override initProgram() with sphere-appropriate shaders.
	 *
	 * Vertex shader: transforms sphere vertices with an MVP matrix.
	 *   The sphere's natural UV coordinates already encode longitude/latitude
	 *   correctly for equirectangular textures, so no per-plane offset math
	 *   is needed in the vertex stage.
	 *
	 * Fragment shader: identical YUV→RGB conversion to the parent, but
	 *   uses a single shared UV varying (the sphere guarantees U/V planes
	 *   sample correctly regardless of their halved texture dimensions).
	 */
	initProgram() {
		const gl = this.contextGL;

		// ── Vertex shader ─────────────────────────────────────────────────────
		const vertSrc = [
			'attribute vec3 vertexPos;',
			'attribute vec2 texturePos;',
			'uniform mat4 MVP;',
			'varying vec2 vUV;',
			'void main() {',
			'  gl_Position = MVP * vec4(vertexPos, 1.0);',
			'  vUV = texturePos;',
			'}',
		].join('\n');

		// ── Fragment shader ───────────────────────────────────────────────────
		let fragSrc;

		if (this.type === 'yuv420') {
			// Three separate luminance textures (Y full-res, U/V half-res).
			// All three are sampled at the same UV; WebGL handles the
			// resolution difference automatically via texture dimensions.
			fragSrc = [
				'precision highp float;',
				'varying highp vec2 vUV;',
				'uniform sampler2D ySampler;',
				'uniform sampler2D uSampler;',
				'uniform sampler2D vSampler;',
				'uniform mat4 YUV2RGB;',
				'void main(void) {',
				'  float y = texture2D(ySampler, vUV).r;',
				'  float u = texture2D(uSampler, vUV).r;',
				'  float v = texture2D(vSampler, vUV).r;',
				'  gl_FragColor = vec4(y, u, v, 1.0) * YUV2RGB;',
				'}',
			].join('\n');
		} else if (this.type === 'yuv422') {
			// Luma and chroma are interleaved in a single LUMINANCE texture.
			// The unpacking logic is identical to the parent's YUV422 shader.
			fragSrc = [
				'precision highp float;',
				'varying highp vec2 vUV;',
				'uniform sampler2D sampler;',
				'uniform highp vec2 resolution;',
				'uniform mat4 YUV2RGB;',
				'void main(void) {',
				'  float texPixX     = 1.0 / resolution.x;',
				'  float logPixX     = 2.0 / resolution.x;',
				'  float logHalfPixX = 4.0 / resolution.x;',
				'  float steps   = floor(vUV.x / logPixX);',
				'  float uvSteps = floor(vUV.x / logHalfPixX);',
				'  float y = texture2D(sampler, vec2(logPixX * steps + texPixX,              vUV.y)).r;',
				'  float u = texture2D(sampler, vec2(logHalfPixX * uvSteps,                  vUV.y)).r;',
				'  float v = texture2D(sampler, vec2(logHalfPixX * uvSteps + 2.0 * texPixX,  vUV.y)).r;',
				'  gl_FragColor = vec4(y, u, v, 1.0) * YUV2RGB;',
				'}',
			].join('\n');
		}

		// ── YUV → RGB colour matrix (same values as parent) ───────────────────
		let YUV2RGB;
		if (this.conversionType === 'rec709') {
			YUV2RGB = [
				1.16438,  0.00000,  1.79274, -0.97295,
				1.16438, -0.21325, -0.53291,  0.30148,
				1.16438,  2.11240,  0.00000, -1.13340,
				0, 0, 0, 1,
			];
		} else {
			// Default: ITU-T Rec. 601
			YUV2RGB = [
				1.16438,  0.00000,  1.59603, -0.87079,
				1.16438, -0.39176, -0.81297,  0.52959,
				1.16438,  2.01723,  0.00000, -1.08139,
				0, 0, 0, 1,
			];
		}

		// ── Compile, link, activate ───────────────────────────────────────────
		const vert = this._compileShader(gl.VERTEX_SHADER,   vertSrc);
		const frag = this._compileShader(gl.FRAGMENT_SHADER, fragSrc);

		const program = gl.createProgram();
		gl.attachShader(program, vert);
		gl.attachShader(program, frag);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error('EquirectangularSphereCanvas: program link error —',
				gl.getProgramInfoLog(program));
		}

		gl.useProgram(program);

		const yuv2rgbLoc = gl.getUniformLocation(program, 'YUV2RGB');
		gl.uniformMatrix4fv(yuv2rgbLoc, false, YUV2RGB);

		// Cache the MVP uniform location for per-frame updates.
		this.mvpUniform   = gl.getUniformLocation(program, 'MVP');
		this.shaderProgram = program;
	}

	/**
	 * Override initBuffers() to upload a UV sphere mesh instead of a flat quad.
	 *
	 * The sphere uses reversed triangle winding so the camera at the origin
	 * sees texture on the inner surface. Positions and UVs are uploaded to
	 * STATIC_DRAW buffers; indices go into an ELEMENT_ARRAY_BUFFER.
	 */
	initBuffers() {
		const gl      = this.contextGL;
		const program = this.shaderProgram;

		const LAT_BANDS  = 32; // horizontal rings  — increase for smoother poles
		const LONG_BANDS = 64; // vertical slices   — increase for smoother edges

		const { positions, texCoords, indices } = this._buildSphere(LAT_BANDS, LONG_BANDS);
		this.sphereIndexCount = indices.length;

		// ── Position buffer ───────────────────────────────────────────────────
		const posBuf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

		const posLoc = gl.getAttribLocation(program, 'vertexPos');
		gl.enableVertexAttribArray(posLoc);
		gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

		// ── UV buffer ─────────────────────────────────────────────────────────
		const uvBuf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		const uvLoc = gl.getAttribLocation(program, 'texturePos');
		gl.enableVertexAttribArray(uvLoc);
		gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

		// ── Index buffer ──────────────────────────────────────────────────────
		// 32 × 64 bands → (32+1)×(64+1) = 2145 vertices < 65 535, so Uint16 is fine.
		const idxBuf = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

		this.sphereIndexBuffer = idxBuf;
	}

	/**
	 * Override initTexture() to use LINEAR filtering.
	 * The parent uses NEAREST, which produces visible blocky seams on a
	 * curved surface at anything but 1:1 pixel mapping.
	 */
	initTexture() {
		const gl         = this.contextGL;
		const textureRef = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, textureRef);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);
		gl.bindTexture(gl.TEXTURE_2D, null);

		return textureRef;
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Per-frame draw functions
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Upload three YUV planes and render the sphere for a YUV 4:2:0 frame.
	 * Called automatically via this.drawNextOutputPictureGL each frame.
	 */
	_drawYUV420(par) {
		const gl = this.contextGL;

		const { yData, uData, vData } = par;
		const width  = this.width;
		const height = this.height;

		const yDataPerRow = par.yDataPerRow || width;
		const yRowCnt     = par.yRowCnt     || height;
		const uDataPerRow = par.uDataPerRow || (width  / 2);
		const uRowCnt     = par.uRowCnt     || (height / 2);
		const vDataPerRow = par.vDataPerRow || uDataPerRow;
		const vRowCnt     = par.vRowCnt     || uRowCnt;

		gl.viewport(0, 0, this.canvasElement.width, this.canvasElement.height);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);
		// Ensure back-face culling is off — we're rendering the inside of the sphere.
		gl.disable(gl.CULL_FACE);

		// Upload Y plane (full resolution, single channel)
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.yTextureRef);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE,
			yDataPerRow, yRowCnt, 0,
			gl.LUMINANCE, gl.UNSIGNED_BYTE, yData);

		// Upload U plane (half resolution)
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.uTextureRef);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE,
			uDataPerRow, uRowCnt, 0,
			gl.LUMINANCE, gl.UNSIGNED_BYTE, uData);

		// Upload V plane (half resolution)
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, this.vTextureRef);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE,
			vDataPerRow, vRowCnt, 0,
			gl.LUMINANCE, gl.UNSIGNED_BYTE, vData);

		gl.uniformMatrix4fv(this.mvpUniform, false, this._computeMVP());

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sphereIndexBuffer);
		gl.drawElements(gl.TRIANGLES, this.sphereIndexCount, gl.UNSIGNED_SHORT, 0);
	}

	/**
	 * Upload an interleaved YUV 4:2:2 texture and render the sphere.
	 */
	_drawYUV422(par) {
		const gl = this.contextGL;

		const { data }   = par;
		const width      = this.width;
		const height     = this.height;
		const dataPerRow = par.dataPerRow || (width * 2);
		const rowCnt     = par.rowCnt     || height;

		gl.viewport(0, 0, this.canvasElement.width, this.canvasElement.height);
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);
		gl.disable(gl.CULL_FACE);

		gl.uniform2f(
			gl.getUniformLocation(this.shaderProgram, 'resolution'),
			dataPerRow, height
		);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.textureRef);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE,
			dataPerRow, rowCnt, 0,
			gl.LUMINANCE, gl.UNSIGNED_BYTE, data);

		gl.uniformMatrix4fv(this.mvpUniform, false, this._computeMVP());

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sphereIndexBuffer);
		gl.drawElements(gl.TRIANGLES, this.sphereIndexCount, gl.UNSIGNED_SHORT, 0);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Sphere mesh generation
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Build a UV sphere with inside-out (reversed) winding.
	 *
	 * UV mapping:
	 *   u = 0 → left edge of equirectangular frame  (−180° lon)
	 *   u = 1 → right edge                          (+180° lon)
	 *   v = 0 → top of frame (north pole,  +90° lat)
	 *   v = 1 → bottom       (south pole,  −90° lat)
	 *
	 * The horizontal flip (u = 1 − lon/longBands) is necessary because without
	 * it the image appears mirror-reversed when viewed from inside the sphere.
	 *
	 * @param {number} latBands  Number of horizontal rings (latitude divisions)
	 * @param {number} longBands Number of vertical slices  (longitude divisions)
	 * @returns {{ positions: number[], texCoords: number[], indices: number[] }}
	 */
	_buildSphere(latBands, longBands) {
		const positions = [];
		const texCoords = [];
		const indices   = [];

		for (let lat = 0; lat <= latBands; lat++) {
			const theta    = (lat / latBands) * Math.PI; // 0 (top) → π (bottom)
			const sinTheta = Math.sin(theta);
			const cosTheta = Math.cos(theta);

			for (let lon = 0; lon <= longBands; lon++) {
				const phi    = (lon / longBands) * 2 * Math.PI;
				const sinPhi = Math.sin(phi);
				const cosPhi = Math.cos(phi);

				// Unit-radius sphere centred at the origin.
				positions.push(
					cosPhi * sinTheta,  // x
					cosTheta,           // y  (1 at north pole, −1 at south pole)
					sinPhi  * sinTheta  // z
				);

				// Flip u so the image reads left-to-right from inside the sphere.
				texCoords.push(
					1 - lon / longBands,  // u
					lat / latBands        // v
				);
			}
		}

		// Reversed winding (a, c, b instead of a, b, c) puts front faces
		// on the inside surface so the camera sees them from origin.
		for (let lat = 0; lat < latBands; lat++) {
			for (let lon = 0; lon < longBands; lon++) {
				const a = lat       * (longBands + 1) + lon;
				const b = a + 1;
				const c = (lat + 1) * (longBands + 1) + lon;
				const d = c + 1;

				indices.push(a, c, b); // reversed winding — upper triangle
				indices.push(b, c, d); // reversed winding — lower triangle
			}
		}

		return { positions, texCoords, indices };
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Camera & MVP
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Compute the Model-View-Projection matrix for the current camera state.
	 *
	 * The model is identity (unit sphere at origin). The view matrix is the
	 * inverse of the camera's rotation: Rx(−pitch) · Ry(−yaw). The projection
	 * is a standard perspective frustum.
	 *
	 * @returns {Float32Array} Column-major 4×4 MVP matrix ready for uniformMatrix4fv
	 */
	_computeMVP() {
		const fov    = ((this.fovDeg != null ? this.fovDeg : 75) * Math.PI) / 180;
		const aspect = this.canvasElement.width / (this.canvasElement.height || 1);
		const yaw    = this.yaw   || 0;
		const pitch  = this.pitch || 0;

		const proj = this._mat4Perspective(fov, aspect, 0.1, 100);
		// View = inverse(camera pose) = Rx(−pitch) · Ry(−yaw)
		// Order: first rotate world by Ry(−yaw), then tilt by Rx(−pitch).
		const view = this._mat4Mul(
			this._mat4RotX(-pitch),
			this._mat4RotY(-yaw)
		);

		return this._mat4Mul(proj, view);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Camera controls
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Attach mouse, touch, and wheel listeners to the canvas for interactive
	 * panning (drag) and FOV zoom (pinch / scroll wheel).
	 */
	_initCameraControls() {
		const canvas    = this.canvasElement;
		const DRAG_SENS = 0.003; // radians per pixel — adjust to taste

		let dragging    = false;
		let lastX       = 0;
		let lastY       = 0;

		const onDragStart = (x, y) => {
			dragging = true;
			lastX    = x;
			lastY    = y;
		};

		const onDragMove = (x, y) => {
			if (!dragging) return;
			const dx = x - lastX;
			const dy = y - lastY;
			lastX = x;
			lastY = y;

			this.yaw   += dx * DRAG_SENS;
			// Clamp pitch to ±90° so the view never flips past a pole.
			this.pitch  = Math.max(
				-Math.PI / 2,
				Math.min(Math.PI / 2, this.pitch + dy * DRAG_SENS)
			);
		};

		const onDragEnd = () => { dragging = false; };

		// ── Mouse ─────────────────────────────────────────────────────────────
		canvas.addEventListener('mousedown', (e) => onDragStart(e.clientX, e.clientY));
		window.addEventListener('mousemove', (e) => onDragMove(e.clientX, e.clientY));
		window.addEventListener('mouseup',   onDragEnd);

		// ── Scroll-wheel FOV zoom ─────────────────────────────────────────────
		canvas.addEventListener('wheel', (e) => {
			e.preventDefault();
			this.fovDeg = Math.max(30, Math.min(120, this.fovDeg + e.deltaY * 0.05));
		}, { passive: false });

		// ── Touch drag ────────────────────────────────────────────────────────
		canvas.addEventListener('touchstart', (e) => {
			if (e.touches.length === 1) {
				e.preventDefault();
				onDragStart(e.touches[0].clientX, e.touches[0].clientY);
			}
		}, { passive: false });

		window.addEventListener('touchmove', (e) => {
			if (e.touches.length === 1) {
				e.preventDefault();
				onDragMove(e.touches[0].clientX, e.touches[0].clientY);
			}
		}, { passive: false });

		window.addEventListener('touchend', onDragEnd);

		// ── Pinch-to-zoom FOV ─────────────────────────────────────────────────
		let lastPinchDist = null;

		canvas.addEventListener('touchstart', (e) => {
			if (e.touches.length === 2) {
				lastPinchDist = this._pinchDist(e.touches);
			}
		}, { passive: true });

		canvas.addEventListener('touchmove', (e) => {
			if (e.touches.length === 2 && lastPinchDist !== null) {
				const dist  = this._pinchDist(e.touches);
				this.fovDeg = Math.max(30, Math.min(120,
					this.fovDeg - (dist - lastPinchDist) * 0.1
				));
				lastPinchDist = dist;
			}
		}, { passive: true });

		canvas.addEventListener('touchend',   () => { lastPinchDist = null; });
		canvas.addEventListener('touchcancel', () => { lastPinchDist = null; });
	}

	_pinchDist(touches) {
		const dx = touches[0].clientX - touches[1].clientX;
		const dy = touches[0].clientY - touches[1].clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Matrix helpers  (column-major, matching WebGL / GLSL convention)
	//
	// In column-major layout, element at (row, col) lives at index col*4+row.
	// Matrix multiplication out = a·b is: out[row,col] = Σ_k  a[row,k] · b[k,col]
	// ─────────────────────────────────────────────────────────────────────────

	/**
	 * Standard perspective projection matrix.
	 * @param {number} fov    Vertical field of view in radians
	 * @param {number} aspect Viewport width / height
	 * @param {number} near   Near clip plane distance
	 * @param {number} far    Far  clip plane distance
	 * @returns {Float32Array} Column-major 4×4
	 */
	_mat4Perspective(fov, aspect, near, far) {
		const f  = 1 / Math.tan(fov / 2);
		const nf = 1 / (near - far);
		// Columns listed left-to-right; rows listed top-to-bottom within each column.
		return new Float32Array([
			f / aspect, 0,  0,                       0,   // col 0
			0,          f,  0,                       0,   // col 1
			0,          0,  (far + near) * nf,      -1,   // col 2
			0,          0,  2 * far * near * nf,     0,   // col 3
		]);
	}

	/**
	 * Rotation around the Y axis (yaw).
	 * @param {number} a Angle in radians
	 * @returns {Float32Array} Column-major 4×4
	 */
	_mat4RotY(a) {
		const c = Math.cos(a);
		const s = Math.sin(a);
		return new Float32Array([
			c, 0, -s, 0,   // col 0
			0, 1,  0, 0,   // col 1
			s, 0,  c, 0,   // col 2
			0, 0,  0, 1,   // col 3
		]);
	}

	/**
	 * Rotation around the X axis (pitch).
	 * @param {number} a Angle in radians
	 * @returns {Float32Array} Column-major 4×4
	 */
	_mat4RotX(a) {
		const c = Math.cos(a);
		const s = Math.sin(a);
		return new Float32Array([
			1,  0,  0, 0,   // col 0
			0,  c,  s, 0,   // col 1
			0, -s,  c, 0,   // col 2
			0,  0,  0, 1,   // col 3
		]);
	}

	/**
	 * Multiply two column-major 4×4 matrices.  Returns a · b.
	 * In GL terms: "first apply b, then apply a".
	 * @param {Float32Array} a
	 * @param {Float32Array} b
	 * @returns {Float32Array} Column-major 4×4
	 */
	_mat4Mul(a, b) {
		const out = new Float32Array(16);
		for (let col = 0; col < 4; col++) {
			for (let row = 0; row < 4; row++) {
				let sum = 0;
				for (let k = 0; k < 4; k++) {
					sum += a[k * 4 + row] * b[col * 4 + k];
				}
				out[col * 4 + row] = sum;
			}
		}
		return out;
	}

	// ─────────────────────────────────────────────────────────────────────────
	// Shader compile helper
	// ─────────────────────────────────────────────────────────────────────────

	_compileShader(type, src) {
		const gl     = this.contextGL;
		const shader = gl.createShader(type);
		gl.shaderSource(shader, src);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const label = type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment';
			console.error(`EquirectangularSphereCanvas: ${label} shader compile error —`,
				gl.getShaderInfoLog(shader));
		}
		return shader;
	}
}

export default YUV360Canvas;