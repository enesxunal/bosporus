/**
 * IONOS SMTP ham bağlantı testi (şifre gösterilmez).
 * Kullanım: npx tsx scripts/smtp-diagnose.ts
 */
import { readFileSync } from "fs";
import net from "net";
import tls from "tls";

function loadEnv() {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    let v = t.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[t.slice(0, i)] = v;
  }
}

function readResponse(socket: net.Socket): Promise<string> {
  return new Promise((resolve, reject) => {
    const onData = (buf: Buffer) => {
      socket.off("error", reject);
      resolve(buf.toString());
    };
    socket.once("data", onData);
    socket.once("error", reject);
  });
}

async function tryAuth(port: number, secure: boolean) {
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();
  const host = process.env.SMTP_HOST ?? "smtp.ionos.de";

  return new Promise<{ ok: boolean; log: string[] }>((resolve) => {
    const log: string[] = [];
    const socket = secure
      ? tls.connect({ host, port, servername: host })
      : net.connect({ host, port });

    const send = (cmd: string) => {
      log.push(`>> ${cmd.startsWith("AUTH") ? "AUTH LOGIN ***" : cmd}`);
      socket.write(cmd + "\r\n");
    };

    socket.on("error", (e) => {
      log.push(`HATA: ${e.message}`);
      resolve({ ok: false, log });
    });

    socket.on(secure ? "secureConnect" : "connect", async () => {
      try {
        let res = await readResponse(socket);
        log.push(`<< ${res.trim()}`);

        send(`EHLO bosporus-gmbh.com`);
        res = await readResponse(socket);
        log.push(`<< ${res.split("\r\n")[0]}`);

        if (!secure) {
          send("STARTTLS");
          res = await readResponse(socket);
          log.push(`<< ${res.trim()}`);
          const tlsSocket = tls.connect({ socket, servername: host }, async () => {
            res = await readResponse(tlsSocket as unknown as net.Socket);
            log.push(`<< ${res.split("\r\n")[0]}`);
            (tlsSocket as unknown as net.Socket).write(`EHLO bosporus-gmbh.com\r\n`);
            res = await readResponse(tlsSocket as unknown as net.Socket);
            log.push(`<< ${res.split("\r\n")[0]}`);

            const userB64 = Buffer.from(user).toString("base64");
            const passB64 = Buffer.from(pass).toString("base64");
            (tlsSocket as unknown as net.Socket).write(`AUTH LOGIN\r\n`);
            res = await readResponse(tlsSocket as unknown as net.Socket);
            log.push(`<< ${res.trim()}`);
            (tlsSocket as unknown as net.Socket).write(`${userB64}\r\n`);
            res = await readResponse(tlsSocket as unknown as net.Socket);
            log.push(`<< ${res.trim()}`);
            (tlsSocket as unknown as net.Socket).write(`${passB64}\r\n`);
            res = await readResponse(tlsSocket as unknown as net.Socket);
            log.push(`<< ${res.trim()}`);
            const ok = res.startsWith("235");
            tlsSocket.end();
            resolve({ ok, log });
          });
          return;
        }

        const userB64 = Buffer.from(user).toString("base64");
        const passB64 = Buffer.from(pass).toString("base64");
        send("AUTH LOGIN");
        res = await readResponse(socket);
        log.push(`<< ${res.trim()}`);
        send(userB64);
        res = await readResponse(socket);
        log.push(`<< ${res.trim()}`);
        send(passB64);
        res = await readResponse(socket);
        log.push(`<< ${res.trim()}`);
        const ok = res.startsWith("235");
        socket.end();
        resolve({ ok, log });
      } catch (e) {
        log.push(`HATA: ${e instanceof Error ? e.message : e}`);
        socket.end();
        resolve({ ok: false, log });
      }
    });
  });
}

async function main() {
  loadEnv();
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("SMTP_USER / SMTP_PASS eksik");
    process.exit(1);
  }
  console.log("Kullanıcı:", process.env.SMTP_USER);
  console.log("Şifre uzunluğu:", process.env.SMTP_PASS.length);

  for (const [port, secure] of [
    [587, false],
    [465, true],
  ] as const) {
    console.log(`\n--- Port ${port} ---`);
    const { ok, log } = await tryAuth(port, secure);
    for (const line of log) console.log(line);
    console.log(ok ? "✅ AUTH başarılı" : "❌ AUTH başarısız");
  }
}

main();
