#!/usr/bin/env bun
import { join } from "node:path";
import { buildBundle } from "./build-bundle.ts";

const root = join(import.meta.dirname, "..");
await buildBundle(root, join(root, "dist"));
