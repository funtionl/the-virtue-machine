import { pipeline, env } from "@huggingface/transformers";

env.allowRemoteModels = true;
env.allowLocalModels = false;

export async function rewritePositive(text: string) {
  const generator = await pipeline(
    "text2text-generation",
    "Xenova/flan-t5-small",
  );

  const prompt = `If the following text is negative, toxic or sarcastic, rewrite it to be kind, respectful, and positive:\n${text}`;

  const output = await generator(prompt, {
    max_new_tokens: 100,
  });

  return output[0].toString();
}
