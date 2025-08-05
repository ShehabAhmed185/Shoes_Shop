const mongDBB = require("mongoose");
const Schema = mongDBB.Schema;

const ArticleScheme = new Schema({
    name: String,
    email: String,
    password: String,
    curDate: {
        type: String,
        default: () => {
            const now = new Date();
            const options = {
                timeZone: "Asia/Gaza",
                weekday: 'short',
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            };
            
            // Format as: "Sat Aug 02 2025 11:00:11 GMT+0300 (Palestine Gaza Time)"
            const dateStr = now.toLocaleDateString("en-US", options);
            const timeStr = now.toLocaleTimeString("en-US", options);
            const timeZoneOffset = -now.getTimezoneOffset() / 60; // Gaza is UTC+3 in summer
            const gmtStr = `GMT+${timeZoneOffset.toString().padStart(2, '0')}00`;
            
            return `${dateStr} ${timeStr} ${gmtStr} (Palestine Gaza Time)`;
        }
    }
});

const userData = mongDBB.model("CustomerData", ArticleScheme);
module.exports = userData;