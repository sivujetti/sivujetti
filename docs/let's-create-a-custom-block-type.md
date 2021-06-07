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
    defaultRenderer: 'text-and-image',
});

```

### 3. Transpiloi

Transpiloi stepin 2. applikaatio yhdeksi tiedostoksi sdk:ta käyttäen:

- `cd site`
- `npm --prefix ../ start -- --configInput site/frontend/rollup.config.js`

Bundlattu tiedosto pitäisi ilmestyä rollup-configissa määriteltyyn kohteeseen (`public/my-site-bundled.js`).

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

Tässä vaiheessa uuden tyyppisiä lohkoja voi siis valita muokkaus-applikaation "Lisää sisältöä"-dialogissa, mutta niitä ei voi tallentaa: korjataan tilanne seuraavassa osiossa.

## Backendin osuus

Ilman backendin osuutta KuuraCms ei osaa:

- Validoida eikä tallentaa tämän tyyppistä sisältöä
- Renderöidä tämän tyyppistä sisältöä

### 1. Rekisteröi tyyppi

Opetetaan Kuura validoimaan ja tallentamaan uudentyyppistä sisältöämme. Tee tämä muokkaamalla `Site.php`:hen:

```php
...
    public function __construct(WebsiteAPI $api) {
        $api->registerBlockType('text-and-image', fn() => new TextAndImageBlockType);
        ...
    }
}

class TextAndImageBlockType implements BlockTypeInterface {
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
    public function getTemplates(): array {
        return []; // todo
    }
}

```

Tämän jälkeen KuuraCms osaa tallentaa ja validoida muokkausapplikaatiossa luodut lohkot käyttäen `TextAndImageBlockType->defineProperties()`-metodin ohjeita.

### 2. Lisää oletustemplaatti

Päivitä `Site.php`:

```php
class TextAndImageBlockType implements BlockTypeInterface {
    ...
    public function getTemplates(): array {
        return ['text-and-image']; // viittaa tiedostoon KUURA_WORKSPACE_PATH . 'site/templates/text-and-image.tmpl.php'
    }
    ...
}
```

Luo tiedosto `<sivustonPolku>/site/templates/text-and-image.tmpl.php`:

```php
<div style="display:flex">
    <article style="flex:1">
        <?= $props->html // allow pre-validated html ?>
    </article>
    <img style="flex:1" src="<?= $this->assetUrl("public/uploads/{$props->imageSrc}") ?>">
</div>
```

Tämän jälkeen muokkaus-applikaatiossa lisätyt sisällöt myös renderöityy oikein.

### Yhteenveto

Lisäsimme sivustoomme uuden lohkotyypin:

- Rekisteröimällä frontendin osuuden `window.kuuraCms.registerBlock()`
    - joka mahdollistaa uuden lohkotyyppimme valinnan muokkaus-applikaatiossa
- Rekisteröimällä backendin osuuden `$websiteApi->registerBlockType();`
    - joka opettaa KuuraCms:n tallentamaan ja renderöinnin lohkotyyppimme sisältöä
