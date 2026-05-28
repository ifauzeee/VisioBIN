import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const rootPage = await readFile(new URL("../src/app/page.js", import.meta.url), "utf8");
const loginScreen = await readFile(new URL("../src/app/components/LoginScreen.js", import.meta.url), "utf8");
const ringkasanPage = await readFile(new URL("../src/app/(dashboard)/ringkasan/page.js", import.meta.url), "utf8");

assert.match(rootPage, /LoginScreen/);
assert.match(loginScreen, /Masuk ke Sistem/);
assert.match(loginScreen, /Masuk sebagai Tamu/);
assert.match(ringkasanPage, /RingkasanView/);

console.log("homepage smoke checks passed");
