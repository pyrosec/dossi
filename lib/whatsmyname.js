'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsmyname = void 0;
const utils = __importStar(require("./utils"));
const path_1 = __importDefault(require("path"));
const child_process_1 = __importDefault(require("child_process"));
async function whatsmyname(username) {
    await utils.mkTmp();
    const dir = process.cwd();
    process.chdir(path_1.default.join(process.env.HOME, "WhatsMyName"));
    const subprocess = child_process_1.default.spawn("python3", [
        path_1.default.join(process.env.HOME, "WhatsMyName", "web_accounts_list_checker.py"),
        "-u",
        username,
        "-of",
        path_1.default.join(utils.tmpdir, username + ".json"),
    ], { stdio: "pipe" });
    process.chdir(dir);
    const stdout = await new Promise((resolve, reject) => {
        let data = "";
        subprocess.on("exit", (code) => {
            if (code !== 0)
                return reject(Error("non-zero exit code"));
            resolve(utils.readResultRaw(username));
        });
    });
    return stdout;
}
exports.whatsmyname = whatsmyname;
;
//# sourceMappingURL=whatsmyname.js.map