"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  signInAnonymously,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

const EVENT_ID = "2026-04-21-2000";
const ADMIN_UID = "0OIfEjkR0EV8QfUkpotvKzeHQtd2";

// そよら成田ニュータウン付近
const LAT = 35.794;
const LON = 140.308;

type VoteValue = "yes" | "no" | "maybe" | null;

type VoteDoc = {
  rsvp: "yes" | "no" | "maybe";
  updatedAt?: unknown;
};

type HourlyWeatherItem = {
  time: string;
  temperature: number;
  weatherCode: number;
};

function weatherText(code: number) {
  if (code === 0) return "晴れ";
  if ([1, 2, 3].includes(code)) return "くもり";
  if ([45, 48].includes(code)) return "霧";
  if ([51, 53, 55, 56, 57].includes(code)) return "霧雨";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "雨";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "雪";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "天気";
}

function weatherIcon(code: number) {
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈";
  return "•";
}

function toHourLabel(iso: string) {
  const d = new Date(iso);
  return `${d.getHours()}時`;
}

function toYouTubeEmbedUrl(url: string) {
  if (!url) return "";

  if (url.includes("youtube.com/embed/")) return url;

  const watch = url.match(/[?&]v=([^&]+)/);
  if (watch?.[1]) return `https://www.youtube.com/embed/${watch[1]}`;

  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short?.[1]) return `https://www.youtube.com/embed/${short[1]}`;

  return "";
}

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [myVote, setMyVote] = useState<VoteValue>(null);
  const [yesCount, setYesCount] = useState(0);
  const [noCount, setNoCount] = useState(0);
  const [maybeCount, setMaybeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [hourlyWeather, setHourlyWeather] = useState<HourlyWeatherItem[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const [videoUrl, setVideoUrl] = useState("");
  const [videoInput, setVideoInput] = useState("");
  const [videoSaving, setVideoSaving] = useState(false);

  const isAdmin = user?.uid === ADMIN_UID;

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        const result = await signInAnonymously(auth);
        setUser(result.user);
      } else {
        setUser(currentUser);
      }

      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const eventRef = doc(db, "events", EVENT_ID);

    const unsubEvent = onSnapshot(eventRef, (snap) => {
      const data = snap.data();
      const url = data?.highlightVideoUrl ?? "";

      setVideoUrl(url);
      setVideoInput(url);
    });

    return () => unsubEvent();
  }, []);

  useEffect(() => {
    const votesRef = collection(db, "events", EVENT_ID, "votes");

    const unsubVotes = onSnapshot(votesRef, (snapshot) => {
      let yes = 0;
      let no = 0;
      let maybe = 0;

      snapshot.docs.forEach((d) => {
        const data = d.data() as VoteDoc;
        if (data.rsvp === "yes") yes += 1;
        if (data.rsvp === "no") no += 1;
        if (data.rsvp === "maybe") maybe += 1;
      });

      setYesCount(yes);
      setNoCount(no);
      setMaybeCount(maybe);
    });

    return () => unsubVotes();
  }, []);

  useEffect(() => {
    if (!user) return;

    const myVoteRef = doc(db, "events", EVENT_ID, "votes", user.uid);

    const unsubMyVote = onSnapshot(myVoteRef, (snap) => {
      if (!snap.exists()) {
        setMyVote(null);
        return;
      }

      const data = snap.data() as VoteDoc;
      setMyVote(data.rsvp);
    });

    return () => unsubMyVote();
  }, [user]);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setWeatherLoading(true);

        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&hourly=temperature_2m,weather_code&forecast_days=1&timezone=Asia%2FTokyo`
        );

        const data = await res.json();

        const times: string[] = data?.hourly?.time ?? [];
        const temps: number[] = data?.hourly?.temperature_2m ?? [];
        const codes: number[] = data?.hourly?.weather_code ?? [];

        const now = new Date();
        const currentHour = now.getHours();

        const merged = times.map((time, i) => ({
          time,
          temperature: temps[i],
          weatherCode: codes[i],
        }));

        const todayNextHours = merged
          .filter((item) => {
            const d = new Date(item.time);
            return d.getHours() >= currentHour;
          })
          .slice(0, 3);

        setHourlyWeather(todayNextHours);
      } catch (error) {
        console.error("天気取得エラー:", error);
      } finally {
        setWeatherLoading(false);
      }
    };

    loadWeather();
  }, []);

  const submitVote = async (value: "yes" | "no" | "maybe") => {
    if (!user) return;

    const voteRef = doc(db, "events", EVENT_ID, "votes", user.uid);

    await setDoc(voteRef, {
      rsvp: value,
      updatedAt: serverTimestamp(),
    });
  };

  const saveVideo = async () => {
    if (!isAdmin) {
      alert("管理者のみ実行できます");
      return;
    }

    try {
      setVideoSaving(true);

      await setDoc(
        doc(db, "events", EVENT_ID),
        {
          highlightVideoUrl: videoInput.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      alert("動画URLを保存しました");
    } catch (error) {
      console.error("動画保存エラー:", error);
      alert("動画URLの保存に失敗しました");
    } finally {
      setVideoSaving(false);
    }
  };

  const resetVotes = async () => {
    if (!isAdmin) {
      alert("管理者のみ実行できます");
      return;
    }

    const ok = window.confirm("参加人数をリセットしますか？");
    if (!ok) return;

    const votesRef = collection(db, "events", EVENT_ID, "votes");
    const snapshot = await getDocs(votesRef);

    await Promise.all(
      snapshot.docs.map((voteDoc) =>
        deleteDoc(doc(db, "events", EVENT_ID, "votes", voteDoc.id))
      )
    );

    alert("参加人数をリセットしました");
  };

  const totalCount = yesCount + noCount + maybeCount;

  const joinRate = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((yesCount / totalCount) * 100);
  }, [yesCount, totalCount]);

  const embedUrl = toYouTubeEmbedUrl(videoUrl);

  const btnStyle = (type: "yes" | "no" | "maybe") => {
    const active = myVote === type;

    const base =
      "w-full rounded-2xl px-4 py-4 text-lg font-bold transition border";

    if (!active) {
      return `${base} border-white/10 bg-white/5 text-white hover:bg-white/10`;
    }

    if (type === "yes") {
      return `${base} border-emerald-300 bg-emerald-500/20 text-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.25)]`;
    }

    if (type === "no") {
      return `${base} border-pink-300 bg-pink-500/20 text-pink-200 shadow-[0_0_20px_rgba(244,114,182,0.25)]`;
    }

    return `${base} border-violet-300 bg-violet-500/20 text-violet-200 shadow-[0_0_20px_rgba(167,139,250,0.25)]`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-6">
        <p className="text-lg text-white/80">読み込み中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white px-6 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <section>
          <p className="text-xs font-bold tracking-[0.35em] text-emerald-300">
            FUTSAL COMMUNITY
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-wide">
            FUTSAL
          </h1>
          <p className="mt-2 text-white/70">いい汗かいて、リフレッシュ！</p>
        </section>

        {/* 開催日 */}
        <section className="rounded-3xl border border-emerald-400/20 bg-white/5 p-5 shadow-xl backdrop-blur">
          <p className="text-sm text-white/60">開催日</p>
          <h2 className="mt-2 text-3xl font-bold text-emerald-300">
            5月27日（水）
          </h2>
          <p className="mt-2 text-white/80">20:00～22:00</p>

          <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
            <p className="text-sm text-emerald-200">
              現在{" "}
              <span className="text-xl font-extrabold text-white">
                {yesCount}人
              </span>{" "}
              参加中🔥
            </p>
            <p className="mt-1 text-xs text-white/60">
              参加できそうなら先にタップ。あとで変更OKです。
            </p>
          </div>
        </section>

        {/* 参加ボタン */}
        <section className="rounded-3xl border border-emerald-400/20 bg-gradient-to-b from-emerald-950/40 to-white/5 p-5 shadow-xl">
          <h3 className="text-2xl font-bold">参加する？</h3>
          <p className="mt-2 text-white/70">
            ワンタップで回答できます。あとで変更もできます。
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3">
            <button
              onClick={() => submitVote("yes")}
              className={`${btnStyle("yes")} py-5 text-xl`}
            >
              ⚽️ 参加する
            </button>

            <button
              onClick={() => submitVote("maybe")}
              className={btnStyle("maybe")}
            >
              🤔 調整中
            </button>

            <button onClick={() => submitVote("no")} className={btnStyle("no")}>
              今回休み
            </button>
          </div>

          <div className="mt-4 rounded-2xl bg-black/20 px-4 py-3 text-sm text-white/70">
            あなたの回答：
            <span className="ml-2 font-bold text-white">
              {myVote === "yes" && "参加する"}
              {myVote === "no" && "今回休み"}
              {myVote === "maybe" && "調整中"}
              {myVote === null && "まだ未回答"}
            </span>
          </div>

          <p className="mt-3 text-xs text-white/50">※あとで変更OK</p>
        </section>

        {/* 参加状況 */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
          <h3 className="text-2xl font-bold">参加状況</h3>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-black/20 p-4 text-center">
              <p className="text-sm text-white/60">参加</p>
              <p className="mt-1 text-3xl font-bold text-emerald-300">
                {yesCount}
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-4 text-center">
              <p className="text-sm text-white/60">休み</p>
              <p className="mt-1 text-3xl font-bold text-pink-300">
                {noCount}
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-4 text-center">
              <p className="text-sm text-white/60">調整中</p>
              <p className="mt-1 text-3xl font-bold text-violet-300">
                {maybeCount}
              </p>
            </div>
          </div>

          <div className="mt-5 h-4 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-emerald-400 transition-all"
              style={{
                width:
                  totalCount === 0 ? "0%" : `${(yesCount / totalCount) * 100}%`,
              }}
            />
          </div>

          <p className="mt-3 text-sm text-white/70">
            参加率：{joinRate}% / 合計回答数：{totalCount}人
          </p>

          {isAdmin && (
            <button
              onClick={resetVotes}
              className="mt-5 w-full rounded-2xl border border-red-400/30 bg-red-500/20 px-4 py-4 text-lg font-bold text-red-200 transition hover:bg-red-500/30"
            >
              参加人数をリセット
            </button>
          )}
        </section>

        {/* 当日の天気 */}
        <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">当日の天気</h3>
              <p className="mt-1 text-sm text-white/60">
                そよら成田ニュータウン
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
              時間ごと
            </div>
          </div>

          {weatherLoading ? (
            <div className="mt-4 rounded-2xl bg-black/20 px-4 py-5 text-sm text-white/70">
              天気を読み込み中...
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {hourlyWeather.map((item) => (
                <div
                  key={item.time}
                  className="rounded-2xl border border-white/10 bg-[#081022] px-3 py-4 text-center"
                >
                  <p className="text-xs text-white/50">
                    {toHourLabel(item.time)}
                  </p>
                  <div className="mt-2 text-2xl">
                    {weatherIcon(item.weatherCode)}
                  </div>
                  <p className="mt-2 text-lg font-bold text-emerald-300">
                    {Math.round(item.temperature)}℃
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    {weatherText(item.weatherCode)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ハイライト動画1本 */}
        <section className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-b from-emerald-950/40 to-white/5 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-emerald-300">
                MATCH HIGHLIGHT
              </p>
              <h3 className="mt-1 text-2xl font-bold">当日のハイライト</h3>
            </div>

            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
              16:9
            </span>
          </div>

          {isAdmin && (
            <div className="mt-4 space-y-3 rounded-2xl border border-emerald-400/20 bg-black/20 p-4">
              <p className="text-sm font-bold text-emerald-200">
                管理者用：動画URL設定
              </p>

              <input
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="YouTube URLを入れる"
                className="w-full rounded-2xl border border-white/10 bg-[#081022] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35"
              />

              <button
                onClick={saveVideo}
                disabled={videoSaving}
                className="w-full rounded-2xl border border-emerald-300/30 bg-emerald-500/20 px-4 py-3 text-base font-bold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-60"
              >
                {videoSaving ? "保存中..." : "動画URLを保存"}
              </button>
            </div>
          )}

          <div className="mt-5">
            {embedUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black">
                <iframe
                  className="h-full w-full"
                  src={embedUrl}
                  title="highlight-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center rounded-3xl border border-white/10 bg-[#07150f] text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/10 text-2xl">
                  ▶
                </div>
                <p className="text-sm font-bold text-white/70">
                  まだ動画が設定されていません
                </p>
                <p className="mt-1 text-xs text-white/35">
                  管理者がYouTube URLを入れると表示されます
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}