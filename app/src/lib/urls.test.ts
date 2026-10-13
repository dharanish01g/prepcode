/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";
import { classifyUrl } from "./urls.ts";

const DEV_ORIGIN = "http://localhost:1420";
const PROD_TAURI_ORIGIN = "tauri://localhost";
const PROD_HTTP_ORIGIN = "http://tauri.localhost";

test("external https and http links classify as external", () => {
  const https = classifyUrl("https://example.com", DEV_ORIGIN);
  assert.equal(https.type, "external");
  if (https.type === "external") assert.equal(https.url, "https://example.com/");

  const http = classifyUrl("http://example.com/docs?page=1#intro", DEV_ORIGIN);
  assert.equal(http.type, "external");
  if (http.type === "external") assert.equal(http.url, "http://example.com/docs?page=1#intro");

  const externalPort = classifyUrl("http://localhost:3000/api", DEV_ORIGIN);
  assert.equal(externalPort.type, "external");
});

test("protocol-relative links normalize to https and classify as external", () => {
  const protoRelative = classifyUrl("//example.com/path", DEV_ORIGIN);
  assert.equal(protoRelative.type, "external");
  if (protoRelative.type === "external")
    assert.equal(protoRelative.url, "https://example.com/path");

  const protoRelativeWithQuery = classifyUrl("//cdn.example.org/lib.js?v=2#sec", DEV_ORIGIN);
  assert.equal(protoRelativeWithQuery.type, "external");
  if (protoRelativeWithQuery.type === "external") {
    assert.equal(protoRelativeWithQuery.url, "https://cdn.example.org/lib.js?v=2#sec");
  }

  // Protocol relative in production Tauri scheme
  const protoInProd = classifyUrl("//example.com", PROD_TAURI_ORIGIN);
  assert.equal(protoInProd.type, "external");
  if (protoInProd.type === "external") assert.equal(protoInProd.url, "https://example.com/");
});

test("fragment-only links classify as internal fragments", () => {
  const hash = classifyUrl("#constraints", DEV_ORIGIN);
  assert.equal(hash.type, "internal");
  if (hash.type === "internal") {
    assert.equal(hash.url, "#constraints");
    assert.equal(hash.isFragment, true);
  }

  const emptyHash = classifyUrl("#", DEV_ORIGIN);
  assert.equal(emptyHash.type, "internal");
  if (emptyHash.type === "internal") {
    assert.equal(emptyHash.url, "#");
    assert.equal(emptyHash.isFragment, true);
  }
});

test("query-string links classify as internal navigation", () => {
  const query = classifyUrl("?tab=solutions&sort=votes", DEV_ORIGIN);
  assert.equal(query.type, "internal");
  if (query.type === "internal") {
    assert.equal(query.url, "?tab=solutions&sort=votes");
    assert.equal(query.isFragment, false);
  }
});

test("relative paths classify as internal without external routing", () => {
  const absPath = classifyUrl("/practice/two-sum", DEV_ORIGIN);
  assert.equal(absPath.type, "internal");
  if (absPath.type === "internal") {
    assert.equal(absPath.url, "http://localhost:1420/practice/two-sum");
    assert.equal(absPath.isFragment, false);
  }

  const relDotPath = classifyUrl("./docs/intro.md", `${DEV_ORIGIN}/guide/`);
  assert.equal(relDotPath.type, "internal");
  if (relDotPath.type === "internal") {
    assert.equal(relDotPath.url, "http://localhost:1420/guide/docs/intro.md");
    assert.equal(relDotPath.isFragment, false);
  }

  const parentPath = classifyUrl("../faq", `${DEV_ORIGIN}/guide/sub/`);
  assert.equal(parentPath.type, "internal");
  if (parentPath.type === "internal") {
    assert.equal(parentPath.url, "http://localhost:1420/guide/faq");
    assert.equal(parentPath.isFragment, false);
  }
});

test("absolute internal URLs matching app origin classify as internal", () => {
  const devInternal = classifyUrl("http://localhost:1420/jobs", DEV_ORIGIN);
  assert.equal(devInternal.type, "internal");
  if (devInternal.type === "internal") {
    assert.equal(devInternal.url, "http://localhost:1420/jobs");
    assert.equal(devInternal.isFragment, false);
  }

  const prodTauriInternal = classifyUrl("tauri://localhost/settings", PROD_TAURI_ORIGIN);
  assert.equal(prodTauriInternal.type, "internal");
  if (prodTauriInternal.type === "internal") {
    assert.equal(prodTauriInternal.url, "tauri://localhost/settings");
    assert.equal(prodTauriInternal.isFragment, false);
  }

  const prodHttpInternal = classifyUrl("http://tauri.localhost/dashboard", PROD_HTTP_ORIGIN);
  assert.equal(prodHttpInternal.type, "internal");
  if (prodHttpInternal.type === "internal") {
    assert.equal(prodHttpInternal.url, "http://tauri.localhost/dashboard");
    assert.equal(prodHttpInternal.isFragment, false);
  }
});

test("dangerous schemes (javascript:, data:, file:, vbscript:, blob:) are blocked", () => {
  const js1 = classifyUrl("javascript:alert(document.domain)", DEV_ORIGIN);
  assert.equal(js1.type, "blocked");

  const jsWhitespace = classifyUrl("  javascript:void(0)  ", DEV_ORIGIN);
  assert.equal(jsWhitespace.type, "blocked");

  const jsObfuscated = classifyUrl("jav\tascript:alert(1)", DEV_ORIGIN);
  assert.equal(jsObfuscated.type, "blocked");

  const jsCase = classifyUrl("JaVaScRiPt:alert(1)", DEV_ORIGIN);
  assert.equal(jsCase.type, "blocked");

  const dataUrl = classifyUrl("data:text/html,<script>alert(1)</script>", DEV_ORIGIN);
  assert.equal(dataUrl.type, "blocked");

  const fileUrl = classifyUrl("file:///C:/Windows/win.ini", DEV_ORIGIN);
  assert.equal(fileUrl.type, "blocked");

  const vbscriptUrl = classifyUrl("vbscript:msgbox(1)", DEV_ORIGIN);
  assert.equal(vbscriptUrl.type, "blocked");

  const blobUrl = classifyUrl("blob:http://localhost:1420/uuid", DEV_ORIGIN);
  assert.equal(blobUrl.type, "blocked");

  // Percent-encoded schemes
  const encodedJs = classifyUrl("%6a%61%76%61%73%63%72%69%70%74%3aalert(1)", DEV_ORIGIN);
  assert.equal(encodedJs.type, "blocked");

  const uppercaseEncodedJs = classifyUrl("%6A%61%56%61%53%63%72%69%70%74%3Aalert(1)", DEV_ORIGIN);
  assert.equal(uppercaseEncodedJs.type, "blocked");

  const encodedData = classifyUrl("%64%61%74%61%3atext/html,<script>alert(1)</script>", DEV_ORIGIN);
  assert.equal(encodedData.type, "blocked");

  const encodedFile = classifyUrl("%66%69%6c%65%3a///etc/passwd", DEV_ORIGIN);
  assert.equal(encodedFile.type, "blocked");

  // Mixed encoding with control characters and spaces
  const mixedJs = classifyUrl("  %6a\t%61 v%61%73%63%72%69%70%74%3aalert(1)  ", DEV_ORIGIN);
  assert.equal(mixedJs.type, "blocked");
});

test("malformed and empty URLs are handled safely without crashing", () => {
  assert.equal(classifyUrl(null).type, "blocked");
  assert.equal(classifyUrl(undefined).type, "blocked");
  assert.equal(classifyUrl("").type, "blocked");
  assert.equal(classifyUrl("    ").type, "blocked");

  const badPort = classifyUrl("http://:80", DEV_ORIGIN);
  assert.equal(badPort.type, "blocked");

  const badHost = classifyUrl("https://[invalid", DEV_ORIGIN);
  assert.equal(badHost.type, "blocked");

  const emptyProtoRelative = classifyUrl("//", DEV_ORIGIN);
  assert.equal(emptyProtoRelative.type, "blocked");
});

test("URLs with surrounding whitespace and spaces are parsed correctly", () => {
  const padded = classifyUrl("   https://example.com/page   ", DEV_ORIGIN);
  assert.equal(padded.type, "external");
  if (padded.type === "external") assert.equal(padded.url, "https://example.com/page");

  const urlWithSpaces = classifyUrl("https://example.com/search?q=hello world", DEV_ORIGIN);
  assert.equal(urlWithSpaces.type, "external");
  if (urlWithSpaces.type === "external") {
    assert.equal(urlWithSpaces.url, "https://example.com/search?q=hello%20world");
  }
});

test("unsupported protocols are blocked", () => {
  assert.equal(classifyUrl("ssh://git@github.com", DEV_ORIGIN).type, "blocked");
  assert.equal(classifyUrl("telnet://192.168.1.1", DEV_ORIGIN).type, "blocked");
  assert.equal(classifyUrl("gopher://example.com", DEV_ORIGIN).type, "blocked");
});
