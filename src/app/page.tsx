"use client";

const SHORT_VIDEO_URLS = [
  "https://youtube.com/shorts/XRAzf8zLnLI",
];

const LONG_VIDEO_URL =
  "https://www.youtube.com/watch?v=1cMwKCGK4mk";

function toEmbedUrl(url: string) {
  if (!url) return "";

  const shorts = url.match(/youtube\.com\/shorts\/([^?&/]+)/);
  if (shorts?.[1]) {
    return `https://www.youtube.com/embed/${shorts[1]}`;
  }

  const watch = url.match(/[?&]v=([^&]+)/);
  if (watch?.[1]) {
    return `https://www.youtube.com/embed/${watch[1]}`;
  }

  const short = url.match(/youtu\.be\/([^?&/]+)/);
  if (short?.[1]) {
    return `https://www.youtube.com/embed/${short[1]}`;
  }

  return url;
}

export default function Page() {
  const shorts = SHORT_VIDEO_URLS.map(toEmbedUrl);
  const longVideo = toEmbedUrl(LONG_VIDEO_URL);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-emerald-50 to-green-100">
      <div className="mx-auto max-w-md px-4 py-6">

        <div className="mb-6 rounded-3xl border border-emerald-200 bg-white p-5 shadow">
          <p className="text-xs font-bold tracking-[0.3em] text-emerald-600">
            FUTSAL HIGHLIGHT
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            当日のハイライト
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            ショート動画をスワイプして閲覧できます
          </p>
        </div>

        <section className="mb-6">
          <h2 className="mb-3 text-xl font-black text-emerald-700">
            Shorts
          </h2>

          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
            {shorts.map((url, index) => (
              <div
                key={index}
                className="w-full shrink-0 snap-center"
              >
                <div className="overflow-hidden rounded-3xl bg-black shadow-lg">
                  <div className="aspect-[9/16]">
                    <iframe
                      className="h-full w-full"
                      src={url}
                      title={`short-${index}`}
                      allowFullScreen
                    />
                  </div>
                </div>

                <p className="mt-2 text-center text-sm font-bold text-emerald-700">
                  {index + 1} / {shorts.length}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-lg">
          <h2 className="mb-3 text-xl font-black text-emerald-700">
            ロングバージョン
          </h2>

          <div className="overflow-hidden rounded-3xl bg-black">
            <div className="aspect-video">
              <iframe
                className="h-full w-full"
                src={longVideo}
                title="long-video"
                allowFullScreen
              />
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}