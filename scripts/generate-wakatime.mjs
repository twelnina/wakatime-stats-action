import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000;

const apiKey = process.env.WAKATIME_API_KEY;

let data;

const options = {};

if (process.env.LAYOUT) {
    options.layout = process.env.LAYOUT;
}

if (process.env.LANGS_COUNT) {
    options.langs_count = Number(process.env.LANGS_COUNT);
}

if (process.env.CARD_WIDTH) {
    options.card_width = Number(process.env.CARD_WIDTH);
}

if (process.env.THEME) {
    options.theme = process.env.THEME;
}

if (process.env.HIDE_BORDER) {
    options.hide_border = process.env.HIDE_BORDER === "true";
}

if (process.env.LINE_HEIGHT) {
    options.line_height = Number(process.env.LINE_HEIGHT);
}

if (process.env.DISPLAY_FORMAT) {
    options.display_format = process.env.DISPLAY_FORMAT;
}

if (process.env.HIDE) {
    options.hide = process.env.HIDE
        .split(",")
        .map((lang) => lang.trim());
}

if (process.env.HIDE_TITLE) {
    options.hide_title = process.env.HIDE_TITLE === "true";
}

if (process.env.CUSTOM_TITLE) {
    options.custom_title = process.env.CUSTOM_TITLE;
}

if (process.env.LOCALE) {
    options.locale = process.env.LOCALE;
}

if (process.env.TITLE_COLOR) {
    options.title_color = process.env.TITLE_COLOR;
}

if (process.env.TEXT_COLOR) {
    options.text_color = process.env.TEXT_COLOR;
}

if (process.env.BG_COLOR) {
    options.bg_color = process.env.BG_COLOR;
}

if (process.env.BORDER_COLOR) {
    options.border_color = process.env.BORDER_COLOR;
}

if (process.env.BORDER_RADIUS) {
    options.border_radius = Number(process.env.BORDER_RADIUS);
}

if (process.env.DISABLE_ANIMATIONS) {
    options.disable_animations = process.env.DISABLE_ANIMATIONS === "true";
}

const outputPath = process.env.OUTPUT_PATH ?? "wakatime-card.svg";


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
