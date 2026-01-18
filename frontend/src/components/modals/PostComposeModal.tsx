import { useEffect, useState } from "react";
import { createPost } from "@/features/home/posts.api";
import { useWorker } from "@/providers/WorkerProvider";

type Props = {
  onClose: () => void;
  onPostCreated?: () => void;
};

const PostComposeModal = ({ onClose, onPostCreated }: Props) => {
  const [content, setContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { output, ready, translate } = useWorker();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setSelectedImage(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("Post content cannot be empty");
      return;
    }

    try {
      // Rewrite the content first
      setIsRewriting(true);
      translate(content.trim());
      // Wait for rewriting to complete
      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsRewriting(false);

      setIsSubmitting(true);
      await createPost({
        content: output || content.trim(),
        image: selectedImage,
      });
      onPostCreated?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create post. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
      setIsRewriting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          Create a New Post
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Post Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              rows={5}
              disabled={isSubmitting || isRewriting}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Image (optional)
            </label>
            {!selectedImage ? (
              <div className="rounded-lg border-2 border-dashed border-slate-300 p-6 text-center hover:border-blue-400 hover:bg-blue-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-input"
                  disabled={isSubmitting || isRewriting}
                />
                <label
                  htmlFor="image-input"
                  className="cursor-pointer space-y-2"
                >
                  <div className="text-2xl">📷</div>
                  <p className="text-sm text-slate-600">
                    Click to upload an image (max 5MB)
                  </p>
                  <p className="text-xs text-slate-500">
                    JPEG, PNG, GIF, or WebP
                  </p>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative inline-block max-w-full">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-1 text-white hover:bg-rose-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-500">{selectedImage.name}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isRewriting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isRewriting}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
            >
              {isRewriting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Rewriting...
                </>
              ) : isSubmitting ? (
                "Creating..."
              ) : (
                "Create Post"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostComposeModal;
