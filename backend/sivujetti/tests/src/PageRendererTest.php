<?php declare(strict_types=1);

namespace Sivujetti\Tests;

use PHPUnit\Framework\TestCase;
use Sivujetti\{AppEnv, ParentAppAwarePageRendererBootModule};

// Autoload ParentAppAwarePageRendererBootModule (inside PageRenderer.php).
class_exists(\Sivujetti\PageRenderer::class);

final class PageRendererTest extends TestCase {
    public function testLinkPatcherReplacesQVarLinksToNonQVarLinks(): void {
        $lnk = self::createLinkCreator();
        // `href="/index.php?q=/slug` -> `href="/slug`
        $doPatchLinks = $this->createPatcher();
        $testTextBlockHtml = "<p>Text {$lnk("/index.php?q=/slug")} | {$lnk("/index.php?q=/")}</p>";
        $actual = $doPatchLinks($testTextBlockHtml);
        $this->assertEquals(
            "<p>Text {$lnk("/slug")} | {$lnk("/")}</p>",
            $actual
        );

        // `href="/index.php?q=/slug` -> `href="/new-dir/slug`
        $doPatchLinks = $this->createPatcher(newBaseDir: "/new-dir/");
        $actual = $doPatchLinks($testTextBlockHtml);
        $this->assertEquals(
            "<p>Text {$lnk("/new-dir/slug")} | {$lnk("/new-dir/")}</p>",
            $actual
        );

        // `href="/orig-dir/index.php?q=/slug` -> `href="/slug`
        $doPatchLinks = $this->createPatcher(origBaseDir: "/orig-dir/");
        $testTextBlockHtml = "<p>Text {$lnk("/orig-dir/index.php?q=/slug")} | {$lnk("/orig-dir/index.php?q=/")}</p>";
        $actual = $doPatchLinks($testTextBlockHtml);
        $this->assertEquals(
            "<p>Text {$lnk("/slug")} | {$lnk("/")}</p>",
            $actual
        );

        // `href="/orig-dir/index.php?q=/slug` -> `href="/new-dir/slug`
        $doPatchLinks = $this->createPatcher(origBaseDir: "/orig-dir/", newBaseDir: "/new-dir/");
        $actual = $doPatchLinks($testTextBlockHtml);
        $this->assertEquals(
            "<p>Text {$lnk("/new-dir/slug")} | {$lnk("/new-dir/")}</p>",
            $actual
        );
    }
    public function testLinkPatcherReplacesNonQVarLinksToNonQVarLinks(): void {
        $lnk = self::createLinkCreator();
        // `href="/slug` -> `href="/new-dir/slug`
        $doPatchLinks = $this->createPatcher(origQueryVar: "", newBaseDir: "/new-dir/");
        $testTextBlockHtml = "<p>Text {$lnk("/slug")} | {$lnk("/")}</p>";
        $actual = $doPatchLinks($testTextBlockHtml);
        $this->assertEquals(
            "<p>Text {$lnk("/new-dir/slug")} | {$lnk("/new-dir/")}</p>",
            $actual
        );

        // `href="/orig-dir/slug` -> `href="/new-dir/slug`
        $doPatchLinks = $this->createPatcher(origQueryVar: "", origBaseDir: "/orig-dir/", newBaseDir: "/new-dir/");
        $testTextBlockHtml = "<p>Text {$lnk("/orig-dir/slug")} | {$lnk("/orig-dir/")}</p>";
        $actual = $doPatchLinks($testTextBlockHtml);
        $this->assertEquals(
            "<p>Text {$lnk("/new-dir/slug")} | {$lnk("/new-dir/")}</p>",
            $actual
        );

        // `href="/orig-dir/slug` -> `href="/slug`
        $doPatchLinks = $this->createPatcher(origQueryVar: "", origBaseDir: "/orig-dir/");
        $testTextBlockHtml = "<p>Text {$lnk("/orig-dir/slug")} | {$lnk("/orig-dir/")}</p>";
        $actual = $doPatchLinks($testTextBlockHtml);
        $this->assertEquals(
            "<p>Text {$lnk("/slug")} | {$lnk("/")}</p>",
            $actual
        );
    }
    private function createPatcher(string $origQueryVar = "q",
                                   string $newQueryVar = "",
                                   string $origBaseDir = "/",
                                   string $newBaseDir = "/"): \Closure {
        $curSiteConfig = [
            "env" => [
                "BASE_URL" => $origBaseDir,
                "QUERY_VAR" => $origQueryVar
            ],
            "app" => [],
        ];
        $targetSiteConfig = [
            "env" => [
                "BASE_URL" => $newBaseDir,
                "QUERY_VAR" => $newQueryVar,
            ],
            "app" => [],
        ];
        $mod = new ParentAppAwarePageRendererBootModule($targetSiteConfig);
        $parentAppEnv = new AppEnv;
        $parentAppEnv->constants = $curSiteConfig["env"];
        $mod->use($parentAppEnv);
        return $mod->createLinkPatcher();
    }
    private function createLinkCreator(): \Closure {
        return fn(string $url): string =>
            "<a href=\"{$url}\">Link</a>"
        ;
    }
}
