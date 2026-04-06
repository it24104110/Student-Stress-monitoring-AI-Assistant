import { useEffect, useState, useRef } from "react";
import { Sparkles, Brain, Heart, Sun, X, Pause, Play, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function AIInsights() {
  const [insights, setInsights] = useState([]);
  const [affirmations, setAffirmations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [summary, setSummary] = useState({ text: "", highlights: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Timer State
  const [activeActivity, setActiveActivity] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    fetchAIData();
  }, []);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      setIsTimerRunning(false);
      setIsFinished(true);
      toast.success(`Activity Complete!`, {
        description: "Incredible job taking time for yourself! You are doing amazing.",
        icon: "✨"
      });
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const fetchAIData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:8080/api/ai-insights");
      setInsights(response.data.insights || []);
      setAffirmations(response.data.affirmations || []);
      setSuggestions(response.data.suggestions || []);
      setSummary(response.data.summary || { text: "", highlights: [] });
    } catch (error) {
      console.error("Error fetching AI data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const iconMap = {
    Brain: Brain,
    Sun: Sun,
    Heart: Heart,
  };

  const handleStartActivity = (title, duration, description) => {
    // Parse duration string to seconds
    const minutesMatch = duration.match(/\d+/);
    const totalSeconds = minutesMatch ? parseInt(minutesMatch[0]) * 60 : 300; // default to 5 min

    setActiveActivity({ title, description });
    setTimeLeft(totalSeconds);
    setIsTimerRunning(true);
    setIsFinished(false);
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);

  const cancelActivity = () => {
    setActiveActivity(null);
    setIsTimerRunning(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-[#6C5CE7] blur-xl rounded-full opacity-50 animate-pulse"></div>
          <Sparkles className="w-16 h-16 text-white relative z-10 animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-widest animate-pulse">
          Consulting the AI...
        </h2>
        <p className="text-[#AAB2D5] text-sm">Reviewing your recent mood history and generating personalized insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">AI Mood Insights</h2>

      {/* AI Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map((insight, index) => {
          const IconComponent = iconMap[insight.icon] || Brain;
          return (
            <div key={index} className="glass-card p-6 border-2" style={{ borderColor: `${insight.color.replace('1)', '0.3)')}` }}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg glow-cyan" style={{ backgroundColor: `${insight.color.replace('1)', '0.2)')}` }}>
                  <IconComponent className="w-6 h-6" style={{ color: insight.color }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{insight.title}</h3>
                  <p className="text-[#AAB2D5] text-sm">{insight.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Positive Affirmations */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-[#845ef7]" />
          <h3 className="text-2xl font-semibold text-white">Daily Affirmations</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {affirmations.map((affirmation, index) => (
            <div
              key={index}
              className="glass-card p-4 hover:border-[#845ef7]/50 border-2 border-transparent transition-all cursor-pointer hover:glow-purple"
            >
              <p className="text-white text-center">{affirmation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Wellness Suggestions */}
      <div className="glass-card p-8">
        <h3 className="text-2xl font-semibold text-white mb-6">Wellness Suggestions</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="glass-card p-6 hover:bg-white/10 transition-all">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-semibold text-white">{suggestion.title}</h4>
                <span className="impact-chip impact-medium">
                  {suggestion.duration}
                </span>
              </div>
              <p className="text-[#AAB2D5] text-sm">{suggestion.description}</p>
              <button
                onClick={() => handleStartActivity(suggestion.title, suggestion.duration, suggestion.description)}
                className="mt-4 w-full btn-gradient py-2 rounded-lg text-sm transition-all focus:outline-none hover:scale-[1.02]"
              >
                Start Activity
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis Summary */}
      <div className="glass-card p-8 border-2" style={{ borderColor: 'rgba(66, 193, 255, 0.3)' }}>
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-full glow-cyan" style={{ backgroundColor: 'rgba(66, 193, 255, 0.2)' }}>
            <Brain className="w-8 h-8 text-[#42c1ff]" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-3">AI Analysis Summary</h3>
            <p className="text-[#AAB2D5] mb-4">
              {summary.text}
            </p>
            <div className="flex gap-3">
              {summary.highlights && summary.highlights.map((highlight, index) => (
                <div key={index} className="glass-card px-4 py-2 rounded-full">
                  <span style={{ color: highlight.color }}>✓ {highlight.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timer Modal */}
      {activeActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="glass-card w-full max-w-sm p-8 border-2" style={{ borderColor: 'rgba(132, 94, 247, 0.4)' }}>

            {/* Close Button Header */}
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white text-center flex-1">{activeActivity.title}</h3>
              <button onClick={cancelActivity} className="text-[#AAB2D5] hover:text-white transition-colors absolute top-4 right-4">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Description Body */}
            <p className="text-sm text-[#AAB2D5] text-center mb-8 px-2">
              {activeActivity.description}
            </p>

            {/* Timer or Finish State */}
            {isFinished ? (
              <div className="flex flex-col items-center justify-center min-h-[160px] animate-fade-in-up">
                <CheckCircle2 className="w-20 h-20 text-[#00D1FF] mb-4 glow-cyan" />
                <h4 className="text-2xl font-bold text-white text-center">Incredible Job!</h4>
                <p className="text-[#AAB2D5] text-center mt-2">
                  "Every small step toward self-care matters. Be proud of taking this moment for you!"
                </p>
                <button
                  onClick={cancelActivity}
                  className="mt-8 w-full btn-gradient py-3 rounded-lg font-semibold hover:scale-[1.03] transition-transform"
                >
                  Return to Insights
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Visual Timer Display */}
                <div className="w-48 h-48 rounded-full border-4 border-[#00D1FF]/20 flex items-center justify-center mb-8 relative glow-cyan">
                  {/* Subtle pulsing background when running */}
                  {isTimerRunning && <div className="absolute inset-0 bg-[#00D1FF]/5 rounded-full animate-ping"></div>}
                  <span className="text-5xl font-mono font-bold text-white tracking-widest relative z-10">
                    {formatTime(timeLeft)}
                  </span>
                </div>

                {/* Controls */}
                <div className="flex gap-4 w-full">
                  <button
                    onClick={toggleTimer}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors focus:outline-none"
                  >
                    {isTimerRunning ? (
                      <><Pause className="w-5 h-5" /> Pause</>
                    ) : (
                      <><Play className="w-5 h-5" /> Resume</>
                    )}
                  </button>
                  <button
                    onClick={cancelActivity}
                    className="flex-1 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors focus:outline-none"
                  >
                    End Early
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
