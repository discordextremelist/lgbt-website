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

import * as Sentry from "@sentry/node";
import * as path from "path";
import * as device from "express-device";
import cookieSession from "cookie-session";
import cookieParser from "cookie-parser";
import createError from "http-errors";
import passport from "passport";
import logger from "morgan";

import * as announcementCache from "./Util/Services/announcementCaching";
import * as featuredCache from "./Util/Services/featuring";
import * as ddosMode from "./Util/Services/ddosMode";
import * as banned from "./Util/Services/banned";
import * as discord from "./Util/Services/discord";

import * as languageHandler from "./Util/Middleware/languageHandler";

import { variables } from "./Util/Function/variables";
import { monacoIsStupid } from "./Util/Middleware/monacoIsStupid";
import { sitemapIndex, sitemapGenerator } from "./Util/Middleware/sitemap";

import i18n from "i18n";
import * as settings from "../settings.json";
import { MongoClient } from "mongodb";
import { RedisOptions } from "ioredis";

const app = express();

if (!settings.website.dev) Sentry.init({ dsn: settings.secrets.sentry });
if (!settings.website.dev) app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);

let dbReady: boolean = false;

app.set("views", path.join(__dirname + "/../../assets/Views"));
app.use(express.static(path.join(__dirname + "/../../assets/Public")));

app.get("*", (req: Request, res: Response, next: () => void) => {
    if (
        dbReady === false &&
        !req.url.includes(".css") &&
        !req.url.includes(".woff2")
    ) {
        return res
            .status(503)
            .sendFile(
                path.join(__dirname + "/../../assets/Public/loading.html")
            );
    } else next();
});

new Promise((resolve, reject) => {
    console.time("Mongo TTL");
    MongoClient.connect(
        settings.secrets.mongo.uri,
        { useUnifiedTopology: true, useNewUrlParser: true }, // useNewUrlParser is set to true because sometimes MongoDB is a cunt - Ice, I love this comment - Cairo
        (error, mongo) => {
            if (error) return reject(error);
            global.db = mongo.db(settings.secrets.mongo.db);
            console.log(
                "Mongo: Connection established! Released deadlock as a part of startup..."
            );
            console.timeEnd("Mongo TTL");
            resolve();
        }
    );
})
    .then(async () => {
        dbReady = true;

        let redisConfig: RedisOptions;
        if (settings.secrets.redis.sentinels.length > 0) {
            redisConfig = {
                sentinels: settings.secrets.redis.sentinels,
                name: settings.secrets.redis.name,
                db: settings.secrets.redis.db,
                password: settings.secrets.redis.passwd
            };
        } else {
            redisConfig = {
                port: settings.secrets.redis.port,
                host: settings.secrets.redis.host,
                db: settings.secrets.redis.db,
                password: settings.secrets.redis.passwd
            };
        }

        global.redis = new (require("ioredis"))(redisConfig);

        console.time("Redis Cache & Core Refresh");
        
        await announcementCache.updateCache();
        await featuredCache.updateFeaturedLGBTServers();
        await ddosMode.updateCache();

        console.timeEnd("Redis Cache & Core Refresh");

        app.set("view engine", "ejs");

        app.use(
            logger(
                // @ts-ignore
                ':req[cf-connecting-ip] - [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer"',
                {
                    skip: (r: { url: string }) =>
                        r.url === "/profile/game/snakes"
                }
            )
        );
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        app.use(device.capture());

        i18n.configure({
            locales: settings.website.locales.all,
            directory: __dirname + "/../../node_modules/del-i18n/website",
            defaultLocale: settings.website.locales.default
        });

        app.use(
            cookieSession({
                name: "delSession",
                secret: settings.secrets.cookie,
                maxAge: 1000 * 60 * 60 * 24 * 7
            })
        );

        app.use(cookieParser(settings.secrets.cookie));

        app.use(passport.initialize());
        app.use(passport.session());

        app.use((req, res, next) => {
            res.locals.user = req.user;
            next();
        });

        app.get("/sitemap.xml", sitemapIndex);

        app.use(i18n.init);

        app.get("/:lang/auth/login", languageHandler.globalHandler, variables, (req: Request, res: Response, next) => {
            if (req.user) res.redirect("/");
            
            res.locals.premidPageInfo = res.__("premid.login");
            res.locals.hideLogin = true;
        
            res.render("templates/login", {
                title: res.__("common.login.short"),
                subtitle: res.__("common.login.subtitle"),
                req
            });
        });

        app.use("/auth", require("./Routes/authentication"));

        // Locale handler.
        // Don't put anything below here that you don't want it's locale to be checked whatever (broken english kthx)
        app.use(["/:lang", "/"], languageHandler.homeHandler);
        app.use("/:lang/*", languageHandler.globalHandler);

        app.use("/:lang/sitemap.xml", sitemapGenerator);

        app.use("/:lang", require("./Routes/index"));
        app.use("/:lang/servers", require("./Routes/servers"));

        app.use(variables);

        if (!settings.website.dev) app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);

        app.use((req: Request, res: Response, next: () => void) => {
            // @ts-ignore
            next(createError(404));
        });

        app.use(
            (
                err: { message: string; status?: number },
                req: Request,
                res: Response,
                next: () => void
            ) => {
                res.locals.message = err.message;
                res.locals.error = err;

                if (err.message === "Not Found")
                    return res.status(404).render("status", {
                        title: res.__("common.error"),
                        subtitle: res.__("common.error.404"),
                        status: 404,
                        type: res.__("common.error"),
                        req: req,
                        pageType: {
                            home: false,
                            standard: true,
                            server: false,
                            bot: false,
                            template: false
                        }
                    });

                res.status(err.status || 500);
                res.render("error");
            }
        );

        app.listen(settings.website.port.value || 3000, () => {
            console.log(
                `Website: Ready on port ${settings.website.port.value || 3000}`
            );
        });
    })
    .catch((e) => {
        console.error("Mongo error: ", e);
        process.exit(1);
    });

export = app;
