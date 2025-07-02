// JavaScript test file with intentional errors for testing error detection

// 1. Syntax Error - Missing closing parenthesis
function brokenFunction(param1, param2 {
  return param1 + param2;
}

// 2. Reference Error - Undefined variable
function useUndefinedVariable() {
  console.log(undefinedVariable);
  return result; // undefined variable
}

// 3. Type Error - Calling non-function
function callNonFunction() {
  const notAFunction = "I'm a string";
  return notAFunction();
}

// 4. Syntax Error - Invalid object literal
const brokenObject = {
  property1: "value1",
  property2: "value2"
  property3: "value3" // Missing comma
};

// 5. Syntax Error - Invalid arrow function
const brokenArrow = (param1, param2 => {
  return param1 + param2;
};

// 6. Reference Error - Accessing undefined property
function accessUndefinedProperty() {
  const obj = {};
  return obj.nonExistentProperty.someMethod();
}

// 7. Syntax Error - Invalid template literal
const brokenTemplate = `Hello ${name`;

// 8. Invalid assignment
const const invalidAssignment = "test";
