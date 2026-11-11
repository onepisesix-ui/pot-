const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const readline = require('readline');
const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(text, (ans) => { rl.close(); resolve(ans); }));
};
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['Pot Bot', 'Chrome', '1.0']
  });
  if (!sock.authState.creds.registered) {
    const phone = await question('رقم الواتساب مع كود البلد: ');
    const code = await sock.requestPairingCode(phone.trim());
    console.log(`كود الربط: ${code}`);
  }
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') console.log('البوت اشتغل!');
    if (connection === 'close' && lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) startBot();
  });
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const text = msg.message.conversation || '';
    const from = msg.key.remoteJid;
    if (text.toLowerCase() === 'ping') {
      await sock.sendMessage(from, { text: 'Pong! البوت شغال' });
    }
  });
}
startBot();
