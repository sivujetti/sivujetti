<?php declare(strict_types=1);

namespace Sivujetti\Tests;

use PHPUnit\Framework\TestCase;
use Sivujetti\ShortIdGenerator;

final class ShortIdGeneratorTest extends TestCase {
    public function testGenerateIdGeneratesUniqueIds(): void {
        $t1 = floor(microtime(true) * 1000);
        $t2 = $t1 + 1001;
        $t3 = $t1 + 2002;
        $t4 = strtotime("18 january 2038") * 1000.0;
        $t5 = $t4 + 1;
        $id1 = ShortIdGenerator::generate($t1);
        $id2 = ShortIdGenerator::generate($t2);
        $id3 = ShortIdGenerator::generate($t3);
        $id4 = ShortIdGenerator::generate($t4);
        $id5 = ShortIdGenerator::generate($t5);

        $c1 = ShortIdGenerator::toComponents($id1);
        $c2 = ShortIdGenerator::toComponents($id2);
        $c3 = ShortIdGenerator::toComponents($id3);
        $c4 = ShortIdGenerator::toComponents($id4);
        $c5 = ShortIdGenerator::toComponents($id5);

        $this->assertEquals($t1, $c1["timestampWithMillis"]);
        $this->assertEquals($t2, $c2["timestampWithMillis"]);
        $this->assertEquals($t3, $c3["timestampWithMillis"]);
        $this->assertEquals($t4, $c4["timestampWithMillis"]);
        $this->assertEquals($t5, $c5["timestampWithMillis"]);

        $this->assertEquals(4, strlen($c1["randomPart"]));
        $this->assertEquals(4, strlen($c2["randomPart"]));
        $this->assertEquals(4, strlen($c3["randomPart"]));
        $this->assertEquals(4, strlen($c4["randomPart"]));
        $this->assertEquals(4, strlen($c5["randomPart"]));

        ShortIdGenerator::reset();
    }
    public function testGenerateIdIncrementsMillisecond(): void {
        $t = floor(microtime(true) * 1000);
        $id1 = ShortIdGenerator::generate($t);
        $id2 = ShortIdGenerator::generate($t);

        $this->assertNotEquals($id1, $id2);
        $c1 = ShortIdGenerator::toComponents($id1);
        $c2 = ShortIdGenerator::toComponents($id2);
        $this->assertEquals($t, $c1["timestampWithMillis"]);
        $this->assertEquals($t + 1, $c2["timestampWithMillis"]);

        ShortIdGenerator::reset();
    }
    public function testGenerateIdNeverUsesSameMillisecond(): void {
        $t = floor(microtime(true) * 1000);
        // Batch/call #1
        $_id1 = ShortIdGenerator::generate($t); // $t
        $_id2 = ShortIdGenerator::generate($t); // $t + 1
        $_id3 = ShortIdGenerator::generate($t); // $t + 2

        // Batch/call #2
        $t2 = $t + 1;
        $id4 = ShortIdGenerator::generate($t2); // Should be $t + 3, not $t + 1
        $id5 = ShortIdGenerator::generate($t2); // Should be $t + 4, not $t + 2

        $c4 = ShortIdGenerator::toComponents($id4);
        $c5 = ShortIdGenerator::toComponents($id5);
        $this->assertEquals($t + 3, $c4["timestampWithMillis"]);
        $this->assertEquals($t + 4, $c5["timestampWithMillis"]);
    }
}
