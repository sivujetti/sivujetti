<footer>
    <?= $this->renderBlocks($this->fetchBlocks()->where('title', 'Footer text')->exec()) ?>
</footer>