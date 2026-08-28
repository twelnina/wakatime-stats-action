import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const apiKey = process.env.WAKATIME_API_KEY;

if (!apiKey) {
    throw new Error("WAKATIME_API_KEY is not set");
}

const authorization = Buffer.from(apiKey).toString("base64");

const response = await fetch(
    "https://api.wakatime.com/api/v1/users/current/stats",
    {
        headers: {
            Authorization: `Basic ${authorization}`,
            Accept: `application/json`,
        },
    },
);

if (!response.ok) {
    throw new Error(
        `WakaTime API error: ${response.status} ${response.statusText}`,
    );
}

const { data } = await response.json();

const require = createRequire(import.meta.url);
const coreEntry = require.resolve(
    "@stats-organization/github-readme-stats-core",
);

const rendererPath = path.join(
    path.dirname(coreEntry),
    "cards",
    "wakatime.js",
);

const { renderWakatimeCard } = await import(
    pathToFileURL(rendererPath).href,
);

const svg = renderWakatimeCard(data, {
    layout: "compact",
    langs_count: 8,
    card_width: 400,
    theme: "transparent",
    hide_border: true,
});

const outputPath = "assets/profile-cards/wakatime.svg";

await mkdir(path.dirname(outputPath), {
    recursive: true,
});

await writeFile(outputPath, svg, "utf-8");

console.log(`Generated: ${outputPath}`);
