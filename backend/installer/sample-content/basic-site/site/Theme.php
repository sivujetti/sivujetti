<?php declare(strict_types=1);

namespace KuuraSite;

use KuuraCms\Block\Entities\Block;
use KuuraCms\PushId;
use KuuraCms\Theme\{ThemeAPI, ThemeInterface};

class Theme implements ThemeInterface {
    /**
     * Ajetaan jokaisen sivupyynnön yhteydessä. Rekisteröi sivutemplaatit
     * ($api->registerLayoutForUrlPattern(<tiedostopolku>, <urlMatcheri>)) ja
     * tyylitiedostot ($api->enqueueCss|JsFile(<urli>)).
     *
     * @param \KuuraCms\Theme\ThemeAPI $api
     */
    public function __construct(ThemeAPI $api) {
        $api->registerPageLayout('Full width',
                                 'layout.default.tmpl.php',
                                 isDefault: true);
        $api->registerPageLayout('With sidebar',
                                 'layout.default.tmpl.php',
                                 initialBlocks: self::createTwoColumnBlocks());
        $api->enqueueCssFile('main.css');
    }
    /**
     * @access private
     */
    private static function createTwoColumnBlocks(): array {
        $col1 = new Block;
        $col1->type = Block::TYPE_SECTION;
        $col1->section = 'main';
        $col1->renderer = 'kuura:generic-wrapper';
        $col1->id = PushId::generate();
        $col1->path = '';
        $col1->title = '';
        $col1->children = self::bar();
        $col1->cssClass = 'main-column';
        $col2 = new Block;
        $col2->type = Block::TYPE_SECTION;
        $col2->section = 'main';
        $col2->renderer = 'kuura:generic-wrapper';
        $col2->id = PushId::generate();
        $col2->path = '';
        $col2->title = '';
        $col2->children = self::bar();
        $col2->cssClass = 'aside-column';
        $root = new Block;
        $root->type = Block::TYPE_COLUMNS;
        $root->section = 'main';
        $root->renderer = 'kuura:generic-wrapper';
        $root->id = PushId::generate();
        $root->path = '';
        $root->title = '';
        $root->children = [$col1, $col2];
        $root->cssClass = 'columns';
        return [$root];
    }
    /**
     * @access private
     */
    private static function bar(): array {
        $b1 = new Block;
        $b1->type = Block::TYPE_HEADING;
        $b1->section = 'main';
        $b1->renderer = 'kuura:auto';
        $b1->id = PushId::generate();
        $b1->path = '';
        $b1->title = '';
        $b1->children = [];
        $b1->level = '2';
        $b1->text = '-';
        $b2 = new Block;
        $b2->type = Block::TYPE_PARAGRAPH;
        $b2->section = 'main';
        $b2->renderer = 'kuura:auto';
        $b2->id = PushId::generate();
        $b2->path = '';
        $b2->title = '';
        $b2->children = [];
        $b2->text = '-';
        return [$b1, $b2];
    }
}
