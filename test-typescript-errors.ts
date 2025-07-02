// Test file with intentional TypeScript errors for testing enhanced error detection

interface User {
  name: string;
  age: number;
}

// Error 1: Type mismatch
const user: User = {
  name: "John",
  age: "thirty" // Should be number, not string
};

// Error 2: Missing property
const incompleteUser: User = {
  name: "Jane"
  // Missing age property
};

// Error 3: Syntax error
function greetUser(user: User {
  return `Hello, ${user.name}!`;
}

// Error 4: Using undefined variable
console.log(undefinedVariable);

// Error 5: Wrong function call
greetUser("not a user object");
