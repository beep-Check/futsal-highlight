"use client";

const SHORT_VIDEO_URLS = [
  "https://youtube.com/shorts/POkxVu6Hyek",
  "https://youtube.com/shorts/U4u3g0rHwcA",
  "https://youtube.com/shorts/frFAboPR-Bo",
  "https://youtube.com/shorts/zRNHe5bCPNo",
];

// ここにロングバージョンのYouTube URLを入れる
// 例：https://www.youtube.com/watch?v=xxxxxxxxxxx
const LONG_VIDEO_URL = "https://www.youtube.com/watch?v=1cMwKCGK4mk";

function toYouTubeEmbedUrl(url: string) {
  if (!url) return "";

  if (url.includes("youtube.com/embed/")) return url;

  const shorts = url.match(/youtube\.com\/shorts\/([^?&/]+)/);
  if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;

  const short = url.match(/youtu\.be\/([^?&/]+)/);
  if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`;

  const watch = url.match(/[?&]v=([^&]+)/);
  if (watch?.[1]) return `https://www.youtube.com/embed/${watch[1]}`;

  return "";
}

export default function Page() {
  const shortEmbedUrls = SHORT_VIDEO_URLS.map(toYouTubeEmbedUrl).filter(Boolean);
  const longEmbedUrl = toYouTubeEmbedUrl(LONG_VIDEO_URL);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-emerald-50 to-green-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-5">
        <header className="mb-4 rounded-3xl border border-emerald-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-bold tracking-[0.35em] text-emerald-600">
            FUTSAL HIGHLIGHT
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            当日のハイライト
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            スワイプして次の動画。ロング版も下で見られます。
          </p>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
            <span className="text-sm font-bold text-emerald-700">
              ショート全 {shortEmbedUrls.length} 本
            </span>
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
              Shorts
            </span>
          </div>
        </header>

        {shortEmbedUrls.length > 0 ? (
          <section className="overflow-hidden rounded-[2rem] border border-emerald-200 bg-white p-3 shadow-xl">
            <div className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-[1.5rem]">
              {shortEmbedUrls.map((url, index) => (
                <article
                  key={`${url}-${index}`}
                  className="flex w-full shrink-0 snap-center flex-col items-center justify-center px-2 py-3"
                >
                  <div className="w-full max-w-[330px] overflow-hidden rounded-[2rem] border border-emerald-100 bg-black shadow-lg">
                    <div className="aspect-[9/16] w-full">
                      <iframe
                        className="h-full w-full"
                        src={url}
                        title={`futsal-highlight-${index + 1}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {shortEmbedUrls.map((_, dotIndex) => (
                      <span
                        key={`${dotIndex}-${index}`}
                        className={`h-2 w-2 rounded-full ${
                          dotIndex === index ? "bg-emerald-600" : "bg-emerald-200"
                        }`}
                      />
                    ))}
                  </div>

                  <p className="mt-3 text-sm font-bold text-emerald-700">
                    {index + 1} / {shortEmbedUrls.length}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section className="flex flex-col items-center justify-center rounded-[2rem] border border-emerald-200 bg-white p-8 text-center shadow-xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
              ▶
            </div>
            <h2 className="text-xl font-black text-slate-900">
              まだショート動画がありません
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              SHORT_VIDEO_URLS にYouTubeショートURLを入れてください。
            </p>
          </section>
        )}

        <section className="mt-6 rounded-[2rem] border border-emerald-200 bg-white p-4 shadow-xl">
          <div className="mb-4">
            <p className="text-xs font-bold tracking-[0.35em] text-emerald-600">
              LONG VERSION
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-900">
              ロングバージョン
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              試合全体や長めのハイライトはこちら。
            </p>
          </div>

          {longEmbedUrl ? (
            <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-black shadow-lg">
              <div className="aspect-video w-full">
                <iframe
                  className="h-full w-full"
                  src={longEmbedUrl}
                  title="futsal-long-version"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center rounded-3xl border border-emerald-100 bg-emerald-50 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                ▶
              </div>
              <p className="text-sm font-bold text-slate-700">
                ロング動画がまだ設定されていません
              </p>
              <p className="mt-1 text-xs text-slate-500">
                LONG_VIDEO_URL にYouTube URLを入れてください。
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}