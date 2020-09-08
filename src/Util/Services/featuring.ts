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

export async function getFeaturedLGBTServers(): Promise<delServer[]> {
    const servers = await global.redis?.get("featured_lgbt_servers");
    return JSON.parse(servers);
}

export async function updateFeaturedLGBTServers() {
    const servers = functions.shuffleArray(
        (await global.db.collection("servers").find().toArray() as delServer[]).filter(
            ({ status, tags }) =>
                status && !status.reviewRequired && tags.includes("LGBT")
        )
    ).slice(0, 6);
    
    for (const server of servers as delServer[]) {
        delete server.inviteCode;
        delete server.longDesc;
        delete server.previewChannel;
        delete server.owner;
        delete server.links.website;
        delete server.links.donation;
        delete server.status;
    }
    
    await global.redis?.set("featured_lgbt_servers", JSON.stringify(servers));
}

setInterval(async () => {
    await updateFeaturedLGBTServers();
}, 900000);
