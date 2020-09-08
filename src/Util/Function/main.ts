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

export const escapeFormatting = (text: string) => {
    const unescaped = text.replace(/\\(\*|_|`|~|\\)/g, "$1");
    const escaped = unescaped.replace(/(\*|_|`|~|\\)/g, "\\$1");
    return escaped;
};

export function getForeground(inputColour: string) {
    const colour =
        inputColour.charAt(0) === "#"
            ? inputColour.substring(1, 7)
            : inputColour;
    const R = parseInt(colour.substring(0, 2), 16);
    const G = parseInt(colour.substring(2, 4), 16);
    const B = parseInt(colour.substring(4, 6), 16);
    const uiColours = [R / 255, G / 255, B / 255];
    const c = uiColours.map((col) => {
        if (col <= 0.03928) {
            return col / 12.92;
        }
        return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return L > 0.179 ? "#000000" : "#FFFFFF";
}

export function parseDate(__, locale: string, rawDate: number) {
    if (rawDate === 0) return "???";

    const date = new Date(rawDate);
    const dateFormat = require(`../../../../node_modules/del-i18n/website/${locale}.json`);

    if (dateFormat["common.dateFormat"].includes("{{amPM}}")) {
        let amPM: string;
        let hour = date.getUTCHours();
        let minute: any = date.getUTCMinutes();

        if (hour === 0) hour = 24;
        if (minute <= 9) minute = `0${minute}`;

        if (hour >= 12 && hour !== 24) {
            amPM = __("common.dateFormat.pm");
            if (hour > 12) hour = hour - 12;
        } else {
            amPM = __("common.dateFormat.am");
            if (hour === 24) hour = hour - 12;
        }

        return __("common.dateFormat", {
            hours: hour,
            minutes: minute,
            dateInMonth: date.getUTCDate(),
            monthNumber: date.getUTCMonth(),
            amPM: amPM,
            year: date.getUTCFullYear()
        });
    } else {
        let hour: any = date.getUTCHours();
        let minute: any = date.getUTCMinutes();

        if (hour <= 11) hour = `0${hour}`;
        if (minute <= 9) minute = `0${minute}`;

        return __("common.dateFormat", {
            hours: hour,
            minutes: minute,
            dateInMonth: date.getUTCDate(),
            monthNumber: date.getUTCMonth(),
            year: date.getUTCFullYear()
        });
    }
}

export function shuffleArray<T>(array: T[]) {
    let currentIndex = array.length,
        temporaryValue,
        randomIndex;
    while (0 !== currentIndex) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}
