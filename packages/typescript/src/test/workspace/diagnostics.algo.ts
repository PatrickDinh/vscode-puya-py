import { Contract, uint64 } from '@algorandfoundation/algorand-typescript'

export class Test extends Contract {
  public test(): uint64 {
    const t = 2
    return t
  }
}
