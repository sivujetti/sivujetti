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

const textAndImageBLockGetInitialData = () => ({
    // todo
});

class TextAndImageBlockFormInputs extends preact.Component {
    applyLatestValue() {
        // todo
    }
}

window.kuuraCms.registerBlock('text-and-image', {
    reRender: textAndImageBlockReRender,
    getInitialData: textAndImageBLockGetInitialData,
    FormImpl: TextAndImageBlockFormInputs,
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