<?php declare(strict_types=1);

namespace Sivujetti;

/**
 * @param       array<int, array|string|array<int, array|string>> $branch
 * @psalm-param array<int, VNode|string|array<int, VNode|string>> $branch
 * @return string
 */
function renderVNodes(array $branch): string {
    $out = "";
    foreach ($branch as $node) {
        if (is_string($node)) {
            // todo escape
            $out .= $node;
        } else if (array_is_list($node))
            $out .= renderVNodes($node);
        else {
            if ($node["el"] === "j-raw") {
                $out .= $node["children"][0]; // @allow unescaped
                continue;
            }
            $attrsMarkup = _renderAttrs($node["attrs"]);
            if ($node["el"] === "svg") {
                $childMarkup = $node["children"][0] ?? ""; // @allow unescaped
            } else {
                $childMarkup = $node["children"] ? renderVNodes($node["children"]) : "";
            }
            // todo escape $node["el"]
            $out .= "<{$node["el"]}{$attrsMarkup}>" .
                (match ($node["el"]) {
                    "img", "input", "br", "hr", "link",
                    "source", "wbr", "area", "track" => "",
                    default => "{$childMarkup}</{$node["el"]}>",
                });
        }
    }
    return $out;
}

/**
 * @param string $el
 * @param array<string, string>|null $attrs
 * @param array<int, VNode>|array<int, string>|string ...$children
 * @return array
 * @psalm-return VNode
 */
function createElement(string $el, ?array $attrs, array|string ...$children): array {
    return [
        "el" => $el,
        "attrs" => $attrs ? $attrs : [],
        "children" => $children,
    ];
}

/**
 * @param array<string, string> $attrs
 * @return string
 */
function _renderAttrs(array $attrs): string {
    $mapped = [];
    foreach ($attrs as $key => $val) {
        // todo escape
        $mapped[] = "{$key}=\"{$val}\"";
    }
    return $mapped ? (" " . implode(" ", $mapped)) : "";
}
