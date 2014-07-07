(function() {

  var init  

  init = function(bjq, _) {

    function isInvalid(changes, validityFunc, field) { 
      return changes.flatMap(function(value) { 
        return invertValidationResult(validityFunc(value, field))
      })

      function isObservable(value) {return _.isFunction(value.onValue)}
      function invertValidationResult(result) {
        if (isObservable(result)) { return result.map(function(v) { return !v }) }
        else { return !result }
      }
    }

    function hasErrors(allErrors) { return _.reduce(allErrors, function(errors1, errors2) { return errors1 || errors2; }) }  
    function getValidators(validators, changes, field) { return _.map(validators, function(f) { return isInvalid(changes, f, field) }) }
    function displayFieldError(field, showStatusClasses, err) {
      if (showStatusClasses === false) return
      field.toggleClass('error', err)
      field.toggleClass('valid', !err)
    }

    bjq.CommonBaconForm = function(formElement) {   
      this.formElement = formElement
      this.formFields = {}

      // Prevent default form submit. 
      // Also remember to use type="button" attribute on button html instances to prevent
      // browser default behavior.
      formElement.on('submit', function(e) {
        e.preventDefault()
        e.stopPropagation()
      })    

    }

    bjq.CommonBaconForm.prototype = {
      addSubmitButton : function(button, request, paramsAsProperty) {
        var instance = this

        instance.hasErrors().assign(button, "attr", "disabled")

        var enterKeys = instance.keyUpStreams().filter(instance.util.ENTER_KEY).filter(instance.hasErrors().not())
        var submit = button.asEventStream('click').doAction('.preventDefault')
        var submitEvents = submit.merge(enterKeys)

        // Remove focus from textfield to insure that submit button is disabled while request is pending.
        enterKeys.onValue(function(e) {
          $(e.target).blur()
        })

        if (typeof request === 'function' ) {
          response = paramsAsProperty
            .sampledBy(submitEvents)
            .debounceImmediate(500)
            .doAction(function(e) {
              button.addClass('throbber')
              instance.disable()
            })
            .flatMapLatest(request)

          response.subscribe(function(a) {
            button.removeClass('throbber')
            instance.formElement.find('input, textarea, select, button').removeAttr('disabled')
          })
        }

        return {
          button: button,
          events : submitEvents,
          response: (typeof response === 'undefined') ? null : response
        }
      },

      addTextField : function(fieldName, defaultValue, validators, showStatusClasses, showErrorsInstantly) {
        defaultValue = (typeof defaultValue === 'undefined') ? '' : defaultValue

        var field = this.formElement.find('input[name="' + fieldName + '"]')
        var bjqField = bjq.textFieldValue(field, defaultValue)
        var fieldKeys = bjqField.toEventStream()
        var fieldBlurStream = field.asEventStream('blur')
        var fieldBlur = fieldBlurStream.map(bjqField)
        var changes = fieldKeys.merge(fieldBlur)      
        var errors = Bacon.combineAsArray(getValidators(validators, changes, field)).map(hasErrors)
        var isBlurredOnce = Bacon.constant(false).or(fieldBlurStream.map(true))
        var shownErrors = showErrorsInstantly ? errors.skip(1) : errors.takeWhile(isBlurredOnce)

        shownErrors.onValue(function(err) {
          displayFieldError(field, showStatusClasses, err)
        })

        bjqField.map(this.validators.NOT_EMPTY).assign(field, 'toggleClass', 'hasContent')

        this.formFields[fieldName] = {
          field: field,
          value: bjqField,
          keys: field.asEventStream('keyup'),
          changes: bjqField.changes(),
          validators: validators,
          errors: errors,
          shownErrors: shownErrors
        }

        return this.formFields[fieldName]
      },

      addTextArea : function(fieldName, defaultValue, validators, showStatusClasses, showErrorsInstantly) {
        defaultValue = (typeof defaultValue === 'undefined') ? '' : defaultValue

        var field = this.formElement.find('textarea[name="' + fieldName + '"]')

        var bjqField = bjq.textFieldValue(field, defaultValue)
        var fieldKeys = bjqField.toEventStream()
        var fieldBlurStream = field.asEventStream('blur')
        var fieldBlur = fieldBlurStream.map(bjqField)
        var changes = fieldKeys.merge(fieldBlur)      
        var errors = Bacon.combineAsArray(getValidators(validators, changes, field)).map(hasErrors)
        var isBlurredOnce = Bacon.constant(false).or(fieldBlurStream.map(true))
        var shownErrors = showErrorsInstantly ? errors.skip(1) : errors.takeWhile(isBlurredOnce)

        shownErrors.onValue(function(err) {
          displayFieldError(field, showStatusClasses, err)
        })

        bjqField.map(this.validators.NOT_EMPTY).assign(field, 'toggleClass', 'hasContent')

        this.formFields[fieldName] = {
          field: field,
          value: bjqField,
          changes: bjqField.changes(),
          validators: validators,
          errors: errors,
          shownErrors: shownErrors
        }

        return this.formFields[fieldName]
      },

      addNumberField : function(fieldName, defaultValue, validators, showStatusClasses) {
        var field = this.formElement.find('input[name="' + fieldName + '"]')
        field.on('keydown', function(e) {
          if (e.keyCode > 57) {
            e.preventDefault()
            e.stopPropagation()
          }
        })
        
        return this.addTextField(fieldName, defaultValue, validators, showStatusClasses)
      },

      addSelectField : function(fieldName, defaultValue, validators, showStatusClasses) {
        defaultValue = (typeof defaultValue === 'undefined') ? '' : defaultValue
        var field = this.formElement.find('select[name="' + fieldName + '"]')
        var bjqField = bjq.selectValue(field, defaultValue)      
        var intial = bjqField.toEventStream()
        var changes = intial.merge(bjqField.changes())
        var errors = Bacon.combineAsArray(getValidators(validators, changes, field)).map(hasErrors)
        var isBlurredOnce = Bacon.constant(false).or(bjqField.changes().map(true))
        var shownErrors = errors.takeWhile(isBlurredOnce)

        shownErrors.onValue(function(err) {
          displayFieldError(field, showStatusClasses, err)
        })

        this.formFields[fieldName] = {
          field: field,
          value: bjqField,
          changes: bjqField.changes(),
          validators: validators,
          errors: errors,
          shownErrors: shownErrors
        }

        return this.formFields[fieldName]
      },

      addCheckboxField : function(fieldName, defaultValue, validators, showStatusClasses) {
        defaultValue = (typeof defaultValue === 'undefined') ? false : defaultValue
        var field = this.formElement.find('input[name="' + fieldName + '"]')
        var bjqField = bjq.checkBoxValue(field, defaultValue)
        var intial = bjqField.toEventStream()
        var changes = intial.merge(bjqField.changes())
        var errors = Bacon.combineAsArray(getValidators(validators, changes, field)).map(hasErrors)
        var isBlurredOnce = Bacon.constant(false).or(bjqField.changes().map(true))  
        var shownErrors = errors.takeWhile(isBlurredOnce)
        
        shownErrors.onValue(function(err) {
          displayFieldError(field, showStatusClasses, err)
        })

        this.formFields[fieldName] = {
          field: field,
          value: bjqField,
          changes: bjqField.changes(),
          validators: validators,
          errors: errors,
          shownErrors: shownErrors
        }

        return this.formFields[fieldName]
      },

      disable : function() { this.formElement.find('input, textarea, select, button').attr('disabled', 'disabled') },

      getSubmitButton : function() { return this.submitButton },

      getField : function(fieldName) { return this.formFields[fieldName].field },
      
      getBjqField : function(fieldName) { return this.formFields[fieldName].value },

      getValues : function() {
        var template = {}
        _.each(this.formFields, function(field, name) {
          template[name] = field.value
        })
        
        return Bacon.combineTemplate(template)
      },

      keyUpStreams : function() {
        if (_.size(this.formFields) === 0) return Bacon.never()

        var fieldsWithKeys = _.filter(this.formFields, function(f) { return typeof f.keys !== 'undefined' })
        var keyUps = _.map(fieldsWithKeys, function(f) { return f.keys })
        return _.reduce(keyUps, function(f1, f2) { return f1.merge(f2) })
      },

      changes : function() {
        if (_.size(this.formFields) === 0) return Bacon.never()
          
        var keyUps = _.map(this.formFields, function(f) { return f.changes })
        return _.reduce(keyUps, function(f1, f2) { return f1.merge(f2) })
      },

      hasErrors : function() {
        var errors = _.map(this.formFields, function(f) { return f.errors })
        return Bacon.combineAsArray(errors).map(hasErrors)
      },

      shownErrors: function() {
        var shownErrors = _.map(this.formFields, function(f) { 
          return f.shownErrors.toEventStream().map(function(err){
            return {error: err, field: f.field}
          })
        })

        return _.reduce(shownErrors, function(f1, f2) { return f1.merge(f2) })
      },

      util : {
        'ENTER_KEY' : function enterKey(e) { return e.keyCode == 13 },
        'ESC_KEY' : function enterKey(e) { return e.keyCode == 27 }
      },

      validators : {
        'EMAIL' : function isValidEmail(email) {
          return /^[A-Za-z0-9._%\-+]+@(?:[A-Za-z0-9\-]+\.)+[A-Za-z]{2,4}$/.test(email)
            && email.toLowerCase().indexOf("mailinator.com") === -1
        },
        'PASSWORD' : function isValidPassword(pwd) { return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,50}$/.test(pwd) },
        'NOT_EMPTY' : function notEmpty(val) { return val !== "" },
        'IS_EMPTY' : function isEmpty(field) { return field.map(function(value) { return value === "" }) },
        'IS_EMPTY_STRING' : function isEmpty(val) { return val === "" },
        'AUTH_CODE': function authCode(val) { return val.length === 5 },
        'MOBILE_WITH_PREFIX' : function containsCountryCode(val) { return /^(?:00|\+)[0-9\s]{6,20}$/.test(val) },
        'MOBILE' : function containsCountryCode(val) { return /^[0-9\s]{6,20}$/.test(val) },
        'IS_TRUE' : function isTrue(bool) { return bool === true },
        'IS_FALSE' : function isFalse(bool) { return false },
        'IS_INTEGER' : function isNumber(val) { return val >>> 0 === parseFloat(val) },
        'IS_DATE': function isDate(val) { return /^\d{1,2}[./-]\d{1,2}[./-]\d{4}$/.test(val)},
        'ANYTHING': function alwaysTrue() { return true }
      }
    }

    return bjq.CommonBaconForm

  } // End init.


  if (typeof define === 'function' && define.amd) {
    define(['bacon.jquery', 'lodash'], init)
  } else {
    init(Bacon.$, _)
  }

})()