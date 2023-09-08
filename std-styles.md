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
--fontSizeDefault: 0.9rem;
// @exportAs(length)
--lineHeightDefault: 1.6rem;
// @exportAs(length)
--maxWidthDefault: 1100px;
// @exportAs(length)
--paddingXDefault: 2.0rem;
// @exportAs(length)
--paddingYDefault: 4.0rem;

font: 400 var(--fontSizeDefault)/var(--lineHeightDefault) -apple-system,system-ui,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",sans-serif;
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
  font-family: -apple-system,system-ui,BlinkMacSystemFont,"Segoe UI","Helvetica Neue",sans-serif;
  font-weight: 500;
}
h1 {
  font-size: 2.6rem;
  line-height: 3rem;
}
h2 {
  font-size: 2.2rem;
  line-height: 2.6rem;
}
```

## Listing

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Base template | yes | yes

### Base template

```scss
// @exportAs(option:1|2|3|4)
--columns_Listing_default1: 1;
// @exportAs(length)
--gapY_Listing_default1: 6rem;
// @exportAs(length)
--gapX_Listing_default1: initial;

display: grid;
grid-template-columns: repeat(var(--columns_Listing_default1), minmax(0, 1fr));
row-gap: var(--gapY_Listing_default1);
column-gap: var(--gapX_Listing_default1);
```

## Menu

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Base template | yes | yes

### Base template

```scss
// @exportAs(option:none|circle|decimal|disc|disclosure-closed|disclosure-open|square)
--listStyleType_Menu_default1: none;
// @exportAs(length)
--gap_Menu_default1: 0.2rem;
// @exportAs(option:100%|0%|1)
--itemsWidth_Menu_default1: 100%;
// @exportAs(length)
--itemsPaddingX_Menu_default1: 0.0rem;
// @exportAs(length)
--itemsPaddingY_Menu_default1: 0.0rem;
// @exportAs(color)
--linksNormal_Menu_default1: #222;
// @exportAs(color)
--linksHover_Menu_default1: #333;
// @exportAs(option:none|uppercase|capitalize|lowercase)
--linksTransform_Menu_default1: none;
// @exportAs(length)
--paddingTop_Menu_default1: 0.0rem;
// @exportAs(length)
--paddingRight_Menu_default1: 0.0rem;
// @exportAs(length)
--paddingBottom_Menu_default1: 0.0rem;
// @exportAs(length)
--paddingLeft_Menu_default1: 0.0rem;

padding-top: var(--paddingTop_Menu_default1);
padding-right: var(--paddingRight_Menu_default1);
padding-bottom: var(--paddingBottom_Menu_default1);
padding-left: var(--paddingLeft_Menu_default1);

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
      padding-top: var(--itemsPaddingY_Menu_default1);
      padding-right: var(--itemsPaddingX_Menu_default1);
      padding-bottom: var(--itemsPaddingY_Menu_default1);
      padding-left: var(--itemsPaddingX_Menu_default1);
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
1 | Base template | yes | yes
2 | Primary | yes | no

### Base template

```scss
// @exportAs(color)
--backgroundNormal_Button_default1: #f8f8f8;
// @exportAs(color)
--backgroundHover_Button_default1: #f0f0f0;
// @exportAs(color)
--text_Button_default1: #333;
// @exportAs(color)
--textHover_Button_default1: #555;
// @exportAs(color)
--border_Button_default1: #f8f8f8;
// @exportAs(color)
--borderHover_Button_default1: #f0f0f0;
// @exportAs(option:center|end|start|space-around|space-between|space-evenly|initial)
--alignHorizontal_Button_default1: center;
// @exportAs(length)
--minWidth_Button_default1: initial;
// @exportAs(length)
--radius_Button_default1: 0px;
// @exportAs(length)
--paddingTop_Button_default1: 0.25rem;
// @exportAs(length)
--paddingRight_Button_default1: 0.4rem;
// @exportAs(length)
--paddingBottom_Button_default1: 0.25rem;
// @exportAs(length)
--paddingLeft_Button_default1: 0.4rem;

font: 400 0.8rem/1.2rem "Domine";
justify-content: var(--alignHorizontal_Button_default1);
background: var(--backgroundNormal_Button_default1);
border: 1px solid var(--border_Button_default1);
border-radius: var(--radius_Button_default1);
color: var(--text_Button_default1);
min-width: var(--minWidth_Button_default1);
padding-top: var(--paddingTop_Button_default1);
padding-right: var(--paddingRight_Button_default1);
padding-bottom: var(--paddingBottom_Button_default1);
padding-left: var(--paddingLeft_Button_default1);

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
--backgroundNormal_Button_u2: #1e717e;
// @exportAs(color)
--backgroundHover_Button_u2: #22808e;
// @exportAs(color)
--text_Button_u2: #fff;
// @exportAs(color)
--textHover_Button_u2: #fff;
// @exportAs(color)
--border_Button_u2: #1e717e;
// @exportAs(color)
--borderHover_Button_u2: #22808e;
// @exportAs(option:center|end|start|space-around|space-between|space-evenly|initial)
--alignHorizontal_Button_u2: initial;
// @exportAs(length)
--minWidth_Button_u2: 0%;
// @exportAs(length)
--paddingTop_Button_u2: 0.25rem;
// @exportAs(length)
--paddingRight_Button_u2: 0.4rem;
// @exportAs(length)
--paddingBottom_Button_u2: 0.25rem;
// @exportAs(length)
--paddingLeft_Button_u2: 0.4rem;
// @exportAs(length)
--radius_Button_u2: 0px;

font: 400 0.8rem/1.2rem "Domine";
justify-content: var(--alignHorizontal_Button_u2);
background: var(--backgroundNormal_Button_u2);
border: 1px solid var(--border_Button_u2);
border-radius: var(--radius_Button_u2);
color: var(--text_Button_u2);
min-width: var(--minWidth_Button_u2);
padding-top: var(--paddingTop_Button_u2, var(--paddingTop_Button_default1));
padding-right: var(--paddingRight_Button_u2, var(--paddingRight_Button_default1));
padding-bottom: var(--paddingBottom_Button_u2, var(--paddingBottom_Button_default1));
padding-left: var(--paddingLeft_Button_u2, var(--paddingLeft_Button_default1));

&:hover {
  background: var(--backgroundHover_Button_u2);
  border: 1px solid var(--borderHover_Button_u2);
  color: var(--textHover_Button_u2);
}
```

## Code

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Base template | yes | no

### Base template

```scss
// @exportAs(option:initial|none)
--display_Code_base1: initial;
// @exportAs(length)
--paddingTop_Code_base1: 0.0rem;
// @exportAs(length)
--paddingRight_Code_base1: 0.0rem;
// @exportAs(length)
--paddingBottom_Code_base1: 0.0rem;
// @exportAs(length)
--paddingLeft_Code_base1: 0.0rem;

display: var(--display_Code_base1);
paddin-top: var(--paddingTop_Code_base1);
padding-right: var(--paddingRight_Code_base1);
padding-bottom: var(--paddingBottom_Code_base1);
padding-left: var(--paddingLeft_Code_base1);
```

## Columns

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Base template | yes | no

### Base template

```scss
// @exportAs(length)
--gap_Columns_base1: 0.4rem;
// @exportAs(option:normal|start|center|end|stretch|baseline|first baseline|last baseline|initial)
--alignItems_Columns_base1: initial;
// @exportAs(length)
--paddingTop_Columns_base1: 0.0rem;
// @exportAs(length)
--paddingRight_Columns_base1: 0.0rem;
// @exportAs(length)
--paddingBottom_Columns_base1: 0.0rem;
// @exportAs(length)
--paddingLeft_Columns_base1: 0.0rem;

gap: var(--gap_Columns_base1);
align-items: var(--alignItems_Columns_base1);
padding-top: var(--paddingTop_Columns_base1);
padding-right: var(--paddingRight_Columns_base1);
padding-bottom: var(--paddingBottom_Columns_base1);
padding-left: var(--paddingLeft_Columns_base1);
```

## Image

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Base template | yes | no

### Base template

```scss
// @exportAs(option:left|right|none|initial)
--float_Image_base1: initial;
// @exportAs(length)
--minHeight_Image_base1: initial;
// @exportAs(length)
--maxHeight_Image_base1: initial;
// @exportAs(length)
--maxWidth_Image_base1: initial;
// @exportAs(option:block|inline|flex|inline-flex|inline-block|initial)
--display_Image_base1: initial;
// @exportAs(length)
--paddingTop_Image_base1: 0.0rem;
// @exportAs(length)
--paddingRight_Image_base1: 0.0rem;
// @exportAs(length)
--paddingBottom_Image_base1: 0.0rem;
// @exportAs(length)
--paddingLeft_Image_base1: 0.0rem;

float: var(--float_Image_base1);
min-height: var(--minHeight_Image_base1);
max-height: var(--maxHeight_Image_base1);
max-width: var(--maxWidth_Image_base1);
display: var(--display_Image_base1);
padding-top: var(--paddingTop_Image_base1);
padding-right: var(--paddingRight_Image_base1);
padding-bottom: var(--paddingBottom_Image_base1);
padding-left: var(--paddingLeft_Image_base1);
```

## Section

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Default | no | yes
2 | Default (body) | no | yes
3 | Base template | yes | no

### Default

```
> div > :not(:first-child) {
  margin-top: 1rem;
}
```

### Default (body) (specifier '>')

```
--paddingTop_Section_si1: var(--paddingYDefault, 4.0rem);
--paddingRight_Section_si1: var(--paddingXDefault, 2.0rem);
--paddingBottom_Section_si1: var(--paddingYDefault, 4.0rem);
--paddingLeft_Section_si1: var(--paddingXDefault, 2.0rem);
--alignHorizontal_Section_si1: center;
display: flex;
justify-content: var(--alignHorizontal_Section_si1);

> div {
  padding-top: var(--paddingTop_Section_si1);
  padding-right: var(--paddingRight_Section_si1);
  padding-bottom: var(--paddingBottom_Section_si1);
  padding-left: var(--paddingLeft_Section_si1);
  max-width: var(--maxWidthDefault, 1100px);
  width: 100%;
}
```

### Base template

```scss
// @exportAs(option:start|center|end|unset)
--alignVertical_Section_base1: unset;
// @exportAs(option:start|center|end|normal|unset)
--alignHorizontal_Section_base1: start;
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
align-items: var(--alignVertical_Section_base1);
justify-content: var(--alignHorizontal_Section_base1);
min-height: var(--minHeight_Section_base1);
background-color: var(--background_Section_base1, var(--backgroundDefault));
border-radius: var(--radius_Section_base1);
text-align: var(--textAlign_Section_base1);

&:before {
  content: "";
  background-color: var(--cover_Section_base1);
  border-radius: var(--radius_Section_base1);
  height: 100%; width: 100%; position: absolute; left: 0; top: 0;
}
> * { position: relative; }

> div {
  padding-top: var(--paddingTop_Section_base1);
  padding-right: var(--paddingRight_Section_base1);
  padding-bottom: var(--paddingBottom_Section_base1);
  padding-left:  var(--paddingLeft_Section_base1);
  flex: 1 0 0;
  max-width: var(--maxWidth_Section_base1, var(--maxWidthDefault));
}
```

## Text

Order | Name | Derivable | Default
--- | --- | --- | ---
1 | Base template | yes | yes

### Base template

```scss
// @exportAs(color)
--textNormal_Text_default1: initial;
// @exportAs(color)
--textHeadings_Text_default1: initial;
// @exportAs(color)
--links_Text_default1: initial;
// @exportAs(option:right|center|justify|default|initial)
--textAlign_Text_default1: initial;
// @exportAs(length)
--fontSize_Text_default1: initial;
// @exportAs(length)
--lineHeight_Text_default1: initial;
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
font-size: var(--fontSize_Text_default1, var(--fontSizeDefault));
line-height: var(--lineHeight_Text_default1, var(--lineHeightDefault));
text-align: var(--textAlign_Text_default1);
max-width: var(--maxWidth_Text_default1);
padding-top: var(--paddingTop_Text_default1);
padding-right: var(--paddingRight_Text_default1);
padding-bottom: var(--paddingBottom_Text_default1);
padding-left: var(--paddingLeft_Text_default1);

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
