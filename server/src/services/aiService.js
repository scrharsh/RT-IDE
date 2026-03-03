const HF_URL = "https://api-inference.huggingface.co/models/bigcode/starcoder";

export const getAiCompletion = async ({ code, language }) => {
  if (!process.env.HF_TOKEN) {
    return {
      completion: "// AI disabled: set HF_TOKEN to enable Hugging Face completions."
    };
  }

  const prompt = `Complete this ${language} code:\n${code}\n`;

  const response = await fetch(HF_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: { max_new_tokens: 60, return_full_text: false }
    })
  });

  if (!response.ok) {
    throw new Error(`Hugging Face error ${response.status}`);
  }

  const payload = await response.json();
  const completion = payload?.[0]?.generated_text ?? "// No completion generated.";
  return { completion };
};
