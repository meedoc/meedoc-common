var should = require('should')
var validators = require('../dist/validators.js')

describe('Tests validators', function() {
  it('should return false for a string made of white spaces', function() {
    validators.HAS_TEXT("     ").should.eql(false)
  })
  it('should return false for a string made of white spaces and line breaks', function() {
    validators.HAS_TEXT("\n     ").should.eql(false)
  })
  it('should return false for a string made of tabs and line breaks', function() {
    validators.HAS_TEXT("\t\n\n\n\n\n\n\n").should.eql(false)
  })
  it('should return false for a string made of invisible characters', function() {
    validators.HAS_TEXT("\n\t\n         ").should.eql(false)
  })
  it('should return true for a string made only of letters', function() {
    validators.HAS_TEXT("QueensOfTheStoneAge").should.eql(true)
  })
  it('should return true for a string made only of letters, numbers and signs', function() {
    validators.HAS_TEXT("#%$a;ksfj570897502()*&^(*&^(#$^#@%))").should.eql(true)
  })
  it('should return true for a string made of visible and invisible characters', function() {
    validators.HAS_TEXT("\nasdf\tasdf\n #@%   2345435    @#% ").should.eql(true)
  })
})
