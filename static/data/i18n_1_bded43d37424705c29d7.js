(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["i18n_1"],{

/***/ "../../../Users/mma2/Documents/JS/zoia2/shared/locales/ru/messages.js":
/*!**********************************************************************!*\
  !*** c:/Users/mma2/Documents/JS/zoia2/shared/locales/ru/messages.js ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/* eslint-disable */
module.exports = {
  languageData: {
    "plurals": function plurals(n, ord) {
      var s = String(n).split("."),
          i = s[0],
          v0 = !s[1],
          i10 = i.slice(-1),
          i100 = i.slice(-2);
      if (ord) return "other";
      return v0 && i10 == 1 && i100 != 11 ? "one" : v0 && i10 >= 2 && i10 <= 4 && (i100 < 12 || i100 > 14) ? "few" : v0 && i10 == 0 || v0 && i10 >= 5 && i10 <= 9 || v0 && i100 >= 11 && i100 <= 14 ? "many" : "other";
    }
  },
  messages: {
    "Authorize": "Authorize",
    "Cancel": "Cancel",
    "Could not load data from server": "Could not load data from server",
    "Could not save data": "Could not save data",
    "Create Account": "Create Account",
    "Field is required": "Field is required",
    "Forgot Password": "Forgot Password",
    "Invalid format": "Invalid format",
    "Log Out": "\u0412\u044B\u0439\u0442\u0438 \u0438\u0437 \u0441\u0438\u0441\u0442\u0435\u043C\u044B",
    "Password:": "Password:",
    "Username:": "Username:",
    "Yes": "Yes",
    "users": "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438",
    "will be deleted. Are you sure?": "will be deleted. Are you sure?"
  }
};

/***/ })

}]);
//# sourceMappingURL=i18n_1_bded43d37424705c29d7.js.map