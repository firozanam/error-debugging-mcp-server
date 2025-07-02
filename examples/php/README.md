# PHP Error Detection Example

This directory contains example PHP files to demonstrate the error detection capabilities of the Error Debugging MCP Server.

## Files

- `sample.php` - Main example file with various PHP constructs and potential issues
- `composer.json` - Composer configuration with development dependencies
- `phpstan.neon` - PHPStan configuration for static analysis
- `phpcs.xml` - PHP_CodeSniffer configuration for coding standards

## Error Types Demonstrated

### Syntax Errors
- Parse errors (commented out in sample.php)
- Missing braces, semicolons, etc.

### Static Analysis Issues
- Type mismatches
- Undefined variables
- Unreachable code
- Unused variables

### Performance Issues
- Inefficient array operations
- Deprecated function usage
- Suboptimal loop constructs

### Coding Standards
- PSR-12 compliance
- Naming conventions
- Code formatting

## Tools Integration

### PHP Built-in Linting
```bash
php -l sample.php
```

### PHPStan Static Analysis
```bash
composer install
vendor/bin/phpstan analyse sample.php --level=max
```

### PHP_CodeSniffer
```bash
composer install
vendor/bin/phpcs sample.php --standard=PSR12
```

## Usage with MCP Server

The Error Debugging MCP Server will automatically detect and analyze these files when PHP support is enabled, providing:

1. **Real-time syntax checking** using `php -l`
2. **Static analysis** using PHPStan (if available)
3. **Coding standards** checking using PHP_CodeSniffer (if available)
4. **Performance suggestions** based on code patterns
5. **Stack trace parsing** for runtime errors

## Configuration

The MCP server will look for these configuration files:
- `composer.json` - For project dependencies and autoloading
- `phpstan.neon` - For PHPStan configuration
- `phpcs.xml` - For PHP_CodeSniffer rules
- `php.ini` - For PHP runtime configuration
