import { randomBytes, scryptSync } from "node:crypto";
import { stdin, stdout } from "node:process";
if (!stdin.isTTY) throw new Error("Use an interactive terminal to enter the password privately.");
stdout.write("管理员密码（至少 12 位，输入不回显）：");
stdin.setRawMode(true);
stdin.resume();
let password = "";
stdin.on("data", (chunk) => {
  for (const char of chunk.toString()) {
    if (char === "\u0003") { stdin.setRawMode(false); process.exit(1); }
    if (char === "\r" || char === "\n") {
      stdin.setRawMode(false); stdin.pause(); stdout.write("\n");
      if (password.length < 12) { console.error("密码至少 12 位。"); process.exit(1); }
      const salt = randomBytes(16).toString("hex");
      console.log(`ADMIN_PASSWORD_HASH=scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`);
      process.exit(0);
    }
    if (char === "\u007f") password = password.slice(0, -1);
    else if (char >= " " && password.length < 256) password += char;
  }
});
