"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Mic, Square, Volume2 } from "lucide-react";
import type {
  LiveConnectConfig,
  LiveServerMessage,
  Session as LiveSession,
} from "@google/genai";
import type { snapshot, shop } from "@/server/service";
import type { VoiceIntent } from "@/domain/voice";
import { Pcm16Encoder, audioBase64, decodeAudio } from "@/lib/voice-audio";
import { deviceText, deviceLabel } from "@/domain/catalog";
export type VoiceResult = {
  intent: VoiceIntent;
  result?: Awaited<ReturnType<typeof shop>>;
  snapshot?: Awaited<ReturnType<typeof snapshot>>;
};
type Availability = {
  mode: "fixture" | "disabled" | "live";
  message: string;
  token?: string;
  model?: string;
  expiresAt?: string;
  config?: LiveConnectConfig;
};
const samples = [
  "Find a 65W USB-C charger under $40",
  "Show my orders",
  "My delivered item is damaged and I want a refund",
];
type Status =
  | "Ready"
  | "Connecting"
  | "Listening"
  | "Processing"
  | "Speaking"
  | "Stopped"
  | "Unavailable";
export function VoiceCompanion({
  pending = false,
  model,
  budget,
  actorId,
  onResult,
}: {
  pending?: boolean;
  model: string;
  budget: number;
  actorId?: string;
  onResult: (result: VoiceResult) => void;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [status, setStatus] = useState<Status>("Ready");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [sample, setSample] = useState(samples[0]);
  const resources = useRef<{
    generation: number;
    session?: LiveSession;
    stream?: MediaStream;
    capture?: AudioContext;
    output?: AudioContext;
    node?: AudioWorkletNode;
    source?: MediaStreamAudioSourceNode;
    gain?: GainNode;
    sources: Set<AudioBufferSourceNode>;
    timer?: ReturnType<typeof setTimeout>;
    abort?: AbortController;
    nextAudio: number;
    input: string;
  }>({ generation: 0, sources: new Set(), nextAudio: 0, input: "" });
  const stop = useCallback(() => {
    const current = resources.current;
    current.generation++;
    current.abort?.abort();
    current.abort = undefined;
    if (current.timer) clearTimeout(current.timer);
    current.timer = undefined;
    current.session?.close();
    current.session = undefined;
    current.stream?.getTracks().forEach((track) => track.stop());
    current.stream = undefined;
    if (current.node) {
      current.node.port.onmessage = null;
      current.node.disconnect();
      current.node = undefined;
    }
    current.source?.disconnect();
    current.source = undefined;
    current.gain?.disconnect();
    current.gain = undefined;
    current.sources.forEach((source) => {
      try {
        source.stop();
      } catch {}
      source.disconnect();
    });
    current.sources.clear();
    void current.capture?.close();
    void current.output?.close();
    current.capture = undefined;
    current.output = undefined;
    current.nextAudio = 0;
    current.input = "";
  }, []);
  useEffect(() => () => stop(), [stop, path, actorId]);
  useEffect(() => {
    if (!open || !actorId) return;
    const controller = new AbortController();
    void fetch("/api/voice/session", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setAvailability(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error ? error.message : "Voice unavailable",
          );
          setStatus("Unavailable");
        }
      });
    return () => controller.abort();
  }, [open, actorId]);
  async function prepare(
    text: string,
    generation = resources.current.generation,
  ) {
    setStatus("Processing");
    setError("");
    const controller = new AbortController();
    resources.current.abort = controller;
    const response = await fetch("/api/voice/intent", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: text, model, budget }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    if (resources.current.generation !== generation) return null;
    const data = result as VoiceResult;
    onResult(data);
    setReply(
      data.intent.kind === "shopping"
        ? deviceText(data.result!.analysis.summary)
        : data.intent.kind === "clarification" ||
            data.intent.kind === "review_required"
          ? data.intent.message
          : data.intent.kind === "support_draft"
            ? "Your support draft is ready. Choose the order and review the request on screen."
            : data.intent.kind === "navigate"
              ? "Opening your own " + data.intent.destination + "."
              : "Please clarify your request.",
    );
    setStatus(resources.current.session ? "Listening" : "Ready");
    return data;
  }
  async function preview() {
    stop();
    const generation = resources.current.generation;
    setTranscript(sample);
    setStatus("Listening");
    setError("");
    resources.current.timer = setTimeout(() => {
      void prepare(sample, generation).catch((error) => {
        if (resources.current.generation === generation) {
          setError(
            error instanceof Error ? error.message : "Please try again.",
          );
          setStatus("Unavailable");
        }
      });
    }, 350);
  }
  async function startLive() {
    stop();
    const current = resources.current;
    const generation = current.generation;
    setError("");
    setTranscript("");
    setReply("");
    setStatus("Connecting");
    const active = () => resources.current.generation === generation;
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "Microphone access needs HTTPS or localhost in a supported browser.",
        );
      const controller = new AbortController();
      current.abort = controller;
      const response = await fetch("/api/voice/session", {
        method: "POST",
        signal: controller.signal,
      });
      const data = (await response.json()) as Availability & { error?: string };
      if (!response.ok) throw new Error(data.error);
      if (!active()) return;
      if (data.mode !== "live" || !data.token || !data.model)
        throw new Error(data.message);
      const tokenExpiry = Date.parse(data.expiresAt || "");
      if (!Number.isFinite(tokenExpiry) || tokenExpiry <= Date.now())
        throw new Error(
          "Voice token expired. Start again; typed shopping remains available.",
        );
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
        video: false,
      });
      if (!active()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      current.stream = stream;
      const capture = new AudioContext({ sampleRate: 16000 });
      current.capture = capture;
      const output = new AudioContext({ sampleRate: 24000 });
      current.output = output;
      await capture.resume();
      await output.resume();
      await capture.audioWorklet.addModule("/voice-capture.js");
      if (!active()) return;
      const { GoogleGenAI } = await import("@google/genai");
      if (!active()) return;
      const client = new GoogleGenAI({
        apiKey: data.token,
        httpOptions: { apiVersion: "v1beta" },
      });
      function clearPlayback() {
        current.sources.forEach((source) => {
          try {
            source.stop();
          } catch {}
          source.disconnect();
        });
        current.sources.clear();
        current.nextAudio = 0;
      }
      async function receive(message: LiveServerMessage) {
        if (!active()) return;
        const content = message.serverContent;
        if (content?.interrupted) {
          clearPlayback();
          setStatus("Listening");
        }
        if (content?.inputTranscription?.text) {
          current.input = (
            current.input + content.inputTranscription.text
          ).slice(-2000);
          setTranscript(current.input);
        }
        if (content?.outputTranscription?.text)
          setReply((value) =>
            (value + content.outputTranscription!.text).slice(-3000),
          );
        for (const part of content?.modelTurn?.parts || []) {
          if (
            !part.inlineData?.data ||
            !part.inlineData.mimeType?.startsWith("audio/pcm")
          )
            continue;
          const samples = decodeAudio(part.inlineData.data);
          const buffer = output.createBuffer(1, samples.length, 24000);
          buffer.copyToChannel(Float32Array.from(samples), 0);
          const source = output.createBufferSource();
          source.buffer = buffer;
          source.connect(output.destination);
          current.sources.add(source);
          source.onended = () => {
            current.sources.delete(source);
            source.disconnect();
            if (active() && !current.sources.size) setStatus("Listening");
          };
          source.start(Math.max(output.currentTime, current.nextAudio));
          current.nextAudio =
            Math.max(output.currentTime, current.nextAudio) + buffer.duration;
          setStatus("Speaking");
        }
        for (const call of message.toolCall?.functionCalls || []) {
          if (!active()) return;
          if (call.name !== "prepare_request") {
            current.session?.sendToolResponse({
              functionResponses: [
                {
                  id: call.id,
                  name: call.name,
                  response: {
                    error:
                      "Action unavailable. Financial approvals require the protected screen.",
                  },
                },
              ],
            });
            continue;
          }
          const request = current.input || String(call.args?.request || "");
          try {
            const result = await prepare(request, generation);
            if (active())
              current.session?.sendToolResponse({
                functionResponses: [
                  {
                    id: call.id,
                    name: call.name,
                    response: result
                      ? {
                          intent: result.intent,
                          deviceProfile:
                            result.intent.kind === "shopping"
                              ? deviceLabel(result.intent.brief.model)
                              : undefined,
                          products: result.result?.products.map((product) => ({
                            name: product.name,
                            price: product.price,
                            currency: "USD",
                            specs: product.specs,
                            source: product.source,
                          })),
                          questions: result.result?.questions,
                        }
                      : { error: "Stopped" },
                  },
                ],
              });
          } catch {
            if (active())
              current.session?.sendToolResponse({
                functionResponses: [
                  {
                    id: call.id,
                    name: call.name,
                    response: {
                      error:
                        "The request could not be prepared. Use the typed shopping brief.",
                    },
                  },
                ],
              });
          }
        }
        if (content?.turnComplete) current.input = "";
      }
      const session = await client.live.connect({
        model: data.model,
        config: data.config,
        callbacks: {
          onopen: () => {
            if (active()) setStatus("Listening");
          },
          onmessage: (message) => {
            void receive(message).catch(() => {
              if (active()) {
                stop();
                setStatus("Unavailable");
                setError(
                  "Audio processing stopped. Typed shopping remains available.",
                );
              }
            });
          },
          onerror: () => {
            if (active()) {
              stop();
              setStatus("Unavailable");
              setError(
                "Voice disconnected or quota was reached. Typed shopping remains available.",
              );
            }
          },
          onclose: (event) => {
            if (active()) {
              stop();
              setStatus(event.code === 1000 ? "Stopped" : "Unavailable");
              if (event.code !== 1000)
                setError(
                  "Voice disconnected or quota was reached. Start again when available; typed shopping remains available.",
                );
            }
          },
        },
      });
      if (!active()) {
        session.close();
        return;
      }
      current.session = session;
      const encoder = new Pcm16Encoder(capture.sampleRate);
      const source = capture.createMediaStreamSource(stream);
      current.source = source;
      const node = new AudioWorkletNode(capture, "dale-voice-capture");
      current.node = node;
      const gain = capture.createGain();
      gain.gain.value = 0;
      current.gain = gain;
      source.connect(node);
      node.connect(gain);
      gain.connect(capture.destination);
      node.port.onmessage = (event) => {
        if (!active()) return;
        const bytes = encoder.encode(event.data as Float32Array);
        if (bytes.length)
          session.sendRealtimeInput({
            audio: {
              data: audioBase64(bytes),
              mimeType: "audio/pcm;rate=16000",
            },
          });
      };
      current.timer = setTimeout(
        () => {
          if (active()) {
            stop();
            setStatus("Stopped");
            setError(
              "The two-minute voice session ended. Start again if needed.",
            );
          }
        },
        Math.max(0, Math.min(120000, Date.parse(data.expiresAt!) - Date.now())),
      );
    } catch (error) {
      if (active()) {
        stop();
        setStatus("Unavailable");
        setError(
          error instanceof Error ? error.message : "Voice could not start.",
        );
      }
    }
  }
  return (
    <section className="voice-companion" aria-label="DALE voice companion">
      <button
        className="button secondary"
        aria-expanded={open}
        disabled={pending}
        aria-controls="voice-panel"
        onClick={() => {
          if (open) {
            stop();
            setStatus("Stopped");
          }
          setOpen(!open);
        }}
      >
        <Mic size={16} /> Talk to DALE
      </button>
      <span>Describe a need. Keep the final say.</span>
      {availability?.mode === "live" &&
        ["Connecting", "Listening", "Processing", "Speaking"].includes(
          status,
        ) && (
          <div
            className="voice-session-dock"
            aria-label="Active microphone controls"
          >
            <span>
              <Mic size={15} /> DALE · {status}
            </span>
            <button
              className="button secondary small"
              onClick={() => {
                stop();
                setStatus("Stopped");
              }}
            >
              <Square size={13} /> Stop microphone
            </button>
          </div>
        )}
      {open && (
        <div className="voice-panel" id="voice-panel">
          <div className="voice-heading">
            <strong>DALE / Voice companion</strong>
            <span role="status">{status}</span>
          </div>
          {!actorId ? (
            <p>
              Start a shopper session or{" "}
              <a href="/demo">open the guided demo</a> to try voice workflows.
            </p>
          ) : (
            <>
              <p>{availability?.message || "Checking voice availability…"}</p>
              {availability?.mode === "fixture" && (
                <>
                  <label>
                    Sample voice scenario
                    <select
                      value={sample}
                      onChange={(event) => setSample(event.target.value)}
                    >
                      {samples.map((sample) => (
                        <option key={sample}>{sample}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="button primary"
                    onClick={() => void preview()}
                  >
                    <Volume2 size={16} /> Play synthetic request
                  </button>
                  <p className="muted">
                    This exercises transcript-to-shopping behavior. It does not
                    recognize microphone speech.
                  </p>
                </>
              )}
              {availability?.mode === "live" && (
                <button
                  className="button primary"
                  onClick={() => void startLive()}
                >
                  <Mic size={16} /> Start microphone conversation
                </button>
              )}
              {availability?.mode === "disabled" && (
                <a href="/demo">Try the provider-free voice demo ↗</a>
              )}
              <label>
                Transcript — editable before preparing a request
                <textarea
                  value={transcript}
                  maxLength={2000}
                  onChange={(event) => setTranscript(event.target.value)}
                  rows={3}
                />
              </label>
              <div className="voice-actions">
                <button
                  className="button secondary"
                  disabled={!transcript.trim()}
                  onClick={() => {
                    stop();
                    void prepare(transcript).catch((error) => {
                      setError(
                        error instanceof Error
                          ? error.message
                          : "Please try again.",
                      );
                      setStatus("Unavailable");
                    });
                  }}
                >
                  Use this request
                </button>
                <button
                  className="button secondary"
                  onClick={() => {
                    stop();
                    setStatus("Stopped");
                  }}
                >
                  <Square size={14} /> Stop voice
                </button>
              </div>
              {reply && (
                <p className="voice-reply" aria-live="polite">
                  {reply}
                </p>
              )}
              <p className="muted">
                Voice can search, draft a support request and open your orders.
                It cannot approve a payment, refund or replacement.
              </p>
            </>
          )}
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </section>
  );
}
