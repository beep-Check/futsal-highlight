"use client";

import { useState } from "react";

const VIDEO_ARCHIVES = [
  {
    date: "4月21日",
    shortVideoUrls: [],
    longVideoUrl: "https://youtu.be/Dbth9myETC0",
  },
  {
    date: "5月27日",
    shortVideoUrls: [],
    longVideoUrl: "https://youtu.be/1cMwKCGK4mk",
  },
  {
    date: "7月31日",
    shortVideoUrls: ["https://youtu.be/fzqR4JtUIx8"],
    longVideoUrl: "https://youtu.be/FSyoC1nfs-U",
  },
  {
    date: "9月18日",
    shortVideoUrls: [],
    longVideoUrl: "https://youtu.be/mCOJdBCi9NE",
  },
];

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
  const [selectedDate, setSelectedDate] = useState(VIDEO_ARCHIVES[0].date);
  const selectedArchive =
    VIDEO_ARCHIVES.find((archive) => archive.date === selectedDate) ??
    VIDEO_ARCHIVES[0];
  const shorts = selectedArchive.shortVideoUrls.map(toEmbedUrl);
  const longVideo = toEmbedUrl(selectedArchive.longVideoUrl);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-emerald-50 to-green-100">
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="mb-6 rounded-3xl border border-emerald-200 bg-white p-5 shadow">
          <p className="text-xs font-bold tracking-[0.3em] text-emerald-600">
            FUTSAL HIGHLIGHT
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">
            過去のハイライト
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            日付を選ぶと、その日の動画を見られます。
          </p>
        </div>

        <section className="mb-6">
          <h2 className="mb-3 text-xl font-black text-emerald-700">
            過去の動画一覧
          </h2>

          <div className="flex flex-wrap gap-2">
            {VIDEO_ARCHIVES.map((archive) => {
              const isSelected = archive.date === selectedDate;

              return (
                <button
                  key={archive.date}
                  type="button"
                  onClick={() => setSelectedDate(archive.date)}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow"
                      : "border border-emerald-300 bg-white text-emerald-700"
                  }`}
                >
                  {archive.date}
                </button>
              );
            })}
          </div>
        </section>

        {shorts.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-xl font-black text-emerald-700">
              {selectedArchive.date}のハイライト
            </h2>

            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
              {shorts.map((url, index) => (
                <div key={url} className="w-full shrink-0 snap-center">
                  <div className="overflow-hidden rounded-3xl bg-black shadow-lg">
                    <div className="aspect-[9/16]">
                      <iframe
                        className="h-full w-full"
                        src={url}
                        title={`${selectedArchive.date}-short-${index + 1}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
        )}

        <section className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-lg">
          <h2 className="mb-3 text-xl font-black text-emerald-700">
            ロングバージョン
          </h2>

          <div className="overflow-hidden rounded-3xl bg-black">
            <div className="aspect-video">
              <iframe
                className="h-full w-full"
                src={longVideo}
                title={`${selectedArchive.date}-long-video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
