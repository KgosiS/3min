"use client";

import { useState, useEffect } from "react";

import {
  SkipForward,
  Clock,
  Users,
  Eye,
} from "lucide-react";

const prompts = [
  "What’s something you’re trying to improve?",
  "What’s a controversial opinion you have?",
  "If money wasn’t an issue, what would you do?",
  "What’s something people misunderstand about you?",
  "What’s your biggest goal right now?",
];

export default function ChatBox({
  socket,
  room,
  matchData,
  myUsername,
  userProfile,
}) {
  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [timeLeft, setTimeLeft] =
    useState(180);

  const [activePrompts, setActivePrompts] =
    useState([]);

  const [typing, setTyping] =
    useState(false);

  const [onlineCount, setOnlineCount] =
    useState(0);

  const [revealed, setRevealed] =
    useState(false);

  const [partnerName, setPartnerName] =
    useState("Anonymous");

  const [systemMessage, setSystemMessage] =
    useState("");

  // random prompts
  useEffect(() => {
    const shuffled = [...prompts].sort(
      () => 0.5 - Math.random()
    );

    setActivePrompts(
      shuffled.slice(0, 3)
    );
  }, []);

  // online count
  useEffect(() => {
    if (!socket) return;

    const handleOnlineCount = (
      count
    ) => {
      setOnlineCount(count);
    };

    socket.off("online-count");

    socket.on(
      "online-count",
      handleOnlineCount
    );

    return () => {
      socket.off(
        "online-count",
        handleOnlineCount
      );
    };
  }, [socket]);

  // receive messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (
      msg
    ) => {
      setMessages((prev) => [
        ...prev,
        {
          text: msg,
          sender: "other",
        },
      ]);
    };

    socket.off("receive-message");

    socket.on(
      "receive-message",
      handleReceiveMessage
    );

    return () => {
      socket.off(
        "receive-message",
        handleReceiveMessage
      );
    };
  }, [socket]);

  // typing
  useEffect(() => {
    if (!socket) return;

    let typingTimeout;

    const handleTypingEvent = () => {

      setTyping(true);

      clearTimeout(
        typingTimeout
      );

      typingTimeout = setTimeout(
        () => {
          setTyping(false);
        },
        1500
      );
    };

    socket.off("user-typing");

    socket.on(
      "user-typing",
      handleTypingEvent
    );

    return () => {
      clearTimeout(
        typingTimeout
      );

      socket.off(
        "user-typing",
        handleTypingEvent
      );
    };
  }, [socket]);

  // partner skipped
  useEffect(() => {
    if (!socket) return;

    const handlePartnerSkipped =
      () => {

        setSystemMessage(
          "Your match skipped the chat."
        );

        setMessages([]);

        setTimeout(() => {

          setSystemMessage("");

          if (userProfile) {
            socket.emit(
              "find-match",
              userProfile
            );
          }

        }, 2000);
      };

    socket.off(
      "partner-skipped"
    );

    socket.on(
      "partner-skipped",
      handlePartnerSkipped
    );

    return () => {
      socket.off(
        "partner-skipped",
        handlePartnerSkipped
      );
    };
  }, [socket]);

  // reveal identity
  useEffect(() => {
    if (!socket) return;

    const handleRevealRequest = (
      username
    ) => {

      const accepted = confirm(
        `${username} wants to reveal their identity`
      );

      if (accepted) {

        setRevealed(true);

        setPartnerName(
          username
        );

        socket.emit(
          "accept-reveal",
          {
            room,
            username:
              myUsername ||
              "Anonymous",
          }
        );
      }
    };

    const handleRevealApproved = (
      username
    ) => {

      setRevealed(true);

      setPartnerName(
        username
      );

      setSystemMessage(
        `${username} revealed their identity`
      );

      setTimeout(() => {
        setSystemMessage("");
      }, 3000);
    };

    socket.off(
      "reveal-request"
    );

    socket.off(
      "reveal-approved"
    );

    socket.on(
      "reveal-request",
      handleRevealRequest
    );

    socket.on(
      "reveal-approved",
      handleRevealApproved
    );

    return () => {

      socket.off(
        "reveal-request",
        handleRevealRequest
      );

      socket.off(
        "reveal-approved",
        handleRevealApproved
      );
    };
  }, [socket]);

  // synced timer
  useEffect(() => {
    if (!socket) return;

    if (timeLeft <= 0) {
      handleSkip();
      return;
    }

    const timer = setInterval(() => {

      setTimeLeft((prev) => {

        const updated =
          prev - 1;

        socket.emit(
          "sync-timer",
          {
            room,
            timeLeft:
              updated,
          }
        );

        return updated;
      });

    }, 1000);

    const handleTimerUpdate = (
      syncedTime
    ) => {

      setTimeLeft(
        syncedTime
      );
    };

    socket.off(
      "timer-update"
    );

    socket.on(
      "timer-update",
      handleTimerUpdate
    );

    return () => {

      clearInterval(
        timer
      );

      socket.off(
        "timer-update",
        handleTimerUpdate
      );
    };
  }, [socket, timeLeft]);

  // send message
  const sendMessage = (
    text
  ) => {

    if (!text.trim())
      return;

    socket.emit(
      "send-message",
      {
        room,
        message: text,
      }
    );

    setMessages((prev) => [
      ...prev,
      {
        text,
        sender: "me",
      },
    ]);

    setMessage("");
  };

  // typing
  const handleTyping = (e) => {

    setMessage(
      e.target.value
    );

    socket.emit(
      "typing",
      room
    );
  };

  // skip
  const handleSkip = () => {

    setMessages([]);

    setTimeLeft(180);

    setRevealed(false);

    setPartnerName(
      "Anonymous"
    );

    socket.emit(
      "skip",
      { room }
    );

    if (userProfile) {

      socket.emit(
        "find-match",
        userProfile
      );
    }
  };

  // reveal
  const handleReveal = () => {

    socket.emit(
      "request-reveal",
      {
        room,
        username:
          myUsername ||
          "Anonymous",
      }
    );
  };

  // timer format
  const formatTime = () => {

    const m = Math.floor(
      timeLeft / 60
    );

    const s =
      timeLeft % 60;

    return `${m}:${
      s < 10
        ? "0"
        : ""
    }${s}`;
  };

  return (
    <div className="w-full max-w-md h-[90vh] flex flex-col bg-white border border-gray-200 rounded-3xl shadow-xl overflow-hidden">

      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b bg-white">

        <div>
          <div className="font-semibold text-sm text-gray-900">
            {revealed
              ? partnerName
              : "Anonymous"}
          </div>

          <div className="text-xs text-gray-500">
            {matchData?.percentage || 0}%
            compatibility
          </div>
        </div>

        <div className="flex items-center gap-4">

          {/* online */}
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            {onlineCount}
          </div>

          {/* timer */}
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {formatTime()}
          </div>

          {/* reveal */}
          <button
            onClick={
              handleReveal
            }
            className="text-gray-500 hover:text-black transition"
          >
            <Eye className="w-5 h-5" />
          </button>

          {/* skip */}
          <button
            onClick={
              handleSkip
            }
            className="text-gray-500 hover:text-black transition"
          >
            <SkipForward className="w-5 h-5" />
          </button>

        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafafa]">

        {/* system */}
        {systemMessage && (
          <div className="text-center text-xs text-gray-400 py-2">
            {systemMessage}
          </div>
        )}

        {/* chat */}
        {messages.map(
          (msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.sender ===
                "me"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl max-w-[75%] text-sm shadow-sm break-words ${
                  msg.sender ===
                  "me"
                    ? "bg-black text-white rounded-br-md"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </div>
          )
        )}

        {/* typing */}
        {typing && (
          <div className="text-xs text-gray-400 px-1 animate-pulse">
            User is typing...
          </div>
        )}

      </div>

      {/* PROMPTS */}
      <div className="px-3 py-2 flex gap-2 overflow-x-auto bg-white border-t">

        {activePrompts.map(
          (p, i) => (
            <button
              key={i}
              onClick={() =>
                sendMessage(
                  p
                )
              }
              className="whitespace-nowrap px-3 py-1.5 text-xs border border-gray-300 rounded-full bg-gray-50 hover:bg-gray-100 transition"
            >
              {p}
            </button>
          )
        )}

      </div>

      {/* INPUT */}
      <div className="p-3 border-t bg-white flex items-center gap-2">

        <input
          value={message}
          onChange={
            handleTyping
          }
          placeholder="Type a message..."
          className="flex-1 p-3 rounded-2xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        />

        <button
          onClick={() =>
            sendMessage(
              message
            )
          }
          className="px-5 py-3 bg-black text-white rounded-2xl text-sm font-medium hover:opacity-90 transition"
        >
          Send
        </button>

      </div>
    </div>
  );
}