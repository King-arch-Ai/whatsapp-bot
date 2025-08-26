import makeWASocket, { useMultiFileAuthState, makeCacheableSignalKeyStore } from "@whiskeysockets/baileys"
import MAIN_LOGGER from "@whiskeysockets/baileys/lib/Utils/logger.js"
import qrcode from "qrcode-terminal"

const logger = MAIN_LOGGER.child({})
logger.level = "silent"

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")

  const sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: true,
    logger,
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update
    if (qr) {
      console.log("Scan this QR code in WhatsApp app to link:")
      qrcode.generate(qr, { small: true })
    }
    if (connection === "open") {
      console.log("✅ Bot is connected to WhatsApp")
    }
  })

  sock.ev.on("messages.upsert", async (msg) => {
    const message = msg.messages[0]
    if (!message.message || message.key.fromMe) return

    const from = message.key.remoteJid
    const text = message.message.conversation || ""

    console.log("📩 Message:", text)

    let reply
    if (text.toLowerCase() === "hi" || text.toLowerCase() === "hello") {
      reply = "Hey! 👋 I'm your WhatsApp bot."
    } else if (text.toLowerCase() === "time") {
      reply = "⏰ Current time: " + new Date().toLocaleTimeString()
    } else if (text.toLowerCase() === "date") {
      reply = "📅 Today's date: " + new Date().toLocaleDateString()
    } else {
      reply = "🤖 Sorry, I only understand: hi, hello, time, date."
    }

    await sock.sendMessage(from, { text: reply })
  })
}

startBot()
