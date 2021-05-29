
function has(obj, key) {
    return obj.hasOwnProperty(key) && typeof obj[key] == "string" && obj[key].length
}

function getOrDefault(obj, key, defaultValue) {
    return (obj != null && has(obj, key)) ? obj[key] : defaultValue;
}

module.exports = {has, getOrDefault};