/*
Discord Extreme List - Discord's unbiased list.

Copyright (C) 2020 Cairo Mitchell-Acason, John Burke, Advaith Jagathesan

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as Discord from "discord.js";
import * as metrics from "datadog-metrics";

import * as settings from "../../../settings.json";
const prefix = "statuses";

metrics.init({ host: "", prefix: "", apiKey: settings.secrets.datadog });

// @ts-expect-error
class Client extends Discord.Client {
    readonly api: {
        channels: any;
        gateway: any;
        guilds: any;
        invites: any;
        oauth2: any;
        users: any;
        voice: any;
        webhooks: any;
    }
}

export const bot = new Client({
    allowedMentions: { parse: [] },
    ws: { intents: ["GUILDS", "GUILD_MEMBERS"] }
});

bot.on("ready", async () => {
    console.log(`Discord: Connected as ${bot.user.tag} (${bot.user.id})`);
    if (process.env.EXECUTOR === "pm2") {
        process.send("ready");
        console.log("PM2: Ready signal sent");
    }
});

export async function getStatus(id: string): Promise<string> {
    const status: string = await global.redis?.hget(prefix, id);
    return status || "offline";
}

bot.login(settings.secrets.discord.token);
