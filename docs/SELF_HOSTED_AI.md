# Self-hosted inference migration

Requested 8 October 2026. Replace Gemini generation with locally served open weights, without provider quotas or billing. This is a new runtime migration, not a credential substitution. Downloading a model does not establish product acceptance.

## Research and actual constraints

The owner reports resizing the existing EC2 instance from t3.micro (1 GiB) to t3.medium (2 vCPU, 4 GiB). Its actual OS-visible memory and joint workload remain unverified until the current address/access is supplied. Its app and worker have memory ceilings of 380 MB and 240 MB, plus PostgreSQL, Caddy and the OS. The available Windows laptop was measured: Ryzen 7 5800HS, 8 cores/16 threads, 16.54 GB physical RAM, RTX 3050 Laptop 4 GB VRAM. Selection probes deliberately use CPU only and two threads. Laptop latency/RAM is not an EC2 benchmark.

| Candidate | Sources and license | Selection evidence |
| --- | --- | --- |
| SmolVLM-256M Instruct Q8 | [Model author](https://huggingface.co/HuggingFaceTB/SmolVLM-256M-Instruct), [llama.cpp conversion](https://huggingface.co/ggml-org/SmolVLM-256M-Instruct-GGUF), Apache-2.0 | 278.8 MB weights/projector; observed idle resident memory 385.9 MB. Failed compound planning, comparison and readable-label extraction; not selected. |
| Qwen3.5-0.8B Q4_K_M | [Model author](https://huggingface.co/Qwen/Qwen3.5-0.8B), [quantization publisher](https://huggingface.co/unsloth/Qwen3.5-0.8B-GGUF), Apache-2.0 | 737.5 MB weights/projector; observed idle resident memory 1,090.9 MB, rising to 1,418.9 MB after probes. Added unrequested tools, failed grounded comparison, missed a clear label. Not selected. |
| Qwen3.5-2B Q4_K_M | [Model author](https://huggingface.co/Qwen/Qwen3.5-2B), [quantization publisher](https://huggingface.co/unsloth/Qwen3.5-2B-GGUF), Apache-2.0 | 1,949.1 MB weights/projector. Observed idle resident 2,647.1 MB, approximately 2,790 MB after probes. Failed composed planning and blurred-label behavior, including after author sampling settings, explicit schema guidance and a compact intent interface. Not selected. |
| Qwen3-VL-2B Instruct Q8 | [Model author](https://huggingface.co/Qwen/Qwen3-VL-2B-Instruct), [runtime publisher conversion](https://huggingface.co/ggml-org/Qwen3-VL-2B-Instruct-GGUF), Apache-2.0 | 2,279.5 MB weights/projector; observed resident 3,133.8 MB after probes. Failed device/cable planning and blurred-label handling; comparison also emitted an unsupported fast-charging reason. Not selected. |
| Gemma 4 E2B | [Model author](https://huggingface.co/google/gemma-4-E2B), [llama.cpp conversion](https://huggingface.co/ggml-org/gemma-4-E2B-it-GGUF), Apache-2.0 | Q4_0 weights alone 2,841.5 MB plus vision projector. Excluded on the former 1 GiB host. Now needs a fresh 4 GiB joint-memory assessment; not locally benchmarked or selected. |

Runtime: [llama.cpp](https://github.com/ggml-org/llama.cpp), pinned CPU release b11429. Model revisions and SHA-256 digests are in `deploy/model-candidates.json`. No inference-provider account or API key is required for self-hosting. Existing compute still consumes CPU/memory; self-hosting does not increase the EC2 instance's capacity.

## Milestones

1. Research current primary model/runtime sources, measure available hardware, reject candidates that fail useful tasks. Four candidates measured/tested. Research remains subject to the actual quality gate; no candidate is qualified.
2. Implement private text/vision inference, schema-constrained JSON, existing server validation, local runtime authentication and explicit no-cloud-fallback behavior. Adapter and configuration contracts pass.
3. Select only after composed shopper conversations, continuation, safety, source grounding, vision labels and the preregistered model evaluation pass. Measure warm/cold latency, peak memory and concurrent app behavior. No small development probe closes this milestone.
4. Replace Gemini speech transport with separately tested local speech recognition/playback. Existing synthetic voice tests remain; Gemini microphone transport is disabled when self-hosted inference is selected. Local speech is now implemented with pinned Whisper tiny multilingual CPU inference, 15-second canonical WAV validation, one active job, actor/global budgets, temporary audio cleanup, editable transcripts and installed-local-voice playback. Two frozen synthesized requests passed actual recognition; browser microphone review/cancel/failure transport passed with a mocked recognizer. Human microphone and EC2 acceptance remain separate.
5. Package the selected runtime/model, install on an authorized host with sufficient memory, verify private binding/authentication, app/worker/database coexistence, restart and full hosted journeys. The owner resized EC2. Its former address now times out on SSH and HTTPS. Current address/access, selected-model service packaging and actual joint/restart checks remain open. No additional infrastructure or AI billing is authorized.

## Candidate installation

```powershell
node scripts/setup-local-model.mjs --candidate qwen2
```

This checks host architecture/memory, downloads the pinned CPU runtime and model files into ignored `.data/self-hosted`, resumes interrupted downloads with bounded retries and verifies full-file SHA-256 before use. It does not enable inference or update `.env`. A mismatch in an existing completed artifact is preserved for inspection. Linux x64 is supported with the pinned Ubuntu CPU runtime; final target compatibility must be verified before deployment.

The adapter uses `AI_PROVIDER=self_hosted`, `AI_MODEL` equal to the served alias and `AI_SELF_HOSTED_BASE_URL=http://127.0.0.1:8081/v1`. `AI_SELF_HOSTED_API_KEY` is private runtime authentication, not a cloud token. Non-loopback endpoints are rejected. It never sends `AI_API_KEY`, retries an expensive timed-out local job, or falls back to Gemini. Truncated, malformed, ungrounded and unauthorized model output remains rejected by the existing contracts. `/live` describes the selected provider; readiness is configuration readiness, not a successful inference health probe.

## Payment currency

The current [PayPal REST currency list](https://developer.paypal.com/api/codes/currency/) does not include INR. [PayPal India](https://www.paypal.com/in/cshelp/article/can-i-use-paypal-to-receive-payments-from-indian-customers-help1049) does not support receiving domestic payments. Do not label existing USD quotes as INR or silently convert them. Sandbox acceptance needs an actually supported settlement currency and an account that accepts it. Existing USD checkout returned `UNSUPPORTED_PAYEE_CURRENCY` after successful buyer login.

## Reproduce bounded selection and speech checks

`npm run model:setup -- --candidate qwen2` prepares artifacts; `npm run model:start` serves the prepared candidate on authenticated loopback only. For PowerShell argument forwarding, the direct equivalent is `node scripts/setup-local-model.mjs --candidate qwen2`. This is a terminal-owned development process, not a production daemon. Run `npx tsx scripts/verify-local-model.ts --prepared` to execute a bounded development gate. It stops on the first failure, overwrites the report and marks later checks not_run. It never searches for a favorable held-out seed or qualifies a model from installation alone. The latest Qwen3.5-2B attempt failed the first composed planning check.

The adapter now includes the output schema in the model prompt as well as response_format: [llama.cpp documentation](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md) explains that grammar constraints alone do not reveal the schema to the model. The compact intent interface converts USD to cents on the server and resolves copied device names through reviewed records, preserving normal workflow validation and confirmation. Publisher sampling profiles and a lower-temperature structured extraction profile were development-tested; none establishes an accepted model. Source facts already proving no eligible offer do not trigger a pointless comparison call.

Run `npm run voice:setup`, then `npx tsx scripts/verify-local-speech.ts --prepared`. The pinned [whisper.cpp](https://github.com/ggml-org/whisper.cpp) CPU release b5454 and Whisper tiny artifact checksums are in deploy/speech-runtime.json. This downloads public artifacts without API accounts. The author lists tiny memory near 273 MB; actual target peak memory remains required. `npm run verify:voice:http` starts/stops an isolated packaged app, checks authentication/origin and actual CPU recognition, and confirms recognition alone makes no agent/order/case mutation. Its raw recordings are owned synthetic fixtures, not human speech evidence.

Production local voice needs explicit VOICE_MODE=local plus absolute LOCAL_SPEECH_EXECUTABLE and LOCAL_SPEECH_MODEL paths. Do not copy Windows paths into Linux configuration. Guided fixtures remain recognizer-free. Existing Google credentials are retained privately but no cloud generation is enabled; AI_PROVIDER=self_hosted, AI_MODE=fixture, AGENT_MODEL_ENABLED=false and AI_MODEL is empty until selection passes. No further API key is needed to finish the engineering.
