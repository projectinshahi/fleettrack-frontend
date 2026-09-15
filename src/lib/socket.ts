import { io } from "socket.io-client";

// Validate NEXT_PUBLIC_SOCKET_URL at load so a missing/invalid value fails loudly
// instead of silently connecting socket.io to the page origin.
const rawUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

let socketUrl = "";
try {
  if (rawUrl) {
    new URL(rawUrl); // throws on an invalid URL
    socketUrl = rawUrl;
  }
} catch {
  // leave socketUrl empty → treated as unconfigured below
}

const configured = socketUrl !== "";

if (!configured) {
  console.error(
    "[FleetTrack] NEXT_PUBLIC_SOCKET_URL is missing or invalid — live vehicle updates are disabled. Set it to your API's socket URL (e.g. http://localhost:5000) and rebuild.",
  );
}

// When unconfigured we still export a socket so the app stays stable, but with
// autoConnect off it never dials the wrong origin — listeners simply never fire.
export const socket = io(socketUrl, {
  transports: ["websocket"],
  autoConnect: configured,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
  timeout: 20000,
  // Send the JWT on every (re)connect. As a callback it re-reads localStorage each time,
  // so login / refresh / reconnect all carry a fresh token. The gateway rejects sockets
  // without a valid token, and scopes updates to the authenticated client's vehicles.
  auth: (cb) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    cb({ token: token ?? "" });
  },
});

socket.on("connect", () => {
  console.log("✅ Socket Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🔌 Socket Disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.warn("⚠️ Reconnecting:", err.message);
});