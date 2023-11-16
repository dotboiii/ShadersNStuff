document.addEventListener('DOMContentLoaded', function () {
    initglsl(); } // Call function when DOM is loaded
    );
    
    //function for loading the shader source from a file
    function loadshaderSource (filename) {
        var shaderSource = "";
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('GET', filename, false);
        xmlhttp.send();
        if (xmlhttp.status === 200) {
            shaderSource = xmlhttp.responseText;
        }
        return shaderSource;
    };

    var initglsl = function () {

        console.log("Hello, WebGL!, this is working!");
    
        const canvas = document.getElementById('glslcanvas');
        const gl = canvas.getContext('webgl');
    
        if (!gl) {
            console.log("WebGL not supported, falling back on experimental-webgl");
            gl = canvas.getContext('experimental-webgl');
        }
        if (!gl) {
            console.error('Unable to initialize WebGL. Your browser may not support it.');
            return;
        }
        var shaderSource = loadshaderSource('shader.glsl');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    
        gl.clearColor(0.5, 0.8, 0.8, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
        //split into vertex and fragment shader
        var vertexshaderSource = shaderSource.split('// Fragment Shader')[0];
        var fragmentshaderSource = shaderSource.split('// Fragment Shader')[1];
    
        // Create shaders and compile
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexshaderSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(vertexShader);
            throw new Error(`Could not compile vertex shader: \n\n${info}`);
        }
    
        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentshaderSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(fragmentShader);
            throw new Error(`Could not compile fragment shader: \n\n${info}`);
        }
    
        // Create program and link shaders
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            throw new Error(`Could not link shader program. \n\n${info}`);
        }
        gl.validateProgram(program);
        if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            throw new Error(`Could not validate shader program. \n\n${info}`);
        }
        //mouse movement stuff
        var dampingFactor = .1;
        var iMouseCenter = [canvas.width / 2, canvas.height / 2];
        var iMousePosition = [0.0, 0.0];

        // Event listener for mouse movement
        window.addEventListener('mousemove', function (e) {
            // Calculate the distance from the center
            var distanceX = e.clientX - iMouseCenter[0];
            var distanceY = e.clientY - iMouseCenter[1];
    
            // Apply damping to the movement
            distanceX *= dampingFactor;
            distanceY *= dampingFactor;
    
            // Update the mouse position
            iMousePosition[0] = iMouseCenter[0] + distanceX;
            iMousePosition[1] = iMouseCenter[1] + distanceY;
        });

        // Create buffer
        var squareVertices = [
            -1.0, -1.0, // bottom left
             1.0, -1.0, // bottom right
            -1.0,  1.0, // top left
        
            -1.0,  1.0, // top left
             1.0, -1.0, // bottom right
             1.0,  1.0  // top right
        ];

        // Create buffer
        var squareVerticesBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareVertices), gl.STATIC_DRAW);
    
        var positionattribute = gl.getAttribLocation(program, 'aVertexPosition');

        if (positionattribute === -1) {
            console.error('Could not locate attribute: position');
            return;
        } // Get position attribute from shader
        
        gl.vertexAttribPointer(
            positionattribute, // Attribute location
            2, // Number of elements per attribute
            gl.FLOAT, // Type of elements
            gl.FALSE, // Is data normalized
            2 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            0 // Offset from the beginning of a single vertex to this attribute
        );
    
        gl.enableVertexAttribArray(positionattribute); // Enable vertex attribute array

       // Resize the canvas when the window is resized
        window.addEventListener('resize', function() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        });

        //uniforms
        var iTime = gl.getUniformLocation(program, 'iTime'); //time since start of program
        var iResolution = gl.getUniformLocation(program, 'iResolution'); //resolution
        var iMouse = gl.getUniformLocation(program, 'iMouse'); //mouse position
        var uRotation = gl.getUniformLocation(program, 'uRotation'); //rotation
        var Texture = gl.getUniformLocation(program, 'Texture'); //texture




        
        // Rendering function
        var render = function (timestamp) {
            gl.useProgram(program);
    
            // Update time
            gl.uniform1f(iTime, timestamp * 0.001);
    
            // Set other uniform values
            gl.uniform2fv(iResolution, [canvas.width, canvas.height]);
            gl.uniform2fv(iMouse, iMousePosition);
            gl.uniform1f(uRotation, 0); // Set the rotation angle in radians
    
            // Draw
            gl.drawArrays(gl.TRIANGLES, 0, 6); // Draw 2 triangles
    
            // Request the next frame
            requestAnimationFrame(render);
        };

        // Start the animation test
        window.dispatchEvent(new Event('resize')); // Set the initial canvas size
        requestAnimationFrame(render);
};
    