import fetch from 'node-fetch';
import fs from 'fs';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

// ─── Helper — call OpenRouter AI ─────────────────────────────────────────────
const callAI = async (systemPrompt, userPrompt) => {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    }),
  });

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    throw new Error('No response from AI: ' + JSON.stringify(data));
  }

  return data.choices[0].message.content;
};

// ─── Extract text from PDF file ───────────────────────────────────────────────
export const extractTextFromPDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

// ─── Resume Scoring ───────────────────────────────────────────────────────────
export const scoreResume = async ({ resumeText, jobTitle, jobDescription, requirements }) => {
  const systemPrompt = `You are an expert technical recruiter and resume evaluator.
You analyze resumes and provide structured scoring and feedback.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

  const userPrompt = `Evaluate this resume for the position of "${jobTitle}".

Job Description:
${jobDescription || 'Not provided'}

Requirements:
${requirements || 'Not provided'}

Resume Text:
${resumeText}

Return a JSON object with this exact structure:
{
  "score": <integer 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "skills": ["skill1", "skill2", ...],
  "experience": {
    "years": <number or null>,
    "level": "<junior|mid|senior|lead>",
    "highlights": ["highlight1", ...]
  },
  "strengths": ["strength1", "strength2", ...],
  "redFlags": ["flag1", ...],
  "recommendation": "<hire|maybe|reject>"
}`;

  const raw = await callAI(systemPrompt, userPrompt);
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
};

// ─── Assessment Question Generation ──────────────────────────────────────────
export const generateAssessmentQuestions = async (job) => {
  const systemPrompt = `You are a senior technical interviewer creating skill assessment tests.
Generate exactly 8 questions for a job assessment.
Mix: 5 MCQ questions and 3 short answer questions.
Questions must be directly relevant to the job requirements and test practical knowledge.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

  const userPrompt = `Create an 8-question technical assessment for this position:

Job Title: ${job.title}
Description: ${job.description || 'Not provided'}
Requirements: ${job.requirements || 'Not provided'}
Job Type: ${job.job_type || 'Full-time'}

Return a JSON array of exactly 8 question objects.
For MCQ questions use this structure:
{
  "type": "mcq",
  "question": "<the question text>",
  "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
  "correct_answer": "A",
  "explanation": "<why this is correct>",
  "difficulty": "<easy|medium|hard>",
  "topic": "<what skill/topic this tests>"
}

For short answer questions use this structure:
{
  "type": "short",
  "question": "<the question text>",
  "ideal_answer": "<what a good answer would include>",
  "key_points": ["point1", "point2", "point3"],
  "difficulty": "<easy|medium|hard>",
  "topic": "<what skill/topic this tests>"
}

Make questions progressively harder. First 3 easy, next 3 medium, last 2 hard.
Return ONLY the JSON array, nothing else.`;

  const raw = await callAI(systemPrompt, userPrompt);
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const questions = JSON.parse(cleaned);

  if (!Array.isArray(questions) || questions.length !== 8) {
    throw new Error('AI did not return exactly 8 questions');
  }

  return questions;
};

// ─── Assessment Grading ───────────────────────────────────────────────────────
export const gradeAssessment = async ({ questions, answers, jobTitle }) => {
  const systemPrompt = `You are an expert technical interviewer grading a candidate's assessment.
Grade each answer fairly and provide constructive feedback.
Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

  const qa = questions.map((q, i) => {
    const candidateAnswer = answers.find((a) => a.questionIndex === i)?.answer || 'No answer provided';
    return {
      questionIndex: i,
      type: q.type,
      question: q.question,
      options: q.options || null,
      correct_answer: q.correct_answer || null,
      ideal_answer: q.ideal_answer || null,
      key_points: q.key_points || null,
      candidate_answer: candidateAnswer,
    };
  });

  const userPrompt = `Grade this technical assessment for a "${jobTitle}" position.

Questions and Candidate Answers:
${JSON.stringify(qa, null, 2)}

Return a JSON object with this structure:
{
  "score": <integer 0-100 overall score>,
  "summary": "<3-4 sentence overall performance summary>",
  "feedback": [
    {
      "questionIndex": <0-7>,
      "correct": <true|false for MCQ, null for short answer>,
      "points_awarded": <0-10 per question>,
      "feedback": "<specific feedback on this answer>",
      "model_answer": "<brief ideal answer>"
    }
  ]
}

Scoring: MCQ = 10 if correct, 0 if wrong. Short answer = 0-10 based on key points covered.
Total score = sum of all points, normalized to 0-100.
Return ONLY the JSON object, nothing else.`;

  const raw = await callAI(systemPrompt, userPrompt);
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
};