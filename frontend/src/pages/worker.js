import { pipeline, TextStreamer } from '@huggingface/transformers';

class MyTranslationPipeline {
  static task = 'text-generation';
  static model = 'HuggingFaceTB/SmolLM2-135M-Instruct';
  static instance = null;

  static async getInstance(progress_callback = null) {
    this.instance ??= pipeline(this.task, this.model, { progress_callback });
    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  // Retrieve the translation pipeline. When called for the first time,
  // this will load the pipeline and save it for future use.
  const translator = await MyTranslationPipeline.getInstance(x => {
      // We also add a progress callback to the pipeline so that we can
      // track model loading.
      self.postMessage(x);
  });

  console.log(event.data.text);

  const messages = [
  { role: "system", content: `You are a helpful assistant.` },
  { role: "user", content: event.data.text },
];

  // Capture partial output as it streams from the pipeline
  const streamer = new TextStreamer(translator.tokenizer, {
      skip_prompt: true,
      skip_special_tokens: true,
      callback_function: function (text) {
          self.postMessage({
              status: 'update',
              output: text
          });
      }
  });

  // Actually perform the translation
  const output = await translator(event.data.text, {
      max_new_tokens: 128,

      // Allows for partial output to be captured
      streamer,
  });

  console.log(output[0].generated_text);

  // Send the output back to the main thread
  self.postMessage({
      status: 'complete',
      output,
  });
});

