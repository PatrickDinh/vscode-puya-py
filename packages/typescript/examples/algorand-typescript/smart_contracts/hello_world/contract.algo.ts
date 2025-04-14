import { Contract, uint64 } from '@algorandfoundation/algorand-typescript'

export class HelloWorld extends Contract {
  public hello(name: string): string {
    const t = 2
    return `${this.getHello()} ${name}`
  }

  private getHello() {
    return 'Hello'
  }
}
