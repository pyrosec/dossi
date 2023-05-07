'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mkTmp = exports.readResultRaw = exports.readResult = exports.tmpdir = void 0;
const mkdirp_1 = __importDefault(require("mkdirp"));
const tmpdir_1 = __importDefault(require("tmpdir"));
exports.tmpdir = tmpdir_1.default;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
async function readResult(query) {
    const result = JSON.parse((await fs_extra_1.default.readFile(path_1.default.join(tmpdir_1.default, query + ".json"), "utf8")).trim());
    return result;
}
exports.readResult = readResult;
;
async function readResultRaw(query) {
    const result = (await fs_extra_1.default.readFile(path_1.default.join(tmpdir_1.default, query + ".json"), "utf8")).trim();
    return result;
}
exports.readResultRaw = readResultRaw;
;
async function mkTmp() {
    await (0, mkdirp_1.default)(tmpdir_1.default);
}
exports.mkTmp = mkTmp;
;
//# sourceMappingURL=utils.js.map