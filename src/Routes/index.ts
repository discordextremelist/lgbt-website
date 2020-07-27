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

import express from "express";
import { Request, Response } from "express";

import * as settings from "../../settings.json";
import * as featuring from "../Util/Services/featuring";
import * as serverCache from "../Util/Services/serverCaching";
import * as discord from "../Util/Services/discord";
import { variables } from "../Util/Function/variables";

const router = express.Router();

const nickSorter = (a, b) =>
    (a.nick || a.user.username).localeCompare(b.nick || b.user.username);
function sortAll() {
    let members = discord.bot.guilds.cache.get(settings.guild.main).members;
    if (!members) throw new Error("Fetching members failed!");
    const staff = [],
        donators = [],
        contributors = [];
    for (const item of members.cache.filter((m) => !m.user.bot)) {
        const member = item[1];
        if (
            member.roles.cache.has(settings.roles.admin) ||
            member.roles.cache.has(settings.roles.assistant) ||
            member.roles.cache.has(settings.roles.mod)
        ) {
            const admin = member.roles.cache.has(settings.roles.admin);
            const assistant = member.roles.cache.has(settings.roles.assistant);
            const mod = member.roles.cache.has(settings.roles.mod);
            member.order = admin ? 3 : assistant ? 2 : mod ? 1 : 0;
            member.rank = admin
                ? "admin"
                : assistant
                ? "assistant"
                : mod
                ? "mod"
                : null;
            const user = discord.bot.users.cache.get(member.id);
            member.avatar = user.avatar;
            member.username = user.username;
            member.discriminator = user.discriminator;
            staff.push(member);
        } else if (
            member.roles.cache.has(settings.roles.booster) ||
            member.roles.cache.has(settings.roles.donator)
        ) {
            const booster = member.roles.cache.has(settings.roles.booster);
            const donator = member.roles.cache.has(settings.roles.donator);
            member.order = booster ? 2 : donator ? 1 : 0;
            member.rank = booster ? "booster" : "donator";
            const user = discord.bot.users.cache.get(member.id);
            member.avatar = user.avatar;
            member.username = user.username;
            member.discriminator = user.discriminator;
            donators.push(member);
        } else if (
            member.roles.cache.has(settings.roles.translators) ||
            member.roles.cache.has(settings.roles.testers)
        ) {
            const translator = member.roles.cache.has(
                settings.roles.translators
            );
            const tester = member.roles.cache.has(settings.roles.testers);
            member.order = translator ? 1 : tester ? 2 : 0;
            member.rank = translator ? "translator" : "tester";
            const user = discord.bot.users.cache.get(member.id);
            member.avatar = user.avatar;
            member.username = user.username;
            member.discriminator = user.discriminator;
            contributors.push(member);
        }
    }
    return {
        staff: staff.sort(nickSorter).sort((a, b) => b.order - a.order),
        donators: donators.sort(nickSorter).sort((a, b) => b.order - a.order),
        contributors: contributors
            .sort(nickSorter)
            .sort((a, b) => a.order - b.order)
    };
}

router.get("/", variables, async (req: Request, res: Response) => {
    res.locals.premidPageInfo = res.__("premid.home");

    const servers = await featuring.getFeaturedServers();

    res.render("templates/index", {
        title: res.__("common.home"),
        subtitle: "",
        req,
        servers
    });
});

router.get("/servers", variables, async (req: Request, res: Response) => {
    res.locals.premidPageInfo = res.__("premid.lgbtServers");

    if (!req.query.page) req.query.page = "1";

    const servers = await serverCache.getAllServers();

    res.render("templates/servers/index", {
        title: res.__("common.lgbtServers"),
        subtitle: res.__("common.lgbtServers.subtitle"),
        req,
        servers,
        serversPgArr: servers.slice(
            15 * Number(req.query.page) - 15,
            15 * Number(req.query.page)
        ),
        page: req.query.page,
        pages: Math.ceil(servers.length / 15)
    });
});

export = router;
