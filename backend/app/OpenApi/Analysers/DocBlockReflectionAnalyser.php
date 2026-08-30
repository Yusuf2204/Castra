<?php

namespace App\OpenApi\Analysers;

use OpenApi\Analysis;
use OpenApi\Analysers\AnalyserInterface;
use OpenApi\Analysers\AttributeAnnotationFactory;
use OpenApi\Analysers\DocBlockAnnotationFactory;
use OpenApi\Analysers\ReflectionAnalyser;
use OpenApi\Context;
use OpenApi\Generator;

/**
 * ReflectionAnalyser that reads DocBlock annotations as well as
 * native attributes, while staying serializable so that
 * `php artisan config:cache` can export the l5-swagger config.
 *
 * The config value is `new DocBlockReflectionAnalyser()`. When
 * config:cache var_export()s it, __set_state() below returns a fresh
 * instance — the real analyser is built lazily, so no
 * non-serializable objects ever end up in the cached config.
 */
class DocBlockReflectionAnalyser implements AnalyserInterface
{
    private ?ReflectionAnalyser $delegate = null;

    private function delegate(): ReflectionAnalyser
    {
        return $this->delegate ??= new ReflectionAnalyser([
            new AttributeAnnotationFactory(),
            new DocBlockAnnotationFactory(),
        ]);
    }

    /**
     * Called by config:cache's var_export() when loading the cache —
     * the exported state is ignored and the analyser is rebuilt fresh.
     *
     * @param  array<string, mixed>  $state
     */
    public static function __set_state(array $state): static
    {
        return new static();
    }

    public function setGenerator(Generator $generator): void
    {
        $this->delegate()->setGenerator($generator);
    }

    public function fromFile(string $filename, Context $context): Analysis
    {
        return $this->delegate()->fromFile($filename, $context);
    }
}
