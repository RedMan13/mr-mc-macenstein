const cl = require('opencl-raub');
const fs = require('fs');
const path = require('path');

// lowk i dont care i just want it to run    good ish
const { context, device } = cl.quickStart(true);
const queue = cl.createCommandQueue(context, device);

const BUFFER_SIZE = 10;
const BYTE_SIZE = BUFFER_SIZE * Uint32Array.BYTES_PER_ELEMENT;

const arrayA = new Uint32Array(BUFFER_SIZE);
const arrayB = new Uint32Array(BUFFER_SIZE);
const arrayC = new Uint32Array(BUFFER_SIZE);

for (let i = 0; i < BUFFER_SIZE; i++) {
	arrayA[i] = i;
	arrayB[i] = i * 2;
}

// Create buffer for arrayA and arrayB and copy host contents
const bufferA = cl.createBuffer(context, cl.MEM_READ_ONLY, BYTE_SIZE);
const bufferB = cl.createBuffer(context, cl.MEM_READ_ONLY, BYTE_SIZE);

// Create buffer for arrayC to read results
const bufferC = cl.createBuffer(context, cl.MEM_WRITE_ONLY, BYTE_SIZE);

const program = cl.createProgramWithSource(context, fs.readFileSync(path.resolve(__dirname, './partical-processor.cl'), 'utf8'));
cl.buildProgram(program);
const kernel = cl.createKernel(program, 'simulate');

/**
 * Runs a particle simulation
 * @param {Uint8Array} pixels The particles to simulate. Final result will also end up here.
 * @param {number} width The width of the space that pixels
 * @param {number} height The height of the space that pixels
 * @param {number} steps How many steps to run
 * @returns {Uint8Array[]} The results of each step
 */
module.exports = function simulate(pixels, width, height, steps) {
    const buffer = cl.createBuffer(context, cl.MEM_READ_WRITE, width * (height +1));
    cl.enqueueWriteBuffer(queue, buffer, true, 0, Math.max(pixels.length, width * (height +1)), pixels);

    cl.setKernelArg(kernel, 0, 'char*', buffer);
    cl.setKernelArg(kernel, 1, 'uint', width);
    cl.setKernelArg(kernel, 2, 'uint', height);
    cl.setKernelArg(kernel, 3, 'char', 0);

    const results = [];
    for (let i = 0; i < steps; i++) {
        cl.enqueueNDRangeKernel(queue, kernel, 1, null, [width * height]);
        results.push(pixels.slice(0, pixels.length));
        cl.enqueueReadBuffer(queue, buffer, true, 0, width * height, pixels);
    }

    cl.releaseMemObject(buffer);
    return results;
}