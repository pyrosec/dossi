"use strict";
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
exports.run = exports.lookupFaxVinQuery = exports.lookupTruePeopleSearchQuery = exports.twilioLookup = exports.printPiplResult = exports.sendPiplImages = exports.sendPiplImagesForPerson = exports.send = exports.from = exports.talkGhastly = exports.SPOOKY_STUFF = exports.queryToObject = exports.runZgrep = void 0;
const pipl_1 = require("pipl");
const donotcall_1 = require("donotcall");
const faxvin_puppeteer_1 = require("faxvin-puppeteer");
const truepeoplesearch_puppeteer_1 = require("truepeoplesearch-puppeteer");
const facebook_recover_puppeteer_1 = require("facebook-recover-puppeteer");
const path_1 = __importDefault(require("path"));
const child_process_1 = __importDefault(require("child_process"));
const twilio_1 = require("twilio");
const uuid_1 = require("uuid");
const subprocesses = __importStar(require("./subprocesses"));
const twilio = new twilio_1.Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const sdk = require("matrix-js-sdk");
const { SecretStorage, MemoryStore, MemoryCryptoStore, InteractiveAuth, AutojoinRoomsMixin, MatrixClient, } = sdk;
const donotcall = new donotcall_1.DonotcallClient();
const pipl = new pipl_1.PiplClient({ apiKey: process.env.PIPL_API_KEY });
const FAXVIN_DEFAULT_STATE = process.env.FAXVIN_DEFAULT_STATE || "TX";
const ZGREP_DIR = process.env.ZGREP_DIR;
const runZgrep = (query, to) => {
    console.log("session:: opened");
    const process = child_process_1.default.spawn("zgrep", [
        "-a",
        query,
        path_1.default.join(ZGREP_DIR, "*"),
    ]);
    process.stdout.setEncoding("utf8");
    process.stderr.setEncoding("utf8");
    process.stdout.on("data", (data) => (0, exports.send)(data, to));
    process.stderr.on("data", (data) => (0, exports.send)(data, to));
};
exports.runZgrep = runZgrep;
const queryToObject = (query) => {
    return query
        .match(/([^\s:]+):((?:"((?:[^"\\]|\\[\s\S])*)")|(?:\S+))/g)
        .map((v) => v.split(":").map((v) => (v.substr(0, 1) === '"' ? JSON.parse(v) : v)))
        .reduce((r, [key, value]) => {
        r[key] = value;
        return r;
    }, {});
};
exports.queryToObject = queryToObject;
exports.SPOOKY_STUFF = [
    "don't let them see you",
    "look alive ghost",
    "the cabal?",
    "just a nightmare",
    "boo",
    "happy haunting",
    "disappear #ghost",
];
const talkGhastly = async (to) => {
    await (0, exports.send)(exports.SPOOKY_STUFF[Math.floor(Math.random() * exports.SPOOKY_STUFF.length)], to);
};
exports.talkGhastly = talkGhastly;
exports.from = "@dossi:" + process.env.MATRIX_HOMESERVER;
var client;
const send = async (msg, to) => {
    return await new Promise((resolve, reject) => client.sendEvent(to, "m.room.message", {
        msgtype: "m.text",
        body: msg,
    }, "", (err, res) => err ? reject(err) : resolve(res)));
};
exports.send = send;
const sendPiplImagesForPerson = async (person, i, to) => {
    if ((person.images || []).length) {
        await (0, exports.send)("IMAGES FOR MATCH " + String(i), to);
        i++;
        await new Promise((resolve, reject) => setTimeout(resolve, 300));
    }
    for (const image of person.images || []) {
        await new Promise((resolve, reject) => setTimeout(resolve, 750));
        await (0, exports.send)(image.url, to);
        await new Promise((resolve, reject) => setTimeout(resolve, 750));
    }
};
exports.sendPiplImagesForPerson = sendPiplImagesForPerson;
const sendPiplImages = async (fromPipl, to) => {
    let i = 0;
    for (const person of fromPipl.possible_persons) {
        await (0, exports.sendPiplImagesForPerson)(person, i, to);
        i++;
    }
};
exports.sendPiplImages = sendPiplImages;
const printPiplResult = async (search, result, to) => {
    if (!result.possible_persons)
        return await (0, exports.send)("no results found", to);
    result.possible_persons.forEach((v) => {
        delete v["@search_pointer"];
    });
    const summary = { ...result };
    const data = JSON.stringify(summary, null, 2);
    await new Promise((resolve, reject) => setTimeout(resolve, 1000));
    await (0, exports.send)(data, to);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await (0, exports.sendPiplImages)(result, to);
};
exports.printPiplResult = printPiplResult;
const twilioLookup = (phoneNumber) => twilio.lookups
    .phoneNumbers(phoneNumber)
    .fetch({ type: ["carrier", "caller-name"] });
exports.twilioLookup = twilioLookup;
let jobId = 0;
const lookupTruePeopleSearchQuery = async (query, to) => {
    const truepeoplesearch = (await truepeoplesearch_puppeteer_1.TruePuppeteer.initialize({
        noSandbox: true,
    }));
    let id = jobId;
    jobId++;
    (0, exports.send)("truepeoplesearch|jobid:" + String(id), to);
    truepeoplesearch.logger = {
        info(v) {
            (0, exports.send)("truepeoplesearch|" + id + "|" + v, to);
        },
        debug(v) { },
        error(e) {
            (0, exports.send)("truepeoplesearch|" + id + "|error|" + e.message, to);
        },
    };
    let result;
    if (query.match(/^\d+$/)) {
        result = await truepeoplesearch.walkPhone({ phone: query });
    }
    else {
        const processed = (0, exports.queryToObject)(query);
        if (processed.streetaddress)
            result = await truepeoplesearch.walkAddress(processed);
        else
            result = await truepeoplesearch.walkName(processed);
    }
    truepeoplesearch._browser.close();
    return result;
};
exports.lookupTruePeopleSearchQuery = lookupTruePeopleSearchQuery;
const lookupFaxVinQuery = async (query) => {
    const faxvin = (await faxvin_puppeteer_1.FaxvinPuppeteer.initialize({
        noSandbox: true,
    }));
    let result;
    if (!query.match(/:/)) {
        result = await faxvin.searchPlate({
            state: FAXVIN_DEFAULT_STATE,
            plate: query,
        });
    }
    else {
        const processed = (0, exports.queryToObject)(query);
        result = await faxvin.searchPlate(processed);
    }
    faxvin.close();
    return result;
};
exports.lookupFaxVinQuery = lookupFaxVinQuery;
const evaluateCommand = async (body, to) => {
    const [first, queryParts] = body.split(/\s+/g);
    let query = queryParts.join(" ");
    if (first[0] !== "!")
        return;
    const cmd = first.substr(1);
    switch (cmd) {
        case "twilio":
            let body;
            if (query.length === 11)
                body = query.substr(1);
            else
                body = query;
            body = "+1" + query;
            const twilioResults = await (0, exports.twilioLookup)(body);
            await (0, exports.send)(JSON.stringify(twilioResults, null, 2), to);
            break;
        case "socialscan":
        case "whatsmyname":
        case "holehe":
            await (0, exports.send)(JSON.stringify(await subprocesses[cmd](query), null, 2), to);
            break;
        case "zgrep":
            await (0, exports.send)('zgrep -a "' + query + '"', to);
            await (0, exports.send)("wait for complete... (this takes a while)", to);
            await (0, exports.send)(await (0, exports.runZgrep)(query, to), to);
            await (0, exports.send)("zgrep:" + query + ": done!", to);
            break;
        case "truepeoplesearch":
            await (0, exports.send)("truepeoplesearch-puppeteer " + query, to);
            await (0, exports.send)("wait for complete ...", to);
            await (0, exports.send)(JSON.stringify(await (0, exports.lookupTruePeopleSearchQuery)(query, to), null, 2), to);
            break;
        case "facebook":
            await (0, exports.send)("facebook-recover-puppeteer " + query, to);
            await (0, exports.send)("wait for complete ...", to);
            const facebook = (await facebook_recover_puppeteer_1.FacebookRecoverPuppeteer.initialize({
                noSandbox: true,
            }));
            await (0, exports.send)(JSON.stringify(await facebook.lookupPhone({ phone: query }), null, 2), to);
            facebook.close();
            break;
        case "donotcall":
            await (0, exports.send)("donotcall " + query, to);
            await (0, exports.send)("wait for complete ...", to);
            await donotcall.savePhoneRegistration((0, exports.queryToObject)(query));
            break;
        case "faxvin":
            await (0, exports.send)("faxvin-puppeteer " + query, to);
            await (0, exports.send)("wait for complete ...", to);
            await (0, exports.send)(JSON.stringify(await (0, exports.lookupFaxVinQuery)(query), null, 2), to);
            break;
        case "sherlock":
            await (0, exports.send)("sherlock " + query + " --print-found", to);
            await (0, exports.send)("wait for complete ...", to);
            await subprocesses.sherlock(query, async (data) => await (0, exports.send)(data, to));
            break;
        case "pipl":
            if (query.indexOf(":") !== -1) {
                const fromPipl = await pipl.search((0, exports.queryToObject)(query));
                await (0, exports.printPiplResult)(query, fromPipl, to);
            }
            else if (query.indexOf("@") !== -1) {
                const data = await pipl.search({ email: query });
                await (0, exports.printPiplResult)(query, data, to);
            }
            else if (query.match(/\d+/)) {
                const data = await pipl.search({ phone: query });
                await (0, exports.printPiplResult)(query, data, to);
            }
            else {
                const split = query.split(/\s+/);
                const data = await pipl.search({
                    first_name: split[0],
                    last_name: split[1],
                    state: split[2],
                });
                await (0, exports.printPiplResult)(query, data, to);
            }
            break;
    }
    await (0, exports.talkGhastly)(to);
};
const run = async () => {
    const storage = new MemoryStore("simpleStorage");
    const cryptoStorage = new MemoryCryptoStore("cryptoStorage");
    client = new MatrixClient({
        baseUrl: "https://" + process.env.MATRIX_HOMESERVER,
        store: storage,
        deviceId: (0, uuid_1.v1)(),
        userId: "@dossi:" + process.env.MATRIX_HOMESERVER,
        accessToken: process.env.MATRIX_ACCESS_TOKEN,
        cryptoStore: cryptoStorage,
    });
    const _client = await new InteractiveAuth({
        matrixClient: client,
    });
    let accessToken = _client.accessToken;
    await client.initCrypto();
    await client.startClient();
    console.log("client started!");
    client.on("RoomMember.membership", function (event, member) {
        (async () => {
            if (member.membership === "invite") {
                await client.joinRoom(member.roomId);
            }
        })().catch((err) => console.error(err));
    });
    client.on("event", async (event, room) => {
        console.log(require('util').inspect([event, room], { colors: true, depth: 15 }));
        if (event.getType() !== "m.room.message")
            return;
        const { body } = event.getContent();
        const sender = event.getSender();
        if (sender.match("dossi"))
            return;
        await evaluateCommand(body, room.roomId);
    });
};
exports.run = run;
//# sourceMappingURL=dossi.js.map