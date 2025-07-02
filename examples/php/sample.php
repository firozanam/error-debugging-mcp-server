<?php
/**
 * Sample PHP file for error detection testing
 */

declare(strict_types=1);

namespace ErrorDebugging\Examples;

class SampleClass
{
    private string $name;
    private array $data;

    public function __construct(string $name)
    {
        $this->name = $name;
        $this->data = [];
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function addData(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
    }

    public function getData(): array
    {
        return $this->data;
    }

    // This will trigger a PHPStan error if strict analysis is enabled
    public function processData(): string
    {
        $result = '';
        foreach ($this->data as $key => $value) {
            $result .= $key . ': ' . $value . "\n";
        }
        return $result;
    }

    // This will trigger a syntax error if uncommented
    // public function syntaxError(
    //     return "missing opening brace";
    // }

    // This will trigger a warning about deprecated function
    public function deprecatedExample(): void
    {
        // This would trigger a warning in newer PHP versions
        // $result = mysql_connect('localhost', 'user', 'pass');
    }

    // Performance issue example
    public function performanceIssue(array $items): array
    {
        $result = [];
        for ($i = 0; $i < count($items); $i++) {
            array_push($result, $items[$i] * 2);
        }
        return $result;
    }
}

// Example usage
$sample = new SampleClass('Test');
$sample->addData('key1', 'value1');
$sample->addData('key2', 42);

echo $sample->processData();
