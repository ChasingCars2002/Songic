import { useState, useEffect, useCallback, useRef } from "react";
import { getRecommendations, fetchReplacement } from "./api/music";
import { useBlacklist } from "./hooks/useBlacklist";
import RecommendationCard from "./components/RecommendationCard";

// ─── Question Bank (30 questions) ──────────────────────────────────────────────
const QUESTION_BANK = [
  {
    id: 1,
    category: "genre",
    question: "Pick the vibe that fits your Friday night",
    options: [
      "Chilled R&B and dim lights",
      "Loud guitars and mosh pits",
      "Deep house and dance floors",
      "Lo-fi beats and a good book",
      "Pop anthems and singing in the mirror",
    ],
  },
  {
    id: 2,
    category: "era",
    question: "What decade of music speaks to you most?",
    options: [
      "60s/70s — classic rock & soul",
      "80s — synth-pop & new wave",
      "90s — grunge, hip-hop & golden era",
      "2000s — indie boom & emo",
      "2010s-now — streaming era melting pot",
    ],
  },
  {
    id: 3,
    category: "mood",
    question: "You're driving alone at 2 AM — what's on?",
    options: [
      "Something cinematic and atmospheric",
      "Raw, emotional vocals that hit hard",
      "Heavy bass shaking the rearview",
      "Ambient electronic — pure vibes",
      "A classic album front to back",
    ],
  },
  {
    id: 4,
    category: "instruments",
    question: "Which sound grabs you first?",
    options: [
      "Heavy distorted bass",
      "Warm acoustic guitar",
      "Moody piano chords",
      "Lush analog synths",
      "Brass and horns with soul",
    ],
  },
  {
    id: 5,
    category: "discovery",
    question: "How do you actually find new music?",
    options: [
      "Algorithm playlists do the work",
      "Friends and word of mouth",
      "Digging through crates and catalogs",
      "Random internet rabbit holes at 3 AM",
    ],
  },
  {
    id: 6,
    category: "lyrics vs production",
    question: "Lyrics or production — what hooks you first?",
    options: [
      "Lyrics — every word matters",
      "Production — if it sounds right, I'm in",
      "Honestly both equally",
      "The vibe matters more than either",
    ],
  },
  {
    id: 7,
    category: "concert",
    question: "Your ideal live music experience?",
    options: [
      "Tiny venue, 50 people, you can feel the sweat",
      "Mid-size theater with perfect acoustics",
      "Massive arena with production and pyro",
      "Outdoor festival with multiple stages",
      "Studio session or listening party",
    ],
  },
  {
    id: 8,
    category: "guilty pleasure",
    question: "Be honest — what's your guilty pleasure?",
    options: [
      "Cheesy 80s power ballads",
      "Mainstream pop I pretend not to know",
      "Corny love songs that make me feel things",
      "Viral TikTok tracks I can't escape",
      "I have zero guilt about my music taste",
    ],
  },
  {
    id: 9,
    category: "forced choice",
    question: "One artist for a whole month — who are you picking?",
    options: [
      "Radiohead",
      "Beyoncé",
      "Kendrick Lamar",
      "Fleetwood Mac",
      "Frank Ocean",
    ],
  },
  {
    id: 10,
    category: "tempo",
    question: "What tempo gets you going?",
    options: [
      "Slow and moody — let it breathe",
      "Mid-tempo grooves I can nod to",
      "Upbeat and danceable",
      "Fast and aggressive — no brakes",
      "I need variety — tempo shifts keep me interested",
    ],
  },
  {
    id: 11,
    category: "vocals",
    question: "What vocal style do you gravitate toward?",
    options: [
      "Smooth and silky",
      "Raspy and raw",
      "Soaring falsetto",
      "Rhythmic flow and rap",
      "No vocals — instrumentals only",
    ],
  },
  {
    id: 12,
    category: "situational",
    question: "What situation needs the best soundtrack?",
    options: [
      "Working out — pure energy",
      "Studying or focusing — background perfection",
      "Cooking dinner — something groovy",
      "Road trip — windows down, volume up",
      "Getting ready to go out",
    ],
  },
  {
    id: 13,
    category: "genre",
    question: "You're curating the aux at a house party — what's the move?",
    options: [
      "Hip-hop and R&B all night",
      "Electronic and house music",
      "Indie and alternative vibes",
      "A little bit of everything — genre chaos",
      "Classic rock and soul bangers",
    ],
  },
  {
    id: 14,
    category: "mood",
    question: "When you're in your feelings, what do you reach for?",
    options: [
      "Sad songs that let me wallow",
      "Angry music to channel the energy",
      "Uplifting tracks to pull me out of it",
      "Something nostalgic from my past",
      "Silence — music is too much right now",
    ],
  },
  {
    id: 15,
    category: "era",
    question: "Which music era's aesthetic do you vibe with most?",
    options: [
      "Psychedelic 70s — tie-dye and vinyl",
      "Punk 80s — leather and rebellion",
      "Grunge 90s — flannel and angst",
      "Y2K 2000s — futuristic and flashy",
      "Now — internet-core and genre-fluid",
    ],
  },
  {
    id: 16,
    category: "instruments",
    question: "Pick the texture that makes a track feel complete",
    options: [
      "Warm vinyl crackle and analog warmth",
      "Crisp, clean digital production",
      "Raw live instrumentation",
      "Layered vocal harmonies",
      "Heavy 808s and sub-bass",
    ],
  },
  {
    id: 17,
    category: "discovery",
    question: "When you find an artist you love, what do you do?",
    options: [
      "Binge their entire discography immediately",
      "Start with the hits, dig deeper later",
      "Find their features and collabs",
      "Check who influenced them and go backward",
      "Listen to one album on repeat for weeks",
    ],
  },
  {
    id: 18,
    category: "forced choice",
    question: "Desert island album — pick a genre to survive with",
    options: [
      "Jazz — timeless and deep",
      "Hip-hop — culture and rhythm",
      "Rock — energy and rebellion",
      "Electronic — infinite soundscapes",
      "Soul/R&B — heart and emotion",
    ],
  },
  {
    id: 19,
    category: "lyrics vs production",
    question: "A song in a language you don't understand — deal breaker?",
    options: [
      "No way, music transcends language",
      "Depends on the production quality",
      "I need to connect with lyrics to enjoy it",
      "I love international music actually",
    ],
  },
  {
    id: 20,
    category: "tempo",
    question: "Your morning alarm goes off — what's the ideal first song?",
    options: [
      "Something gentle to ease into the day",
      "A groovy mid-tempo bop",
      "High-energy to jump-start everything",
      "Whatever was stuck in my head last night",
      "Silence. Music before coffee is criminal",
    ],
  },
  {
    id: 21,
    category: "vocals",
    question: "Which voice would narrate your life?",
    options: [
      "A deep baritone with gravitas",
      "An ethereal soprano that floats",
      "A sharp-witted rapper with bars",
      "A gritty blues voice full of stories",
      "An auto-tuned dreamscape",
    ],
  },
  {
    id: 22,
    category: "concert",
    question: "You just scored backstage passes — who for?",
    options: [
      "A legendary act from the past (time travel allowed)",
      "The biggest pop star in the world right now",
      "An underground artist about to blow up",
      "A DJ or producer's exclusive set",
      "A jazz trio in a smoky basement club",
    ],
  },
  {
    id: 23,
    category: "guilty pleasure",
    question: "Which of these would secretly show up in your Wrapped?",
    options: [
      "Disney soundtracks",
      "Video game OSTs",
      "Reality TV theme songs",
      "ASMR playlists that are basically music",
      "Workout motivation compilations",
    ],
  },
  {
    id: 24,
    category: "situational",
    question: "The weather outside is awful — what are you playing?",
    options: [
      "Cozy acoustic and folk",
      "Melancholic indie that matches the mood",
      "Tropical beats to mentally escape",
      "Dark ambient or post-rock",
      "Loud music to drown out the storm",
    ],
  },
  {
    id: 25,
    category: "mood",
    question: "You just got amazing news — what's the celebration track?",
    options: [
      "A feel-good pop anthem",
      "Hard-hitting hip-hop to feel invincible",
      "Classic rock victory lap",
      "Dance music — time to move",
      "Something emotional — happy tears type beat",
    ],
  },
  {
    id: 26,
    category: "genre",
    question: "Which subgenre rabbit hole would you happily fall into?",
    options: [
      "Shoegaze and dream pop",
      "Afrobeats and amapiano",
      "Midwest emo and math rock",
      "Trip-hop and downtempo",
      "Neo-soul and modern funk",
    ],
  },
  {
    id: 27,
    category: "forced choice",
    question: "You can only keep one format — choose wisely",
    options: [
      "Albums — the full artistic statement",
      "Singles — hits are hits for a reason",
      "Live recordings — raw and real",
      "Remixes and mashups — evolution is king",
    ],
  },
  {
    id: 28,
    category: "instruments",
    question: "Which of these would make you stop scrolling?",
    options: [
      "A guitarist shredding an unexpected solo",
      "A beatmaker flipping an obscure sample",
      "A vocalist hitting an impossible note",
      "A drummer going absolutely feral",
      "A producer layering sounds in real-time",
    ],
  },
  {
    id: 29,
    category: "situational",
    question: "You're hosting a dinner party — what sets the mood?",
    options: [
      "Jazz standards and bossa nova",
      "Indie folk and singer-songwriter",
      "Smooth R&B and neo-soul",
      "Chill electronic and lo-fi",
      "Classic Motown and soul",
    ],
  },
  {
    id: 30,
    category: "discovery",
    question: "An artist you love drops a completely different-sounding album. Reaction?",
    options: [
      "Respect — artists should evolve",
      "I'll give it three full listens before judging",
      "Disappointed — I liked what they were doing",
      "Depends on whether the new sound actually works",
    ],
  },
];

const QUIZ_COUNT = 5;

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const LOADING_MESSAGES = [
  "Analyzing your taste...",
  "Curating your sound...",
  "Finding your hidden gems...",
  "Matching your frequency...",
  "Decoding your sonic DNA...",
  "Tuning into your wavelength...",
  "Scanning the archives...",
  "Building your sonic profile...",
];

// ─── Equalizer Bars ─────────────────────────────────────────────────────────────
function EqualizerBars() {
  const bars = Array.from({ length: 16 }, () => ({
    delay: Math.random() * 0.8,
    speed: 0.3 + Math.random() * 0.5,
  }));
  return (
    <div className="flex items-end gap-[3px] h-20 justify-center">
      {bars.map((bar, i) => (
        <div
          key={i}
          className="w-[5px] rounded-full origin-bottom"
          style={{
            background: "linear-gradient(to top, #ff2d78, #a855f7)",
            animation: `eq-bar ${bar.speed}s ease-in-out ${bar.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Vinyl Spinner ──────────────────────────────────────────────────────────────
function VinylSpinner() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-8">
      <div
        className="w-full h-full rounded-full"
        style={{
          background: `radial-gradient(circle at center,
            #1a1a24 18%,
            #252532 19%, #252532 20%, #1a1a24 21%,
            #1a1a24 32%, #252532 33%, #252532 34%, #1a1a24 35%,
            #1a1a24 47%, #252532 48%, #252532 49%, #1a1a24 50%,
            #1a1a24 62%, #333 63%)`,
          boxShadow: "0 0 60px rgba(168, 85, 247, 0.25)",
          animation: "spin 3s linear infinite",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full"
            style={{
              background: "linear-gradient(135deg, #ff2d78, #a855f7)",
            }}
          />
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ─── Progress Bar ───────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex justify-between text-sm text-gray-400 mb-2">
        <span>
          {current + 1} of {total}
        </span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-[#252532] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #ff2d78, #a855f7, #3b82f6)",
          }}
        />
      </div>
    </div>
  );
}

// ─── Landing Screen ─────────────────────────────────────────────────────────────
function LandingScreen({ onStart }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(255,45,120,0.08)" }}
      />
      <div
        className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-[120px] pointer-events-none"
        style={{ background: "rgba(168,85,247,0.08)" }}
      />

      <div
        className="text-center relative z-10"
        style={{ animation: "fadeInUp 0.6s ease-out" }}
      >
        <div className="mb-6 flex items-center justify-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #ff2d78, #a855f7)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              className="w-9 h-9"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
        </div>

        <h1
          className="text-6xl sm:text-8xl font-black tracking-tight mb-4"
          style={{
            fontFamily: "'Outfit', sans-serif",
            background:
              "linear-gradient(135deg, #ff2d78, #a855f7, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Songic
        </h1>

        <p className="text-xl text-gray-400 mb-2">
          Discover your sonic identity
        </p>
        <p className="text-sm text-gray-500 mb-10 max-w-sm mx-auto">
          Answer {QUIZ_COUNT} quick questions about your music taste and get
          personalized song recommendations with real previews — powered by
          live music data.
        </p>

        <button
          onClick={onStart}
          className="group relative px-10 py-4 rounded-full text-lg font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #ff2d78, #a855f7)",
          }}
        >
          Start the Quiz
          <div
            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl pointer-events-none"
            style={{ background: "rgba(255,45,120,0.4)" }}
          />
        </button>

        <p className="text-xs text-gray-600 mt-6">
          Takes about 1 minute · No sign-up needed
        </p>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Quiz Screen ────────────────────────────────────────────────────────────────
function QuizScreen({ questions, answers, onAnswer, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [slideDir, setSlideDir] = useState("right");

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const canGoBack = currentIndex > 0;
  const selectedAnswer = answers[question.id];
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  const goTo = (idx, dir) => {
    setSlideDir(dir);
    setAnimKey((k) => k + 1);
    setCurrentIndex(idx);
  };

  const handleSelect = (option) => {
    onAnswer(question.id, option);
    setTimeout(() => {
      if (!isLast) goTo(currentIndex + 1, "right");
    }, 280);
  };

  const handleSkip = () => {
    onAnswer(question.id, "Skipped");
    if (!isLast) goTo(currentIndex + 1, "right");
    else onFinish();
  };

  const animClass = slideDir === "right" ? "slideRight" : "slideLeft";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none"
        style={{ background: "rgba(168,85,247,0.04)" }}
      />

      <div className="w-full max-w-lg relative z-10">
        <ProgressBar current={currentIndex} total={questions.length} />

        <div
          key={animKey}
          style={{ animation: `${animClass} 0.35s ease-out` }}
        >
          <div className="flex justify-center mb-4">
            <span className="text-xs uppercase tracking-widest text-gray-500 bg-[#1a1a24] px-3 py-1 rounded-full">
              {question.category}
            </span>
          </div>

          <h2
            className="text-2xl sm:text-3xl font-bold text-center text-white mb-8 leading-snug"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {question.question}
          </h2>

          <div className="space-y-3">
            {question.options.map((option, i) => {
              const isSelected = selectedAnswer === option;
              return (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className="w-full text-left px-5 py-4 rounded-2xl border transition-all duration-200 text-sm sm:text-base cursor-pointer"
                  style={{
                    borderColor: isSelected
                      ? "rgba(255,45,120,0.5)"
                      : "#252532",
                    background: isSelected
                      ? "rgba(255,45,120,0.08)"
                      : "rgba(26,26,36,0.6)",
                    color: isSelected ? "#fff" : "#cbd5e1",
                  }}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors duration-200"
                      style={{
                        background: isSelected ? "#ff2d78" : "#252532",
                        color: isSelected ? "#fff" : "#6b7280",
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => canGoBack && goTo(currentIndex - 1, "left")}
            disabled={!canGoBack}
            className="text-sm px-4 py-2 rounded-xl transition-all cursor-pointer"
            style={{
              color: canGoBack ? "#9ca3af" : "#374151",
              cursor: canGoBack ? "pointer" : "not-allowed",
            }}
          >
            &larr; Back
          </button>

          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
          >
            Skip
          </button>

          {isLast && allAnswered ? (
            <button
              onClick={onFinish}
              className="px-6 py-2 rounded-full text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #ff2d78, #a855f7)",
              }}
            >
              Get Results &rarr;
            </button>
          ) : (
            <button
              onClick={() => !isLast && goTo(currentIndex + 1, "right")}
              disabled={isLast}
              className="text-sm px-4 py-2 rounded-xl transition-all cursor-pointer"
              style={{
                color: !isLast ? "#9ca3af" : "#374151",
                cursor: !isLast ? "pointer" : "not-allowed",
              }}
            >
              Next &rarr;
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Loading Screen ─────────────────────────────────────────────────────────────
function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <VinylSpinner />
      <EqualizerBars />
      <p
        key={msgIndex}
        className="mt-8 text-lg text-gray-300"
        style={{ animation: "fadeInUp 0.4s ease-out" }}
      >
        {LOADING_MESSAGES[msgIndex]}
      </p>
      <p className="mt-3 text-sm text-gray-600">
        Searching live music databases...
      </p>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes eq-bar {
          0%, 100% { transform: scaleY(0.15); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Results Screen ─────────────────────────────────────────────────────────────
function ResultsScreen({ tracks, profile, allTracks, onRetake }) {
  const [displayedTracks, setDisplayedTracks] = useState(tracks);
  const [replacingId, setReplacingId] = useState(null);
  const { blacklistedIds, addToBlacklist } = useBlacklist();
  const allTracksRef = useRef(allTracks);
  const dismissCountRef = useRef(0);

  const handleKnowIt = useCallback(
    async (track) => {
      setReplacingId(track.id);
      addToBlacklist(track);

      const currentIds = new Set(displayedTracks.map((t) => t.id));
      const updatedBlacklist = new Set([...blacklistedIds, track.id]);

      // First try to find a replacement from the pre-fetched pool
      const poolCandidate = allTracksRef.current.find(
        (t) =>
          !currentIds.has(t.id) &&
          !updatedBlacklist.has(t.id) &&
          t.artist.toLowerCase() !== track.artist.toLowerCase()
      );

      let replacement = poolCandidate;

      // If pool is exhausted, fetch from API
      if (!replacement) {
        replacement = await fetchReplacement(
          track,
          updatedBlacklist,
          currentIds
        );
      }

      dismissCountRef.current += 1;

      setDisplayedTracks((prev) =>
        prev.map((t) => {
          if (t.id === track.id) {
            return replacement || { ...t, _dismissed: true };
          }
          return t;
        })
      );
      setReplacingId(null);
    },
    [displayedTracks, blacklistedIds, addToBlacklist]
  );

  const dismissedCount = dismissCountRef.current;

  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden">
      <div
        className="absolute top-20 -left-40 w-96 h-96 rounded-full blur-[140px] pointer-events-none"
        style={{ background: "rgba(255,45,120,0.06)" }}
      />
      <div
        className="absolute bottom-20 -right-40 w-96 h-96 rounded-full blur-[140px] pointer-events-none"
        style={{ background: "rgba(59,130,246,0.06)" }}
      />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Profile Header */}
        <div
          className="text-center mb-10"
          style={{ animation: "fadeInUp 0.5s ease-out" }}
        >
          <div
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest mb-4 px-4 py-1.5 rounded-full"
            style={{ color: "#ff2d78", background: "rgba(255,45,120,0.1)" }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Your Sonic Identity
          </div>
          <h1
            className="text-4xl sm:text-5xl font-black mb-3"
            style={{
              fontFamily: "'Outfit', sans-serif",
              background:
                "linear-gradient(135deg, #ff2d78, #a855f7, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {profile.profileName}
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto">
            {profile.profileDescription}
          </p>
        </div>

        {/* Dismissed counter */}
        {dismissedCount > 0 && (
          <div
            className="text-center mb-6"
            style={{ animation: "fadeInUp 0.3s ease-out" }}
          >
            <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-[#1a1a24] text-gray-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-3.5 h-3.5"
              >
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              {dismissedCount} track{dismissedCount !== 1 ? "s" : ""} you
              already knew — replaced with deeper cuts
            </span>
          </div>
        )}

        {/* Recommendations */}
        <section
          className="mb-10"
          style={{ animation: "fadeInUp 0.5s ease-out 0.2s both" }}
        >
          <h2
            className="text-sm uppercase tracking-widest mb-5 flex items-center gap-2"
            style={{ color: "#ff2d78" }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            Your Personalized Picks
          </h2>

          <div className="space-y-4">
            {displayedTracks
              .filter((t) => !t._dismissed)
              .map((track, i) => (
                <RecommendationCard
                  key={track.id}
                  track={track}
                  index={i}
                  onKnowIt={handleKnowIt}
                  isReplacing={replacingId === track.id}
                />
              ))}
          </div>

          {displayedTracks.every((t) => t._dismissed) && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-2">
                Wow, you really know your music!
              </p>
              <p className="text-gray-500 text-sm">
                We've run out of fresh recommendations for this session.
              </p>
            </div>
          )}
        </section>

        {/* Taste Tags */}
        <section
          className="mb-10"
          style={{ animation: "fadeInUp 0.5s ease-out 0.3s both" }}
        >
          <h2
            className="text-sm uppercase tracking-widest mb-4 flex items-center gap-2"
            style={{ color: "#a855f7" }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-4 h-4"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            Your Taste DNA
          </h2>
          <div className="flex flex-wrap gap-2">
            {profile.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full text-sm"
                style={{
                  background: "rgba(168,85,247,0.1)",
                  color: "#a855f7",
                  border: "1px solid rgba(168,85,247,0.2)",
                }}
              >
                {tag}
              </span>
            ))}
            {profile.moods.map((mood) => (
              <span
                key={mood}
                className="px-3 py-1.5 rounded-full text-sm"
                style={{
                  background: "rgba(59,130,246,0.1)",
                  color: "#3b82f6",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
              >
                {mood}
              </span>
            ))}
            <span
              className="px-3 py-1.5 rounded-full text-sm"
              style={{
                background: "rgba(6,182,212,0.1)",
                color: "#06b6d4",
                border: "1px solid rgba(6,182,212,0.2)",
              }}
            >
              {profile.era} era
            </span>
          </div>
        </section>

        {/* Retake Button */}
        <div
          className="text-center"
          style={{ animation: "fadeInUp 0.5s ease-out 0.4s both" }}
        >
          <button
            onClick={onRetake}
            className="group relative px-8 py-3 rounded-full text-base font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #ff2d78, #a855f7)",
            }}
          >
            Retake Quiz
            <div
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl pointer-events-none"
              style={{ background: "rgba(255,45,120,0.4)" }}
            />
          </button>
          <p className="text-xs text-gray-600 mt-3">
            Questions are reshuffled every time
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Error Screen ───────────────────────────────────────────────────────────────
function ErrorScreen({ message, onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ff2d78"
          strokeWidth="1.5"
          className="w-16 h-16 mx-auto mb-4"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <h2
          className="text-2xl font-bold text-white mb-3"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Something went wrong
        </h2>
        <p className="text-gray-400 mb-6">
          {message ||
            "We couldn't generate your recommendations. Please try again."}
        </p>
        <button
          onClick={onRetry}
          className="px-8 py-3 rounded-full text-base font-semibold text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #ff2d78, #a855f7)",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const initQuiz = useCallback(() => {
    const shuffled = shuffleArray(QUESTION_BANK).slice(0, QUIZ_COUNT);
    setQuestions(shuffled);
    setAnswers({});
    setResults(null);
    setErrorMsg("");
    setScreen("quiz");
  }, []);

  const handleAnswer = useCallback((questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const fetchResults = useCallback(async (qs, ans) => {
    setScreen("loading");

    const userAnswers = qs.map((q) => ({
      question: q.question,
      category: q.category,
      answer: ans[q.id] || "Skipped",
    }));

    try {
      const data = await getRecommendations(userAnswers);
      setResults(data);
      setScreen("results");
    } catch (err) {
      console.error("Recommendation error:", err);
      setErrorMsg(err.message);
      setScreen("error");
    }
  }, []);

  const handleFinish = useCallback(() => {
    fetchResults(questions, answers);
  }, [questions, answers, fetchResults]);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      {screen === "landing" && <LandingScreen onStart={initQuiz} />}
      {screen === "quiz" && (
        <QuizScreen
          questions={questions}
          answers={answers}
          onAnswer={handleAnswer}
          onFinish={handleFinish}
        />
      )}
      {screen === "loading" && <LoadingScreen />}
      {screen === "results" && results && (
        <ResultsScreen
          tracks={results.tracks}
          profile={results.profile}
          allTracks={results._allTracks}
          onRetake={initQuiz}
        />
      )}
      {screen === "error" && (
        <ErrorScreen
          message={errorMsg}
          onRetry={() => fetchResults(questions, answers)}
        />
      )}
    </>
  );
}
