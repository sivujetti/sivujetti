# Custom-lohkotyypin luominen

Tässä tutoriaalissa opit luomaan uuden lohkotyypin.

## Frontendin osuus

Ilman frontendin osuutta sivuston ylläpitäjät eivät pystyisi lisäämään tai muokkaamaan tämän tyyppistä sisältöä muokkaus-applikaatiossa.

### 0. Asenna KuuraSDK

Todo

### 1. Luo konfiguraatiotiedosto

Luo tiedosto `<sivustonPolku>/site/frontend/rollup.config.js`, ja kirjoita sen sisällöksi:

```javascript
module.exports = {
    input: 'site/frontend/main.js',
    output: {
        file: 'public/my-site-bundled.js',
    }
};

```

### 2. Luo lohkoimplementaatiolle tiedosto

Luo tiedosto `<sivustonPolku>/site/frontend/main.js` ja kirjoita sen sisälläksi:

```javascript
const textAndImageBlockReRender = (newDataFromForm, blockRef, prevData) => {
    // todo
};

const textAndImageBlockGetInitialData = () => ({
    // todo
});

class TextAndImageBlockFormInputs extends preact.Component {
    applyLatestValue() {
        // todo
    }
}

window.kuuraCms.registerBlock('text-and-image', {
    reRender: textAndImageBlockReRender,
    getInitialData: textAndImageBlockGetInitialData,
    EditFormImpl: TextAndImageBlockFormInputs,
    CreateFormImpl: TextAndImageBlockFormInputs,
    friendlyName: 'Text and image',
});

```

### 3. Transpiloi

Transpiloi stepin 2. applikaatio yhdeksi tiedostoksi sdk:ta käyttäen:

- `cd site`
- `npm --prefix ../ start -- --configInput site/frontend/rollup.config.js`

Bundlattu tiedosto pitäisi ilmestyä `rollup.config.js` -tiedostossa määriteltyyn kohteeseen (`public/my-site-bundled.js`).

### 4. Koodaa lohkotyyppi loppuun

todo

### 5. Sisällytä transpiloitu tiedosto muokkaus-applikaatiosivuun

Tee tämä muokkaamalla `Site.php`:hen:

```php
...
    public function __construct(WebsiteAPI $api) {
        ...
        $api->enqueueEditAppJsFile('my-site-bundled.js');
    }
...
```

Tämän jälkeen muokkaus-applikaatio sisällyttää uuden `<script>`-tagin sivuun, ja uuden lohkotyypin sisältöä pitäisi pystyä valitsemaan "Luo sisältöä" dialogin listasta uutta sisältöää luodessa.

### 6. Yhteenveto

Tässä vaiheessa uuden tyyppisiä lohkoja voi siis lisätä muokkaus-applikaation "Lisää sisältöä"-dialogissa, mutta niitä ei voi tallentaa: korjataan tilanne seuraavassa osiossa.

## Backendin osuus

...

### 1. Rekisteröi tyyppi

Tee tämä muokkaamalla `Site.php`:hen:

```php
...
    public function __construct(WebsiteAPI $api) {
        $api->registerBlockType('text-and-image', fn() => new TextAndImageBlockType);
        ...
    }
}

class TextAndImageBlockType implements BlockTypeInterface {
    public function getDefaultRenderer(): string {
        return 'templates/my-site-text-and-image.tmpl.php';
    }
    public function defineProperties(): BlockProperties {
        $out = new BlockProperties;
        $textProp = new BlockProperty;
        $textProp->name = 'html';
        $textProp->dataType = 'text';
        $out[] = $textProp;
        $imageSrcProp = new BlockProperty;
        $imageSrcProp->name = 'imageSrc';
        $imageSrcProp->dataType = 'text';
        $out[] = $imageSrcProp;
        return $out;
     }
}

```

Tämän jälkeen KuuraCms osaa tallentaa muokkausapplikaatiossa luodut lohkot käyttäen `TextAndImageBlockType->defineProperties()`-metodin ohjeita.

### 2. Lisää oletustemplaatti

Luo tiedosto `<sivustonPolku>/site/templates/my-site-text-and-image.tmpl.php`:

```php
<div style="display:flex">
    <article style="flex:1">
        <?= $props->html // allow pre-validated html ?>
    </article>
    <img style="flex:1" src="<?= $this->assetUrl("public/uploads/{$props->imageSrc}") ?>"/>
</div>
```
