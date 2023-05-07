'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.holehe = exports.stripUsed = void 0;
const child_process_1 = __importDefault(require("child_process"));
const stripUsed = (s) => {
    return s
        .split("\n")
        .filter((v) => v.match("[+]"))
        .join("\n");
};
exports.stripUsed = stripUsed;
const holehe = async function holehe(username) {
    const subprocess = child_process_1.default.spawn("holehe", [username, "--only-used", "--no-color"], { stdio: "pipe" });
    const stdout = await new Promise((resolve, reject) => {
        let data = "";
        subprocess.stdout.setEncoding("utf8");
        subprocess.stdout.on("data", (v) => {
            data += v;
        });
        subprocess.on("exit", (code) => {
            if (code !== 0)
                return reject(Error("non-zero exit code"));
            resolve(data);
        });
    });
    return exports.stripUsed(stdout);
};
exports.holehe = holehe;
//# sourceMappingURL=holehe.js.map