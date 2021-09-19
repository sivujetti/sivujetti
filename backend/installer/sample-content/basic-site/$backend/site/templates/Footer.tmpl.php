<footer>
    <?= $this->renderBlocks(\Pike\ArrayUtils::filterByKey($page->layout->blocks, "Paragraph", "type")) ?>
</footer>