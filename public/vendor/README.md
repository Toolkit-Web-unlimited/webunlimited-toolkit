# ONNX Runtime Web Setup

## ort.min.js Installation

To complete the ONNX Runtime Web setup:

1. **Install onnxruntime-web**:
   ```bash
   npm install onnxruntime-web
   ```

2. **Copy ort.min.js**:
   ```bash
   cp node_modules/onnxruntime-web/dist/ort.min.js public/vendor/ort.min.js
   ```

3. **Verify the file**:
   - The file should be ~2MB in size
   - It should contain the full ONNX Runtime Web library
   - It will be loaded via `importScripts('/vendor/ort.min.js')` in the WebWorker

## Model Files

Place your ONNX model files in `/public/models/`:
- Example: `saliency.onnx` for saliency prediction
- The Worker will load them via `ort.InferenceSession.create('/models/saliency.onnx')`

## Build Process

- The `ort.min.js` file is served statically from `/public/vendor/`
- No bundling issues with Next.js
- Classic WebWorker approach ensures compatibility
- Vercel deployment ready
