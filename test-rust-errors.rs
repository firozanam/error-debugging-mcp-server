// Rust test file with intentional errors for testing error detection

// 1. Syntax Error - Missing semicolon
fn broken_function() {
    let x = 5
    println!("x is {}", x);
}

// 2. Borrow checker error - Use after move
fn borrow_error() {
    let s1 = String::from("hello");
    let s2 = s1;
    println!("{}", s1); // Error: s1 was moved
}

// 3. Type mismatch
fn type_mismatch() {
    let x: i32 = "string"; // Cannot assign string to i32
}

// 4. Undefined variable
fn undefined_variable() {
    println!("{}", undefined_var);
}

// 5. Syntax Error - Invalid struct definition
struct BrokenStruct {
    field1: String,
    field2: i32
    field3: bool, // Missing comma above
}

// 6. Lifetime error
fn lifetime_error() -> &str {
    let s = String::from("hello");
    &s // Error: returning reference to local variable
}

// 7. Syntax Error - Invalid match expression
fn invalid_match(x: i32) {
    match x {
        1 => println!("one"),
        2 => println!("two")
        3 => println!("three"), // Missing comma above
        _ => println!("other"),
    }
}

// 8. Mutability error
fn mutability_error() {
    let x = 5;
    x = 6; // Error: cannot assign to immutable variable
}

// 9. Syntax Error - Invalid function signature
fn invalid_signature(param1: i32, param2) -> i32 { // Missing type for param2
    param1 + param2
}

// 10. Syntax Error - Unclosed block
fn unclosed_block() {
    if true {
        println!("inside if");
    // Missing closing brace

// 11. Invalid macro usage
fn invalid_macro() {
    println!("Hello, {}"; // Missing closing parenthesis
}

// 12. Syntax Error - Invalid main function
fn main( {
    broken_function();
    borrow_error();
}
