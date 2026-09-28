// Runs on the CI runner (deploy/ship.sh): a local TCP port whose connections
// reach the registry on the server, each carried by its own SSH session.
// Needed because the server's sshd refuses port forwarding (`ssh -L`); a
// plain command session is allowed. Node is preinstalled on the runners.
//   node deploy/registry-proxy.mjs <local port> <registry port on the server> <ssh log file>
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import net from "node:net";

const [localPort, remotePort, logFile] = process.argv.slice(2);
const log = createWriteStream(logFile, { flags: "a" });
const remote = ["prod", "docker", "exec", "-i", "seodaily-registry", "nc", "127.0.0.1", remotePort];

net
  .createServer((socket) => {
    const ssh = spawn("ssh", remote, { stdio: ["pipe", "pipe", "pipe"] });
    ssh.stderr.on("data", (chunk) => log.write(chunk));
    socket.pipe(ssh.stdin);
    ssh.stdout.pipe(socket);
    ssh.stdin.on("error", () => {});
    socket.on("error", () => ssh.kill());
    socket.on("close", () => ssh.kill());
    ssh.on("exit", () => socket.end());
  })
  .listen(Number(localPort), "127.0.0.1", () => console.log(`registry proxy on 127.0.0.1:${localPort}`));
