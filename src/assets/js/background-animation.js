class NoiseAnimation {
	constructor(canvasId) {
		this.canvas = document.getElementById(canvasId);
		this.gl = this.canvas.getContext('webgl');
		this.setupCanvas();
		this.createShaders();
		this.createProgram();
		this.setupBuffers();
		this.setupEventListeners();
		this.start();
	}

	setupCanvas() {
		this.canvas.width = window.innerWidth * 2;
		this.canvas.height = window.innerHeight * 2;
		this.canvas.style.width = '100%';
		this.canvas.style.height = '100%';
		this.scrollOffset = 0;
		this.scrollNormalized = 0;        // normalized (0..1) scroll value
		this.scrollScale = -0.75;         // tweak this (0 = no parallax, 1 = strong)
	}

	createShaders() {
		const fragmentShaderSource = `
            precision highp float;

            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_scroll;       // normalized scroll (0..1)
            uniform float u_scrollScale;  // scale factor for parallax

            #define SCALE 2.0
            #define SPEED 0.02
            #define LEVELS 100.0
            #define COLOR1 vec3(0.01, 0.01, 0.01)
            #define COLOR2 vec3(0.194616, 0.8388, 0.982251)
            #define COLOR3 vec3(0.701097, 0.973446, 0.201557)

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
                    u.y
                );
            }

            void main() {
                vec2 aspect = vec2(u_resolution.x / u_resolution.y, 1.0);
                // Apply normalized scroll with a tunable scale to avoid large jumps
                vec2 uv = ((gl_FragCoord.xy / u_resolution.xy) - 0.5 + vec2(0.0, u_scroll * u_scrollScale)) * SCALE * aspect;
                float t = u_time * SPEED;

                float n = 0.0;
                n += 0.5 * noise(uv * 1.0 + vec2(t, 0.0));
                n += 0.25 * noise(uv * 2.0 - vec2(0.0, t));
                n += 0.125 * noise(uv * 4.0 + vec2(t * 0.5));

                float q = floor(n * LEVELS * 1.5) / (LEVELS - 1.0);

                vec3 color;
                if      (q < 0.08)  color = COLOR1;
                else if (q < 0.09)  color = COLOR2;
                else if (q < 0.12)  color = COLOR1;
                else if (q < 0.25)  color = COLOR2;
                else if (q < 0.22)  color = COLOR1;
                else if (q < 0.28)  color = COLOR2;
                else if (q < 0.36)  color = COLOR1;
                else if (q < 0.40)  color = COLOR2;
                else if (q < 0.50)  color = COLOR1;
                else if (q < 0.62)  color = COLOR3;
                else if (q < 0.70)  color = COLOR1;
                else if (q < 0.73)  color = COLOR2;
                else if (q < 0.80)  color = COLOR1;
                else if (q < 0.84)  color = COLOR2;
                else if (q < 0.90)  color = COLOR1;
                else if (q < 0.92)  color = COLOR2;
                else if (q < 0.94)  color = COLOR1;
                else if (q < 0.95)  color = COLOR2;
                else                color = COLOR1;

                color = pow(color, vec3(1.0 / 2.2));
                gl_FragColor = vec4(color, 1.0);
            }
        `;

		const vertexShaderSource = `
            attribute vec4 a_position;
            void main() { 
                gl_Position = a_position; 
            }
        `;

		this.fragShader = this.createShader(
			this.gl.FRAGMENT_SHADER,
			fragmentShaderSource
		);
		this.vertShader = this.createShader(
			this.gl.VERTEX_SHADER,
			vertexShaderSource
		);
	}

	createShader(type, source) {
		const shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			console.error(this.gl.getShaderInfoLog(shader));
		}
		return shader;
	}

	createProgram() {
		this.program = this.gl.createProgram();
		this.gl.attachShader(this.program, this.vertShader);
		this.gl.attachShader(this.program, this.fragShader);
		this.gl.linkProgram(this.program);
		this.gl.useProgram(this.program);
	}

	setupBuffers() {
		const positionBuffer = this.gl.createBuffer();
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
		this.gl.bufferData(
			this.gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
			this.gl.STATIC_DRAW
		);

		const positionLocation = this.gl.getAttribLocation(
			this.program,
			'a_position'
		);
		this.gl.enableVertexAttribArray(positionLocation);
		this.gl.vertexAttribPointer(
			positionLocation,
			2,
			this.gl.FLOAT,
			false,
			0,
			0
		);

		this.timeLoc = this.gl.getUniformLocation(this.program, 'u_time');
		this.resLoc = this.gl.getUniformLocation(this.program, 'u_resolution');
		this.scrollLoc = this.gl.getUniformLocation(this.program, 'u_scroll');
		this.scrollScaleLoc = this.gl.getUniformLocation(this.program, 'u_scrollScale');
	}

	setupEventListeners() {
		window.addEventListener('resize', () => this.resize());
		window.addEventListener('scroll', () => {
			const docHeight = Math.max(
				document.body.scrollHeight,
				document.documentElement.scrollHeight,
				document.body.offsetHeight,
				document.documentElement.offsetHeight,
				document.body.clientHeight,
				document.documentElement.clientHeight
			);
			// Normalize scroll to 0..1 across the scrollable range
			this.scrollNormalized = window.pageYOffset / Math.max(1, docHeight - window.innerHeight);
		});
	}

	resize() {
		this.canvas.width = window.innerWidth * 2;
		this.canvas.height = window.innerHeight * 2;
		this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	}

	render(time) {
		this.gl.uniform1f(this.timeLoc, time * 0.001);
		this.gl.uniform2f(this.resLoc, this.canvas.width, this.canvas.height);
		// Pass normalized scroll and scale to shader (no heavy per-frame lookups)
		this.gl.uniform1f(this.scrollLoc, this.scrollNormalized);
		this.gl.uniform1f(this.scrollScaleLoc, this.scrollScale);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
		requestAnimationFrame((t) => this.render(t));
	}

	start() {
		this.resize();
		requestAnimationFrame((t) => this.render(t));
	}
}
