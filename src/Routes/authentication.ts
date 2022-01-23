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

import bodyParser from "body-parser";
import passport from "passport";
import { Strategy } from "passport-discord";
import * as discord from "../Util/Services/discord";
import { DiscordAPIError } from "discord.js";

import * as settings from "../../settings.json";

const router = express.Router();

passport.use(
    new Strategy(
        {
            clientID: settings.secrets.discord.id,
            clientSecret: settings.secrets.discord.secret,
            callbackURL: settings.website.url + settings.website.callback,
            scope: settings.website.authScopes,
            authorizationURL: "https://discord.com/oauth2/authorize?prompt=none"
        },
        (accessToken, refreshToken, profile, done) => {
            process.nextTick(() => {
                return done(null, profile);
            });
        }
    )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

router.use(bodyParser.json());
router.use(
    bodyParser.urlencoded({
        extended: true
    })
);

router.get("/login/joinGuild", (req: Request, res: Response) => {
    req.session.joinGuild = true;
    res.redirect("/auth/login/continue");
});

router.get("/login/continue", passport.authenticate("discord"));

router.get(
    "/login/callback",
    passport.authenticate("discord", { failureRedirect: "/auth/login" }),
    async (req: Request, res: Response, next) => {
        const user: delUser = await global.db
            .collection<delUser>("users")
            .findOne({ _id: req.user.id });

        if (!user) {
            await global.db.collection<delUser>("users").insertOne({
                _id: req.user.id,
                token: req.user.accessToken,
                name: req.user.username,
                discrim: req.user.discriminator,
                fullUsername: req.user.username + "#" + req.user.discriminator,
                locale: req.user.locale,
                flags: req.user.flags,
                avatar: {
                    hash: req.user.avatar,
                    url: `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}`
                },
                preferences: {
                    customGlobalCss: "",
                    defaultColour: "#b114ff",
                    defaultForegroundColour: "#ffffff",
                    enableGames: true,
                    experiments: false,
                    theme: 0
                },
                profile: {
                    bio: "",
                    css: "",
                    links: {
                        website: "",
                        github: "",
                        gitlab: "",
                        twitter: "",
                        instagram: "",
                        snapchat: ""
                    }
                },
                game: {
                    snakes: {
                        maxScore: 0
                    }
                },
                rank: {
                    admin: false,
                    assistant: false,
                    mod: false,
                    premium: false,
                    tester: false,
                    translator: false,
                    covid: false
                },
                staffTracking: {
                    details: {
                        away: {
                            status: false,
                            message: ""
                        },
                        standing: "Unmeasured",
                        country: "",
                        timezone: "",
                        managementNotes: "",
                        languages: []
                    },
                    lastLogin: 0,
                    lastAccessed: {
                        time: 0,
                        page: ""
                    },
                    punishments: {
                        strikes: [],
                        warnings: []
                    },
                    handledBots: {
                        allTime: {
                            total: 0,
                            approved: 0,
                            declined: 0,
                            remove: 0
                        },
                        prevWeek: {
                            total: 0,
                            approved: 0,
                            declined: 0,
                            remove: 0
                        },
                        thisWeek: {
                            total: 0,
                            approved: 0,
                            declined: 0,
                            remove: 0
                        }
                    }
                }
            } as delUser);
        } else {
            if (user.rank.mod === true) {
                await global.db.collection("users").updateOne(
                    { _id: req.user.id },
                    {
                        $set: {
                            token: req.user.accessToken,
                            name: req.user.username,
                            discrim: req.user.discriminator,
                            fullUsername:
                                req.user.username +
                                "#" +
                                req.user.discriminator,
                            locale: req.user.locale,
                            flags: req.user.flags,
                            avatar: {
                                hash: req.user.avatar,
                                url: `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}`
                            },
                            "staffTracking.lastLogin": Date.now()
                        }
                    }
                );
            } else {
                await global.db.collection("users").updateOne(
                    { _id: req.user.id },
                    {
                        $set: {
                            token: req.user.accessToken,
                            name: req.user.username,
                            discrim: req.user.discriminator,
                            fullUsername:
                                req.user.username +
                                "#" +
                                req.user.discriminator,
                            locale: req.user.locale,
                            flags: req.user.flags,
                            avatar: {
                                hash: req.user.avatar,
                                url: `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}`
                            }
                        } as delUser
                    }
                );
            }
        }

        if (req.session.joinGuild && req.session.joinGuild === true) {
            req.session.joinGuild = false;

            discord.bot.api.guilds(settings.guild.main).members(req.user.id).put({ data: { access_token: req.user.accessToken } })
                .catch((error: DiscordAPIError) => {
                    console.error(error)
                    if (error.httpStatus === 403 && !req.user.impersonator) {
                        return res.status(403).render("status", {
                            title: res.__("common.error"),
                            status: 403,
                            subtitle: res.__("common.error.notMember"),
                            req,
                            type: "Error"
                        });
                    } else next();
                });
        }

        res.redirect(req.session.redirectTo || "/");
    }
);

router.get("/logout", async (req: Request, res: Response) => {
    if (!req.user.impersonator) {
        req.session.logoutJust = true;

        await req.logout();
        res.redirect(req.session.redirectTo || "/");
    } else {
        req.user.id = req.user.impersonator;
        req.user.impersonator = undefined;
        res.redirect("/");
    }
});

export = router;
