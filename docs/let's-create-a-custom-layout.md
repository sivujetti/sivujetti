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
    <style>
        .columns { display: flex; }
        .columns > section { flex: 1; }
    </style>
</head>
<body>
    <header>
        <h1 data-prop="title"><?= $this->e($page->title) ?></h1>
    </header>
    <div class="columns">
        <?= $this->renderBlocks($page->blocks) ?>
    </div>
    <footer>
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

- `data-prop="title"`-attribuutti tulee määritellä siksi, että muokkaus-applikaatio osaisi renderöidä sivun otsikon "Luo sivu"-toiminnon esikatselussa

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

## 3. Hae sivupohjaan lohkoja

- todo luo lohko käyttäen `kuura-cli`:tä
- päivitä sivupohjan koodiin edellä luotu staattinen lohko

## 4. Yhteenveto

...
