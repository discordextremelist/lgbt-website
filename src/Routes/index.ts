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

router.get("/", variables, async (req: Request, res: Response) => {
    res.locals.premidPageInfo = res.__("premid.home");

    const servers = await featuring.getFeaturedLGBTServers();

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

    const servers = (await serverCache.getAllServers()).filter(
        ({ _id, status, tags }) =>
            status && !status.reviewRequired && tags.includes("LGBT")
    );

    res.render("templates/servers/index", {
        title: res.__("common.lgbtServers.discord"),
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
