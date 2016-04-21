// This file is used only for testing purposes. Ideally, this code would be
// loaded in the common-bacon-form.js but since there's no build, we can't do
// it. This should be implemented in the future.
module.exports = {
  EMAIL : function isValidEmail(email) {
    return /^[A-Za-z0-9._%\-+]+@(?:[A-Za-z0-9\-]+\.)+[A-Za-z]{2,4}$/.test(email)
      && email.toLowerCase().indexOf("mailinator.com") === -1
  },
  PASSWORD : function isValidPassword(pwd) { return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,50}$/.test(pwd) },
  NOT_EMPTY : function notEmpty(val) { return val !== "" },
  IS_EMPTY : function isEmpty(field) { return field.map(function(value) { return value === "" }) },
  IS_EMPTY_STRING : function isEmpty(val) { return val === "" },
  AUTH_CODE : function authCode(val) { return val.length === 5 },
  MOBILE_WITH_PREFIX : function containsCountryCode(val) { return /^(?:00|\+)[0-9\s]{6,20}$/.test(val) },
  MOBILE : function containsCountryCode(val) { return /^[0-9\s]{6,20}$/.test(val) },
  IS_TRUE : function isTrue(bool) { return bool === true },
  IS_FALSE : function isFalse(bool) { return false },
  IS_INTEGER : function isNumber(val) { return val >>> 0 === parseFloat(val) },
  IS_DATE : function isDate(val) { return /^\d{1,2}[./-]\d{1,2}[./-]\d{4}$/.test(val)},
  ANYTHING : function alwaysTrue() { return true },
  HAS_TEXT : function hasText(val) {
    return val.replace(/[\s\t\n\r\000\xFF\uFFFF\cI\v\0]/g, "") !== ""
  }
}
