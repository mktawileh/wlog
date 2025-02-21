"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DateUtils {
    static parse(dateString) {
        const currentDate = new Date();
        let day, month, year;
        if (/^\d{1,2}$/.test(dateString)) {
            day = parseInt(dateString, 10);
            month = currentDate.getMonth() + 1;
            year = currentDate.getFullYear();
        }
        else if (/^\d{1,2}\/\d{1,2}$/.test(dateString)) {
            [day, month] = dateString.split('/').map(Number);
            year = currentDate.getFullYear();
        }
        else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
            [day, month, year] = dateString.split('/').map(Number);
        }
        else {
            return null;
        }
        const parsedDate = new Date(year, month - 1, day);
        return parsedDate.getTime();
    }
    static toString(timestamp, format) {
        const date = new Date(timestamp);
        const parts = [];
        if (format.includes('d'))
            parts.push(date.getDate().toString().padStart(2, "0"));
        if (format.includes('m'))
            parts.push((date.getMonth() + 1).toString().padStart(2, "0"));
        if (format.includes('y'))
            parts.push(date.getFullYear());
        return parts.join('/');
    }
}
exports.default = DateUtils;
