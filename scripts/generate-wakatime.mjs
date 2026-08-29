import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;

const apiKey = process.env.WAKATIME_API_KEY;

const outputPath = process.env.OUTPUT_PATH ?? "wakatime-card.svg";

let data;

const optionDefinitions = {
    LAYOUT: ["layout", String],
    LANGS_COUNT: ["langs_count", Number],
    CARD_WIDTH: ["card_width", Number],
    THEME: ["theme", String],
    HIDE_BORDER: ["hide_border", (value) => value === "true"],
    LINE_HEIGHT: ["line_height", Number],
    DISPLAY_FORMAT: ["display_format", String],
    HIDE: ["hide", (value) => value.split(",").map((lang) => lang.trim())],
    HIDE_TITLE: ["hide_title", (value) => value === "true"],
    CUSTOM_TITLE: ["custom_title", String],
    LOCALE: ["locale", String],
    TITLE_COLOR: ["title_color", String],
    TEXT_COLOR: ["text_color", String],
    BG_COLOR: ["bg_color", String],
    BORDER_COLOR: ["border_color", String],
    BORDER_RADIUS: ["border_radius", Number],
    DISABLE_ANIMATIONS: ["disable_animations", (value) => value === "true"],
};

const options = {};

for (const [envName, [optionName, parse]] of Object.entries(optionDefinitions)) {
    const value = process.env[envName];

    if (value) {
        options[optionName] = parse(value);
    }
}


if (!apiKey) {
    throw new Error("WAKATIME_API_KEY is not set");
}

const authorization = Buffer.from(apiKey).toString("base64");

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await fetch(
        "https://api.wakatime.com/api/v1/users/current/stats/last_7_days",
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

    const body = await response.json();
    data = body.data;

    console.log(`Stats status: ${data.percent_calculated}% calculated, up to date: ${data.is_up_to_date}`);

    if (data.is_up_to_date) {
        break;
    }

    if (attempt === MAX_ATTEMPTS) {
        throw new Error(`Wakatime stats are still not up to date after ${MAX_ATTEMPTS} attempts`);
    }

    console.log(`Stats are still updating. Retrying in ${RETRY_DELAY_MS / 1000} seconds...`)

    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
}

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

const svg = renderWakatimeCard(data, options);

await mkdir(path.dirname(outputPath), {
    recursive: true,
});

await writeFile(outputPath, svg, "utf-8");

console.log(`Modified at: ${data.modified_at}`);
console.log(`Total seconds: ${data.total_seconds}`);

console.log(`Generated: ${outputPath}`);
