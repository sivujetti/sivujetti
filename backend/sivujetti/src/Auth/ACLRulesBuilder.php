<?php declare(strict_types=1);

namespace Sivujetti\Auth;

use Pike\{PikeException};

final class ACLRulesBuilder {
    /** @var object[] {resourceName: string, actions: string[], rolePerms: array<string, array{0: int, 1: string|string[]}>}[] */
    private array $items;
    /** @var ?object {resourceName: string, actions: string[], rolePerms: array<string, array{0: int, 1: string|string[]}>}|null */
    private ?object $head;
    /** @var string e.g. "plugins/JetForms:" or "" */
    private string $resourcePrefix;
    /** @var int[] */
    private const VALID_ROLES = [
        1 << 1,
        1 << 2,
        1 << 3,
        1 << 4,
        1 << 5,
    ];
    /**
     * @param string $resourcePrefix = ""
     */
    public function __construct(string $resourcePrefix = "") {
        $this->items = [];
        $this->head = null;
        $this->resourcePrefix = $resourcePrefix;
    }
    /**
     * @param string $name e.g. "mailSendSettings"
     * @param string[] e.g. ["read", "update"]
     * @return $this
     */
    public function defineResource(string $name, array $actions): ACLRulesBuilder {
        if ($this->resourcePrefix && !str_starts_with($name, $this->resourcePrefix))
            $name = "{$this->resourcePrefix}{$name}"; // e.g. "resourceName" -> "plugins/JetForms:resourceName"
        $item = (object) ["resourceName" => $name, "actions" => $actions, "rolePerms" => []];
        $this->items[] = $item;
        $this->head = $this->items[count($this->items) - 1];
        return $this;
    }
    /**
     * Sets permissions for the previous resource.
     *
     * @param int $role \Sivujetti\Auth\ACL::ROLE_*
     * @param string|string[] "*" or ["action1", "action2"]
     * @return $this
     */
    public function setPermissions(int $role, string|array $rolePerms): ACLRulesBuilder {
        if (!$this->head) throw new PikeException("Expected \$builder->definedResource()",
                                                  PikeException::BAD_INPUT);
        if (!in_array($role, self::VALID_ROLES, true))
            throw new PikeException("\$role must be \Sivujetti\Auth\ACL\ROLE_*",
                                    PikeException::BAD_INPUT);
        if (is_string($rolePerms) && $rolePerms !== "*")
            throw new PikeException("\$rolePerms (as a string) doesn't support " .
                " anything else than \"*\"", PikeException::BAD_INPUT);
        $this->head->rolePerms["_{$role}"] = [$role, $rolePerms];
        return $this;
    }
    /**
     * @return bool
     */
    public function isEmpty(): bool {
        return count($this->items) === 0;
    }
    /**
     * @return object see \Pike\Auth\ACL::setRules()
     */
    public function toObject(): object {
        $resources = new \stdClass;
        $userPerms = new \stdClass;
        foreach ($this->items as $itm) {
            $masks = self::actionsToActionsMasks($itm->actions);
            $resources->{$itm->resourceName} = $masks;
            //
            foreach ($itm->rolePerms as [$role, $allowedActions]) {
                if (!is_object($userPerms->{$role} ?? null)) $userPerms->{$role} = new \stdClass;
                $userPerms->{$role}->{$itm->resourceName} = ACL::makePermissions($allowedActions, $masks);
            }
        }
        return (object) ["resources" => $resources, "userPermissions" => $userPerms];
    }
    /**
     * @param string[]
     * @return object {read: 6, update: 8}
     */
    private static function actionsToActionsMasks(array $actions): object {
        $masks = (object) [
            // "read" => 2,
            // "update" => 4,
            // ...
        ];
        for ($i = 0; $i < count($actions); ++$i) {
            $actionName = $actions[$i];
            // 1 << 1 = 0b0010
            // 1 << 2 = 0b0100
            // 1 << 3 = 0b1000
            // etc..
            $masks->{$actionName} = 1 << ($i + 1);
        }
        return $masks;
    }
}
