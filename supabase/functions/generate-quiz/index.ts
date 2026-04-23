import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

type TranscriptChunk = {
  chunk_index: number;
  content: string;
  start_seconds: number | null;
  end_seconds: number | null;
};

type RetrievedChunk = {
  chunk_index: number;
  content: string;
  start_seconds: number | null;
  end_seconds: number | null;
  similarity?: number;
};

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });

const normalizeQuestions = (input: unknown): QuizQuestion[] => {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      const question = String((item as { question?: unknown })?.question || "").trim();
      const optionsRaw = (item as { options?: unknown })?.options;
      const correctIndexRaw = (item as { correctIndex?: unknown })?.correctIndex;

      const options = Array.isArray(optionsRaw)
        ? optionsRaw.map((option) => String(option || "").trim()).filter(Boolean)
        : [];

      const normalizedOptions = options.slice(0, 4);
      while (normalizedOptions.length < 4) {
        normalizedOptions.push("Option missing");
      }

      const correctIndex = Number.isInteger(correctIndexRaw) ? Number(correctIndexRaw) : 0;
      const safeCorrectIndex = correctIndex >= 0 && correctIndex < 4 ? correctIndex : 0;

      if (!question) return null;

      return {
        question,
        options: normalizedOptions,
        correctIndex: safeCorrectIndex,
      };
    })
    .filter((row): row is QuizQuestion => Boolean(row));
};

const clampQuestionCount = (value: unknown) => Math.min(Math.max(Number(value) || 5, 1), 10);

const formatVectorLiteral = (embedding: number[]) => `[${embedding.join(",")}]`;

const chunkTranscript = (segments: TranscriptSegment[], maxChars = 1400): TranscriptChunk[] => {
  const chunks: TranscriptChunk[] = [];
  let currentTexts: string[] = [];
  let currentStart: number | null = null;
  let currentEnd: number | null = null;

  const flush = () => {
    const joined = currentTexts.join(" ").replace(/\s+/g, " ").trim();
    if (!joined) return;
    chunks.push({
      chunk_index: chunks.length,
      content: joined,
      start_seconds: currentStart,
      end_seconds: currentEnd,
    });
    currentTexts = [];
    currentStart = null;
    currentEnd = null;
  };

  for (const segment of segments) {
    const text = String(segment.text || "").trim();
    if (!text) continue;

    if (currentStart === null) currentStart = Number(segment.start || 0);
    currentEnd = Number(segment.end || segment.start || 0);

    currentTexts.push(text);
    const currentLength = currentTexts.join(" ").length;
    if (currentLength >= maxChars) flush();
  }

  flush();
  return chunks;
};

const parseTranscriptionSegments = (payload: unknown): TranscriptSegment[] => {
  const rawSegments = (payload as { segments?: unknown })?.segments;
  if (!Array.isArray(rawSegments)) return [];

  return rawSegments
    .map((segment) => {
      const start = Number((segment as { start?: unknown })?.start);
      const end = Number((segment as { end?: unknown })?.end);
      const text = String((segment as { text?: unknown })?.text || "").trim();
      if (!text || !Number.isFinite(start) || !Number.isFinite(end)) return null;
      return { start, end, text };
    })
    .filter((row): row is TranscriptSegment => Boolean(row));
};

const generateQuizFromContext = async ({
  apiKey,
  model,
  questionCount,
  topic,
  part,
  subject,
  classLevel,
  contextChunks,
}: {
  apiKey: string;
  model: string;
  questionCount: number;
  topic: string;
  part: string;
  subject: string;
  classLevel: string;
  contextChunks: RetrievedChunk[];
}) => {
  const systemPrompt =
    "You create high-quality multiple-choice quizzes for secondary school students. Use ONLY provided context. Return strict JSON only.";

  const context = contextChunks
    .sort((a, b) => (a.chunk_index || 0) - (b.chunk_index || 0))
    .map((chunk) => {
      const start = chunk.start_seconds ?? 0;
      const end = chunk.end_seconds ?? start;
      return `[${start.toFixed(2)}s-${end.toFixed(2)}s] ${chunk.content}`;
    })
    .join("\n");

  const userPrompt = [
    `Generate ${questionCount} multiple-choice questions for this lesson video.`,
    `Topic: ${topic}`,
    `Lesson part/title: ${part}`,
    subject ? `Subject: ${subject}` : null,
    classLevel ? `Class level: ${classLevel}` : null,
    "Rules:",
    "- Use only facts from the context transcript.",
    "- 4 options per question.",
    "- Exactly one correct answer.",
    "- Keep wording clear and student-friendly.",
    "Return JSON in this exact format:",
    '{"questions":[{"question":"...","options":["...","...","...","..."],"correctIndex":0}]}',
    "Transcript context:",
    context,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const failureText = await response.text();
    throw new Error(`AI provider request failed: ${failureText.slice(0, 500)}`);
  }

  const completion = await response.json();
  const content = completion?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("AI response did not include content");
  }

  let parsed: { questions?: unknown };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI response was not valid JSON");
  }

  const questions = normalizeQuestions(parsed.questions);
  if (!questions.length) {
    throw new Error("AI did not return valid questions");
  }

  return questions;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const body = await req.json();

    const topic = String(body?.topic || "").trim();
    const part = String(body?.part || "").trim();
    const subject = String(body?.subject || "").trim();
    const classLevel = String(body?.classLevel || "").trim();
    const videoPartId = String(body?.videoPartId || "").trim();
    const questionCount = clampQuestionCount(body?.questionCount);

    if (!topic) {
      return json(400, { error: "Topic is required" });
    }

    if (!part) {
      return json(400, { error: "Part is required" });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return json(500, {
        error: "Missing OPENAI_API_KEY in Supabase Edge Function secrets",
      });
    }

    const quizModel = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
    const transcriptionModel = Deno.env.get("OPENAI_TRANSCRIPTION_MODEL") || "whisper-1";
    const embeddingModel = Deno.env.get("OPENAI_EMBEDDING_MODEL") || "text-embedding-3-small";

    if (!videoPartId) {
      const questions = await generateQuizFromContext({
        apiKey,
        model: quizModel,
        questionCount,
        topic,
        part,
        subject,
        classLevel,
        contextChunks: [
          {
            chunk_index: 0,
            content: `Topic: ${topic}. Lesson: ${part}. Subject: ${subject}. Class: ${classLevel}.`,
            start_seconds: 0,
            end_seconds: 0,
          },
        ],
      });
      return json(200, { questions, source: "metadata-only" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json(500, {
        error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Edge Function secrets",
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from("video_parts")
      .select("id, title, storage_path, transcript_status")
      .eq("id", videoPartId)
      .single();

    if (lessonError || !lesson?.storage_path) {
      return json(404, { error: "Video lesson not found or missing storage_path" });
    }

    let chunksForRetrieval: RetrievedChunk[] = [];
    const { count: existingCount } = await supabaseAdmin
      .from("video_transcript_chunks")
      .select("id", { count: "exact", head: true })
      .eq("video_part_id", videoPartId);

    if (!existingCount || existingCount === 0) {
      await supabaseAdmin
        .from("video_parts")
        .update({
          transcript_status: "processing",
          transcript_error: null,
          transcript_updated_at: new Date().toISOString(),
        })
        .eq("id", videoPartId);

      const { data: signedData, error: signedError } = await supabaseAdmin.storage
        .from("videos")
        .createSignedUrl(String(lesson.storage_path), 600);

      if (signedError || !signedData?.signedUrl) {
        await supabaseAdmin
          .from("video_parts")
          .update({
            transcript_status: "failed",
            transcript_error: signedError?.message || "Could not create signed URL",
            transcript_updated_at: new Date().toISOString(),
          })
          .eq("id", videoPartId);
        return json(502, { error: "Failed to access lesson video from storage" });
      }

      const videoResponse = await fetch(signedData.signedUrl);
      if (!videoResponse.ok) {
        await supabaseAdmin
          .from("video_parts")
          .update({
            transcript_status: "failed",
            transcript_error: `Failed to fetch video file (${videoResponse.status})`,
            transcript_updated_at: new Date().toISOString(),
          })
          .eq("id", videoPartId);
        return json(502, { error: "Failed to download video for transcription" });
      }

      const videoBuffer = await videoResponse.arrayBuffer();
      const transcriptionForm = new FormData();
      transcriptionForm.append("model", transcriptionModel);
      transcriptionForm.append("response_format", "verbose_json");
      transcriptionForm.append("timestamp_granularities[]", "segment");
      transcriptionForm.append("file", new Blob([videoBuffer]), "lesson-video.mp4");

      const transcriptionResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: transcriptionForm,
      });

      if (!transcriptionResponse.ok) {
        const details = await transcriptionResponse.text();
        await supabaseAdmin
          .from("video_parts")
          .update({
            transcript_status: "failed",
            transcript_error: `Transcription failed: ${details.slice(0, 300)}`,
            transcript_updated_at: new Date().toISOString(),
          })
          .eq("id", videoPartId);
        return json(502, {
          error: "Video transcription request failed",
          details: details.slice(0, 500),
        });
      }

      const transcriptionPayload = await transcriptionResponse.json();
      const segments = parseTranscriptionSegments(transcriptionPayload);
      if (!segments.length) {
        await supabaseAdmin
          .from("video_parts")
          .update({
            transcript_status: "failed",
            transcript_error: "No transcription segments returned",
            transcript_updated_at: new Date().toISOString(),
          })
          .eq("id", videoPartId);
        return json(502, { error: "No transcript segments returned from transcription API" });
      }

      const transcriptChunks = chunkTranscript(segments);
      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: embeddingModel,
          input: transcriptChunks.map((chunk) => chunk.content),
        }),
      });

      if (!embeddingResponse.ok) {
        const details = await embeddingResponse.text();
        await supabaseAdmin
          .from("video_parts")
          .update({
            transcript_status: "failed",
            transcript_error: `Embedding failed: ${details.slice(0, 300)}`,
            transcript_updated_at: new Date().toISOString(),
          })
          .eq("id", videoPartId);
        return json(502, {
          error: "Embedding request failed",
          details: details.slice(0, 500),
        });
      }

      const embeddingPayload = await embeddingResponse.json();
      const embeddings = Array.isArray(embeddingPayload?.data)
        ? embeddingPayload.data.map((row: { embedding?: unknown }) => row.embedding)
        : [];

      if (embeddings.length !== transcriptChunks.length) {
        await supabaseAdmin
          .from("video_parts")
          .update({
            transcript_status: "failed",
            transcript_error: "Embedding count mismatch",
            transcript_updated_at: new Date().toISOString(),
          })
          .eq("id", videoPartId);
        return json(502, { error: "Embedding payload did not match transcript chunks" });
      }

      const upsertRows = transcriptChunks.map((chunk, index) => ({
        video_part_id: videoPartId,
        chunk_index: chunk.chunk_index,
        content: chunk.content,
        start_seconds: chunk.start_seconds,
        end_seconds: chunk.end_seconds,
        embedding: formatVectorLiteral(embeddings[index] as number[]),
      }));

      const { error: upsertError } = await supabaseAdmin
        .from("video_transcript_chunks")
        .upsert(upsertRows, { onConflict: "video_part_id,chunk_index" });

      if (upsertError) {
        await supabaseAdmin
          .from("video_parts")
          .update({
            transcript_status: "failed",
            transcript_error: upsertError.message,
            transcript_updated_at: new Date().toISOString(),
          })
          .eq("id", videoPartId);
        return json(502, { error: "Failed to persist transcript chunks" });
      }

      await supabaseAdmin
        .from("video_parts")
        .update({
          transcript_status: "ready",
          transcript_error: null,
          transcript_updated_at: new Date().toISOString(),
        })
        .eq("id", videoPartId);
    }

    const retrievalQuery = [topic, part, subject, classLevel].filter(Boolean).join(" | ");
    const retrievalEmbeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: embeddingModel,
        input: retrievalQuery,
      }),
    });

    if (!retrievalEmbeddingResponse.ok) {
      const details = await retrievalEmbeddingResponse.text();
      return json(502, {
        error: "Failed to create retrieval embedding",
        details: details.slice(0, 500),
      });
    }

    const retrievalEmbeddingPayload = await retrievalEmbeddingResponse.json();
    const queryEmbedding = retrievalEmbeddingPayload?.data?.[0]?.embedding;
    if (!Array.isArray(queryEmbedding)) {
      return json(502, { error: "Missing retrieval embedding vector" });
    }

    const { data: matchedChunks, error: matchError } = await supabaseAdmin.rpc(
      "match_video_transcript_chunks",
      {
        p_video_part_id: videoPartId,
        p_query_embedding: formatVectorLiteral(queryEmbedding),
        p_match_count: Math.max(8, questionCount * 2),
      },
    );

    if (matchError) {
      return json(502, { error: "Failed to retrieve transcript context", details: matchError.message });
    }

    chunksForRetrieval = Array.isArray(matchedChunks) ? (matchedChunks as RetrievedChunk[]) : [];
    if (!chunksForRetrieval.length) {
      const { data: fallbackChunks } = await supabaseAdmin
        .from("video_transcript_chunks")
        .select("chunk_index, content, start_seconds, end_seconds")
        .eq("video_part_id", videoPartId)
        .order("chunk_index", { ascending: true })
        .limit(12);
      chunksForRetrieval = (fallbackChunks || []) as RetrievedChunk[];
    }

    if (!chunksForRetrieval.length) {
      return json(502, { error: "No transcript chunks available for this lesson" });
    }

    const questions = await generateQuizFromContext({
      apiKey,
      model: quizModel,
      questionCount,
      topic,
      part,
      subject,
      classLevel,
      contextChunks: chunksForRetrieval,
    });

    return json(200, {
      questions,
      source: "video-rag",
      usedChunks: chunksForRetrieval.length,
    });
  } catch (error) {
    return json(500, {
      error: "Unexpected server error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
