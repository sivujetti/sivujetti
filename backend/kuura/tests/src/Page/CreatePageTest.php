<?php declare(strict_types=1);

namespace KuuraCms\Tests\Page;

use KuuraCms\App;
use KuuraCms\Block\Entities\Block;
use KuuraCms\Page\Entities\Page;
use KuuraCms\PageType\Entities\PageType;
use KuuraCms\Tests\Utils\{BlockTestUtils, HttpApiTestTrait, PageTestUtils};
use Pike\{PikeException, TestUtils\DbTestCase, TestUtils\HttpTestUtils};

final class CreatePageTest extends DbTestCase {
    use HttpTestUtils;
    use HttpApiTestTrait;
    private PageTestUtils $pageTestUtils;
    protected function setUp(): void {
        parent::setUp();
        $this->pageTestUtils = new PageTestUtils(self::$db);
    }
    public function testCreateNormalPageInsertsPageToDb(): void {
        $state = $this->setupTest();
        $this->makeKuuraApp($state);
        $this->sendCreatePageRequest($state);
        $this->verifyRequestFinishedSuccesfully($state);
        $this->verifyInsertedPageToDb($state);
    }
    private function setupTest(): \TestState {
        $state = new \TestState;
        $btu = new BlockTestUtils();
        $state->inputData = (object) [
            "slug" => "/my-page",
            "path" => "/my-page/",
            "level" => 1,
            "title" => "My page",
            "layoutId" => 1,
            "blocks" => [],
            "status" => Page::STATUS_PUBLISHED,
            "categories" => "[]",
        ];
        $state->app = null;
        return $state;
    }
    private function makeKuuraApp(\TestState $state): void {
        $state->app = $this->makeApp(fn() => App::create(self::setGetConfig()));
    }
    private function sendCreatePageRequest(\TestState $state): void {
        $state->spyingResponse = $state->app->sendRequest(
            $this->createApiRequest("/api/pages/" . PageType::PAGE, "POST", $state->inputData));
    }
    private function verifyRequestFinishedSuccesfully(\TestState $state): void {
        $this->verifyResponseMetaEquals(201, "application/json", $state->spyingResponse);
    }
    private function verifyInsertedPageToDb(\TestState $state): void {
        $actual = $this->pageTestUtils->getPageBySlug($state->inputData->slug);
        unset($actual->blocks);
        unset($actual->layout);
        $this->assertEquals([
            "slug" => $state->inputData->slug,
            "path" => $state->inputData->path,
            "level" => $state->inputData->level,
            "title" => $state->inputData->title,
            "layoutId" => strval($state->inputData->layoutId),
            "id" => $actual->id,
            "type" => PageType::PAGE,
            "status" => $state->inputData->status,
            "categories" => $state->inputData->categories,
        ], (array) $actual);
    }

    ////////////////////////////////////////////////////////////////////////////

    public function testCreateNormalPageRejectsInvalidInputs(): void {
        $state = $this->setupTest();
        $state->inputData = (object) [];
        $this->makeKuuraApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage(implode(PHP_EOL, [
            "slug must be string",
            "path must be string",
            "level must be number",
            "title must be string",
            "layoutId must be number",
            "The value of layoutId must be 1 or greater",
            "blocks must be array",
            "status must be number",
            "The value of status must be 0 or greater",
            "categories must be string",
            "The length of categories must be 256000 or less",
        ]));
        $this->sendCreatePageRequest($state);
    }

    ////////////////////////////////////////////////////////////////////////////

    public function testCreateNormalPageValidatesBlocksRecursively(): void {
        $state = $this->setupTest();
        $btu = new BlockTestUtils();
        $notValidBlock = (object) ["type" => Block::TYPE_PARAGRAPH];
        $validBlock = $btu->makeBlockData(Block::TYPE_SECTION, "Main", "kuura:block-generic-wrapper", children: [
            $notValidBlock,
        ], propsData: ["cssClass" => "", "bgImage" => ""]);
        $state->inputData->blocks = [$validBlock];
        $this->makeKuuraApp($state);
        $this->expectException(PikeException::class);
        $this->expectExceptionMessage(implode(PHP_EOL, [
            "The value of renderer was not in the list",
        ]));
        $this->sendCreatePageRequest($state);
    }
}
