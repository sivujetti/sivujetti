<div class="j-<?= \Sivujetti\Block\Entities\Block::TYPE_LISTING, " page-type-", strtolower($props->filterPageType), ($props->styleClasses ? " {$this->escAttr($props->styleClasses)}" : "") ?>" data-block-type="<?= \Sivujetti\Block\Entities\Block::TYPE_LISTING ?>" data-block="<?= $props->id ?>">
<?php if ($props->__pages ?? null): ?>
    <?php foreach ($props->__pages as $page): ?>
    <article class="list-item list-item-<?= $page->slug ?>">
        <?php foreach ($props->rendererSettings->parts as $part):
        // Heading
        if ($part->kind === "heading"):
            $whiteListed = [0, 1, 2, 3, 4, 5, 6][$part->data->level] ?? 6;
            echo "<h", $whiteListed, ">", $this->e($page->title), "</h", $whiteListed, ">";

        // Link
        elseif ($part->kind === "link"): ?>
            <div><a href="<?= $this->url(
                ($props->filterPageType === "Pages" ? "" : $props->__pageType->slug) . $page->slug
            ) ?>"><?= $this->__($part->data->text) ?></a></div>
        <?php

        // Image
        elseif ($part->kind === "image"): ?>
            <div class="article-pic">
                <?php if ($part->data->primarySource === "meta" && isset($page->meta->socialImage->src)): ?>
                    <img src="<?= $this->assetUrl("public/uploads/{$page->meta->socialImage->src}") ?>" alt="<?= $this->__("Article media") ?>">
                <?php elseif ($part->data->primarySource === "content" &&
                                ($_pic = \Sivujetti\Block\BlockTree::findBlock($page->blocks, fn($b) => $b->type === "Image"))): ?>
                    <img src="<?= $_pic->src
                        ? $this->maybeExternalMediaUrl($_pic->src)
                        : \Sivujetti\BlockType\ImageBlockType::PLACEHOLDER_SRC ?>" alt="<?= $_pic->altText
                            ? $this->escAttr($_pic->altText)
                            : "" ?>">
                <?php elseif ($part->data->fallbackImageSrc): ?>
                    <img src="<?= $this->maybeExternalMediaUrl($part->data->fallbackImageSrc) ?>" alt="<?= $this->__("Article media") ?>">
                <?php else: ?>
                    <!-- no image found -->
                <?php endif; ?>
            </div>
        <?php

        // Excerpt
        elseif ($part->kind === "excerpt"): ?>
            <div class="article-excerpt">
                <?php if ($part->data->primarySource === "meta" && isset($page->meta->description)):
                    echo $page->meta->description; /* allow unescaped */
                elseif ($part->data->primarySource === "content" &&
                        ($_text = \Sivujetti\Block\BlockTree::findBlock($page->blocks, fn($b) => $b->type === "Text" && str_contains($b->html, "</p>"))) &&
                        ($_paras = (function (string $html): array {
                            $dom = new DOMDocument(encoding: "UTF-8");
                            $dom->loadHTML($html);
                            return array_map(fn($p) => array_reduce([...$p->childNodes->getIterator()],
                                fn($html, $c) => "{$html}<p>{$p->ownerDocument->saveHTML($c)}</p>",
                                ""
                            ), [...$dom->getElementsByTagName("p")->getIterator()]);
                        })($_text->html))):
                    foreach ($_paras as $_p)
                        echo $_p; /* allow unescaped */
                else:
                    echo "<!-- no description found -->";
                endif; ?>
            </div>
        <?php endif; ?>
        <?php endforeach; ?>
    </article>
    <?php endforeach; ?>
<?php else: ?>
    <p><?= $this->__("No %s found.", strtolower($props->__pageType->friendlyNamePlural)) ?></p>
<?php endif; ?>
<?= $this->renderChildren($props); ?>
</div>