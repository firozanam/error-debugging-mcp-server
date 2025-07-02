<?php
// PHP test file with intentional errors for testing error detection

// 1. Syntax Error - Missing semicolon
function brokenFunction() {
    $x = 5
    echo "x is " . $x;
}

// 2. Syntax Error - Invalid variable name
function invalidVariable() {
    $5invalid = "test"; // Variable names cannot start with numbers
    echo $5invalid;
}

// 3. Undefined function call
function undefinedFunction() {
    return nonExistentFunction();
}

// 4. Syntax Error - Missing closing quote
function unclosedString() {
    $str = "This string is not closed;
    echo $str;
}

// 5. Syntax Error - Invalid array syntax
function invalidArray() {
    $arr = array(
        "key1" => "value1",
        "key2" => "value2"
        "key3" => "value3"  // Missing comma
    );
    return $arr;
}

// 6. Type Error - Calling non-function
function callNonFunction() {
    $notAFunction = "I'm a string";
    return $notAFunction();
}

// 7. Syntax Error - Invalid class definition
class BrokenClass {
    public $property1;
    public $property2
    public $property3; // Missing semicolon above
    
    public function method1() {
        return $this->property1;
    }
    
    // 8. Syntax Error - Invalid method definition
    public function method2( {
        return "broken method";
    }
}

// 9. Syntax Error - Invalid if statement
function invalidIf() {
    $x = 5;
    if ($x == 5 {  // Missing closing parenthesis
        echo "x is 5";
    }
}

// 10. Syntax Error - Invalid foreach loop
function invalidForeach() {
    $arr = array(1, 2, 3);
    foreach ($arr as $value {  // Missing closing parenthesis
        echo $value;
    }
}

// 11. Syntax Error - Missing closing brace
function unclosedFunction() {
    echo "This function is not closed";

// 12. Parse Error - Invalid PHP tag
function invalidTag() {
    echo "test";
    <? // Invalid short tag without php
    echo "more test";
}

// Missing closing PHP tag and brace
