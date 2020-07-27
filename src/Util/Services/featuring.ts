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

import * as functions from "../Function/main";

// TODO: change it from featured_servers to featured_lgbt_servers
export async function getFeaturedServers(): Promise<delServer[]> {
    const servers = await global.redis.get("featured_servers");
    return JSON.parse(servers);
}

// TODO: change it from featured_servers to featured_lgbt_servers
export async function updateFeaturedServers() {
    const servers = functions
        .shuffleArray(await global.db.collection("servers").find().toArray())
        .slice(0, 6);
    await global.redis.set("featured_servers", JSON.stringify(servers));
}

setInterval(async () => {
    await updateFeaturedServers();
}, 900000);
