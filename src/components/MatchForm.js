"use client";

import { useState, useEffect } from "react";
import {
  User,
  Calendar,
  Users,
  Sparkles,
  Tag,
} from "lucide-react";

import useSocket from "../hooks/useSocket";
import ChatBox from "./ChatBox";

const interestsList = [
  "Music",
  "Gaming",
  "Technology",
  "Relationships",
  "Education",
  "Fitness",
  "Movies",
];

const vibes = ["Chill", "Deep", "Funny", "Advice"];

export default function MatchForm() {
  const socket = useSocket();

  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [interests, setInterests] = useState([]);
  const [vibe, setVibe] = useState("");

  const [room, setRoom] = useState(null);
const [matchData, setMatchData] = useState(null);
  const [searching, setSearching] = useState(false);

  const toggleInterest = (item) => {
    setInterests((prev) =>
      prev.includes(item)
        ? prev.filter((i) => i !== item)
        : [...prev, item]
    );
  };

const handleSubmit = () => {
  if (!socket) return;

  if (!age || !vibe || interests.length === 0) {
    alert("Please complete your profile.");
    return;
  }

  setSearching(true);

  socket.emit("find-match", {
    username,
    age,
    gender,
    interests,
    vibe,
  });
};

 useEffect(() => {
  if (!socket) return;

  socket.on(
    "matched",
    ({ room, percentage, username }) => {
      setRoom(room);

      setMatchData({
        percentage,
        username,
      });

      setSearching(false);
    }
  );

  return () => {
    socket.off("matched");
  };
}, [socket]);

  // 👉 If matched, show chat
  if (room) {
   return (
  <ChatBox
    socket={socket}
    room={room}
    matchData={matchData}
    myUsername={username || "Anonymous"}
  />
);
  }

  return (
    <div className="w-full max-w-md p-6 rounded-2xl bg-white shadow-lg border border-gray-200">
      
      {/* Title */}
      <div className="flex items-center gap-2 justify-center mb-6">
        <Sparkles className="w-5 h-5 text-gray-700" />
        <h1 className="text-2xl font-semibold">Connect</h1>
      </div>

      {/* Username */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>Username</span>
        </div>
        <input
          type="text"
          placeholder="Optional"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
      </div>

      {/* Age */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Age Range</span>
        </div>
        <select
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-300"
        >
          <option value="">Select</option>
          <option>18-21</option>
          <option>22-25</option>
          <option>26-30</option>
        </select>
      </div>

      {/* Gender */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>Gender Preference</span>
        </div>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-300"
        >
          <option value="">Select</option>
          <option>Male</option>
          <option>Female</option>
          <option>Any</option>
        </select>
      </div>

      {/* Interests */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <Tag className="w-4 h-4" />
          <span>Interests</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {interestsList.map((item) => (
            <button
              key={item}
              onClick={() => toggleInterest(item)}
              className={`px-3 py-1 rounded-full text-sm border ${
                interests.includes(item)
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Vibe */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <Sparkles className="w-4 h-4" />
          <span>Conversation Type</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {vibes.map((v) => (
            <button
              key={v}
              onClick={() => setVibe(v)}
              className={`px-4 py-2 rounded-lg border ${
                vibe === v
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Button */}
      <button
        onClick={handleSubmit}
        disabled={searching}
        className="w-full py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:opacity-50"
      >
        {searching ? "Finding match..." : "Start Matching"}
      </button>
    </div>
  );
}