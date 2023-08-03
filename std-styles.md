# Standard style units

"Standard" stylis/scss styles for each block type.

## \_\_body\_\_

```scss
// @exportAs(color)
--textDefault: #222;
// @exportAs(color)
--headingsDefault: #6a747e;
// @exportAs(color)
--backgroundDefault: #fff;
// @exportAs(color)
--linksDefault: #45bdd1;
// @exportAs(color)
--linksHover: #82d6e4;
// @exportAs(length)
--maxWidthDefault: 1100px;

font: 400 .8rem/1.2rem -apple-system,system-ui,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",sans-serif;
background-color: var(--backgroundDefault);
color: var(--textDefault);

a {
  color: var(--linksDefault);
  &:hover {
    color: var(--linksHover);
  }
}
h1, h2, h3, h4, h5, h6 {
  color: var(--headingsDefault);
}
```

## Listing

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Default | yes | yes

### Default

```scss
// @exportAs(option:1|2|3|4)
--columns_Listing_default1: 1;
// @exportAs(length)
--gap_Listing_default1: 6rem;

display: grid;
grid-template-columns: repeat(var(--columns_Listing_default1), minmax(0, 1fr));
gap: var(--gap_Listing_default1);
```

## Menu

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Default | yes | yes

### Default

```scss
// @exportAs(option:none|circle|decimal|disc|disclosure-closed|disclosure-open|square)
--listStyleType_Menu_default1: none;
// @exportAs(length)
--gap_Menu_default1: 0.2rem;
// @exportAs(option:100%|0%|1)
--itemsWidth_Menu_default1: 100%;
// @exportAs(color)
--linksNormal_Menu_default1: #222;
// @exportAs(color)
--linksHover_Menu_default1: #333;
// @exportAs(option:none|uppercase|capitalize|lowercase)
--linksTransform_Menu_default1: none;
// @exportAs(length)
--paddingTop_Menu_default1: initial;
// @exportAs(length)
--paddingRight_Menu_default1: initial;
// @exportAs(length)
--paddingBottom_Menu_default1: initial;
// @exportAs(length)
--paddingLeft_Menu_default1: initial;

padding: var(--paddingTop_Menu_default1) var(--paddingRight_Menu_default1) var(--paddingBottom_Menu_default1) var(--paddingLeft_Menu_default1);

ul {
  list-style-type: var(--listStyleType_Menu_default1);
  display: flex;
  gap: var(--gap_Menu_default1);
  flex-wrap: wrap;
  margin: 0;
  li {
    flex: 0 0 var(--itemsWidth_Menu_default1);
    margin: 0;
    a {
      color: var(--linksNormal_Menu_default1, var(--linksDefault));
      text-transform: var(--linksTransform_Menu_default1);
      &:hover {
        color: var(--linksHover_Menu_default1, var(--linksHover));
      }
    }
  }
}
```

## Button

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Default | yes | yes
2 | Primary | yes | no

### Default

```scss
// @exportAs(color)
--backgroundNormal_Button_default1: #f2f2f2;
// @exportAs(color)
--backgroundHover_Button_default1: #f0f0f0;
// @exportAs(color)
--text_Button_default1: #333;
// @exportAs(color)
--textHover_Button_default1: #555;
// @exportAs(color)
--border_Button_default1: #f2f2f2;
// @exportAs(color)
--borderHover_Button_default1: #f0f0f0;
// @exportAs(option:center|flex-end|flex-start|space-around|space-between|space-evenly|initial)
--alignHorizontal_Button_default1: initial;
// @exportAs(length)
--minWidth_Button_default1: initial;
// @exportAs(length)
--paddingTop_Button_default1: 0.25rem;
// @exportAs(length)
--paddingRight_Button_default1: 0.4rem;
// @exportAs(length)
--paddingBottom_Button_default1: 0.25rem;
// @exportAs(length)
--paddingLeft_Button_default1: 0.4rem;
// @exportAs(length)
--radius_Button_default1: 0px;

font: 400 .75rem/1.2rem -apple-system,system-ui,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",sans-serif;
justify-content: var(--alignHorizontal_Button_default1);
background: var(--backgroundNormal_Button_default1);
border: 1px solid var(--border_Button_default1);
border-radius: var(--radius_Button_default1);
color: var(--text_Button_default1);
min-width: var(--minWidth_Button_default1);
padding: var(--paddingTop_Button_default1) var(--paddingRight_Button_default1) var(--paddingBottom_Button_default1) var(--paddingLeft_Button_default1);

&:hover {
  background: var(--backgroundHover_Button_default1);
  border: 1px solid var(--borderHover_Button_default1);
  color: var(--textHover_Button_default1);
}
```

/ tämä derivedFrom: 'unit-1'
### Primary

```scss
// @exportAs(color)
--backgroundNormal_Button_default1: #1e717e;
// @exportAs(color)
--backgroundHover_Button_default1: #22808e;
// @exportAs(color)
--text_Button_default1: #fff;
// @exportAs(color)
--textHover_Button_default1: #fff;
// @exportAs(color)
--border_Button_default1: #1e717e;
// @exportAs(color)
--borderHover_Button_default1: #22808e;
// @exportAs(option:center|flex-end|flex-start|space-around|space-between|space-evenly|initial)
--alignHorizontal_Button_default1: initial;
// @exportAs(length)
--minWidth_Button_default1: 0%;
// @exportAs(length)
--paddingTop_Button_default1: 0.25rem;
// @exportAs(length)
--paddingRight_Button_default1: 0.4rem;
// @exportAs(length)
--paddingBottom_Button_default1: 0.25rem;
// @exportAs(length)
--paddingLeft_Button_default1: 0.4rem;
// @exportAs(length)
--radius_Button_default1: 0px;

font: 400 0.8rem/1.2rem "Domine";
justify-content: var(--alignHorizontal_Button_default1);
background: var(--backgroundNormal_Button_default1);
border: 1px solid var(--border_Button_default1);
border-radius: var(--radius_Button_default1);
color: var(--text_Button_default1);
min-width: var(--minWidth_Button_default1);
padding: var(--paddingTop_Button_default1) var(--paddingRight_Button_default1) var(--paddingBottom_Button_default1) var(--paddingLeft_Button_default1);

&:hover {
  background: var(--backgroundHover_Button_default1);
  border: 1px solid var(--borderHover_Button_default1);
  color: var(--textHover_Button_default1);
}
```

## Code

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Commons | yes | no

### Commons

```scss
// @exportAs(option:initial|none)
--display_Code_base1: initial;
// @exportAs(length)
--paddingTop_Code_base1: initial;
// @exportAs(length)
--paddingRight_Code_base1: initial;
// @exportAs(length)
--paddingBottom_Code_base1: initial;
// @exportAs(length)
--paddingLeft_Code_base1: initial;

display: var(--display_Code_base1);
padding: var(--paddingTop_Code_base1) var(--paddingRight_Code_base1) var(--paddingBottom_Code_base1) var(--paddingLeft_Code_base1);
```

## Columns

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Default | yes | no

### Commons

```scss
// @exportAs(length)
--gap_Columns_base1: 0.4rem;
// @exportAs(option:normal|start|center|end|stretch|baseline|first baseline|last baseline|initial)
--alignItems_Columns_base1: initial;
// @exportAs(length)
--paddingTop_Columns_base1: initial;
// @exportAs(length)
--paddingRight_Columns_base1: initial;
// @exportAs(length)
--paddingBottom_Columns_base1: initial;
// @exportAs(length)
--paddingLeft_Columns_base1: initial;

gap: var(--gap_Columns_base1);
align-items: var(--alignItems_Columns_base1);
padding: var(--paddingTop_Columns_base1) var(--paddingRight_Columns_base1) var(--paddingBottom_Columns_base1) var(--paddingLeft_Columns_base1);
```

## Image

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Default | yes | no

### Commons

```scss
// @exportAs(option:left|right|none)
--float_Image_base1: none;
// @exportAs(length)
--minHeight_Image_base1: initial;
// @exportAs(length)
--maxHeight_Image_base1: initial;
// @exportAs(length)
--maxWidth_Image_base1: initial;
// @exportAs(option:block|inline|flex|inline-flex|inline-block)
--display_Image_base1: initial;
// @exportAs(length)
--paddingTop_Image_base1: initial;
// @exportAs(length)
--paddingRight_Image_base1: initial;
// @exportAs(length)
--paddingBottom_Image_base1: initial;
// @exportAs(length)
--paddingLeft_Image_base1: initial;

float: var(--float_Image_base1);
min-height: var(--minHeight_Image_base1);
max-height: var(--maxHeight_Image_base1);
max-width: var(--maxWidth_Image_base1);
display: var(--display_Image_base1);
padding: var(--paddingTop_Image_base1) var(--paddingRight_Image_base1) var(--paddingBottom_Image_base1) var(--paddingLeft_Image_base1);
```

## Section

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Stack | no | yes
2 | Body | no | yes
3 | Commons | yes | no

### Stack

```
> div > :not(:first-child) {
  margin-top: 1rem;
}
```

### Body

```
> div {
  padding: 4rem 2rem;
  max-width: var(--maxWidthDefault);
  margin: 0 auto;
}
```

### Commons

```scss
// @exportAs(option:flex-start|center|flex-end|unset)
--alignItems_Section_base1: initial;
// @exportAs(option:right|center|justify|default)
--textAlign_Section_base1: default;
// @exportAs(length)
--minHeight_Section_base1: initial;
// @exportAs(length)
--maxWidth_Section_base1: initial;
// @exportAs(color)
--background_Section_base1: initial;
// @exportAs(color)
--cover_Section_base1: initial;
// @exportAs(length)
--radius_Section_base1: 0px;
// @exportAs(length)
--paddingTop_Section_base1: initial;
// @exportAs(length)
--paddingRight_Section_base1: initial;
// @exportAs(length)
--paddingBottom_Section_base1: initial;
// @exportAs(length)
--paddingLeft_Section_base1: initial;

position: relative;
display: flex;
align-items: var(--alignItems_Section_base1);
min-height: var(--minHeight_Section_base1);
background-color: var(--background_Section_base1, var(--backgroundDefault));
text-align: var(--textAlign_Section_base1);

&:before {
  content: "";
  background-color: var(--cover_Section_base1);
  border-radius: var(--radius_Section_base1);
  height: 100%; width: 100%; position: absolute; left: 0; top: 0;
}
> * { position: relative; }

> div {
  padding: var(--paddingTop_Section_base1) var(--paddingRight_Section_base1) var(--paddingBottom_Section_base1) var(--paddingLeft_Section_base1);
  flex: 1 0 0;
  max-width: var(--maxWidth_Section_base1, var(--maxWidthDefault));
}
```

## Text

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Default | yes | yes

### Default

```scss
// @exportAs(color)
--textNormal_Text_default1: initial;
// @exportAs(color)
--textHeadings_Text_default1: initial;
// @exportAs(color)
--links_Text_default1: initial;
// @exportAs(option:right|center|justify|default)
--textAlign_Text_default1: default;
// @exportAs(length)
--maxWidth_Text_default1: initial;
// @exportAs(length)
--paragraphsMargin_Text_default1: 1.2rem;
// @exportAs(length)
--paddingTop_Text_default1: initial;
// @exportAs(length)
--paddingRight_Text_default1: initial;
// @exportAs(length)
--paddingBottom_Text_default1: initial;
// @exportAs(length)
--paddingLeft_Text_default1: initial;

color: var(--textNormal_Text_default1, var(--textDefault));
text-align: var(--textAlign_Text_default1);
max-width: var(--maxWidth_Text_default1);
padding: var(--paddingTop_Text_default1) var(--paddingRight_Text_default1) var(--paddingBottom_Text_default1) var(--paddingLeft_Text_default1);

a {
  color: var(--links_Text_default1, var(--linksDefault));
}
p {
  margin: 0 0 var(--paragraphsMargin_Text_default1);
}
> p:last-child {
  margin-bottom: 0;
}
h1, h2, h3, h4, h5, h6 {
  color: var(--textHeadings_Text_default1, var(--headingsDefault));
}
```
