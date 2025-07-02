// Go test file with intentional errors for testing error detection
package main

import (
    "fmt"
    "nonexistent/package"  // Import error
)

// 1. Syntax Error - Missing function body
func brokenFunction() {

// 2. Type Error - Mismatched types
func typeMismatch() {
    var x int = "string"  // Cannot assign string to int
    fmt.Println(x)
}

// 3. Undefined variable
func undefinedVariable() {
    fmt.Println(undefinedVar)
}

// 4. Syntax Error - Invalid struct
type BrokenStruct struct {
    Field1 string
    Field2 int
    Field3 bool  // Missing comma or newline
    Field4 float64
}

// 5. Function signature error
func invalidSignature(param1 string, param2) {  // Missing type for param2
    return param1
}

// 6. Syntax Error - Invalid slice declaration
func invalidSlice() {
    var slice []int = [1, 2, 3]  // Should use {} not []
    fmt.Println(slice)
}

// 7. Unreachable code
func unreachableCode() {
    return
    fmt.Println("This will never execute")  // Unreachable
}

// 8. Invalid method receiver
func (s BrokenStruct invalidMethod() {  // Missing closing parenthesis
    fmt.Println("Invalid method")
}

// 9. Syntax Error - Invalid channel operation
func invalidChannel() {
    ch := make(chan int)
    ch <- <- ch  // Invalid syntax
}

// 10. Missing main function closer
func main() {
    fmt.Println("Hello, World!")
    brokenFunction()
// Missing closing brace
