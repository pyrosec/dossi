"use strict";
import url from "url";
import { PiplClient } from "pipl";
import fs from "fs-extra";
import { DonotcallClient } from "donotcall";
import { FaxvinPuppeteer } from "faxvin-puppeteer";
import { TruePuppeteer } from "truepeoplesearch-puppeteer";
import lodash from "lodash";
import { FacebookRecoverPuppeteer } from "facebook-recover-puppeteer";
import path from "path";
import mkdirp from "mkdirp";
import child_process from "child_process";
import { Twilio } from "twilio";
import { v1 } from "uuid";
import * as subprocesses from "./subprocesses";
const twilio = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const {
  MatrixClient,
  MatrixAuth,
  SimpleFsStorageProvider,
  AutojoinRoomsMixin,
  RustSdkCryptoStorageProvider,
} = require("matrix-bot-sdk");
const sdk = require("matrix-js-sdk");

// const {
//   SecretStorage,
//   MemoryStore,
//   MemoryCryptoStore,
//   InteractiveAuth,
//   AutojoinRoomsMixin,
//   MatrixClient,
// } = sdk;

const donotcall = new DonotcallClient();
const pipl = new PiplClient({ apiKey: process.env.PIPL_API_KEY });

const FAXVIN_DEFAULT_STATE = process.env.FAXVIN_DEFAULT_STATE || "TX";
const ZGREP_DIR = process.env.ZGREP_DIR;

export const runZgrep = (query, to) => {
  console.log("session:: opened");
  const process = child_process.spawn("zgrep", [
    "-a",
    query,
    path.join(ZGREP_DIR, "*"),
  ]);
  process.stdout.setEncoding("utf8");
  process.stderr.setEncoding("utf8");
  process.stdout.on("data", (data) => send(data, to));
  process.stderr.on("data", (data) => send(data, to));
};
export const queryToObject = (query) => {
  return query
    .match(/([^\s:]+):((?:"((?:[^"\\]|\\[\s\S])*)")|(?:\S+))/g)
    .map((v) =>
      v.split(":").map((v) => (v.substr(0, 1) === '"' ? JSON.parse(v) : v))
    )
    .reduce((r, [key, value]) => {
      r[key] = value;
      return r;
    }, {});
};

export const SPOOKY_STUFF = [
  "don't let them see you",
  "look alive ghost",
  "the cabal?",
  "just a nightmare",
  "boo",
  "happy haunting",
  "disappear #ghost",
];
export const talkGhastly = async (to) => {
  await send(SPOOKY_STUFF[Math.floor(Math.random() * SPOOKY_STUFF.length)], to);
};

export const from = "@dossi:" + process.env.MATRIX_HOMESERVER;

var client;

export const send = async (msg, to) => {
  return await new Promise((resolve, reject) => client.sendEvent(to, "m.room.message", {
    msgtype: "m.text",
    body: msg,
  }, "", (err, res) => err ? reject(err) : resolve(res)));
};

export const sendPiplImagesForPerson = async (person, i, to) => {
  if ((person.images || []).length) {
    await send("IMAGES FOR MATCH " + String(i), to);
    i++;
    await new Promise((resolve, reject) => setTimeout(resolve, 300));
  }
  for (const image of person.images || []) {
    await new Promise((resolve, reject) => setTimeout(resolve, 750));
    await send(image.url, to);
    await new Promise((resolve, reject) => setTimeout(resolve, 750));
  }
};

export const sendPiplImages = async (fromPipl, to) => {
  let i = 0;
  for (const person of fromPipl.possible_persons) {
    await sendPiplImagesForPerson(person, i, to);
    i++;
  }
};

export const printPiplResult = async (search, result, to) => {
  if (!result.possible_persons) return await send("no results found", to);
  result.possible_persons.forEach((v) => {
    delete v["@search_pointer"];
  });
  const summary = { ...result };
  const data = JSON.stringify(summary, null, 2);
  await new Promise((resolve, reject) => setTimeout(resolve, 1000));

  await send(data, to);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await sendPiplImages(result, to);
};

export const twilioLookup = (phoneNumber) =>
  twilio.lookups
    .phoneNumbers(phoneNumber)
    .fetch({ type: ["carrier", "caller-name"] });

let jobId = 0;

export const lookupTruePeopleSearchQuery = async (query, to) => {
  const truepeoplesearch = (await TruePuppeteer.initialize({
    noSandbox: true,
  })) as TruePuppeteer;
  let id = jobId;
  jobId++;
  send("truepeoplesearch|jobid:" + String(id), to);
  truepeoplesearch.logger = {
    info(v) {
      send("truepeoplesearch|" + id + "|" + v, to);
    },
    debug(v) {},
    error(e) {
      send("truepeoplesearch|" + id + "|error|" + e.message, to);
    },
  };
  let result;
  if (query.match(/^\d+$/)) {
    result = await truepeoplesearch.walkPhone({ phone: query });
  } else {
    const processed = queryToObject(query);
    if (processed.streetaddress)
      result = await truepeoplesearch.walkAddress(processed);
    else result = await truepeoplesearch.walkName(processed);
  }
  truepeoplesearch._browser.close();
  return result;
};

export const lookupFaxVinQuery = async (query) => {
  const faxvin = (await FaxvinPuppeteer.initialize({
    noSandbox: true,
  })) as FaxvinPuppeteer;
  let result;
  if (!query.match(/:/)) {
    result = await faxvin.searchPlate({
      state: FAXVIN_DEFAULT_STATE,
      plate: query,
    });
  } else {
    const processed = queryToObject(query);
    result = await faxvin.searchPlate(processed);
  }
  faxvin.close();
  return result;
};

const evaluateCommand = async (body, to) => {
  const splitBody = body.split(/\s+/g);
  const first = splitBody[0];
  const queryParts = splitBody.length > 1 ? splitBody.slice(1) : [];
  let query = queryParts.join(" ");

  if (first[0] !== "!") return;
  const cmd = first.substr(1);
  switch (cmd) {
    case "twilio":
      let body;
      if (query.length === 11) body = query.substr(1);
      else body = query;
      body = "+1" + query;
      const twilioResults = await twilioLookup(body);
      await send(JSON.stringify(twilioResults, null, 2), to);
      break;
    case "socialscan":
    case "whatsmyname":
    case "holehe":
      await send(JSON.stringify(await subprocesses[cmd](query), null, 2), to);
      break;
    case "zgrep":
      await send('zgrep -a "' + query + '"', to);
      await send("wait for complete... (this takes a while)", to);
      await send(await runZgrep(query, to), to);
      await send("zgrep:" + query + ": done!", to);
      break;
    case "truepeoplesearch":
      await send("truepeoplesearch-puppeteer " + query, to);
      await send("wait for complete ...", to);
      await send(
        JSON.stringify(await lookupTruePeopleSearchQuery(query, to), null, 2),
        to
      );
      break;
    case "facebook":
      await send("facebook-recover-puppeteer " + query, to);
      await send("wait for complete ...", to);
      const facebook = (await FacebookRecoverPuppeteer.initialize({
        noSandbox: true,
      })) as FacebookRecoverPuppeteer;
      await send(
        JSON.stringify(await facebook.lookupPhone({ phone: query }), null, 2),
        to
      );
      facebook.close();
      break;
    case "donotcall":
      await send("donotcall " + query, to);
      await send("wait for complete ...", to);
      await donotcall.savePhoneRegistration(queryToObject(query));
      break;
    case "faxvin":
      await send("faxvin-puppeteer " + query, to);
      await send("wait for complete ...", to);
      await send(JSON.stringify(await lookupFaxVinQuery(query), null, 2), to);
      break;
    case "sherlock":
      await send("sherlock " + query + " --print-found", to);
      await send("wait for complete ...", to);
      await subprocesses.sherlock(query, async (data) => await send(data, to));
      break;
    case "pipl":
      if (query.indexOf(":") !== -1) {
        const fromPipl = await pipl.search(queryToObject(query));
        await printPiplResult(query, fromPipl, to);
      } else if (query.indexOf("@") !== -1) {
        const data = await pipl.search({ email: query });
        await printPiplResult(query, data, to);
      } else if (query.match(/\d+/)) {
        const data = await pipl.search({ phone: query });
        await printPiplResult(query, data, to);
      } else {
        const split = query.split(/\s+/);
        const data = await pipl.search({
          first_name: split[0],
          last_name: split[1],
          state: split[2],
        });
        await printPiplResult(query, data, to);
      }
      break;
  }
  await talkGhastly(to);
};

export const run = async () => {
  const storageDirectory = path.join(process.env.HOME, ".matrix-bot", "storage");
  mkdirp.sync(storageDirectory);
  const storage = new SimpleFsStorageProvider(path.join(storageDirectory, "simple.json"));
  const cryptoStorage = new RustSdkCryptoStorageProvider(storageDirectory);
  const _client = await new MatrixAuth("https://" + process.env.MATRIX_HOMESERVER).passwordLogin(
    process.env.MATRIX_USERNAME,
    process.env.MATRIX_PASSWORD,
    process.env.MATRIX_USERNAME
  );
  client = await new MatrixClient(
    "https://" + process.env.MATRIX_HOMESERVER,
    _client.accessToken,
    storage,
    cryptoStorage,
  );
  
  /* const _client = await new InteractiveAuth({
    matrixClient: client,
  }); */

  await AutojoinRoomsMixin.setupOnClient(client);
  await client.start().then(async () => {
    console.log(client.crypto.isReady);
  });
  // let accessToken = _client.accessToken;
  // await client.initCrypto();
  // await client.startClient();
  
  client.on("RoomMember.membership", function (event, member) {
    (async () => {
      if (member.membership === "invite") {
        await client.joinRoom(member.roomId);
      }
    })().catch((err) => console.error(err));
  });
  client.on("event", async (event, room) => {
    console.log(require('util').inspect([ event, room ], { colors: true, depth: 15 }));
    if (event.getType() !== "m.room.message") return;
    const { body } = event.getContent();
    const sender = event.getSender();
    if (sender.match("dossi")) return;
    await evaluateCommand(body, room.roomId);
  });
  client.on("room.message", async (roomId, event) => {
      console.log(event);
      if (event["content"]?.["msgtype"] !== "m.text") return; //don't repond to non-text messages
      if (event["sender"] === (await client.getUserId())) return; //dont respond to own messages

      const body = event["content"]["body"];
      if (body?.startsWith("!hello")) {
            await client.replyNotice(roomId, event, "Hello World");
         }
    
      await evaluateCommand(body, roomId);
    });
};
