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

import sanitizeHtml from "sanitize-html";

import * as settings from "../../settings.json";
import * as htmlRef from "../../htmlReference.json";
import * as userCache from "../Util/Services/userCaching";
import * as serverCache from "../Util/Services/serverCaching";
import { variables } from "../Util/Function/variables";

const md = require("markdown-it")();
const Entities = require("html-entities").XmlEntities;
const entities = new Entities();
const router = express.Router();

router.get("/:id", variables, async (req: Request, res: Response) => {
    res.locals.pageType = {
        server: true,
        bot: false
    };

    let server: delServer | undefined = await serverCache.getServer(
        req.params.id
    );
    if (!server) {
        server = await global.db
            .collection("servers")
            .findOne({ _id: req.params.id });
        if (!server)
            return res.status(404).render("status", {
                title: res.__("common.error"),
                status: 404,
                subtitle: res.__("common.error.server.404"),
                type: "Error",
                req: req,
                pageType: { server: false, bot: false }
            });
    }

    let serverOwner: delUser | undefined = await userCache.getUser(
        server.owner.id
    );
    if (!serverOwner) {
        serverOwner = await global.db
            .collection("users")
            .findOne({ _id: server.owner.id });
    }

    res.locals.premidPageInfo = res.__("premid.servers.view", server.name);

    const dirty = entities.decode(md.render(server.longDesc));
    let clean: string;
    clean = sanitizeHtml(dirty, {
        allowedTags: htmlRef.minimal.tags,
        allowedAttributes: htmlRef.minimal.attributes,
        allowVulnerableTags: true
    });

    res.render("templates/servers/view", {
        title: server.name,
        subtitle: server.shortDesc,
        server,
        longDesc: clean,
        serverOwner,
        webUrl: settings.website.url,
        req
    });
});

export = router;
