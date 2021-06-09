# Custom-sivutemplaatin määritteleminen

Tässä tutoriaalissa opit lisäämään teemaasi sivupohjan, joita sivuston ylläpitäjät voivat valita muokkaus-applikaatiossa uusia sivuja luodessaan.

## 1. Koodaa sivupohja

Luo tiedosto `<sivustonPolku>/site/templates/layout.my-layout.tmpl.php`, ja kirjoita sen sisällöksi:

```php
<!DOCTYPE html>
<html lang="<?= $site->lang ?>">
<head>
    <meta charset="utf-8">
    <title><?= "{$page->title} - {$site->name}" ?></title>
    <meta name="generator" content="KuuraCMS">
    <?= $this->cssFiles() ?>
</head>
<body>
    <header>
        <h1 data-prop="title"><?= $this->e($page->title) ?></h1>
    </header>
    <div style="display:flex">
        <section style="flex:1" data-section="main">
            <?= $this->renderBlocks($this->filterBlocks($page, 'main')) ?>
        </section>
        <section style="flex:1" data-section="sidebar">
            <?= $this->renderBlocks($this->filterBlocks($page, 'sidebar')) ?>
        </section>
    </div>
    <footer data-section="footer">
        <?= $this->renderBlocks($this->filterBlocks($page, 'footer')) ?>
        &copy; <?= $site->name ?> <?= date('Y') ?>
    </footer>
</body>
</html>
```

Käytössä olevat muuttujat:

- `$site` todo
- `$url` todo
- todo

Muut huomiot:

- `data-section`-attribuutit tulee määritellä siksi, että muokkaus-applikaatio osaisi renderöidä lohkot oikeisiin paikkoihin "Luo sivu"-toiminnon esikatselussa
- `data-prop="title"`-attribuutti siksi, että muokkaus-applikaatio osaisi renderidä sivun otsikon "Luo sivu"-toiminnon esikatselussa

## 2. Rekisteröi sivupohja

Tee tämä muokkaamalla `Theme.php`:hen:

```php
...
    public function __construct(ThemeAPI $api) {
        ...
        $api->registerPageLayout(friendlyName: 'My layout',
                                 relFilePath: 'layout.my-layout.tmpl.php',
                                 sections: ['main', 'sidebar', 'footer'],
                                 isDefault: false);
    }
...
```

Tämän jälkeen rekisteröity sivupohja pitäisi olla valittavissa muokkaus-applikaation "Luo sivu"-näkymässä.

## 3. Yhteenveto

...
