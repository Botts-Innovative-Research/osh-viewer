import { randomUUID } from "../../../utils/Utils";
var YUVCanvas = /** @class */ (function () {
    function YUVCanvas(parOptions) {
        parOptions = parOptions || {};
        this.canvasElement = parOptions.canvas || document.createElement("canvas");
        this.canvasElement.setAttribute('id', randomUUID());
        this.contextOptions = parOptions.contextOptions;
        this.type = parOptions.type || "yuv420";
        this.customYUV444 = parOptions.customYUV444;
        this.conversionType = parOptions.conversionType || "rec601";
        this.width = parOptions.width || 640;
        this.height = parOptions.height || 320;
        this.animationTime = parOptions.animationTime || 0;
        this.canvasElement.width = this.width;
        this.canvasElement.height = this.height;
        this.init();
    }
    YUVCanvas.prototype.init = function () {
        var _this = this;
        this.initContextGL();
        if (this.contextGL) {
            this.initProgram();
            this.initBuffers();
            this.initTextures();
        }
        /**
         * Draw the next output picture using WebGL
         */
        if (this.type === "yuv420") {
            this.drawNextOuptutPictureGL = function (par) {
                var gl = _this.contextGL;
                var texturePosBuffer = _this.texturePosBuffer;
                var uTexturePosBuffer = _this.uTexturePosBuffer;
                var vTexturePosBuffer = _this.vTexturePosBuffer;
                var yTextureRef = _this.yTextureRef;
                var uTextureRef = _this.uTextureRef;
                var vTextureRef = _this.vTextureRef;
                var yData = par.yData;
                var uData = par.uData;
                var vData = par.vData;
                var width = _this.width;
                var height = _this.height;
                var yDataPerRow = par.yDataPerRow || width;
                var yRowCnt = par.yRowCnt || height;
                var uDataPerRow = par.uDataPerRow || (width / 2);
                var uRowCnt = par.uRowCnt || (height / 2);
                var vDataPerRow = par.vDataPerRow || uDataPerRow;
                var vRowCnt = par.vRowCnt || uRowCnt;
                var roll = Math.round(par.roll / 90) * 90;
                if (roll > 180)
                    roll -= 360;
                if (Math.abs(roll) == 90) {
                    _this.canvasElement.width = _this.height;
                    _this.canvasElement.height = _this.width;
                    gl.viewport(0, 0, height, width);
                }
                else {
                    _this.canvasElement.width = _this.width;
                    _this.canvasElement.height = _this.height;
                    gl.viewport(0, 0, width, height);
                }
                var tTop = 0;
                var tLeft = 0;
                var tBottom = height / yRowCnt;
                var tRight = width / yDataPerRow;
                var texturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);
                gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, texturePosValues, gl.DYNAMIC_DRAW);
                if (_this.customYUV444) {
                    tBottom = height / uRowCnt;
                    tRight = width / uDataPerRow;
                }
                else {
                    tBottom = (height / 2) / uRowCnt;
                    tRight = (width / 2) / uDataPerRow;
                }
                var uTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);
                gl.bindBuffer(gl.ARRAY_BUFFER, uTexturePosBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, uTexturePosValues, gl.DYNAMIC_DRAW);
                if (_this.customYUV444) {
                    tBottom = height / vRowCnt;
                    tRight = width / vDataPerRow;
                }
                else {
                    tBottom = (height / 2) / vRowCnt;
                    tRight = (width / 2) / vDataPerRow;
                }
                var vTexturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);
                gl.bindBuffer(gl.ARRAY_BUFFER, vTexturePosBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, vTexturePosValues, gl.DYNAMIC_DRAW);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, yTextureRef);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, yDataPerRow, yRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, yData);
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, uTextureRef);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, uDataPerRow, uRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, uData);
                gl.activeTexture(gl.TEXTURE2);
                gl.bindTexture(gl.TEXTURE_2D, vTextureRef);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, vDataPerRow, vRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, vData);
                gl.uniform1f(_this.rollUniform, roll * Math.PI / 180.);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            };
            this.drawNextOuptutPictureBitmapGL = function (par) {
                var gl = _this.contextGL;
                var texturePosBuffer = _this.texturePosBuffer;
                var yTextureRef = _this.yTextureRef;
                var yData = par.yData;
                var width = _this.width;
                var height = _this.height;
                var yDataPerRow = width;
                var yRowCnt = height;
                var tTop = 0;
                var tLeft = 0;
                var tBottom = height / yRowCnt;
                var tRight = width / yDataPerRow;
                var texturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);
                var roll = Math.round(par.roll / 90) * 90;
                if (roll > 180)
                    roll -= 360;
                if (Math.abs(roll) == 90) {
                    _this.canvasElement.width = _this.height;
                    _this.canvasElement.height = _this.width;
                    gl.viewport(0, 0, height, width);
                }
                else {
                    _this.canvasElement.width = _this.width;
                    _this.canvasElement.height = _this.height;
                    gl.viewport(0, 0, width, height);
                }
                gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, texturePosValues, gl.DYNAMIC_DRAW);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, yTextureRef);
                // gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, yDataPerRow, yRowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, yData);
                gl.texImage2D(gl.TEXTURE_2D, // target
                0, // mip level
                gl.RGBA, // internal format
                gl.RGBA, //format
                gl.UNSIGNED_BYTE, // type
                yData);
                gl.uniform1f(_this.rollUniform, roll * Math.PI / 180.);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            };
        }
        else if (this.type === "yuv422") {
            this.drawNextOuptutPictureGL = function (par) {
                var gl = _this.contextGL;
                var texturePosBuffer = _this.texturePosBuffer;
                var textureRef = _this.textureRef;
                var data = par.data;
                var width = _this.width;
                var height = _this.height;
                var dataPerRow = par.dataPerRow || (width * 2);
                var rowCnt = par.rowCnt || height;
                gl.viewport(0, 0, width, height);
                var tTop = 0;
                var tLeft = 0;
                var tBottom = height / rowCnt;
                var tRight = width / (dataPerRow / 2);
                var texturePosValues = new Float32Array([tRight, tTop, tLeft, tTop, tRight, tBottom, tLeft, tBottom]);
                gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, texturePosValues, gl.DYNAMIC_DRAW);
                gl.uniform2f(gl.getUniformLocation(_this.shaderProgram, 'resolution'), dataPerRow, height);
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, textureRef);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, dataPerRow, rowCnt, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, data);
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            };
        }
    };
    /**
     * Returns true if the canvas supports WebGL
     */
    YUVCanvas.prototype.isWebGL = function () {
        return this.contextGL;
    };
    /**
     * Create the GL context from the canvas element
     */
    YUVCanvas.prototype.initContextGL = function () {
        var canvas = this.canvasElement;
        var gl = null;
        var validContextNames = ["webgl", "experimental-webgl", "moz-webgl", "webkit-3d"];
        var nameIndex = 0;
        while (!gl && nameIndex < validContextNames.length) {
            var contextName = validContextNames[nameIndex];
            try {
                if (this.contextOptions) {
                    gl = canvas.getContext(contextName, this.contextOptions);
                }
                else {
                    gl = canvas.getContext(contextName);
                }
            }
            catch (e) {
                gl = null;
            }
            if (!gl || typeof gl.getParameter !== "function") {
                gl = null;
            }
            ++nameIndex;
        }
        this.contextGL = gl;
    };
    /**
     * Initialize GL shader program
     */
    YUVCanvas.prototype.initProgram = function () {
        var gl = this.contextGL;
        // vertex shader is the same for all types
        var vertexShaderScript;
        var fragmentShaderScript;
        if (this.type === "yuv420") {
            vertexShaderScript = [
                'attribute vec4 vertexPos;',
                'attribute vec4 texturePos;',
                'attribute vec4 uTexturePos;',
                'attribute vec4 vTexturePos;',
                'varying vec2 textureCoord;',
                'varying vec2 uTextureCoord;',
                'varying vec2 vTextureCoord;',
                'uniform float roll;',
                'void main()',
                '{',
                '  vec4 ctr = vec4(0.5, 0.5, 0, 0);',
                '  mat4 rotMatrix = mat4( cos(roll), -sin(roll), 0, 0,',
                '                         sin(roll),  cos(roll), 0, 0,',
                '                         0,          0,         1, 0,',
                '                         0,          0,         0, 1);',
                '  gl_Position = vertexPos;',
                '  textureCoord = mat2(rotMatrix) * (texturePos.xy - vec2(ctr)) + vec2(ctr);',
                '  uTextureCoord = mat2(rotMatrix) * (uTexturePos.xy - vec2(ctr)) + vec2(ctr);',
                '  vTextureCoord = mat2(rotMatrix) * (vTexturePos.xy - vec2(ctr)) + vec2(ctr);',
                '}'
            ].join('\n');
            fragmentShaderScript = [
                'precision highp float;',
                'varying highp vec2 textureCoord;',
                'varying highp vec2 uTextureCoord;',
                'varying highp vec2 vTextureCoord;',
                'uniform sampler2D ySampler;',
                'uniform sampler2D uSampler;',
                'uniform sampler2D vSampler;',
                'uniform mat4 YUV2RGB;',
                'void main(void) {',
                '  highp float y = texture2D(ySampler,  textureCoord).r;',
                '  highp float u = texture2D(uSampler,  uTextureCoord).r;',
                '  highp float v = texture2D(vSampler,  vTextureCoord).r;',
                '  gl_FragColor = vec4(y, u, v, 1) * YUV2RGB;',
                '}'
            ].join('\n');
        }
        else if (this.type === "yuv422") {
            vertexShaderScript = [
                'attribute vec4 vertexPos;',
                'attribute vec4 texturePos;',
                'varying vec2 textureCoord;',
                'void main()',
                '{',
                '  gl_Position = vertexPos;',
                '  textureCoord = texturePos.xy;',
                '}'
            ].join('\n');
            fragmentShaderScript = [
                'precision highp float;',
                'varying highp vec2 textureCoord;',
                'uniform sampler2D sampler;',
                'uniform highp vec2 resolution;',
                'uniform mat4 YUV2RGB;',
                'void main(void) {',
                '  highp float texPixX = 1.0 / resolution.x;',
                '  highp float logPixX = 2.0 / resolution.x;',
                '  highp float logHalfPixX = 4.0 / resolution.x;',
                '  highp float steps = floor(textureCoord.x / logPixX);',
                '  highp float uvSteps = floor(textureCoord.x / logHalfPixX);',
                '  highp float y = texture2D(sampler, vec2((logPixX * steps) + texPixX, textureCoord.y)).r;',
                '  highp float u = texture2D(sampler, vec2((logHalfPixX * uvSteps), textureCoord.y)).r;',
                '  highp float v = texture2D(sampler, vec2((logHalfPixX * uvSteps) + texPixX + texPixX, textureCoord.y)).r;',
                //'  highp float y = texture2D(sampler,  textureCoord).r;',
                //'  gl_FragColor = vec4(y, u, v, 1) * YUV2RGB;',
                '  gl_FragColor = vec4(y, u, v, 1.0) * YUV2RGB;',
                '}'
            ].join('\n');
        }
        var YUV2RGB = [];
        if (this.conversionType === "rec709") {
            // ITU-T Rec. 709
            YUV2RGB = [
                1.16438, 0.00000, 1.79274, -0.97295,
                1.16438, -0.21325, -0.53291, 0.30148,
                1.16438, 2.11240, 0.00000, -1.13340,
                0, 0, 0, 1,
            ];
        }
        else {
            // assume ITU-T Rec. 601
            YUV2RGB = [
                1.16438, 0.00000, 1.59603, -0.87079,
                1.16438, -0.39176, -0.81297, 0.52959,
                1.16438, 2.01723, 0.00000, -1.08139,
                0, 0, 0, 1
            ];
        }
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexShaderScript);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.log('Vertex shader failed to compile: ' + gl.getShaderInfoLog(vertexShader));
        }
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentShaderScript);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.log('Fragment shader failed to compile: ' + gl.getShaderInfoLog(fragmentShader));
        }
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.log('Program failed to compile: ' + gl.getProgramInfoLog(program));
        }
        gl.useProgram(program);
        var YUV2RGBRef = gl.getUniformLocation(program, 'YUV2RGB');
        gl.uniformMatrix4fv(YUV2RGBRef, false, YUV2RGB);
        this.rollUniform = gl.getUniformLocation(program, "roll");
        this.shaderProgram = program;
    };
    /**
     * Initialize vertex buffers and attach to shader program
     */
    YUVCanvas.prototype.initBuffers = function () {
        var gl = this.contextGL;
        var program = this.shaderProgram;
        var vertexPosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);
        var vertexPosRef = gl.getAttribLocation(program, 'vertexPos');
        gl.enableVertexAttribArray(vertexPosRef);
        gl.vertexAttribPointer(vertexPosRef, 2, gl.FLOAT, false, 0, 0);
        if (this.animationTime) {
            var animationTime = this.animationTime;
            var timePassed = 0;
            var stepTime = 15;
            var aniFun = function () {
                timePassed += stepTime;
                var mul = (1 * timePassed) / animationTime;
                if (timePassed >= animationTime) {
                    mul = 1;
                }
                else {
                    setTimeout(aniFun, stepTime);
                }
                var neg = -1 * mul;
                var pos = 1 * mul;
                var vertexPosBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([pos, pos, neg, pos, pos, neg, neg, neg]), gl.STATIC_DRAW);
                var vertexPosRef = gl.getAttribLocation(program, 'vertexPos');
                gl.enableVertexAttribArray(vertexPosRef);
                gl.vertexAttribPointer(vertexPosRef, 2, gl.FLOAT, false, 0, 0);
                try {
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
                }
                catch (e) {
                }
            };
            aniFun();
        }
        var texturePosBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
        var texturePosRef = gl.getAttribLocation(program, 'texturePos');
        gl.enableVertexAttribArray(texturePosRef);
        gl.vertexAttribPointer(texturePosRef, 2, gl.FLOAT, false, 0, 0);
        this.texturePosBuffer = texturePosBuffer;
        if (this.type === "yuv420") {
            var uTexturePosBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, uTexturePosBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
            var uTexturePosRef = gl.getAttribLocation(program, 'uTexturePos');
            gl.enableVertexAttribArray(uTexturePosRef);
            gl.vertexAttribPointer(uTexturePosRef, 2, gl.FLOAT, false, 0, 0);
            this.uTexturePosBuffer = uTexturePosBuffer;
            var vTexturePosBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vTexturePosBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
            var vTexturePosRef = gl.getAttribLocation(program, 'vTexturePos');
            gl.enableVertexAttribArray(vTexturePosRef);
            gl.vertexAttribPointer(vTexturePosRef, 2, gl.FLOAT, false, 0, 0);
            this.vTexturePosBuffer = vTexturePosBuffer;
        }
    };
    /**
     * Initialize GL textures and attach to shader program
     */
    YUVCanvas.prototype.initTextures = function () {
        var gl = this.contextGL;
        var program = this.shaderProgram;
        if (this.type === "yuv420") {
            var yTextureRef = this.initTexture();
            var ySamplerRef = gl.getUniformLocation(program, 'ySampler');
            gl.uniform1i(ySamplerRef, 0);
            this.yTextureRef = yTextureRef;
            var uTextureRef = this.initTexture();
            var uSamplerRef = gl.getUniformLocation(program, 'uSampler');
            gl.uniform1i(uSamplerRef, 1);
            this.uTextureRef = uTextureRef;
            var vTextureRef = this.initTexture();
            var vSamplerRef = gl.getUniformLocation(program, 'vSampler');
            gl.uniform1i(vSamplerRef, 2);
            this.vTextureRef = vTextureRef;
        }
        else if (this.type === "yuv422") {
            // only one texture for 422
            var textureRef = this.initTexture();
            var samplerRef = gl.getUniformLocation(program, 'sampler');
            gl.uniform1i(samplerRef, 0);
            this.textureRef = textureRef;
        }
    };
    /**
     * Create and configure a single texture
     */
    YUVCanvas.prototype.initTexture = function () {
        var gl = this.contextGL;
        var textureRef = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, textureRef);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindTexture(gl.TEXTURE_2D, null);
        return textureRef;
    };
    /**
     * Draw picture data to the canvas.
     * If this object is using WebGL, the data must be an I420 formatted ArrayBuffer,
     * Otherwise, data must be an RGBA formatted ArrayBuffer.
     */
    YUVCanvas.prototype.drawNextOutputPicture = function (width, height, croppingParams, data) {
        var gl = this.contextGL;
        if (gl) {
            this.drawNextOuptutPictureGL(width, height, croppingParams, data);
        }
        else {
            this.drawNextOuptutPictureRGBA(width, height, croppingParams, data);
        }
    };
    /**
     * Draw next output picture using ARGB data on a 2d canvas.
     */
    YUVCanvas.prototype.drawNextOuptutPictureRGBA = function (width, height, croppingParams, data) {
        var canvas = this.canvasElement;
        var argbData = data;
        var ctx = canvas.getContext('2d');
        var imageData = ctx.getImageData(0, 0, width, height);
        imageData.data.set(argbData);
        if (croppingParams === null) {
            ctx.putImageData(imageData, 0, 0);
        }
        else {
            ctx.putImageData(imageData, -croppingParams.left, -croppingParams.top, 0, 0, croppingParams.width, croppingParams.height);
        }
    };
    YUVCanvas.prototype.resize = function (width, height) {
        this.canvasElement.width = width;
        this.canvasElement.height = height;
        this.width = width;
        this.height = height;
    };
    return YUVCanvas;
}());
export default YUVCanvas;
//# sourceMappingURL=YUVCanvas.js.map