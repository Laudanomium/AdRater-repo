angular.module('constellation.filters', [])
    .filter('trunc', function (stringifyFilter) {
        return function (input, size) {
            if (!input) return undefined;
            input = stringifyFilter(input);
            return (input.length > size) ? input.substr(0, size - 1) + '...' : input;
        };
    })
    .filter('filterMessagesWithResponse', function () {
        return function (obj) {
            var returnObject = {};
            for (var p in obj) {
                if (obj[p].ResponseData != null) {
                    returnObject[p] = obj[p];
                }
            }
            return returnObject;
        };
    })
    .filter('hasProperties', function () {
        return function (obj) {
            for (var p in obj) {
                return true;
            }
            return false;
        };
    })
    .filter('propertiesCount', function () {
        return function (obj) {
            var count = 0;
            for (var p in obj) {
                count++;
            }
            return count;
        };
    })
    .filter('emptyMessage', function () {
        return function (input, message) {
            return (input == undefined || input == null || input.length == 0) ? message : input;
        };
    })
    .filter('prettyJSON', function () {
        return function (json) {
            return angular.toJson(json, true);
        }
    })
    .filter('stringify', function () {
        return function (input, size) {
            if (typeof input === 'object') {
                return JSON.stringify(input);
            }
            else {
                return input;
            }
        };
    })
    .filter('description', function () {
        return function (text) {
            return text != null && text != "" ? " (" + text + ")" : "";
        };
    })
    .filter('roundInt', function () {
        return function (input) {
            return Math.round(input);
        }
    })
	.filter('round', function () {
	    return function (input) {
	        return Math.round(input * 100) / 100;
	    }
	})
    .filter('parseDate', function () {
        return function (date) {
            if (typeof date != 'Date') {
                date = date.substring(0, 19) + date.substring(date.length - 6);
                date = new Date(date);
            }
            return date;
        };
    })
    .filter('elapsedTime', function (parseDateFilter) {
        return function (date) {
            var diff = Math.abs(new Date() - parseDateFilter(date));
            var secs = Math.floor(diff / 1000);
            var minutes = Math.floor(secs / 60); secs = secs % 60;
            var hours = Math.floor(minutes / 60); minutes = minutes % 60;
            var days = Math.floor(hours / 24); hours = hours % 24;
            var r = secs + " second(s)";
            if (minutes > 0)
                r = " " + minutes + " minute(s) " + r;
            if (hours > 0)
                r = " " + hours + " hour(s) " + r;
            if (days > 0)
                r = " " + days + " day(s) " + r;
            return r;
        };
    })
    .filter('filterByKey', function () {
        return function (input, search) {
            if (!input || !search) return input;
            var expected = ('' + search).toLowerCase();
            var result = {};
            angular.forEach(input, function (value, key) {
                var actual = ('' + key).toLowerCase();
                if (actual.indexOf(expected) !== -1) {
                    result[key] = value;
                }
            });
            return result;
        }
    })
    .filter('getUniqueSource', function () {
        return function (stateObjects) {
            var knowSources = [], unique, results = [];
            for (var so in stateObjects) {
                // StateObject's source
                var source = stateObjects[so].SentinelName + "/" + stateObjects[so].PackageName;
                // check for uniqueness
                unique = true;
                for (v = 0; v < knowSources.length; v++) {
                    if (source == knowSources[v]) {
                        unique = false;
                    }
                }
                // If this is indeed unique
                if (unique) {
                    knowSources.push(source);
                    results.push(stateObjects[so]);
                }
            }
            return results;
        };
    })
    .filter('toArray', function () {
        return function (items) {
            var result = [];
            angular.forEach(items, function (item) {
                result.push(item);
            });
            return result;
        };
    })
	.filter('licenseTypeName', function () {
	    return function (input) {
	        switch (input) {
	            case 1:
	                return "Personal";
	            case 2:
	                return "Education";
	            case 3:
	                return "Trial";
	            case 4:
	                return "Developer";
	            case 5:
	                return "Standard";
	            case 6:
	                return "Enterprise";
	            case 0:
	            default:
	                return "None";
	        }
	    }
	});