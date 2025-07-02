# Python test file with intentional errors for testing error detection

# 1. Syntax Error - Invalid indentation
def broken_function():
print("This should be indented")
    return True

# 2. Syntax Error - Missing colon
def another_broken_function()
    return False

# 3. Name Error - Undefined variable
def use_undefined_variable():
    print(undefined_variable)
    return result

# 4. Type Error - Unsupported operation
def type_error_example():
    return "string" + 5

# 5. Syntax Error - Invalid dictionary
broken_dict = {
    "key1": "value1",
    "key2": "value2"
    "key3": "value3"  # Missing comma
}

# 6. Import Error - Non-existent module
import non_existent_module

# 7. Syntax Error - Invalid function call
def invalid_call():
    return some_function(param1, param2,)  # Trailing comma in wrong place

# 8. Syntax Error - Unclosed string
broken_string = "This string is not closed

# 9. Indentation Error - Mixed tabs and spaces
def mixed_indentation():
    if True:
        print("spaces")
	print("tabs")  # This line uses tabs

# 10. Syntax Error - Invalid assignment
5 = variable_name
