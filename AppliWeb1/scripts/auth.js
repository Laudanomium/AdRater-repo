
var login_page = "login.html";
var default_page = "default.html";

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

function setCookie(cname, cvalue, cexpiration) {
    var expires = "Thu, 01 Jan 1970 00:00:00 UTC";
    if (cexpiration > 0) {
        var date = new Date();
        date.setTime(date.getTime() + (cexpiration * 1000));
        expires = date.toUTCString();
    }
    document.cookie = cname + "=" + cvalue + "; expires=" + expires;
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&]*)"),
        results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function getUsername() {
    return getCookie("username");
}

function getAccessKey() {
    checkAuth();
    return getCookie("accessKey");
}

function checkAuth() {
    var user = getCookie("username");
    if (user == "") {
        logout();
    }
    else {
        var lifetime = parseInt(getCookie("lifetime"));
        setCookie("accessKey", getCookie("accessKey"), lifetime);
        setCookie("username", getCookie("username"), lifetime);
        setCookie("lifetime", getCookie("lifetime"), lifetime);
    }
}

function logout() {
    setCookie("accessKey", "", 0);
    setCookie("username", "", 0);
    setCookie("lifetime", "", 0);
    window.location.href = login_page + "?return_url=" + encodeURIComponent(window.location.href);
}

function login(username, password, exmin) {
    var shaObj = new jsSHA("SHA-1", "TEXT");
    shaObj.update(username + password);
    loginWithAccessKey(username, shaObj.getHash("HEX"), exmin);
}

function loginWithAccessKey(username, accessKey, exmin) {
    setCookie("username", username, exmin * 60);
    setCookie("accessKey", accessKey, exmin * 60);
    setCookie("lifetime", exmin * 60, exmin * 60);
    window.location.href = (getParameterByName("return_url") || default_page);
}