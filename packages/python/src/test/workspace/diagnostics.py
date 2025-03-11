from algopy import ARC4Contract, UInt64
from algopy.arc4 import abimethod


class Test(ARC4Contract):
    @abimethod()
    def test(self) -> UInt64:
        t = 2
        return t
