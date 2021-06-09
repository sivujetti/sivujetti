<?php
// == <ul> ================
if (!isset($props['treeStart'])) echo '<ul>';
else echo str_replace('{depth}', $props['depth'], $props['treeStart']);
//
foreach ($props['branch'] as $i => $item) {
    // == <li> ================
    echo str_replace('{current}', $urlStr !== $item->url ? ' data-current' : '',
        !isset($props['itemStart']) ? '<li{current}>' : str_replace(
                                                            ['{i}', '{depth}'],
                                                            [$i, $props['depth']],
                                                            $props['itemStart']
                                                        )
    );
    // == <a ...</a> ================
    echo '<a href="', $this->url($item->url), '"',
            isset($props['itemAttrs']) ? $this->attrsMapToStr($props['itemAttrs']) : '', '>',
        $item->text,
    '</a>';
    if ($item->children) {
        echo $this->{'kuura:_MenuPrint'}(array_merge($props, ['branch' => $item->children,
                                                              'depth' => $props['depth'] + 1]));
    }
    // == </li> ================
    echo $props['itemEnd'] ?? '</li>';
}
// == </ul> ================
echo $props['treeEnd'] ?? '</ul>';