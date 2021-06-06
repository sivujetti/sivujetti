<form action="<?= $this->url("/api/defaults/contact-form/handle-submit/21") ?>"
    method="post"
    id="kuura-form-todo"
    novalidate>
    <?php foreach (json_decode($props->fields) as $f):
        echo match ($f->type) {
            'text' => "<div><label>{$f->label}</label><input name=\"todoa\"></div>",
            'email' => "<div><label>{$f->label}</label><input name=\"btodob\" type=\"email\"></div>",
            'textarea' => "<div><label>{$f->label}</label><textarea name=\"todoc\"></textarea></div>",
            default => "Don't know how to render input type `{$f->type}`"
        };
    endforeach; ?>
    <input type="hidden" name="_returnTo" value="<?= is_string($props->returnTo ?? null) ? $this->e($props->returnTo) : '' ?>">
    <input type="hidden" name="_csrf" value="todo">
    <button>Contact us</button>
</form>
<!--<script>
document.getElementById('form-todo').addEventListener('submit', e => {
    e.preventDefault();
    fetch();
});
</script>-->